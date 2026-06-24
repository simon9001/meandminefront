'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, XCircle, Truck, CreditCard, ChevronRight, ShoppingBag } from 'lucide-react';
import { listMyOrders } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Package; color: string; step: number }> = {
  pending_payment:   { label: 'Awaiting Payment', icon: CreditCard,  color: 'text-amber-600 bg-amber-50 border-amber-100',   step: 0 },
  paid:              { label: 'Confirmed',         icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-100',       step: 1 },
  awaiting_dispatch: { label: 'Being Prepared',    icon: Package,     color: 'text-purple-600 bg-purple-50 border-purple-100', step: 1 },
  dispatched:        { label: 'On the Way',         icon: Truck,       color: 'text-indigo-600 bg-indigo-50 border-indigo-100', step: 2 },
  delivered:         { label: 'Delivered',          icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', step: 3 },
  cancelled:         { label: 'Cancelled',          icon: XCircle,     color: 'text-red-500 bg-red-50 border-red-100',          step: -1 },
};

const STEPS = ['Payment', 'Processing', 'Dispatched', 'Delivered'];

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn:  () => listMyOrders({ limit: 20 }),
  });
  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 flex gap-3 animate-pulse">
            <div className="flex gap-2">
              {[0, 1, 2].map((j) => <div key={j} className="h-14 w-14 rounded-xl bg-gray-100 flex-shrink-0" />)}
            </div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-36" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
        <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">No orders yet</p>
        <p className="text-sm text-gray-400 mb-5">Your orders will appear here once you shop.</p>
        <Link
          href="/products"
          className="px-6 py-2.5 rounded-xl bg-[#1a3828] text-white text-sm font-bold hover:bg-[#2d5a40] transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-gray-900">Order History</h2>
        <span className="text-xs text-gray-400 font-medium">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {orders.map((order) => {
        const cfg  = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
        const Icon = cfg.icon;
        const isCancelled = order.status === 'cancelled';
        const items = order.orderItems ?? [];
        // Show up to 3 item thumbnails
        const thumbs = items.slice(0, 3);
        const extra  = items.length - thumbs.length;

        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="flex gap-3">
              {/* Item thumbnails */}
              <div className="flex gap-1.5 flex-shrink-0">
                {thumbs.length > 0 ? (
                  thumbs.map((item, i) => (
                    <div
                      key={i}
                      className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-200" />
                        </div>
                      )}
                      {/* "+N more" badge on last thumb */}
                      {i === thumbs.length - 1 && extra > 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                          <span className="text-white text-xs font-black">+{extra}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-gray-200" />
                  </div>
                )}
              </div>

              {/* Order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(order.placedAt)}
                      {items.length > 0 && <> · {items.length} item{items.length !== 1 ? 's' : ''}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <p className="font-black text-gray-900 text-sm">{formatPrice(order.totalAmount)}</p>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>

                {/* Status badge */}
                <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                  <Icon className="h-3 w-3" /> {cfg.label}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {!isCancelled && (
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                {STEPS.map((stepLabel, i) => {
                  const filled  = i <= cfg.step;
                  const current = i === cfg.step;
                  return (
                    <div key={stepLabel} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`h-1 w-full rounded-full ${
                        filled ? (current ? 'bg-gray-900' : 'bg-emerald-400') : 'bg-gray-100'
                      }`} />
                      <span className={`text-[8px] font-semibold hidden sm:block ${
                        current ? 'text-gray-700' : filled ? 'text-emerald-500' : 'text-gray-300'
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
