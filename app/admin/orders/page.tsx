'use client';
import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import {
  useAdminListOrdersQuery,
  useUpdateOrderStatusMutation,
} from '@/lib/redux/api/adminApi';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/lib/types';

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700',
  confirmed:  'bg-blue-50 text-blue-700',
  processing: 'bg-purple-50 text-purple-700',
  shipped:    'bg-indigo-50 text-indigo-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
};

export default function AdminOrdersPage() {
  const [status, setStatus]     = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const { data, isLoading } = useAdminListOrdersQuery({
    status: status === 'all' ? undefined : status,
    page,
    limit: 20,
  });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const orders     = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const filtered   = search
    ? orders.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()))
    : orders;

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <div className="hidden sm:flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
                status === s ? 'bg-forest-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="sm:hidden w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white capitalize"
        >
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-forest-600 mx-auto" /></div>
        ) : !filtered.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order: Order) => (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <td className="px-4 py-3">
                        {expanded === order.id
                          ? <ChevronDown className="h-4 w-4 text-gray-400" />
                          : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                        {formatDate(order.placedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {order.orderItems?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 text-sm">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {updating === order.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 flex-shrink-0" />
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updating === order.id}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-forest-500 bg-white disabled:opacity-50"
                          >
                            {STATUSES.filter((s) => s !== 'all').map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={7} className="bg-gray-50/70 px-6 py-4 border-b border-gray-100">
                          <div className="space-y-3 max-w-2xl">
                            {order.orderItems && order.orderItems.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                                <div className="space-y-1">
                                  {order.orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-700">{item.productName} <span className="text-gray-400">× {item.quantity}</span></span>
                                      <span className="font-semibold text-gray-900">{formatPrice(item.totalPrice)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {order.shippingAddress && (
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ship To</p>
                                <p className="text-sm text-gray-700">
                                  {[
                                    order.shippingAddress.recipientName,
                                    order.shippingAddress.addressLine1,
                                    order.shippingAddress.city,
                                    order.shippingAddress.county,
                                  ].filter(Boolean).join(', ')}
                                </p>
                                {order.shippingAddress.phone && (
                                  <p className="text-xs text-gray-500 mt-0.5">{order.shippingAddress.phone}</p>
                                )}
                              </div>
                            )}

                            {order.customerNote && (
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Note</p>
                                <p className="text-sm text-gray-700 italic">&ldquo;{order.customerNote}&rdquo;</p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-2">
                              <span>Subtotal: <strong className="text-gray-700">{formatPrice(order.subtotal)}</strong></span>
                              <span>Shipping: <strong className="text-gray-700">{formatPrice(order.shippingFee)}</strong></span>
                              {order.discountAmount > 0 && (
                                <span>Discount: <strong className="text-red-600">-{formatPrice(order.discountAmount)}</strong></span>
                              )}
                              <span>Total: <strong className="text-gray-900 text-sm">{formatPrice(order.totalAmount)}</strong></span>
                              <span className={`ml-auto px-2.5 py-0.5 rounded-full font-semibold ${
                                order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ← Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
