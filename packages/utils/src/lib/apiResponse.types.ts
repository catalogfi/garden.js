export enum ApiStatus {
  Ok = 'Ok',
  Error = 'Error',
}

export type APIResponse<T> = {
  status: ApiStatus;
  result?: T;
  error?: string;
};
