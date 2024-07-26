import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import {
  QuoteConfig,
  QuoteResponse,
  QuoteResult,
  DeBridgeErrors,
  DeBridgePoints,
  DebridgeResources,
  GetDebridgeTxsResponse,
  GetTxsConfig,
  IDebridge,
  SwapConfig,
  SwapResponse,
  DebridgeConfig,
} from './debridge.types';
import { QuoteQueryParams } from './debridge.api.types';
import {
  DEBRIDGE_GARDEN_AFFILIATE_ADDRESS,
  DEBRIDGE_GARDEN_FEE_COMMISSION,
  DEBRIDGE_REFERRAL_CODE,
} from './constants';
import * as ethers from 'ethers';
import { Url } from '@gardenfi/utils';
import { getContract, maxUint256, erc20Abi } from 'viem';

export class Debridge implements IDebridge {
  public debridgeDomain: Url;
  public debridgeTxDomain: Url;
  public debridgePointsDomain: Url;
  public orderCount: number;
  constructor(debridgeConfig: DebridgeConfig) {
    this.debridgeDomain = new Url(debridgeConfig.debridgeDomain);
    this.debridgeTxDomain = new Url(debridgeConfig.debridgeTxDomain);
    this.debridgePointsDomain = new Url(debridgeConfig.debridgePointsDomain);
    this.orderCount = debridgeConfig.orderCount || 100;
  }

  async getPoints(address: string): AsyncResult<DeBridgePoints, string> {
    const searchParams = new URLSearchParams({ origin: 'DeSwap' });

    const url = this.debridgePointsDomain.endpoint(
      DebridgeResources.points(address) + '?' + searchParams
    );

    const response = await Fetcher.get<DeBridgePoints>(url);

    return Ok(response);
  }

  async getTx(txHash: string): AsyncResult<GetDebridgeTxsResponse, string> {
    const url = this.debridgeTxDomain.endpoint(DebridgeResources.tx);

    const body = {
      giveChainIds: [],
      takeChainIds: [],
      filter: txHash,
      skip: 0,
      take: this.orderCount,
    };

    const tx = await Fetcher.post<GetDebridgeTxsResponse>(url, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return Ok(tx);
  }

  async getTxs(
    getTxsConfig: GetTxsConfig
  ): AsyncResult<GetDebridgeTxsResponse, string> {
    const url = this.debridgeTxDomain.endpoint(DebridgeResources.tx);

    const body = {
      giveChainIds: getTxsConfig.chainIdsFrom ?? [],
      takeChainIds: getTxsConfig.chainIdsTo ?? [],
      filter: getTxsConfig.address,
      skip: 0,
      take: this.orderCount,
    };

    const txs = await Fetcher.post<GetDebridgeTxsResponse>(url, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return Ok(txs);
  }

  async quote(
    quoteConfig: QuoteConfig,
    abortController?: AbortController
  ): AsyncResult<QuoteResult, DeBridgeErrors> {
    const url = this.debridgeDomain.endpoint(DebridgeResources.createTx);

    const tenPowerInputDecimals =
      10n **
      BigInt(
        !quoteConfig.isExactOut
          ? quoteConfig.fromToken.decimals
          : quoteConfig.toToken.decimals
      );

    const amount = quoteConfig.amount;

    const amountInDecimals = BigInt(amount) * tenPowerInputDecimals;

    const createTxQueryParams: QuoteQueryParams = {
      srcChainId: quoteConfig.fromToken.chainId,
      srcChainTokenIn: quoteConfig.fromToken.address,
      srcChainTokenInAmount: !quoteConfig.isExactOut
        ? amountInDecimals.toString()
        : 'auto',
      dstChainId: quoteConfig.toToken.chainId,
      dstChainTokenOut: quoteConfig.toToken.address,
      dstChainTokenOutRecipient: quoteConfig.toAddress,
      senderAddress: quoteConfig.fromAddress,
      srcChainOrderAuthorityAddress: quoteConfig.fromAddress,
      referralCode: DEBRIDGE_REFERRAL_CODE,
      srcChainRefundAddress: quoteConfig.fromAddress,
      dstChainOrderAuthorityAddress: quoteConfig.fromAddress,
      enableEstimate: false,
      additionalTakerRewardBps: 0,
      affiliateFeePercent: DEBRIDGE_GARDEN_FEE_COMMISSION,
      affiliateFeeRecipient: DEBRIDGE_GARDEN_AFFILIATE_ADDRESS,
    };

    if (quoteConfig.isExactOut) {
      createTxQueryParams.dstChainTokenOutAmount = amountInDecimals.toString();
    }

    const createTxParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(createTxQueryParams).map(([key, value]) => [
          key,
          value.toString(),
        ])
      )
    );

    try {
      const createTxResponse = await Fetcher.get<QuoteResponse>(
        url.href + '?' + createTxParams,
        {
          signal: abortController?.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (createTxResponse.errorId) {
        return Err(createTxResponse.errorId);
      }

      return Ok({
        quote: quoteConfig.isExactOut
          ? createTxResponse.estimation.srcChainTokenIn.amount
          : createTxResponse.estimation.dstChainTokenOut.recommendedAmount,
        tx: createTxResponse.tx,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return Err(DeBridgeErrors.API_CALL_CANCELLED);
      } else {
        return Err(DeBridgeErrors.UNKNOWN_ERROR);
      }
    }
  }

  async swap(swapConfig: SwapConfig): AsyncResult<SwapResponse, string> {
    const quoteResult = await this.quote(swapConfig);

    if (quoteResult.error) {
      return Err(quoteResult.error);
    }

    const isFromAmount = 'fromAmount' in swapConfig;
    const tenPowerDecimals = BigInt(
      isFromAmount ? swapConfig.fromToken.decimals : swapConfig.toToken.decimals
    );
    const amount = swapConfig.amount;
    const amountInDecimals = BigInt(amount) * tenPowerDecimals;

    if (swapConfig.fromToken.address === ethers.ZeroAddress)
      return Err('Src token cannot be the zero address');

    const tx = quoteResult.val.tx;

    const erc20Contract = getContract({
      abi: erc20Abi,
      address: swapConfig.fromToken.address as `0x{string}`,
      client: swapConfig.client,
    });

    const approvedAmount = await erc20Contract.read.allowance([
      swapConfig.fromAddress as `0x{string}`,
      tx.to as `0x{string}`,
    ]);
    if (!swapConfig.client.account)
      return Err('No account provided for the client');

    if (approvedAmount < Number(amountInDecimals)) {
      try {
        const approvalTx = await erc20Contract.write.approve(
          [tx.to as `0x{string}`, maxUint256],
          {
            account: swapConfig.client.account,
            chain: swapConfig.client.chain,
          }
        );
      } catch (e) {
        return Err((e as Error).message);
      }
    }

    try {
      const swapTx = await swapConfig.client.sendTransaction({
        account: swapConfig.client.account,
        chain: swapConfig.client.chain,
        to: tx.to as `0x{string}`,
        data: tx.data as `0x{string}`,
        value: BigInt(tx.value),
      });

      return Ok({
        txHash: swapTx,
        quote: quoteResult.val.quote,
      });
    } catch (err) {
      return Err((err as Error).message);
    }
  }
}
