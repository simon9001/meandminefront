import { apiFetch } from '../api';
import type { ApiResponse } from '../types';

export async function getWishlist() {
  return apiFetch<ApiResponse<unknown[]>>('/wishlist');
}

export async function addToWishlist(productId: string, variantId?: string) {
  return apiFetch<ApiResponse<unknown>>('/wishlist', { method: 'POST', body: { productId, variantId } });
}

export async function removeFromWishlist(id: string) {
  return apiFetch(`/wishlist/${id}`, { method: 'DELETE' });
}

export async function checkWishlist(productId: string) {
  return apiFetch<ApiResponse<{ inWishlist: boolean; id: string | null }>>(`/wishlist/check/${productId}`);
}
