'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Plus, Loader2, Package, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import {
  useAdminListProductsQuery,
  useDeleteProductMutation,
  adminApi,
} from '@/lib/redux/api/adminApi';
import { useAppDispatch } from '@/lib/redux/hooks';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage]     = useState(1);
  const dispatch            = useAppDispatch();

  const queryArgs = { search: search || undefined, status, page, limit: 20 };
  const { data, isLoading } = useAdminListProductsQuery(queryArgs);
  const [deleteProduct]     = useDeleteProductMutation();

  const products   = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(p.id).unwrap();
      // Optimistically remove from the displayed cache entry immediately —
      // the backend soft-deletes (archives) so the refetch would still return
      // the product under status=all. This ensures it vanishes right away.
      dispatch(
        adminApi.util.updateQueryData('adminListProducts', queryArgs, (draft) => {
          draft.data = draft.data.filter((item) => item.id !== p.id);
          draft.meta.total = Math.max(0, draft.meta.total - 1);
        })
      );
      toast.success('Product deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
        <Link href="/admin/products/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-bold hover:bg-forest-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="archived">Archived (deleted)</option>
          <option value="all">All (incl. archived)</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-forest-600 mx-auto" /></div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => {
                  const img   = p.primaryImageUrl;
                  const price = p.salePrice ?? p.basePrice;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                            {img
                              ? <Image src={img} alt={p.name} fill className="object-cover" sizes="40px" />
                              : <Package className="h-5 w-5 text-gray-300 m-auto mt-2.5" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[180px]">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.brand?.name ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">{formatPrice(price)}</span>
                        {p.salePrice && p.salePrice < p.basePrice && (
                          <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(p.basePrice)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'active'       ? 'bg-green-50 text-green-700' :
                          p.status === 'draft'        ? 'bg-yellow-50 text-yellow-700' :
                          p.status === 'out_of_stock' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/products/${p.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <Link href={`/admin/products/${p.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDelete(p)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
          ← Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}
