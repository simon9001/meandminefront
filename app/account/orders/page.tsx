'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, XCircle, Truck, CreditCard, ChevronRight } from 'lucide-react';
import { listMyOrders } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Package; color: string; step: number }> = {
  pending_payment:   { label: 'Awaiting Payment', icon: CreditCard,  color: 'text-amber-600 bg-amber-50',   step: 0 },
  paid:              { label: 'Payment Confirmed', icon: CheckCircle, color: 'text-blue-600 bg-blue-50',     step: 1 },
  awaiting_dispatch: { label: 'Being Prepared',   icon: Package,     color: 'text-purple-600 bg-purple-50', step: 1 },
  dispatched:        { label: 'On the Way',        icon: Truck,       color: 'text-indigo-600 bg-indigo-50', step: 2 },
  delivered:         { label: 'Delivered',         icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50', step: 3 },
  cancelled:         { label: 'Cancelled',         icon: XCircle,     color: 'text-red-600 bg-red-50',       step: -1 },
};

const PROGRESS_STEPS = ['Payment', 'Processing', 'Dispatched', 'Delivered'];

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: () => listMyOrders({ limit: 20 }) });
  const orders = data?.data ?? [];

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  if (!orders.length) return (
    <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="font-semibold text-gray-700">No orders yet</p>
      <p className="text-sm text-gray-500 mb-4">Shop something awesome!</p>
      <Link href="/products" className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Order History</h2>
        <span className="text-xs text-gray-400 font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {orders.map((order) => {
        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
        const Icon = cfg.icon;
        const isCancelled = order.status === 'cancelled';

        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-black text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.placedAt)} · {order.orderItems?.length ?? 0} item{(order.orderItems?.length ?? 0) !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm">{formatPrice(order.totalAmount)}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                    <Icon className="h-3 w-3" />{cfg.label}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            </div>

            {/* Mini progress bar */}
            {!isCancelled && (
              <div className="flex items-center gap-1 mt-1">
                {PROGRESS_STEPS.map((stepLabel, i) => {
                  const filled = i <= cfg.step;
                  const current = i === cfg.step;
                  return (
                    <div key={stepLabel} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`h-1.5 w-full rounded-full transition-all ${
                        filled ? (current ? 'bg-forest-700' : 'bg-emerald-400') : 'bg-gray-100'
                      }`} />
                      <span className={`text-[9px] font-medium hidden sm:block ${
                        current ? 'text-forest-700' : filled ? 'text-emerald-500' : 'text-gray-300'
                      }`}>
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
