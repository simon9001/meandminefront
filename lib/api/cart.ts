import { apiFetch } from '../api';
import type { ApiResponse, Cart } from '../types';

export async function getCart() {
  return apiFetch<ApiResponse<Cart>>('/cart');
}

export async function addToCart(payload: { productId: string; variantId?: string; supplyId?: string; quantity: number }) {
  return apiFetch<ApiResponse<unknown>>('/cart/items', { method: 'POST', body: payload });
}

export async function updateCartItem(itemId: string, quantity: number) {
  return apiFetch<ApiResponse<unknown>>(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } });
}

export async function removeCartItem(itemId: string) {
  return apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' });
}

export async function clearCart() {
  return apiFetch('/cart', { method: 'DELETE' });
}

export async function mergeCart(sessionId: string) {
  return apiFetch('/cart/merge', { method: 'POST', body: { sessionId } });
}
