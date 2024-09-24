import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { IOrderProvider } from './orders.types';
import {
  CreateOrder,
  MatchedOrder,
  PaginatedData,
  PaginationConfig,
} from '../orderbook/orderbook.types';
import { APIResponse, Url } from '@gardenfi/utils';
import { ConstructUrl } from '../utils';

export class OrdersProvider implements IOrderProvider {
  private url: Url;

  constructor(url: string | Url) {
    this.url = new Url('/orders', url);
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

  async getOrders<T extends boolean>(
    address: string,
    matched: T,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<
    PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    string
  > {
    const endpoint = matched ? 'matched' : 'unmatched';
    const url = ConstructUrl(
      this.url,
      `/user/${endpoint}/${address}`,
      paginationConfig,
    );

    try {
      const res = await Fetcher.get<
        APIResponse<PaginatedData<T extends true ? MatchedOrder : CreateOrder>>
      >(url);

      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('GetOrders: Unexpected error, result is undefined');
    } catch (error) {
      return Err('GetOrders:', String(error));
    }
  }

  async getAllOrders<T extends boolean>(
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
    ) => void,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void> {
    const fetchOrders = async () => {
      try {
        const result = await this.getOrders(account, matched, paginationConfig);
        if (result.ok) {
          cb(result.val);
        } else {
          console.error('Error fetching orders:', result.error);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    await fetchOrders();
    const intervalId = setInterval(fetchOrders, interval);

    // Return a function to clear the interval if needed
    return () => {
      clearInterval(intervalId);
    };
  }
}
