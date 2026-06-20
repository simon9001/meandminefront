'use client';
import { useState, Fragment } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2, Send, X } from 'lucide-react';
import {
  useAdminListOrdersQuery,
  useUpdateOrderStatusMutation,
  useDispatchOrderMutation,
} from '@/lib/redux/api/adminApi';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/lib/types';

const STATUSES = ['all', 'pending_payment', 'awaiting_dispatch', 'dispatched', 'delivered', 'cancelled'];

const STATUS_LABELS: Record<string, string> = {
  all:               'All',
  pending_payment:   'Pending Payment',
  awaiting_dispatch: 'Awaiting Dispatch',
  dispatched:        'Dispatched',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment:   'bg-amber-50 text-amber-700',
  paid:              'bg-blue-50 text-blue-700',
  awaiting_dispatch: 'bg-purple-50 text-purple-700',
  dispatched:        'bg-indigo-50 text-indigo-700',
  delivered:         'bg-green-50 text-green-700',
  cancelled:         'bg-red-50 text-red-700',
};

interface DispatchForm {
  parcelRef:       string;
  trackingNo:      string;
  collectionPoint: string;
  dispatchNotes:   string;
}

export default function AdminOrdersPage() {
  const [status,   setStatus]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Dispatch modal
  const [dispatchingId,  setDispatchingId]  = useState<string | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<Order | null>(null);
  const [dispatchForm,   setDispatchForm]   = useState<DispatchForm>({
    parcelRef: '', trackingNo: '', collectionPoint: '', dispatchNotes: '',
  });

  const { data, isLoading } = useAdminListOrdersQuery({
    status: status === 'all' ? undefined : status,
    page,
    limit: 20,
  });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [dispatchMutation, { isLoading: dispatching }] = useDispatchOrderMutation();

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

  function openDispatchModal(order: Order) {
    setDispatchTarget(order);
    setDispatchingId(order.id);
    setDispatchForm({ parcelRef: '', trackingNo: '', collectionPoint: '', dispatchNotes: '' });
  }

  function closeDispatchModal() {
    setDispatchingId(null);
    setDispatchTarget(null);
  }

  async function handleDispatch() {
    if (!dispatchingId) return;
    try {
      await dispatchMutation({
        orderId:         dispatchingId,
        parcelRef:       dispatchForm.parcelRef.trim() || undefined,
        trackingNo:      dispatchForm.trackingNo.trim() || undefined,
        collectionPoint: dispatchForm.collectionPoint.trim() || undefined,
        dispatchNotes:   dispatchForm.dispatchNotes.trim() || undefined,
      }).unwrap();
      toast.success('Order dispatched — customer notified by email');
      closeDispatchModal();
    } catch {
      toast.error('Failed to dispatch order');
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
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                status === s ? 'bg-forest-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="sm:hidden w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
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
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order: Order) => (
                  <Fragment key={order.id}>
                    <tr
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
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {updating === order.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 flex-shrink-0" />
                          )}
                          {order.status === 'awaiting_dispatch' && (
                            <button
                              onClick={() => openDispatchModal(order)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                              <Send className="h-3 w-3" /> Dispatch
                            </button>
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updating === order.id}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-forest-500 bg-white disabled:opacity-50"
                          >
                            {STATUSES.filter((s) => s !== 'all').map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
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

                            {/* Delivery info */}
                            {order.deliveryInfo && (
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery Details</p>
                                <p className="text-sm text-gray-700">
                                  {[
                                    order.deliveryInfo.recipientName,
                                    order.deliveryInfo.stage,
                                    order.deliveryInfo.town,
                                    order.deliveryInfo.county,
                                  ].filter(Boolean).join(', ')}
                                </p>
                                {order.deliveryInfo.phone && (
                                  <p className="text-xs text-gray-500 mt-0.5">{order.deliveryInfo.phone}</p>
                                )}
                                {order.deliveryInfo.deliveryMethod && (
                                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                                    {order.deliveryInfo.deliveryMethod.replace('_', ' ')}
                                    {order.deliveryInfo.preferredProvider && ` — preferred: ${order.deliveryInfo.preferredProvider}`}
                                  </p>
                                )}
                                {order.deliveryInfo.instructions && (
                                  <p className="text-xs text-gray-500 italic mt-0.5">&ldquo;{order.deliveryInfo.instructions}&rdquo;</p>
                                )}
                              </div>
                            )}

                            {/* Dispatch info */}
                            {order.dispatchInfo && (
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dispatch Info</p>
                                <div className="text-xs text-gray-600 space-y-0.5">
                                  {order.dispatchInfo.parcelRef    && <p>Parcel Ref: <span className="font-mono font-semibold">{order.dispatchInfo.parcelRef}</span></p>}
                                  {order.dispatchInfo.trackingNo   && <p>Tracking: <span className="font-mono font-semibold">{order.dispatchInfo.trackingNo}</span></p>}
                                  {order.dispatchInfo.collectionPoint && <p>Collection: {order.dispatchInfo.collectionPoint}</p>}
                                  {order.dispatchInfo.dispatchNotes   && <p className="italic">{order.dispatchInfo.dispatchNotes}</p>}
                                </div>
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
                  </Fragment>
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

      {/* Dispatch Modal */}
      {dispatchingId && dispatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Dispatch Order</h2>
                <p className="text-sm text-gray-500">#{dispatchTarget.orderNumber}</p>
              </div>
              <button onClick={closeDispatchModal} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                The customer will receive an email notification with the dispatch details you enter below.
              </p>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Parcel Reference</label>
                <input
                  value={dispatchForm.parcelRef}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, parcelRef: e.target.value }))}
                  placeholder="e.g. PKG-12345"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Tracking Number</label>
                <input
                  value={dispatchForm.trackingNo}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, trackingNo: e.target.value }))}
                  placeholder="Courier tracking number"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Collection Point</label>
                <input
                  value={dispatchForm.collectionPoint}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, collectionPoint: e.target.value }))}
                  placeholder="e.g. G4S Westlands Office"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Dispatch Notes (optional)</label>
                <textarea
                  value={dispatchForm.dispatchNotes}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, dispatchNotes: e.target.value }))}
                  rows={2}
                  placeholder="Any notes for the customer…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={closeDispatchModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                disabled={dispatching}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
