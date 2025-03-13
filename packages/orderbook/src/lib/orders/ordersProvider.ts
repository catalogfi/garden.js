import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { IOrderProvider } from './orders.types';
import {
  CreateOrder,
  MatchedOrder,
  PaginatedData,
  PaginationConfig,
} from '../orderbook/orderbook.types';
import { APIResponse, ApiStatus, Url } from '@gardenfi/utils';
import { ConstructUrl } from '../utils';

export class OrdersProvider implements IOrderProvider {
  private url: Url;

  constructor(url: string) {
    this.url = new Url(url).endpoint('orders');
  }

  async getOrder<T extends boolean>(
    id: string,
    matched: T,
  ): AsyncResult<T extends true ? MatchedOrder : CreateOrder, string> {
    const endpoint = matched ? `/id/matched/${id}` : `/id/unmatched/${id}`;
    const url = this.url.endpoint(endpoint);

    try {
      const res = await Fetcher.get<
        APIResponse<T extends true ? MatchedOrder : CreateOrder>
      >(url);

      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('GetOrder: Unexpected error, result is undefined');
    } catch (error) {
      return Err('GetOrder:', String(error));
    }
  }

  async getMatchedOrders(
    address: string,
    pending: boolean,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<PaginatedData<MatchedOrder>, string> {
    const url = ConstructUrl(this.url, `/user/matched/${address}`, {
      ...paginationConfig,
      pending,
    });

    try {
      const res = await Fetcher.get<APIResponse<PaginatedData<MatchedOrder>>>(
        url,
      );

      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('GetMatchedOrders: Unexpected error, result is undefined');
    } catch (error) {
      return Err('GetMatchedOrders:', String(error));
    }
  }

  async getUnMatchedOrders(
    address: string,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<PaginatedData<CreateOrder>, string> {
    const url = ConstructUrl(
      this.url,
      `/user/unmatched/${address}`,
      paginationConfig,
    );

    try {
      const res = await Fetcher.get<APIResponse<PaginatedData<CreateOrder>>>(
        url,
      );

      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('GetUnMatchedOrders: Unexpected error, result is undefined');
    } catch (error) {
      return Err('GetUnMatchedOrders:', String(error));
    }
  }

  async getOrders<T extends boolean>(
    matched: T,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<
    PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    string
  > {
    const endPoint = matched ? '/matched' : '/unmatched';
    const url = ConstructUrl(this.url, endPoint, paginationConfig);

    try {
      const res = await Fetcher.get<
        APIResponse<PaginatedData<T extends true ? MatchedOrder : CreateOrder>>
      >(url);

      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('GetAllOrders: Unexpected error, result is undefined');
    } catch (error) {
      return Err('GetAllOrders:', String(error));
    }
  }

  async subscribeOrders<T extends boolean>(
    account: string,
    matched: T,
    interval: number,
    cb: (
      orders: PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    ) => Promise<void>,
    pending: boolean = false,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void> {
    let isProcessing = false;

    const fetchOrders = async () => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        const result = matched
          ? await this.getMatchedOrders(account, pending, paginationConfig)
          : await this.getUnMatchedOrders(account, paginationConfig);
        if (result.ok) {
          await cb(
            result.val as PaginatedData<
              T extends true ? MatchedOrder : CreateOrder
            >,
          );
        } else {
          console.error('Error fetching orders:', result.error);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        isProcessing = false;
      }
    };

    await fetchOrders();
    const intervalId = setInterval(fetchOrders, interval);

    // Return a function to clear the interval if needed
    return () => {
      clearInterval(intervalId);
    };
  }

  async getOrdersCount(address: string): AsyncResult<number, string> {
    const url = this.url.endpoint(`/user/count/${address}`);

    try {
      const res = await Fetcher.get<APIResponse<number>>(url);

      if (res.error) return Err(res.error);
      return res.status === ApiStatus.Ok && res.result !== undefined
        ? Ok(res.result)
        : Err('GetOrdersCount: Unexpected error, result is undefined');
    } catch (error) {
      return Err('GetOrdersCount:', String(error));
    }
  }
}
