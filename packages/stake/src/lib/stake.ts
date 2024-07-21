import { Url } from '@gardenfi/utils';
import { AsyncResult, Err, Fetcher, Ok, Result } from '@catalogfi/utils';
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
import {
  checkAllowanceAndApprove,
  convertTo0xString,
  executeWithTryCatch,
} from './utils';

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
    return executeWithTryCatch<Stake[]>(async () => {
      const res = await Fetcher.get<{ data: Stake[] }>(
        api.endpoint('/stakes?userId=' + address)
      );
      return res.data;
    }, 'Failed to get stakes');
  }

  static async getGlobalStakingData(
    api: Url
  ): AsyncResult<GlobalStakingData, string> {
    return executeWithTryCatch<GlobalStakingData>(async () => {
      const res = await Fetcher.get<{ data: GlobalStakingData }>(
        api.endpoint('/stakingStats')
      );
      return res.data;
    }, 'Failed to get global staking data');
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

    if (shouldMintNFT) {
      return executeWithTryCatch<`0x${string}`>(
        async () =>
          await flowerContract.write.mint(
            [convertTo0xString(this.config.GARDEN_FILLER_ADDRESS)],
            {
              account: this.address,
              chain: this.walletClient.chain,
            }
          ),
        'Failed to mint NFT'
      );
    } else {
      return executeWithTryCatch<`0x${string}`>(
        async () =>
          await stakeContract.write.vote(
            [
              convertTo0xString(this.config.GARDEN_FILLER_ADDRESS),
              stakeUnits,
              lockPeriod,
            ],
            {
              account: this.address,
              chain: this.walletClient.chain,
            }
          ),
        'Failed to stake'
      );
    }
  }

  async unStake(stakeId: string): AsyncResult<string, string> {
    const stakeContract = getContract({
      address: convertTo0xString(this.config.STAKING_CONTRACT_ADDRESS),
      abi: StakeABI,
      client: { public: this.walletClient, wallet: this.walletClient },
    });

    return executeWithTryCatch<`0x${string}`>(
      async () =>
        await stakeContract.write.refund([convertTo0xString(stakeId)], {
          account: this.address,
          chain: this.walletClient.chain,
        }),
      'Failed to unStake'
    );
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

    return executeWithTryCatch<`0x${string}`>(
      async () =>
        await stakeContract.write.renew(
          [convertTo0xString(stakeId), BigInt(duration)],
          {
            account: this.address,
            chain: this.walletClient.chain,
          }
        ),
      'Failed to renew stake'
    );
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

    return executeWithTryCatch<`0x${string}`>(
      async () =>
        await stakeContract.write.extend(
          [convertTo0xString(stakeId), BigInt(duration)],
          {
            account: this.address,
            chain: this.walletClient.chain,
          }
        ),
      'Failed to extend stake'
    );
  }
}
