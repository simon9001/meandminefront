import { baseApi } from './baseApi';
import type { Promotion } from '@/lib/types';

interface ApiWrap<T> { data: T; success: boolean; }

export interface CreatePromotionPayload {
  type: 'hero_slide' | 'navbar_banner';
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl?: string;
  offerText?: string;
  offerBg?: string;
  ctaText?: string;
  ctaUrl: string;
  bgColor?: string;
  tags?: string[];
  offerBadgeStyle?: string;
  ctaStyle?: string;
  displayOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    listPromotions: builder.query<Promotion[], { type?: string }>({
      query: (params) => ({ url: '/promotions', params }),
      transformResponse: (res: ApiWrap<Promotion[]>) => res.data,
      providesTags: ['Promotion'],
    }),

    adminListAllPromotions: builder.query<Promotion[], void>({
      query: () => '/promotions/all',
      transformResponse: (res: ApiWrap<Promotion[]>) => res.data,
      providesTags: ['Promotion'],
    }),

    createPromotion: builder.mutation<Promotion, CreatePromotionPayload>({
      query: (body) => ({ url: '/promotions', method: 'POST', body }),
      transformResponse: (res: ApiWrap<Promotion>) => res.data,
      invalidatesTags: ['Promotion'],
    }),

    updatePromotion: builder.mutation<Promotion, { id: string } & Partial<CreatePromotionPayload>>({
      query: ({ id, ...body }) => ({ url: `/promotions/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<Promotion>) => res.data,
      invalidatesTags: ['Promotion'],
    }),

    deletePromotion: builder.mutation<void, string>({
      query: (id) => ({ url: `/promotions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Promotion'],
    }),

  }),
});

export const {
  useListPromotionsQuery,
  useAdminListAllPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} = promotionsApi;
