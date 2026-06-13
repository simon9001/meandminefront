import { apiFetch, ApiError } from '../api';
import { buildQueryString } from '../utils';
import type { ApiResponse, Paginated, Product, SupplierComparison, Review } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular';
}

export async function listProducts(filters: ProductFilters = {}) {
  const qs = buildQueryString(filters as Record<string, string | number | boolean | undefined>);
  return apiFetch<Paginated<Product>>(`/products${qs}`, { auth: false });
}

export async function getProduct(slug: string) {
  return apiFetch<ApiResponse<Product>>(`/products/${slug}`, { auth: false });
}

export async function getSupplierComparison(productId: string) {
  return apiFetch<ApiResponse<SupplierComparison[]>>(`/products/${productId}/suppliers`, { auth: false });
}

export async function listProductReviews(productId: string, params?: { page?: number; limit?: number; rating?: number }) {
  const qs = buildQueryString((params ?? {}) as Record<string, string | number | boolean | undefined>);
  return apiFetch<Paginated<Review>>(`/reviews/product/${productId}${qs}`, { auth: false });
}

export async function createReview(payload: { productId: string; rating: number; title?: string; body: string; orderId?: string }) {
  return apiFetch<ApiResponse<Review>>('/reviews', { method: 'POST', body: payload });
}

export async function voteReview(reviewId: string, vote: 'helpful' | 'not_helpful') {
  return apiFetch(`/reviews/${reviewId}/vote`, { method: 'POST', body: { vote } });
}

export async function listCategories() {
  return apiFetch<ApiResponse<{ id: string; name: string; slug: string; imageUrl?: string; children?: unknown[] }[]>>('/categories', { auth: false });
}

export { ApiError };
