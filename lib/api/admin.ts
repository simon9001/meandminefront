import { apiFetch } from '../api';
import { buildQueryString } from '../utils';
import type { ApiResponse, Paginated, DashboardStats, DailyRevenue, TopProduct, Order } from '../types';

export async function getDashboardStats() {
  return apiFetch<ApiResponse<DashboardStats>>('/admin/dashboard');
}

export async function getDailyRevenue(days = 30) {
  return apiFetch<ApiResponse<DailyRevenue[]>>(`/admin/analytics/revenue?days=${days}`);
}

export async function getTopProducts(limit = 10) {
  return apiFetch<ApiResponse<TopProduct[]>>(`/admin/analytics/top-products?limit=${limit}`);
}

export async function getLowStock(threshold = 5) {
  return apiFetch<ApiResponse<unknown[]>>(`/admin/inventory/low-stock?threshold=${threshold}`);
}

export async function adminListOrders(params?: { page?: number; limit?: number; status?: string; paymentStatus?: string }) {
  const qs = buildQueryString((params ?? {}) as Record<string, string | number | boolean | undefined>);
  return apiFetch<Paginated<Order>>(`/orders${qs}`);
}

export async function updateOrderStatus(orderId: string, status: string, adminNote?: string) {
  return apiFetch<ApiResponse<Order>>(`/orders/${orderId}/status`, { method: 'PATCH', body: { status, adminNote } });
}

export async function adminListProducts(params?: { page?: number; limit?: number; search?: string }) {
  const qs = buildQueryString((params ?? {}) as Record<string, string | number | boolean | undefined>);
  return apiFetch<{ data: unknown[]; total: number }>(`/products${qs}`);
}

export async function refreshMaterializedViews() {
  return apiFetch('/admin/refresh-views', { method: 'POST' });
}
