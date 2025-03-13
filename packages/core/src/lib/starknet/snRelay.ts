import { checkAllowanceAndApprove } from '@gardenfi/utils';
import { Account, WalletAccount, Contract, RpcProvider } from 'starknet';
import { MatchedOrder } from '@gardenfi/orderbook';
import { IStarknetRelay } from './snRelay.types';
import { AsyncResult, Err, Fetcher, Ok, trim0x } from '@catalogfi/utils';
import { APIResponse, IAuth, Url, with0x } from '@gardenfi/utils';

export class snRelay implements IStarknetRelay {
  private url: Url;
  private auth: IAuth;

  constructor(url: string | Url, auth: IAuth) {
    this.url = new Url('/relayer', url);
    this.auth = auth;
  }

  async init(
    account: Account,
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    if (!account.address) return Err('No account address');
    if (
      account.address.toLowerCase() !==
      order.source_swap.initiator.toLowerCase()
    )
      return Err('Account address does not match initiator address');

    const { create_order, source_swap } = order;

    if (
      !source_swap.amount ||
      !source_swap.redeemer ||
      !create_order.timelock ||
      !create_order.secret_hash
    )
      return Err('Invalid order');

    const secretHash = with0x(create_order.secret_hash);
    const timelock = BigInt(create_order.timelock);
    const redeemer = with0x(source_swap.redeemer);
    const amount = BigInt(source_swap.amount);
    // const asasd = new Account()
    try {
      const auth = await this.auth.getAuthHeaders();
      if (auth.error) return Err(auth.error);
      const STARK =
        '0x4718F5A0FC34CC1AF16A1CDEE98FFB20C31F5CD61D6AB07201858F4287C938D';
      const starknetProvider = new RpcProvider({
        nodeUrl: 'http://127.0.0.1:8547/rpc',
      });
      const contractData = await starknetProvider.getClassAt(STARK);

      const contract = new Contract(contractData.abi, STARK, starknetProvider);

      const token = contract.address;
      //   account,
      // );
      // const contract =
      // new Contract(abi, contractaddress, walletClient);

      return Ok('');
    } catch (error) {
      console.error('init error:', error);
      return Err(String(error));
    }
  }

  async redeem(orderId: string, secret: string): AsyncResult<string, string> {
    try {
      return Ok('');
    } catch (error) {
      return Err(String(error));
    }
  }
}
