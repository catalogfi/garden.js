import { AsyncResult, Err, Fetcher, Ok, Result } from '@catalogfi/utils';
import {
  CreateTxConfig,
  CreateTxQueryParams,
  CreateTxResponse,
  CreateTxResult,
  DeBridgeErrorCodes,
  DeBridgePoints,
  DebridgeResources,
  GetDebridgeTxsResponse,
  GetTxsConfig,
  IDebridge,
  SwapConfig,
  SwapResponse,
} from './debridge.types';
import {
  DEBRIDGE_GARDEN_AFFILIATE_ADDRESS,
  DEBRIDGE_GARDEN_FEE_COMMISSION,
  DEBRIDGE_REFERRAL_CODE,
} from './constants';
import * as ethers from 'ethers';
import ERC20Abi from './abi/erc20.json';

export class Debridge {
  public static DEBRIDGE_DOMAIN = new URL('/v1.0', 'https://api.dln.trade');
  public static DEBRIDGE_TX_DOMAIN = new URL(
    '/api/Orders',
    'https://stats-api.dln.trade/'
  );
  public static DEBRIDGE_POINTS_DOMAIN = new URL(
    '/api/points',
    'https://points-api.debridge.finance'
  );

  private static ORDER_COUNT = 100;

  static async getPoints(address: string): AsyncResult<DeBridgePoints, string> {
    const searchParams = new URLSearchParams({ origin: 'DeSwap' });
    const url = new URL(
      Debridge.DEBRIDGE_POINTS_DOMAIN.pathname +
        DebridgeResources.points(address) +
        '?' +
        searchParams,
      Debridge.DEBRIDGE_POINTS_DOMAIN
    );

    const response = await Fetcher.get<DeBridgePoints>(url);

    return Ok(response);
  }

  static async getTx(
    txHash: string
  ): AsyncResult<GetDebridgeTxsResponse, string> {
    const url = new URL(
      Debridge.DEBRIDGE_TX_DOMAIN.pathname + DebridgeResources.tx,
      Debridge.DEBRIDGE_TX_DOMAIN
    );

    const body = {
      giveChainIds: [],
      takeChainIds: [],
      filter: txHash,
      skip: 0,
      take: this.ORDER_COUNT,
    };

    const tx = await Fetcher.post<GetDebridgeTxsResponse>(url, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return Ok(tx);
  }

  static async getTxs(
    getTxsConfig: GetTxsConfig
  ): AsyncResult<GetDebridgeTxsResponse, string> {
    const url = new URL(
      Debridge.DEBRIDGE_TX_DOMAIN.pathname + DebridgeResources.tx,
      Debridge.DEBRIDGE_TX_DOMAIN
    );

    const body = {
      giveChainIds: getTxsConfig.chainIdsFrom ?? [],
      takeChainIds: getTxsConfig.chainIdsTo ?? [],
      filter: getTxsConfig.address,
      skip: 0,
      take: this.ORDER_COUNT,
    };

    const txs = await Fetcher.post<GetDebridgeTxsResponse>(url, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return Ok(txs);
  }

  static async createTx(
    createTxConfig: CreateTxConfig,
    abortController: AbortController
  ): AsyncResult<CreateTxResult, DeBridgeErrorCodes> {
    const url = new URL(
      Debridge.DEBRIDGE_DOMAIN.pathname + DebridgeResources.createTx,
      Debridge.DEBRIDGE_DOMAIN
    );

    const tenPowerInputDecimals =
      10n ** BigInt(createTxConfig.srcTokenDecimals);

    const sellAmountInDecimals =
      BigInt(createTxConfig.sellAmount) * tenPowerInputDecimals;

    const createTxQueryParams: CreateTxQueryParams = {
      srcChainId: createTxConfig.srcChainId,
      srcChainTokenIn: createTxConfig.srcChainTokenIn,
      srcChainTokenInAmount: createTxConfig.isExactOut
        ? 'auto'
        : sellAmountInDecimals.toString(),
      dstChainId: createTxConfig.dstChainId,
      dstChainTokenOut: createTxConfig.dstChainTokenOut,
      dstChainTokenOutRecipient: createTxConfig.dstChainTokenOutRecipient,
      senderAddress: createTxConfig.senderAddress,
      srcChainOrderAuthorityAddress: createTxConfig.senderAddress,
      referralCode: DEBRIDGE_REFERRAL_CODE,
      srcChainRefundAddress: createTxConfig.senderAddress,
      dstChainOrderAuthorityAddress: createTxConfig.senderAddress,
      enableEstimate: false,
      additionalTakerRewardBps: 0,
      affiliateFeePercent: DEBRIDGE_GARDEN_FEE_COMMISSION,
      affiliateFeeRecipient: DEBRIDGE_GARDEN_AFFILIATE_ADDRESS,
    };

    if (createTxConfig.isExactOut) {
      createTxQueryParams.dstChainTokenOutAmount =
        sellAmountInDecimals.toString();
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
      const createTxResponse = await Fetcher.get<CreateTxResponse>(
        url.href + '?' + createTxParams,
        {
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (createTxResponse.errorId) {
        return Err(createTxResponse.errorId);
      }

      return Ok({
        quote: createTxConfig.isExactOut
          ? createTxResponse.estimation.srcChainTokenIn.amount
          : createTxResponse.estimation.dstChainTokenOut.recommendedAmount,
        tx: createTxResponse.tx,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return Err(DeBridgeErrorCodes.API_CALL_CANCELLED);
      } else {
        return Err(DeBridgeErrorCodes.UNKNOWN_ERROR);
      }
    }
  }

  static async swap(
    swapConfig: SwapConfig,
    abortController: AbortController
  ): AsyncResult<SwapResponse, string> {
    const {
      srcChainId,
      senderAddress,
      srcChainTokenIn,
      srcTokenDecimals,
      sellAmount,
      dstChainId,
      dstChainTokenOut,
      dstChainTokenOutRecipient,
      signer,
      isExactOut,
    } = swapConfig;

    const createTxResult = await Debridge.createTx(
      {
        srcChainId,
        srcChainTokenIn,
        isExactOut,
        dstChainId,
        dstChainTokenOut,
        dstChainTokenOutRecipient,
        senderAddress,
        sellAmount,
        srcTokenDecimals,
      },
      abortController
    );

    if (createTxResult.error) {
      return Err(createTxResult.error);
    }

    const tenPowerInputDecimals = 10n ** BigInt(srcTokenDecimals);

    const sellAmountInDecimals = BigInt(sellAmount) * tenPowerInputDecimals;

    if (srcChainTokenIn === ethers.ZeroAddress)
      return Err('Src token cannot be the zero address');

    const erc20Contract = new ethers.Contract(
      srcChainTokenIn,
      new ethers.Interface(JSON.stringify(ERC20Abi)),
      signer
    );

    const tx = createTxResult.val.tx;

    const approvedAmount = await erc20Contract['allowance'](
      senderAddress,
      tx.to
    );

    if (approvedAmount < Number(sellAmountInDecimals)) {
      try {
        const approvalTx = await erc20Contract['approve'](
          tx.to,
          ethers.MaxUint256
        );
        await approvalTx.wait();
      } catch (e) {
        return Err((e as Error).message);
      }
    }

    try {
      const swapTx = await signer.sendTransaction(tx);

      await swapTx.wait();

      return Ok({
        txHash: swapTx.hash,
        quote: createTxResult.val.quote,
      });
    } catch (err) {
      return Err((err as Error).message);
    }
  }
}
