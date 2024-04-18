import { JsonRpcSigner, Wallet } from 'ethers';
import { IAuth } from './auth.interface';
import { OrderbookOpts } from '../orderbook.types';
export declare class Siwe implements IAuth {
    private readonly url;
    private store;
    private readonly signer;
    private readonly signingStatement;
    private readonly domain;
    constructor(url: string, signer: JsonRpcSigner | Wallet, opts?: OrderbookOpts);
    verifyToken(token: string, account: string): boolean;
    getToken(): Promise<string>;
    private signStatement;
}
