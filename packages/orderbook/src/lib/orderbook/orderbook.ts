import {
  IOrderbook,
  CreateOrderResponse,
  Order,
  PaginatedData,
  PaginationConfig,
  Status,
  CreateOrderRequest,
  OrderStatus,
} from './orderbook.types';
import {
  APIResponse,
  AsyncResult,
  Err,
  Fetcher,
  IAuth,
  Ok,
  Url,
  Request as UtilsRequest,
} from '@gardenfi/utils';
import { ConstructUrl, discriminateOrderResponse } from '../utils';
import { Chain } from '../asset';

/**
 * A class that allows you to create and manage orders with the orderbook url.
 * @class
 * @implements {IOrderbook}
 */
export class Orderbook implements IOrderbook {
  private url: Url;

  constructor(url: Url) {
    this.url = url;
  }

  /**
   * Creates an order
   * @param {CreateOrderRequest} order - The configuration for the creating the order.
   * @param {IAuth} auth - The auth object.
   * @returns {CreateOrderResponse} The create order ID.
   */
  async createOrder(
    order: CreateOrderRequest,
    auth: IAuth,
  ): AsyncResult<CreateOrderResponse, string> {
    try {
      const headers = await auth.getAuthHeaders();
      if (headers.error) {
        return Err(headers.error);
      }
      const res = await Fetcher.post<APIResponse<CreateOrderResponse>>(
        this.url.endpoint('/v2/orders'),
        {
          body: JSON.stringify(order),
          headers: {
            ...headers.val,
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.error) return Err(res.error);

      if (!res.result)
        return Err('CreateOrder: Unexpected error, result is undefined');

      const createOrderResponse = discriminateOrderResponse(res.result);

      if (!createOrderResponse) {
        return Err('CreateOrder: Unable to determine order type from response');
      }

      return Ok(createOrderResponse);
    } catch (error) {
      return Err('CreateOrder Err:', String(error));
    }
  }

  /**
   * Get an order by its ID
   * @param id - The ID of the order
   * @returns {AsyncResult<Order, string>} A promise that resolves to the order.
   */
  async getOrder(
    id: string,
    request?: UtilsRequest,
  ): AsyncResult<Order, string> {
    try {
      const url = this.url.endpoint(`/v2/orders`).endpoint(id);
      const res = await Fetcher.get<APIResponse<Order>>(url, { ...request });

      if (res.error) return Err(res.error);
      if (!res.result)
        return Err('GetOrder: Unexpected error, result is undefined');
      return Ok(res.result);
    } catch (error: any) {
      return Err(
        `GetOrder: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get orders by status
   * @param address - The address of the order
   * @param status - The status of the order
   * @param paginationConfig - The pagination configuration
   * @returns {AsyncResult<PaginatedData<Order>, string>} A promise that resolves to the orders.
   */
  async getOrdersByStatus(
    address: string,
    status: Status,
    paginationConfig?: PaginationConfig,
    request?: UtilsRequest,
  ): AsyncResult<PaginatedData<Order>, string> {
    try {
      const endpoint = '/v2/orders';

      const params = {
        ...(paginationConfig?.page && { page: paginationConfig.page }),
        ...(paginationConfig?.per_page && {
          per_page: paginationConfig.per_page,
        }),
        ...(address && { address }),
        ...(status && { status }),
      };

      const url = ConstructUrl(this.url, endpoint, params);

      const res = await Fetcher.get<APIResponse<PaginatedData<Order>>>(url, {
        ...request,
      });

      if (res.error) return Err(res.error);

      if (!res.result)
        return Err('GetOrdersByStatus: Unexpected error, result is undefined');

      return Ok(res.result);
    } catch (error: any) {
      return Err(
        `GetOrdersByStatus: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get all orders
   * @param filters - The filters for the orders
   * @param paginationConfig - The pagination configuration
   * @returns {AsyncResult<PaginatedData<Order>, string>} A promise that resolves to the orders.
   */
  async getOrders(
    filters: {
      address?: string;
      tx_hash?: string;
      from_chain?: Chain;
      to_chain?: Chain;
      status?: OrderStatus | OrderStatus[];
      [key: string]: string | string[] | undefined;
    },
    paginationConfig?: PaginationConfig,
    address?: string,
    tx_hash?: string,
  ): AsyncResult<PaginatedData<Order>, string> {
    const endpoint = '/v2/orders';
    const params = {
      ...(paginationConfig?.page && { page: paginationConfig.page }),
      ...(paginationConfig?.per_page && {
        per_page: paginationConfig.per_page,
      }),
      ...(address && { address }),
      ...(tx_hash && { tx_hash }),
      ...(filters.from_chain && { from_chain: filters.from_chain }),
      ...(filters.to_chain && { to_chain: filters.to_chain }),
      ...(filters.status && { status: filters.status }),
      ...(filters.address && { address: filters.address }),
      ...(filters.tx_hash && { tx_hash: filters.tx_hash }),
    };

    const url = ConstructUrl(this.url, endpoint, params);

    try {
      const res = await Fetcher.get<APIResponse<PaginatedData<Order>>>(url);

      if (res.error) return Err(res.error);

      if (!res.result)
        return Err('GetAllOrders: Unexpected error, result is undefined');

      return Ok(res.result);
    } catch (error: any) {
      return Err(
        `GetAllOrders: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Subscribe to orders
   * @param account - The account of the order
   * @param interval - The interval of the order
   * @param cb - The callback function
   * @param status - The status of the order
   * @param paginationConfig - The pagination configuration
   * @returns {Promise<() => void>} A promise that resolves to the unsubscribe function.
   */
  async subscribeOrders(
    account: string,
    interval: number,
    cb: (orders: PaginatedData<Order>) => Promise<void>,
    status: Status = 'all',
    paginationConfig?: PaginationConfig,
  ): Promise<() => void> {
    let isProcessing = false;
    const fetchOrders = async () => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        const result = await this.getOrdersByStatus(
          account,
          status,
          paginationConfig,
        );
        if (result.ok) {
          await cb(result.val);
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
}
