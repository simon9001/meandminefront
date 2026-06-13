import { baseApi } from './baseApi';
import type { Product, Paginated, SupplierComparison, Review } from '@/lib/types';

interface ApiWrap<T> { data: T; success: boolean; }

export interface ProductFilters {
  page?:     number;
  limit?:    number;
  search?:   string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?:     'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular';
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    listProducts: builder.query<Paginated<Product>, ProductFilters>({
      query: (params) => ({ url: '/products', params: params as Record<string, unknown> }),
      providesTags: (result) =>
        result ? [...result.data.map(({ id }) => ({ type: 'Product' as const, id })), 'Product'] : ['Product'],
      keepUnusedDataFor: 300,
    }),

    getProduct: builder.query<Product, string>({
      query: (slug) => `/products/${slug}`,
      transformResponse: (res: ApiWrap<Product>) => res.data,
      providesTags: (_r, _e, slug) => [{ type: 'Product', id: slug }],
      keepUnusedDataFor: 120,
    }),

    getProductSuppliers: builder.query<SupplierComparison[], string>({
      query: (productId) => `/products/${productId}/suppliers`,
      transformResponse: (res: ApiWrap<SupplierComparison[]>) => res.data,
      keepUnusedDataFor: 60,
    }),

    listCategories: builder.query<{ id: string; name: string; slug: string; imageUrl?: string }[], void>({
      query: () => '/categories',
      transformResponse: (res: ApiWrap<{ id: string; name: string; slug: string; imageUrl?: string }[]>) => res.data,
      keepUnusedDataFor: 600,
    }),

    listProductReviews: builder.query<Paginated<Review>, { productId: string; page?: number; rating?: number }>({
      query: ({ productId, ...params }) => ({ url: `/reviews/product/${productId}`, params }),
      providesTags: (_r, _e, { productId }) => [{ type: 'Review', id: productId }],
    }),

    createReview: builder.mutation<Review, { productId: string; rating: number; title?: string; body: string }>({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      transformResponse: (res: ApiWrap<Review>) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Review', id: productId }, { type: 'Product', id: productId }],
    }),

    voteReview: builder.mutation<void, { reviewId: string; vote: 'helpful' | 'not_helpful' }>({
      query: ({ reviewId, vote }) => ({ url: `/reviews/${reviewId}/vote`, method: 'POST', body: { vote } }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useGetProductSuppliersQuery,
  useListCategoriesQuery,
  useListProductReviewsQuery,
  useCreateReviewMutation,
  useVoteReviewMutation,
} = productsApi;
