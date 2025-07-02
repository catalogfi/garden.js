import { Address } from 'viem';

export class OnChainIdentifier {
  isEVM: boolean;
  address: string | Address;

  private constructor(isEVM: boolean, address: string | Address) {
    this.isEVM = isEVM;
    this.address = address;
  }

  static from_evm(address: Address): OnChainIdentifier {
    return new OnChainIdentifier(true, address);
  }

  static from_btc(address: string): OnChainIdentifier {
    const t = new OnChainIdentifier(false, address);
    return t;
  }

  unwrap_evm(): Address {
    if (!this.isEVM) {
      throw new Error('Not an EVM address');
    }
    return this.address as Address;
  }

  unwrap_btc(): string {
    if (this.isEVM) {
      throw new Error('Not a BTC address');
    }
    return this.address as string;
  }

  isEvm(): this is { address: Address; isEVM: true } {
    return this.isEVM;
  }

  isBtc(): this is { address: string; isEVM: false } {
    return !this.isEVM;
  }
}
