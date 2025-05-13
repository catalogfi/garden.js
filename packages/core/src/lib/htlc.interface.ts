export interface IHTLCWallet {
  id(): string;
  init(): Promise<string>;
  redeem(secret: string, receiver?: string): Promise<string>;
  refund(receiver?: string): Promise<string>;
}
