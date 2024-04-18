export interface IAuth {
    getToken(): Promise<string>;
    verifyToken(token: string, account: string): boolean;
}
