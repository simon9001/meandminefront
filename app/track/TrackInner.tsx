'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart, Package, CheckCircle, Truck, MapPin, Home, AlertCircle, Loader2,
} from 'lucide-react';
import {
  useOrders, ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, mapDbStatus,
} from '@/lib/orders-store';
import type { DisplayStatus } from '@/lib/orders-store';
import { trackOrderByNumber } from '@/lib/api/orders';
import type { TrackedOrder } from '@/lib/api/orders';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const STATUS_COLORS: Record<DisplayStatus, string> = {
  confirmed:        'bg-blue-100 text-blue-700',
  processing:       'bg-amber-100 text-amber-700',
  dispatched:       'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function OrderTimeline({ status }: { status: DisplayStatus }) {
  const currentIndex = ORDER_STATUS_STEPS.indexOf(status as Exclude<DisplayStatus, 'cancelled'>);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-start gap-0 w-full">
      {ORDER_STATUS_STEPS.map((step, i) => {
        const isCompleted = i < effectiveIndex;
        const isCurrent   = i === effectiveIndex;
        const isFuture    = i > effectiveIndex;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center w-full">
              <div className={`flex-1 h-0.5 ${i === 0 ? 'invisible' : isCompleted || isCurrent ? 'bg-earth-500' : 'bg-gray-200'}`} />
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                isCurrent   ? 'bg-forest-900 text-white shadow-lg shadow-forest-900/30' :
                isCompleted ? 'bg-earth-500 text-white' :
                              'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className={`flex-1 h-0.5 ${i === ORDER_STATUS_STEPS.length - 1 ? 'invisible' : isCompleted ? 'bg-earth-500' : 'bg-gray-200'}`} />
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight max-w-[64px] ${isFuture ? 'text-gray-400' : isCurrent ? 'text-forest-900' : 'text-earth-600'}`}>
              {ORDER_STATUS_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function estimatedDelivery(zone?: string): string {
  return zone === 'nairobi'
    ? 'Same day or next business day (Nairobi)'
    : '2–4 business days (upcountry)';
}

function OrderDetail({ order }: { order: TrackedOrder }) {
  const displayStatus = mapDbStatus(order.status);
  const isCancelled   = displayStatus === 'cancelled';
  const waText        = encodeURIComponent(`Hi Maschon, I need help with order ${order.order_number}. Please assist.`);
  const zone          = order.metadata?.zone as string | undefined;
  const paymentMethod = order.metadata?.payment_method as string | undefined;
  const addr          = order.shipping_address;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-bark-100 p-5 bg-white space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-bark-500 font-semibold uppercase tracking-widest">Order Number</p>
            <h1 className="text-xl font-black text-forest-900">{order.order_number}</h1>
            <p className="text-sm text-bark-500 mt-0.5">
              Placed {new Date(order.placed_at).toLocaleDateString('en-KE', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        {!isCancelled && (
          <div className="pt-2">
            <OrderTimeline status={displayStatus} />
          </div>
        )}

        <div className="flex items-center gap-2 p-3 rounded-xl bg-forest-50 border border-forest-100">
          <Truck className="h-4 w-4 text-forest-700 flex-shrink-0" />
          <p className="text-sm text-forest-800 font-medium">{estimatedDelivery(zone)}</p>
        </div>
      </div>

      {/* Delivery info */}
      <div className="rounded-2xl border border-bark-100 p-5 bg-white space-y-3">
        <h2 className="font-black text-forest-900 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-earth-600" />
          Delivery Information
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-bark-500 text-xs font-semibold uppercase tracking-widest">Name</p>
            <p className="text-forest-900 font-semibold mt-0.5">{addr.recipient_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-bark-500 text-xs font-semibold uppercase tracking-widest">Phone</p>
            <p className="text-forest-900 font-semibold mt-0.5">{addr.phone ?? '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-bark-500 text-xs font-semibold uppercase tracking-widest">Address</p>
            <p className="text-forest-900 font-semibold mt-0.5">{addr.address_line1 ?? '—'}</p>
          </div>
          {zone && (
            <div>
              <p className="text-bark-500 text-xs font-semibold uppercase tracking-widest">Zone</p>
              <p className="text-forest-900 font-semibold mt-0.5 capitalize">{zone}</p>
            </div>
          )}
          {paymentMethod && (
            <div>
              <p className="text-bark-500 text-xs font-semibold uppercase tracking-widest">Payment</p>
              <p className="text-forest-900 font-semibold mt-0.5">
                {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}
              </p>
            </div>
          )}
        </div>

        {paymentMethod === 'mpesa' && order.status === 'pending' && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 space-y-1">
            <p className="font-bold">M-Pesa Payment Due</p>
            <p>
              Send <strong>KES {Number(order.total_amount).toLocaleString()}</strong> to Paybill{' '}
              <strong>522522</strong>, Account: <strong>{order.order_number}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-bark-100 p-5 bg-white space-y-3">
        <h2 className="font-black text-forest-900 flex items-center gap-2">
          <Package className="h-4 w-4 text-earth-600" />
          Items ({order.order_items.reduce((s, i) => s + i.quantity, 0)})
        </h2>
        <div className="space-y-3">
          {order.order_items.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest-900 line-clamp-2">{item.product_name}</p>
                <p className="text-xs text-bark-500">× {item.quantity}</p>
              </div>
              <p className="text-sm font-black text-forest-900 flex-shrink-0">
                KES {Number(item.total_price).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-bark-100 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-bark-600">
            <span>Subtotal</span>
            <span>KES {Number(order.subtotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-bark-600">
            <span>Delivery</span>
            <span className={Number(order.shipping_fee) === 0 ? 'text-green-600 font-semibold' : ''}>
              {Number(order.shipping_fee) === 0 ? 'FREE' : `KES ${Number(order.shipping_fee).toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between font-black text-forest-900 text-base border-t border-bark-100 pt-2">
            <span>Total</span>
            <span>KES {Number(order.total_amount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`https://wa.me/254700000000?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: '#25D366' }}
        >
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp Support
        </a>
        <Link
          href="/track"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-forest-900 border border-bark-200 hover:bg-gray-50 transition-colors"
        >
          My orders
        </Link>
        <Link
          href="/products"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-forest-900 border border-bark-200 hover:bg-gray-50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Keep shopping
        </Link>
      </div>
    </div>
  );
}

function OrdersList() {
  const { orders } = useOrders();

  if (orders.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-5 text-center px-4">
        <div className="h-20 w-20 rounded-full bg-cream-50 flex items-center justify-center">
          <ShoppingCart className="h-10 w-10 text-bark-300" />
        </div>
        <div>
          <h2 className="text-xl font-black text-forest-900">No orders yet</h2>
          <p className="text-bark-500 mt-1 text-sm">Place an order to see it tracked here.</p>
        </div>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl bg-forest-900 text-white font-bold text-sm hover:bg-forest-700 transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-black text-forest-900 mb-6">Your Orders</h1>
      {orders.map((ref) => (
        <Link
          key={ref.orderNumber}
          href={`/track?id=${ref.orderNumber}`}
          className="block rounded-2xl border border-bark-100 p-5 bg-white hover:border-forest-200 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-black text-forest-900">{ref.orderNumber}</p>
              <p className="text-sm text-bark-500 mt-0.5">
                {new Date(ref.placedAt).toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              <p className="text-sm text-bark-600 mt-1">KES {ref.total.toLocaleString()}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-700">
              Track order →
            </span>
          </div>
        </Link>
      ))}
      <div className="pt-4 text-center">
        <Link href="/products" className="text-sm text-forest-700 font-semibold hover:text-forest-900 transition-colors">
          ← Back to shopping
        </Link>
      </div>
    </div>
  );
}

function TrackByNumber({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder]   = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    trackOrderByNumber(orderNumber)
      .then((res) => { if (!cancelled) setOrder(res.data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center space-y-5">
        <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-forest-900">Order not found</h2>
          <p className="text-bark-500 mt-1 text-sm">
            We could not find order <strong>{orderNumber}</strong>.
          </p>
          <p className="text-bark-500 text-sm mt-1">
            Double-check the order number or{' '}
            <a
              href="https://wa.me/254700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-semibold"
            >
              contact us on WhatsApp
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/track" className="px-6 py-3 rounded-xl border border-bark-200 text-forest-900 font-bold text-sm hover:bg-gray-50 transition-colors">
            My orders
          </Link>
          <Link href="/products" className="px-6 py-3 rounded-xl bg-forest-900 text-white font-bold text-sm hover:bg-forest-700 transition-colors">
            Back to shopping
          </Link>
        </div>
      </div>
    );
  }

  return <OrderDetail order={order} />;
}

export default function TrackInner() {
  const searchParams  = useSearchParams();
  const orderNumber   = searchParams.get('id');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      {orderNumber ? <TrackByNumber orderNumber={orderNumber} /> : <OrdersList />}
    </div>
  );
}
