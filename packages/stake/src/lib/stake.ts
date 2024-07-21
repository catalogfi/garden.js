import { Url } from '@gardenfi/utils';
import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import {
  Config,
  DURATION,
  GlobalStakingData,
  IStakeProvider,
  Stake,
} from './stake.types';
import {
  DURATION_MAP,
  ETH_BLOCKS_PER_DAY,
  INFINITE,
  MIN_STAKE,
  SEED_FOR_MINTING_NFT,
  STAKING_CONFIG,
} from './constants';
import { WalletClient, getContract, maxUint256 } from 'viem';
import { arbitrum, sepolia } from 'viem/chains';
import { FlowerABI } from './abi/flowerABI';
import { StakeABI } from './abi/stakeABI';
import { checkAllowanceAndApprove, convertTo0xString } from './utils';

export class StakeProvider implements IStakeProvider {
  private address: `0x${string}`;
  private walletClient: WalletClient;
  private config: Config;

  private constructor(walletClient: WalletClient, address: string) {
    this.walletClient = walletClient;
    this.config =
      STAKING_CONFIG[walletClient.chain?.id as keyof typeof STAKING_CONFIG];
    this.address = convertTo0xString(address);
  }

  static init(walletClient: WalletClient): StakeProvider {
    if (!walletClient.chain) throw new Error('No chain found');
    if (
      walletClient.chain.id !== arbitrum.id &&
      walletClient.chain.id !== sepolia.id
    ) {
      throw new Error(
        'Unsupported chain: only arbitrum and sepolia are supported'
      );
    }
    if (!walletClient.account) throw new Error('No account found');

    return new StakeProvider(walletClient, walletClient.account.address);
  }

  static async getStakes(
    api: Url,
    address: string
  ): AsyncResult<Stake[], string> {
    try {
      const res = await Fetcher.get<{ data: Stake[] }>(
        api.endpoint('/stakes?userId=' + address)
      );
      return Ok(res.data);
    } catch (error) {
      return Err('Failed to get stakes: ' + error);
    }
  }

  static async getGlobalStakingData(
    api: Url
  ): AsyncResult<GlobalStakingData, string> {
    try {
      const res = await Fetcher.get<{
        data: GlobalStakingData;
      }>(api.endpoint('/stakingStats'));
      return Ok(res.data);
    } catch (error) {
      return Err('Failed to get global staking data: ' + error);
    }
  }

  async stakeAndVote(
    stakeAmount: number,
    selectedDuration: DURATION
  ): AsyncResult<string, string> {
    if (stakeAmount % MIN_STAKE !== 0)
      return Err('Stake amount should be multiple of 2100');

    const is21k = stakeAmount === SEED_FOR_MINTING_NFT;
    const isPermanent = selectedDuration === INFINITE;
    const shouldMintNFT = is21k && isPermanent;
    const stakeUnits = BigInt(stakeAmount) / BigInt(MIN_STAKE);
    const lockPeriod =
      selectedDuration === INFINITE
        ? maxUint256
        : BigInt(DURATION_MAP[selectedDuration].lockDuration) *
          BigInt(ETH_BLOCKS_PER_DAY);

    const stakeContract = getContract({
      address: convertTo0xString(this.config.STAKING_CONTRACT_ADDRESS),
      abi: StakeABI,
      client: { public: this.walletClient, wallet: this.walletClient },
    });

    const flowerContract = getContract({
      address: convertTo0xString(this.config.FLOWER_CONTRACT_ADDRESS),
      abi: FlowerABI,
      client: { public: this.walletClient, wallet: this.walletClient },
    });

    const approveRes = await checkAllowanceAndApprove(
      stakeAmount,
      this.config.SEED_ADDRESS,
      shouldMintNFT
        ? this.config.FLOWER_CONTRACT_ADDRESS
        : this.config.STAKING_CONTRACT_ADDRESS,
      this.walletClient
    );
    if (approveRes.error) return Err('Approve Error', approveRes.error);

    try {
      if (shouldMintNFT) {
        const res = await flowerContract.write.mint(
          [convertTo0xString(this.config.GARDEN_FILLER_ADDRESS)],
          {
            account: this.address,
            chain: this.walletClient.chain,
          }
        );
        return Ok(res);
      } else {
        const res = await stakeContract.write.vote(
          [
            convertTo0xString(this.config.GARDEN_FILLER_ADDRESS),
            stakeUnits,
            lockPeriod,
          ],
          {
            account: this.address,
            chain: this.walletClient.chain,
          }
        );
        return Ok(res);
      }
    } catch (error) {
      return Err('Failed to stake: ' + error);
    }
  }

  async unStake(stakeId: string): AsyncResult<string, string> {
    const stakeContract = getContract({
      address: convertTo0xString(this.config.STAKING_CONTRACT_ADDRESS),
      abi: StakeABI,
      client: { public: this.walletClient, wallet: this.walletClient },
    });

    try {
      const txHash = await stakeContract.write.refund(
        [convertTo0xString(stakeId)],
        {
          account: this.address,
          chain: this.walletClient.chain,
        }
      );

      return Ok(txHash);
    } catch (error) {
      return Err('Failed to unStake: ' + error);
    }
  }

  async renewStake(
    stakeId: string,
    duration: DURATION
  ): AsyncResult<string, string> {
    const stakeContract = getContract({
      address: convertTo0xString(this.config.STAKING_CONTRACT_ADDRESS),
      abi: StakeABI,
      client: { public: this.walletClient, wallet: this.walletClient },
    });

    try {
      const txHash = await stakeContract.write.renew(
        [convertTo0xString(stakeId), BigInt(duration)],
        {
          account: this.address,
          chain: this.walletClient.chain,
        }
      );

      return Ok(txHash);
    } catch (error) {
      return Err('Failed to unStake: ' + error);
    }
  }
  async extendStake(
    stakeId: string,
    duration: DURATION
  ): AsyncResult<string, string> {
    const stakeContract = getContract({
      address: convertTo0xString(this.config.STAKING_CONTRACT_ADDRESS),
      abi: StakeABI,
      client: { public: this.walletClient, wallet: this.walletClient },
    });

    try {
      const txHash = await stakeContract.write.extend(
        [convertTo0xString(stakeId), BigInt(duration)],
        {
          account: this.address,
          chain: this.walletClient.chain,
        }
      );

      return Ok(txHash);
    } catch (error) {
      return Err('Failed to unStake: ' + error);
    }
  }
}
