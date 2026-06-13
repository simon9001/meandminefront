'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { listMyOrders } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Package; color: string }> = {
  pending:    { label: 'Pending',   icon: Clock,        color: 'text-amber-600 bg-amber-50' },
  confirmed:  { label: 'Confirmed', icon: CheckCircle,  color: 'text-blue-600 bg-blue-50' },
  processing: { label: 'Processing',icon: Package,      color: 'text-purple-600 bg-purple-50' },
  shipped:    { label: 'Shipped',   icon: Truck,        color: 'text-indigo-600 bg-indigo-50' },
  delivered:  { label: 'Delivered', icon: CheckCircle,  color: 'text-emerald-600 bg-emerald-50' },
  cancelled:  { label: 'Cancelled', icon: XCircle,      color: 'text-red-600 bg-red-50' },
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: () => listMyOrders({ limit: 20 }) });
  const orders = data?.data ?? [];

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  if (!orders.length) return (
    <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="font-semibold text-gray-700">No orders yet</p>
      <p className="text-sm text-gray-500 mb-4">Shop something awesome!</p>
      <Link href="/products" className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">Browse Products</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900">Order History ({orders.length})</h2>
      {orders.map((order) => {
        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
        const Icon = cfg.icon;
        return (
          <Link key={order.id} href={`/account/orders/${order.id}`} className="block rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-500">{formatDate(order.placedAt)}</p>
                <p className="text-xs text-gray-500">{order.orderItems?.length ?? 0} item{(order.orderItems?.length ?? 0) !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />{cfg.label}
                </span>
                <p className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
