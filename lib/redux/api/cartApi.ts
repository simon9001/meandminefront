import { baseApi } from './baseApi';
import type { Cart } from '@/lib/types';

interface ApiWrap<T> { data: T; success: boolean; }

type RawCartItem = Record<string, unknown>;
type RawMedia   = { url: string; is_primary: boolean };

function mapCartItem(item: RawCartItem): Cart['items'][number] {
  const rawProducts = (item.products ?? null) as Record<string, unknown> | null;
  const media = Array.isArray(rawProducts?.product_media)
    ? (rawProducts!.product_media as RawMedia[])
    : [];
  const primaryMedia = media.find((m) => m.is_primary) ?? media[0] ?? null;

  return {
    ...item,
    // snake_case → camelCase for item-level fields
    unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
    productId: (item.product_id ?? item.productId ?? '') as string,
    variantId: (item.variant_id ?? item.variantId) as string | undefined,
    supplyId:  (item.supply_id  ?? item.supplyId)  as string | undefined,
    // Normalise the nested products object
    products: rawProducts ? {
      ...rawProducts,
      basePrice:      Number(rawProducts.base_price ?? rawProducts.basePrice ?? 0),
      salePrice:      rawProducts.sale_price != null ? Number(rawProducts.sale_price) : undefined,
      // Flatten product_media array into a single primaryImageUrl
      primaryImageUrl: primaryMedia?.url ?? null,
    } : null,
  } as Cart['items'][number];
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getCart: builder.query<Cart, void>({
      query: () => '/cart',
      transformResponse: (res: ApiWrap<{ id: string | null; items: RawCartItem[]; subtotal: number }>) => ({
        id:       res.data.id,
        subtotal: Number(res.data.subtotal ?? 0),
        items:    (res.data.items ?? []).map(mapCartItem),
      }),
      providesTags: ['Cart'],
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
