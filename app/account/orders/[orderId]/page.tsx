'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Package, MapPin, Truck, CheckCircle2, XCircle,
  CreditCard, Loader2, Phone, Clock, Info,
} from 'lucide-react';
import { getMyOrder, initializePayment } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { key: 'pending_payment',   label: 'Payment',    desc: 'Awaiting your payment' },
  { key: 'paid',              label: 'Confirmed',  desc: 'Payment received' },
  { key: 'awaiting_dispatch', label: 'Preparing',  desc: 'Your items are being packed' },
  { key: 'dispatched',        label: 'On the way', desc: 'Package is with the courier' },
  { key: 'delivered',         label: 'Delivered',  desc: 'Order successfully delivered' },
] as const;

// Map status → which step index is "current"
const STATUS_INDEX: Record<string, number> = {
  pending_payment:   0,
  paid:              1,
  awaiting_dispatch: 2,
  dispatched:        3,
  delivered:         4,
};

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn:  () => getMyOrder(orderId),
  });
  const order = data?.data;

  const [paying, setPaying] = useState(false);

  async function handlePayNow() {
    if (!order) return;
    setPaying(true);
    try {
      const res = await initializePayment(order.id);
      window.location.href = res.data.authorizationUrl;
    } catch {
      toast.error('Could not start payment. Please try again.');
      setPaying(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-60 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">Order not found</p>
        <Link href="/account/orders" className="mt-4 inline-block text-sm text-emerald-600 font-semibold hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const isCancelled  = order.status === 'cancelled';
  const isPending    = order.status === 'pending_payment';
  const isDelivered  = order.status === 'delivered';
  const currentStep  = STATUS_INDEX[order.status] ?? 0;
  const delivery     = order.deliveryInfo ?? (order.shippingAddress as typeof order.deliveryInfo);
  const dispatch     = order.dispatchInfo;

  return (
    <div className="space-y-4">

      {/* ── Back link ────────────────────────────────────────────────────── */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      {/* ── Order header + status tracker ────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-gray-50">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order</p>
            <h2 className="font-black text-gray-900 text-xl leading-tight">#{order.orderNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(order.placedAt)}
            </p>
          </div>

          <span className={`mt-1 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
            isCancelled  ? 'bg-red-50 text-red-600'
            : isDelivered ? 'bg-emerald-50 text-emerald-700'
            : isPending   ? 'bg-amber-50 text-amber-700'
            :               'bg-blue-50 text-blue-700'
          }`}>
            {isCancelled  ? 'Cancelled'
             : isDelivered ? 'Delivered'
             : isPending   ? 'Awaiting Payment'
             : order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        </div>

        {/* Progress tracker */}
        {!isCancelled ? (
          <div className="px-5 py-5">
            <div className="flex items-start">
              {STATUS_STEPS.map((step, i) => {
                const done    = i < currentStep;
                const current = i === currentStep;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {/* Left connector line */}
                    {i > 0 && (
                      <div className={`absolute left-0 top-[13px] w-1/2 h-0.5 transition-colors ${
                        done || current ? 'bg-emerald-500' : 'bg-gray-100'
                      }`} />
                    )}
                    {/* Right connector line */}
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`absolute right-0 top-[13px] w-1/2 h-0.5 transition-colors ${
                        done ? 'bg-emerald-500' : 'bg-gray-100'
                      }`} />
                    )}
                    {/* Dot */}
                    <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done    ? 'bg-emerald-500 text-white' :
                      current ? 'bg-gray-900 text-white ring-4 ring-gray-100' :
                                'bg-gray-100 text-gray-400'
                    }`}>
                      {done
                        ? <CheckCircle2 className="h-4 w-4" />
                        : current
                        ? <span className="h-2 w-2 rounded-full bg-white" />
                        : <span className="text-[9px] font-black">{i + 1}</span>
                      }
                    </div>
                    <p className={`text-[9px] font-bold mt-1.5 text-center leading-tight px-0.5 ${
                      current ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current step description */}
            <p className="text-xs text-center text-gray-500 mt-3 bg-gray-50 rounded-xl py-2 px-4">
              {STATUS_STEPS[currentStep]?.desc}
            </p>

            {/* Pay Now CTA for pending orders */}
            {isPending && (
              <button
                onClick={handlePayNow}
                disabled={paying}
                className="mt-4 w-full py-3 rounded-xl bg-[#ff7c2a] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e06920] transition-colors disabled:opacity-50"
              >
                {paying
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to payment…</>
                  : <><CreditCard className="h-4 w-4" /> Complete Payment</>
                }
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center gap-3 bg-red-50">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">This order was cancelled.</p>
          </div>
        )}
      </div>

      {/* ── Order items ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">
            Items <span className="text-gray-400 font-normal">({order.orderItems?.length ?? 0})</span>
          </h3>
        </div>

        <div className="divide-y divide-gray-50">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex gap-3.5 px-5 py-4">
              {/* Product image */}
              <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-200" />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                {item.productSlug ? (
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="font-semibold text-gray-900 text-sm leading-snug hover:text-emerald-700 transition-colors line-clamp-2"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {item.productName}
                  </p>
                )}

                {item.variantOptions && Object.keys(item.variantOptions).length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Qty {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>

              <p className="font-bold text-gray-900 text-sm flex-shrink-0 self-start pt-0.5">
                {formatPrice(item.totalPrice)}
              </p>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2 text-sm bg-gray-50/50">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {(order.shippingFee ?? 0) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span>
              <span>{formatPrice(order.shippingFee!)}</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-gray-900 text-base pt-2.5 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── Delivery details ─────────────────────────────────────────────── */}
      {delivery && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" /> Delivery Details
          </h3>
          <div className="space-y-2 text-sm">
            {delivery.recipientName && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0 text-xs pt-0.5">Name</span>
                <span className="font-semibold text-gray-900">{delivery.recipientName}</span>
              </div>
            )}
            {delivery.phone && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0 text-xs pt-0.5">Phone</span>
                <a href={`tel:${delivery.phone}`} className="text-gray-700 flex items-center gap-1 hover:text-emerald-700">
                  <Phone className="h-3 w-3" /> {delivery.phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0 text-xs pt-0.5">Address</span>
              <span className="text-gray-700">
                {[
                  delivery.stage,
                  delivery.town ?? delivery.city,
                  delivery.county,
                  delivery.addressLine1,
                ].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
            {delivery.deliveryMethod && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0 text-xs pt-0.5">Method</span>
                <span className="text-gray-700 capitalize">
                  {delivery.deliveryMethod.replace('_', ' ')}
                </span>
              </div>
            )}
            {delivery.preferredProvider && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0 text-xs pt-0.5">Courier</span>
                <span className="text-gray-700">{delivery.preferredProvider}</span>
              </div>
            )}
            {delivery.instructions && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0 text-xs pt-0.5">Notes</span>
                <span className="text-gray-600 italic">&ldquo;{delivery.instructions}&rdquo;</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dispatch / tracking info ─────────────────────────────────────── */}
      {dispatch && (order.status === 'dispatched' || order.status === 'delivered') && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-indigo-600" /> Shipping & Tracking
          </h3>
          <div className="space-y-2 text-sm">
            {dispatch.dispatchedAt && (
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 w-28 flex-shrink-0 text-xs pt-0.5">Dispatched</span>
                <span className="text-gray-800">{formatDate(dispatch.dispatchedAt)}</span>
              </div>
            )}
            {dispatch.provider && (
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 w-28 flex-shrink-0 text-xs pt-0.5">Courier</span>
                <span className="text-gray-800 font-semibold">{dispatch.provider}</span>
              </div>
            )}
            {dispatch.trackingNo && (
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 w-28 flex-shrink-0 text-xs pt-0.5">Tracking No.</span>
                <span className="font-mono text-gray-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 text-xs">
                  {dispatch.trackingNo}
                </span>
              </div>
            )}
            {dispatch.parcelRef && (
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 w-28 flex-shrink-0 text-xs pt-0.5">Parcel Ref.</span>
                <span className="font-mono text-gray-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 text-xs">
                  {dispatch.parcelRef}
                </span>
              </div>
            )}
            {dispatch.collectionPoint && (
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 w-28 flex-shrink-0 text-xs pt-0.5">Pickup point</span>
                <span className="text-gray-800">{dispatch.collectionPoint}</span>
              </div>
            )}
            {dispatch.dispatchNotes && (
              <p className="text-xs text-indigo-700 italic mt-1 pt-1 border-t border-indigo-100">
                {dispatch.dispatchNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Customer note ────────────────────────────────────────────────── */}
      {order.customerNote && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 flex gap-3">
          <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Your note</p>
            <p className="text-sm text-gray-700 italic">&ldquo;{order.customerNote}&rdquo;</p>
          </div>
        </div>
      )}

      {/* ── Delivered banner ─────────────────────────────────────────────── */}
      {isDelivered && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-emerald-800">Order delivered!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              We hope you love your purchase.
              {order.deliveredAt && ` Delivered on ${formatDate(order.deliveredAt)}.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Refresh button ───────────────────────────────────────────────── */}
      <button
        onClick={() => refetch()}
        className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        ↻ Refresh order status
      </button>

    </div>
  );
}
