import { baseApi } from './baseApi';
import type { Cart } from '@/lib/types';

interface ApiWrap<T> { data: T; success: boolean; }

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getCart: builder.query<Cart, void>({
      query: () => '/cart',
      transformResponse: (res: ApiWrap<Cart>) => res.data,
      providesTags: ['Cart'],
      // Auto-refresh every 90s so cart stays in sync across tabs/devices
      keepUnusedDataFor: 90,
    }),

    addToCart: builder.mutation<void, { productId: string; variantId?: string; supplyId?: string; quantity: number }>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: builder.mutation<void, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({ url: `/cart/items/${itemId}`, method: 'PATCH', body: { quantity } }),
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation<void, string>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: builder.mutation<void, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    mergeCart: builder.mutation<void, { sessionId: string }>({
      query: (body) => ({ url: '/cart/merge', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useMergeCartMutation,
} = cartApi;
