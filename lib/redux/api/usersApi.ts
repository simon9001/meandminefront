import { baseApi } from './baseApi';

export interface SavedAddress {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  county?: string | null;
  postal_code?: string | null;
  country_code: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateAddressPayload {
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postalCode?: string;
  countryCode?: string;
  isDefault?: boolean;
}

interface ApiWrap<T> { data: T; success: boolean; }

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    listAddresses: builder.query<SavedAddress[], void>({
      query: () => '/users/addresses',
      transformResponse: (res: ApiWrap<SavedAddress[]>) => res.data,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Address' as const, id })), 'Address']
          : ['Address'],
    }),

    createAddress: builder.mutation<SavedAddress, CreateAddressPayload>({
      query: (body) => ({ url: '/users/addresses', method: 'POST', body }),
      transformResponse: (res: ApiWrap<SavedAddress>) => res.data,
      invalidatesTags: ['Address'],
    }),

    updateAddress: builder.mutation<SavedAddress, { id: string } & Partial<CreateAddressPayload>>({
      query: ({ id, ...body }) => ({ url: `/users/addresses/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<SavedAddress>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Address', id }, 'Address'],
    }),

    deleteAddress: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Address', id }, 'Address'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useListAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = usersApi;
