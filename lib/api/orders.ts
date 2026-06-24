import { apiFetch } from '../api';
import { buildQueryString } from '../utils';
import type { ApiResponse, Paginated, Order, OrderItem, DeliveryInfo, DispatchInfo, CheckoutItem } from '../types';

// ─── Snake → camelCase mappers ────────────────────────────────────────────────

function mapOrderItem(i: Record<string, unknown>): OrderItem {
  return {
    id:                (i.id ?? '') as string,
    productId:         ((i.product_id ?? i.productId) ?? '') as string,
    productName:       ((i.product_name ?? i.productName) ?? '') as string,
    productSku:        (i.product_sku ?? i.productSku) as string | undefined,
    // Backend injects these as flat fields after a separate products lookup
    productSlug:       (i.product_slug ?? i.productSlug) as string | undefined,
    imageUrl:          (i.primary_image_url ?? i.imageUrl) as string | undefined,
    variantOptions:    (i.variant_options ?? i.variantOptions) as Record<string, string> | undefined,
    quantity:          Number(i.quantity ?? 0),
    unitPrice:         Number((i.unit_price ?? i.unitPrice) ?? 0),
    totalPrice:        Number((i.total_price ?? i.totalPrice) ?? 0),
    fulfillmentStatus: ((i.fulfillment_status ?? i.fulfillmentStatus) ?? 'pending') as string,
  };
}

function mapOrder(o: Record<string, unknown>): Order {
  const rawAddr = (o.shipping_address ?? o.shippingAddress) as Record<string, unknown> | undefined;
  const rawMeta = (o.metadata ?? {}) as Record<string, unknown>;
  return {
    id:             (o.id ?? '') as string,
    orderNumber:    ((o.order_number ?? o.orderNumber) ?? '') as string,
    status:         (o.status as Order['status']) ?? 'pending_payment',
    paymentStatus:  ((o.payment_status ?? o.paymentStatus) as Order['paymentStatus']) ?? 'pending',
    subtotal:       Number(o.subtotal ?? 0),
    shippingFee:    Number((o.shipping_fee ?? o.shippingFee) ?? 0),
    discountAmount: Number((o.discount_amount ?? o.discountAmount) ?? 0),
    totalAmount:    Number((o.total_amount ?? o.totalAmount) ?? 0),
    currency:       (o.currency as string) ?? 'KES',
    placedAt:       ((o.placed_at ?? o.placedAt) ?? '') as string,
    deliveredAt:    (o.delivered_at ?? o.deliveredAt) as string | undefined,
    customerNote:   ((o.customer_note ?? o.customerNote) as string | undefined),
    deliveryInfo:   rawAddr as DeliveryInfo | undefined,
    dispatchInfo:   (rawMeta.dispatchInfo as DispatchInfo | undefined),
    shippingAddress: rawAddr as Record<string, string> | undefined,
    orderItems: ((o.order_items ?? o.orderItems) as Record<string, unknown>[] | undefined)
      ?.map(mapOrderItem),
  };
}

// ─── Guest checkout (no auth) ─────────────────────────────────────────────────

export interface GuestOrderItem {
  name:     string;
  price:    number;
  quantity: number;
}

export interface GuestCheckoutPayload {
  items:        GuestOrderItem[];
  customerName: string;
  phone:        string;
  email?:       string;
  address:      string;
  zone:         'nairobi' | 'upcountry';
  payment:      'mpesa' | 'cod';
  shippingFee:  number;
}

export interface GuestOrderResponse {
  id:          string;
  orderNumber: string;
}

export async function createGuestOrder(payload: GuestCheckoutPayload) {
  return apiFetch<ApiResponse<GuestOrderResponse>>('/orders/guest', {
    method: 'POST', body: payload,
  });
}

// ─── Public order tracking (no auth) ─────────────────────────────────────────

export interface TrackedOrderItem {
  product_name: string;
  quantity:     number;
  unit_price:   number;
  total_price:  number;
}

export interface TrackedOrder {
  id:               string;
  order_number:     string;
  status:           string;
  payment_status:   string;
  subtotal:         number;
  shipping_fee:     number;
  total_amount:     number;
  currency:         string;
  placed_at:        string;
  metadata:         { payment_method?: string; zone?: string; dispatchInfo?: DispatchInfo; [key: string]: unknown };
  shipping_address: Record<string, string>;
  order_items:          TrackedOrderItem[];
  order_status_history: { from_status: string | null; to_status: string; changed_at: string }[];
}

export async function trackOrderByNumber(orderNumber: string) {
  return apiFetch<ApiResponse<TrackedOrder>>(
    `/orders/track/${encodeURIComponent(orderNumber)}`,
  );
}

// ─── Authenticated order endpoints ────────────────────────────────────────────

export async function listMyOrders(params?: { page?: number; limit?: number; status?: string }) {
  const qs = buildQueryString((params ?? {}) as Record<string, string | number | boolean | undefined>);
  const raw = await apiFetch<{ success: boolean; data: Record<string, unknown>[]; meta: { total: number; page: number; limit: number } }>(`/orders/my${qs}`);
  return {
    ...raw,
    data: (raw.data ?? []).map(mapOrder),
  } as Paginated<Order>;
}

export async function getMyOrder(orderId: string) {
  const raw = await apiFetch<ApiResponse<Record<string, unknown>>>(`/orders/my/${orderId}`);
  return {
    ...raw,
    data: mapOrder(raw.data),
  } as ApiResponse<Order>;
}

export interface CreateOrderPayload {
  items: CheckoutItem[];
  addressId?: string;
  discountCode?: string;
  shippingFee?: number;
  notes?: string;
  idempotencyKey?: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  return apiFetch<ApiResponse<{ id: string; orderNumber: string }>>('/orders', { method: 'POST', body: payload });
}

export async function cancelOrder(orderId: string, reason?: string) {
  return apiFetch<ApiResponse<Order>>(`/orders/${orderId}/cancel`, { method: 'POST', body: { reason } });
}

export async function initializePayment(orderId: string) {
  return apiFetch<ApiResponse<{ authorizationUrl: string; reference: string }>>('/payments/initialize', {
    method: 'POST', body: { orderId },
  });
}

export async function verifyPayment(reference: string) {
  return apiFetch<ApiResponse<unknown>>(`/payments/verify/${reference}`);
}

export async function getShipment(orderId: string) {
  return apiFetch<ApiResponse<unknown>>(`/shipments/order/${orderId}`);
}

export async function validateDiscountCode(code: string, subtotal: number) {
  return apiFetch<ApiResponse<{ code: string; discountAmount: number; description: string }>>('/discount-codes/validate', {
    method: 'POST', body: { code, subtotal },
  });
}
