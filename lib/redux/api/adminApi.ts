import { baseApi } from './baseApi';
import type {
  Product,
  Category,
  Order,
  Address,
  AuthUser,
  Paginated,
  DashboardStats,
  DailyRevenue,
  TopProduct,
} from '@/lib/types';

interface ApiWrap<T> { data: T; success: boolean; }

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface InventoryItem {
  productId:      string;
  variantId?:     string;
  productName:    string;
  sku?:           string;
  availableStock: number;
  totalStock:     number;
  reservedStock:  number;
  warningThreshold: number;
}

export interface DiscountCode {
  id:             string;
  code:           string;
  description:    string;
  discountType:   'percentage' | 'fixed';
  discountValue:  number;
  minOrderAmount: number;
  maxUses?:       number;
  usedCount:      number;
  isActive:       boolean;
  expiresAt?:     string;
  createdAt:      string;
}

export interface Shipment {
  id:          string;
  orderId:     string;
  carrier?:    string;
  trackingNo?: string;
  status:      string;
  events:      { id: string; status: string; description: string; location?: string; eventTime: string }[];
}

export interface CreateProductPayload {
  name:                  string;
  slug:                  string;
  shortDescription?:     string;
  fullDescription?:      string;
  basePrice:             number;
  salePrice?:            number;
  showSalePrice?:        boolean;
  categoryId?:           string;
  brandId?:              string;
  status?:               string;
  isFeatured?:           boolean;
  isNewArrival?:         boolean;
  isBestSeller?:         boolean;
  stockWarningThreshold?: number;
  tags?:                 string[];
}

export interface CreateCategoryPayload {
  name:         string;
  slug:         string;
  description?: string;
  parentId?:    string;
  imageUrl?:    string;
}

export interface CreateDiscountPayload {
  code:           string;
  description:    string;
  discountType:   'percentage' | 'fixed';
  discountValue:  number;
  minOrderAmount?: number;
  maxUses?:       number;
  expiresAt?:     string;
}

export interface CreateShipmentPayload {
  orderId:      string;
  carrier?:     string;
  trackingNo?:  string;
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Dashboard / Analytics ──
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/admin/dashboard',
      transformResponse: (res: ApiWrap<DashboardStats>) => res.data,
      providesTags: ['Admin'],
    }),

    getDailyRevenue: builder.query<DailyRevenue[], number | void>({
      query: (days = 30) => `/admin/analytics/revenue?days=${days}`,
      transformResponse: (res: ApiWrap<DailyRevenue[]>) => res.data,
    }),

    getTopProducts: builder.query<TopProduct[], number | void>({
      query: (limit = 10) => `/admin/analytics/top-products?limit=${limit}`,
      transformResponse: (res: ApiWrap<TopProduct[]>) => res.data,
    }),

    // ── Products (admin) ──
    adminListProducts: builder.query<Paginated<Product>, { page?: number; limit?: number; search?: string; status?: string }>({
      query: (params) => ({ url: '/products', params }),
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: 'Product' as const, id })), 'Product']
          : ['Product'],
    }),

    createProduct: builder.mutation<Product, CreateProductPayload>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      transformResponse: (res: ApiWrap<Product>) => res.data,
      invalidatesTags: ['Product', 'Admin'],
    }),

    updateProduct: builder.mutation<Product, { id: string } & Partial<CreateProductPayload>>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<Product>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, 'Admin'],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product', 'Admin'],
    }),

    addProductMedia: builder.mutation<{ id: string; url: string; isPrimary: boolean }, {
      productId: string; url: string; isPrimary?: boolean; mediaType?: string; altText?: string; displayOrder?: number;
    }>({
      query: ({ productId, ...body }) => ({ url: `/products/${productId}/media`, method: 'POST', body }),
      transformResponse: (res: ApiWrap<{ id: string; url: string; isPrimary: boolean }>) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }, 'Product'],
    }),

    deleteProductMedia: builder.mutation<void, { productId: string; mediaId: string }>({
      query: ({ productId, mediaId }) => ({ url: `/products/${productId}/media/${mediaId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }, 'Product'],
    }),

    deleteUploadedImage: builder.mutation<void, { publicId: string }>({
      query: (body) => ({ url: '/upload/image', method: 'DELETE', body }),
    }),

    // ── Categories (admin) ──
    adminListCategories: builder.query<Category[], void>({
      query: () => '/categories',
      transformResponse: (res: ApiWrap<Category[]>) => res.data,
      providesTags: ['Admin'],
    }),

    createCategory: builder.mutation<Category, CreateCategoryPayload>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      transformResponse: (res: ApiWrap<Category>) => res.data,
      invalidatesTags: ['Admin'],
    }),

    updateCategory: builder.mutation<Category, { id: string } & Partial<CreateCategoryPayload>>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<Category>) => res.data,
      invalidatesTags: ['Admin'],
    }),

    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin'],
    }),

    // ── Orders (admin) ──
    adminListOrders: builder.query<Paginated<Order>, { page?: number; limit?: number; status?: string; paymentStatus?: string }>({
      query: (params) => ({ url: '/orders', params }),
      transformResponse: (res: unknown) => {
        const raw = res as { success: boolean; data: Record<string, unknown>[]; meta: { total: number; page: number; limit: number } };
        const orders: Order[] = raw.data.map((o) => ({
          id:             o.id as string,
          orderNumber:    (o.order_number ?? o.orderNumber) as string,
          status:         o.status as Order['status'],
          paymentStatus:  (o.payment_status ?? o.paymentStatus) as Order['paymentStatus'],
          subtotal:       Number(o.subtotal ?? 0),
          shippingFee:    Number(o.shipping_fee ?? o.shippingFee ?? 0),
          discountAmount: Number(o.discount_amount ?? o.discountAmount ?? 0),
          totalAmount:    Number(o.total_amount ?? o.totalAmount ?? 0),
          currency:       (o.currency as string) ?? 'KES',
          placedAt:       (o.placed_at ?? o.placedAt) as string,
          customerNote:   (o.customer_note ?? o.customerNote) as string | undefined,
          shippingAddress: (o.shipping_address ?? o.shippingAddress) as Order['shippingAddress'],
          orderItems: ((o.order_items ?? o.orderItems) as Record<string, unknown>[] | undefined)?.map((i) => ({
            id:                i.id as string,
            productId:         (i.product_id ?? i.productId ?? '') as string,
            productName:       (i.product_name ?? i.productName) as string,
            quantity:          Number(i.quantity),
            unitPrice:         Number(i.unit_price ?? i.unitPrice ?? 0),
            totalPrice:        Number(i.total_price ?? i.totalPrice ?? 0),
            fulfillmentStatus: (i.fulfillment_status ?? i.fulfillmentStatus ?? 'pending') as string,
          })),
        }));
        const { total, page, limit } = raw.meta ?? { total: 0, page: 1, limit: 20 };
        return {
          success: true,
          data: orders,
          meta: { total, page, limit, totalPages: Math.ceil(total / (limit || 1)) },
        };
      },
      providesTags: ['Order'],
    }),

    updateOrderStatus: builder.mutation<Order, { orderId: string; status: string; adminNote?: string }>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/status`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<Order>) => res.data,
      invalidatesTags: (_r, _e, { orderId }) => [{ type: 'Order', id: orderId }, 'Order', 'Admin'],
    }),

    // ── Inventory (admin) ──
    listInventory: builder.query<InventoryItem[], { search?: string; lowStock?: boolean }>({
      query: (params) => ({ url: '/inventory', params }),
      transformResponse: (res: ApiWrap<InventoryItem[]>) => res.data,
      providesTags: ['Admin'],
    }),

    listLowStock: builder.query<InventoryItem[], { threshold?: number }>({
      query: (params) => ({ url: '/inventory/low-stock', params }),
      transformResponse: (res: ApiWrap<InventoryItem[]>) => res.data,
      providesTags: ['Admin'],
    }),

    adjustInventory: builder.mutation<void, { productId: string; variantId?: string; delta: number; reason?: string }>({
      query: (body) => ({ url: '/inventory/adjust', method: 'POST', body }),
      invalidatesTags: ['Admin'],
    }),

    setInventory: builder.mutation<void, { productId: string; variantId?: string; quantity: number; reason?: string }>({
      query: (body) => ({ url: '/inventory/set', method: 'PUT', body }),
      invalidatesTags: ['Admin'],
    }),

    // ── Users (admin) ──
    listUsers: builder.query<AuthUser[], { page?: number; role?: string; search?: string }>({
      query: (params) => ({ url: '/users', params }),
      transformResponse: (res: ApiWrap<AuthUser[]>) => res.data,
      providesTags: ['Admin'],
    }),

    setUserRole: builder.mutation<void, { userId: string; role: string }>({
      query: ({ userId, role }) => ({ url: `/users/${userId}/role`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['Admin'],
    }),

    // ── Discount Codes (admin) ──
    listDiscountCodes: builder.query<DiscountCode[], void>({
      query: () => '/discount-codes',
      transformResponse: (res: ApiWrap<DiscountCode[]>) => res.data,
      providesTags: ['Admin'],
    }),

    createDiscountCode: builder.mutation<DiscountCode, CreateDiscountPayload>({
      query: (body) => ({ url: '/discount-codes', method: 'POST', body }),
      transformResponse: (res: ApiWrap<DiscountCode>) => res.data,
      invalidatesTags: ['Admin'],
    }),

    updateDiscountCode: builder.mutation<DiscountCode, { id: string } & Partial<CreateDiscountPayload & { isActive: boolean }>>({
      query: ({ id, ...body }) => ({ url: `/discount-codes/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<DiscountCode>) => res.data,
      invalidatesTags: ['Admin'],
    }),

    deleteDiscountCode: builder.mutation<void, string>({
      query: (id) => ({ url: `/discount-codes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin'],
    }),

    // ── Shipments (admin) ──
    getShipmentForOrder: builder.query<Shipment, string>({
      query: (orderId) => `/shipments/order/${orderId}`,
      transformResponse: (res: ApiWrap<Shipment>) => res.data,
    }),

    createShipment: builder.mutation<Shipment, CreateShipmentPayload>({
      query: (body) => ({ url: '/shipments', method: 'POST', body }),
      transformResponse: (res: ApiWrap<Shipment>) => res.data,
      invalidatesTags: ['Order', 'Admin'],
    }),

    addShipmentEvent: builder.mutation<Shipment, { shipmentId: string; status: string; description: string; location?: string; eventTime?: string }>({
      query: ({ shipmentId, ...body }) => ({ url: `/shipments/${shipmentId}/events`, method: 'POST', body }),
      transformResponse: (res: ApiWrap<Shipment>) => res.data,
      invalidatesTags: ['Order'],
    }),

    // ── Address (customer) ──
    listAddresses: builder.query<Address[], void>({
      query: () => '/users/addresses',
      transformResponse: (res: ApiWrap<Address[]>) => res.data,
      providesTags: ['User'],
    }),

    createAddress: builder.mutation<Address, Omit<Address, 'id'>>({
      query: (body) => ({ url: '/users/addresses', method: 'POST', body }),
      transformResponse: (res: ApiWrap<Address>) => res.data,
      invalidatesTags: ['User'],
    }),

    updateAddress: builder.mutation<Address, { addressId: string } & Partial<Omit<Address, 'id'>>>({
      query: ({ addressId, ...body }) => ({ url: `/users/addresses/${addressId}`, method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<Address>) => res.data,
      invalidatesTags: ['User'],
    }),

    deleteAddress: builder.mutation<void, string>({
      query: (addressId) => ({ url: `/users/addresses/${addressId}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),

    // ── Profile (customer) ──
    getProfile: builder.query<AuthUser, void>({
      query: () => '/users/profile',
      transformResponse: (res: ApiWrap<AuthUser>) => res.data,
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<AuthUser, Partial<Pick<AuthUser, 'firstName' | 'lastName'>>>({
      query: (body) => ({ url: '/users/profile', method: 'PATCH', body }),
      transformResponse: (res: ApiWrap<AuthUser>) => res.data,
      invalidatesTags: ['User'],
    }),

    refreshMaterializedViews: builder.mutation<void, void>({
      query: () => ({ url: '/admin/refresh-views', method: 'POST' }),
      invalidatesTags: ['Admin'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardStatsQuery,
  useGetDailyRevenueQuery,
  useGetTopProductsQuery,
  useAdminListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddProductMediaMutation,
  useDeleteProductMediaMutation,
  useDeleteUploadedImageMutation,
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAdminListOrdersQuery,
  useUpdateOrderStatusMutation,
  useListInventoryQuery,
  useListLowStockQuery,
  useAdjustInventoryMutation,
  useSetInventoryMutation,
  useListUsersQuery,
  useSetUserRoleMutation,
  useListDiscountCodesQuery,
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
  useGetShipmentForOrderQuery,
  useCreateShipmentMutation,
  useAddShipmentEventMutation,
  useListAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRefreshMaterializedViewsMutation,
} = adminApi;
