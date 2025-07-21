import {
  CreateOrderRequestWithAdditionalData,
  CreateOrderResponse,
  IOrderbook,
  NewCreateOrderRequest,
  Order,
  PaginatedData,
  PaginationConfig,
  Status,
} from './orderbook.types';
import {
  APIResponse,
  AsyncResult,
  Err,
  Fetcher,
  IAuth,
  Ok,
  Url,
} from '@gardenfi/utils';
import { ConstructUrl } from '../utils';
import { Chain } from '../asset';

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
    order: NewCreateOrderRequest,
    auth: IAuth,
  ): AsyncResult<string, string> {
    const headers = await auth.getAuthHeaders();
    if (headers.error) {
      return Err(headers.error);
    }
    try {
      const res = await Fetcher.post<CreateOrderResponse>(
        this.Url.endpoint('orders'),
        {
          body: JSON.stringify(order),
          headers: {
            ...headers.val,
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.error) {
        return Err(res.error);
      }
      return res.result
        ? Ok(res.result)
        : Err('CreateOrder: Unexpected error, result is undefined');
    } catch (error) {
      return Err('CreateOrder Err:', String(error));
    }
  }

  /**
   * Get an order by its ID
   * @param id - The ID of the order
   * @returns {AsyncResult<Order, string>} A promise that resolves to the order.
   */
  async getOrder(id: string): AsyncResult<Order, string> {
    try {
      const url = this.Url.endpoint(`/v2/orders/${id}`);
      const res = await Fetcher.get<APIResponse<Order>>(url);

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
      const url = ConstructUrl(this.Url, endpoint, params);
      const res = await Fetcher.get<APIResponse<PaginatedData<Order>>>(url);
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
   * @param paginationConfig - The pagination configuration
   * @param address - The address of the order
   * @param tx_hash - The transaction hash of the order
   * @param fromChain - The chain of the order
   * @param toChain - The chain of the order
   * @returns {AsyncResult<PaginatedData<Order>, string>} A promise that resolves to the orders.
   */
  async getOrders(
    paginationConfig?: PaginationConfig,
    address?: string,
    tx_hash?: string,
    fromChain?: Chain,
    toChain?: Chain,
  ): AsyncResult<PaginatedData<Order>, string> {
    // ?per_page=500&status=pending
    const endpoint = '/v2/orders';
    const params = {
      ...(paginationConfig?.page && { page: paginationConfig.page }),
      ...(paginationConfig?.per_page && {
        per_page: paginationConfig.per_page,
      }),
      ...(address && { address }),
      ...(tx_hash && { tx_hash }),
      ...(fromChain && { from_chain: fromChain }),
      ...(toChain && { to_chain: toChain }),
    };

    const url = ConstructUrl(this.Url, endpoint, params);

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
