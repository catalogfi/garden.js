import { AsyncResult, Fetcher, Ok, Err } from '@catalogfi/utils';
import {
  CreateOrder,
  CreateOrderRequestWithAdditionalData,
  CreateOrderResponse,
  IOrderbook,
  MatchedOrder,
  PaginatedData,
  PaginationConfig,
} from './orderbook.types';
import { APIResponse, ApiStatus, IAuth, Url } from '@gardenfi/utils';
import { ConstructUrl } from '../utils';

/**
 * A class that allows you to create and manage orders with the orderbook url.
 * @class
 * @implements {IOrderbook}
 */
export class Orderbook implements IOrderbook {
  private Url: Url;

  constructor(url: Url) {
    this.Url = url;
  }

  /**
   * Creates an order
   * @param {CreateOrderRequestWithAdditionalData} order - The configuration for the creating the order.
   * @param {IAuth} auth - The auth object.
   * @returns {string} The create order ID.
   */
  async createOrder(
    order: CreateOrderRequestWithAdditionalData,
    auth: IAuth,
  ): AsyncResult<string, string> {
    const headers = await auth.getAuthHeaders();
    if (headers.error) return Err(headers.error);

    try {
      const res = await Fetcher.post<CreateOrderResponse>(
        this.Url.endpoint('/relayer').endpoint('create-order'),
        {
          body: JSON.stringify(order),
          headers: {
            ...headers.val,
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('CreateOrder: Unexpected error, result is undefined');
    } catch (error) {
      return Err('CreateOrder:', String(error));
    }
  }

  async getOrder<T extends boolean>(
    id: string,
    matched: T,
  ): AsyncResult<T extends true ? MatchedOrder : CreateOrder, string> {
    const endpoint = matched ? `/id/matched/${id}` : `/id/unmatched/${id}`;
    const url = this.Url.endpoint('orders').endpoint(endpoint);

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
    const url = ConstructUrl(
      this.Url.endpoint('orders'),
      `/user/matched/${address}`,
      {
        ...paginationConfig,
        pending,
      },
    );

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
      this.Url.endpoint('orders'),
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
    const url = ConstructUrl(
      this.Url.endpoint('orders'),
      endPoint,
      paginationConfig,
    );

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

    return () => {
      clearInterval(intervalId);
    };
  }

  async getOrdersCount(address: string): AsyncResult<number, string> {
    const url = this.Url.endpoint('orders').endpoint(`/user/count/${address}`);

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
