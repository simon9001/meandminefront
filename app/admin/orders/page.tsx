'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { adminListOrders, updateOrderStatus } from '@/lib/api/admin';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/lib/types';

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-purple-50 text-purple-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => adminListOrders({ status: status === 'all' ? undefined : status, page }),
  });

  const orders = (data?.data ?? []) as Order[];

  const statusMut = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => updateOrderStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const filtered = search ? orders.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase())) : orders;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order #…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        {/* Status pills — hidden on mobile in favour of select */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${status === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
          ))}
        </div>
        {/* Status dropdown — mobile only */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="sm:hidden w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white capitalize"
        >
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" /></div>
        ) : !filtered.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Items</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{formatDate(order.placedAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">{(order as unknown as { users?: { email?: string } }).users?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{order.orderItems?.length ?? 0}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-sm">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => statusMut.mutate({ id: order.id, s: e.target.value })}
                        disabled={statusMut.isPending}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      >
                        {STATUSES.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">← Previous</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={orders.length < 20} className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
      </div>
    </div>
  );
}
