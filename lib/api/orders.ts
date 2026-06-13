import { apiFetch } from '../api';
import { buildQueryString } from '../utils';
import type { ApiResponse, Paginated, Order, CheckoutItem } from '../types';

export interface CreateOrderPayload {
  items: CheckoutItem[];
  addressId?: string;
  discountCode?: string;
  shippingFee?: number;
  notes?: string;
  idempotencyKey?: string;
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
    method: 'POST', body: payload, auth: false,
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
  metadata:         { payment_method?: string; zone?: string; [key: string]: unknown };
  shipping_address: {
    recipient_name?: string;
    phone?:          string;
    address_line1?:  string;
    city?:           string;
  };
  order_items:           TrackedOrderItem[];
  order_status_history:  { from_status: string | null; to_status: string; changed_at: string }[];
}

export async function trackOrderByNumber(orderNumber: string) {
  return apiFetch<ApiResponse<TrackedOrder>>(
    `/orders/track/${encodeURIComponent(orderNumber)}`,
    { auth: false }
  );
}

export async function listMyOrders(params?: { page?: number; limit?: number; status?: string }) {
  const qs = buildQueryString((params ?? {}) as Record<string, string | number | boolean | undefined>);
  return apiFetch<Paginated<Order>>(`/orders/my${qs}`);
}

export async function getMyOrder(orderId: string) {
  return apiFetch<ApiResponse<Order>>(`/orders/my/${orderId}`);
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
