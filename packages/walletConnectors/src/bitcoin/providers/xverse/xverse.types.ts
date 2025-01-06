export interface XVerseBitcoinProvider {
  request: (
    method: string,
    params: any
  ) => Promise<{
    result?: any;
    error?: any;
    status: 'success' | 'error';
  }>;
}
