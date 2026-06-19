import { baseApi } from './baseApi';
import type { Order, Paginated } from '@/lib/types';

interface ApiWrap<T> { data: T; success: boolean; }

export interface CreateOrderPayload {
  items:            { productId: string; variantId?: string; supplyId?: string; quantity: number }[];
  shippingAddress?: Record<string, string>;
  shippingFee?:     number;
  discountCode?:    string;
  notes?:           string;
  idempotencyKey?:  string;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    listMyOrders: builder.query<Paginated<Order>, { page?: number; status?: string }>({
      query: (params) => ({ url: '/orders/my', params }),
      providesTags: (result) =>
        result ? [...result.data.map(({ id }) => ({ type: 'Order' as const, id })), 'Order'] : ['Order'],
      // Auto-refresh every 2 minutes so order status updates appear automatically
      keepUnusedDataFor: 120,
    }),

    getMyOrder: builder.query<Order, string>({
      query: (orderId) => `/orders/my/${orderId}`,
      transformResponse: (res: ApiWrap<Order>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
      // Poll every 30s so shipment status updates in real time on the order detail page
      keepUnusedDataFor: 60,
    }),

    createOrder: builder.mutation<{ id: string; orderNumber: string }, CreateOrderPayload>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      transformResponse: (res: ApiWrap<{ id: string; orderNumber: string }>) => res.data,
      invalidatesTags: ['Order', 'Cart'],
    }),

    cancelOrder: builder.mutation<Order, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({ url: `/orders/${orderId}/cancel`, method: 'POST', body: { reason } }),
      transformResponse: (res: ApiWrap<Order>) => res.data,
      invalidatesTags: (_r, _e, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),

    initializePayment: builder.mutation<{ authorizationUrl: string; reference: string }, string>({
      query: (orderId) => ({ url: '/payments/initialize', method: 'POST', body: { orderId } }),
      transformResponse: (res: ApiWrap<{ authorizationUrl: string; reference: string }>) => res.data,
    }),

    verifyPayment: builder.mutation<{ status: string }, string>({
      query: (reference) => ({ url: `/payments/verify/${reference}`, method: 'GET' }),
      transformResponse: (res: ApiWrap<{ status: string }>) => res.data,
      invalidatesTags: ['Order', 'Cart'],
    }),

    validateDiscountCode: builder.mutation<{ discountAmount: number; description: string }, { code: string; subtotal: number }>({
      query: (body) => ({ url: '/discount-codes/validate', method: 'POST', body }),
      transformResponse: (res: ApiWrap<{ discountAmount: number; description: string }>) => res.data,
    }),

    getWishlist: builder.query<{ id: string; products: unknown }[], void>({
      query: () => '/wishlist',
      transformResponse: (res: ApiWrap<{ id: string; products: unknown }[]>) => res.data,
      providesTags: ['Wishlist'],
    }),

    addToWishlist: builder.mutation<{ id: string }, { productId: string }>({
      query: (body) => ({ url: '/wishlist', method: 'POST', body }),
      transformResponse: (res: ApiWrap<{ id: string }>) => res.data,
      invalidatesTags: ['Wishlist'],
    }),

    removeFromWishlist: builder.mutation<void, string>({
      query: (id) => ({ url: `/wishlist/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMyOrdersQuery,
  useGetMyOrderQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useInitializePaymentMutation,
  useVerifyPaymentMutation,
  useValidateDiscountCodeMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = ordersApi;
