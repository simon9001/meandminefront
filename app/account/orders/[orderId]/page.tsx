'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, Truck, Info, CheckCircle2, XCircle } from 'lucide-react';
import { getMyOrder } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';
import { useListProductsQuery } from '@/lib/redux/api/productsApi';
import { ProductCard } from '@/components/product/ProductCard';

const STATUS_STEPS = [
  { key: 'pending_payment',   label: 'Payment',    description: 'Awaiting payment confirmation' },
  { key: 'awaiting_dispatch', label: 'Processing', description: 'Your order is being prepared' },
  { key: 'dispatched',        label: 'Dispatched', description: 'Package is on its way to you' },
  { key: 'delivered',         label: 'Delivered',  description: 'Order has been delivered' },
] as const;

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data, isLoading } = useQuery({ queryKey: ['order', orderId], queryFn: () => getMyOrder(orderId) });
  const order = data?.data;

  const { data: popularData } = useListProductsQuery({ sort: 'popular', limit: 8 });

  if (isLoading) return <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />;
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found</div>;

  const isCancelled = order.status === 'cancelled';
  const currentStep = STATUS_STEPS.findIndex(s => s.key === order.status);
  const effectiveStep = currentStep === -1 ? (isCancelled ? -1 : 0) : currentStep;

  const orderedIds = new Set(order.orderItems?.map(i => i.productId) ?? []);
  const relatedProducts = (popularData?.data ?? []).filter(p => !orderedIds.has(p.id)).slice(0, 6);

  const delivery = order.deliveryInfo ?? order.shippingAddress;
  const dispatch = order.dispatchInfo;

  return (
    <div className="space-y-5">
      <Link href="/account/orders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All Orders
      </Link>

      {/* Header + status tracker */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Order</p>
            <h2 className="font-black text-gray-900 text-xl">#{order.orderNumber}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.placedAt)}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            isCancelled
              ? 'bg-red-50 text-red-600'
              : order.status === 'delivered'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-blue-50 text-blue-700'
          }`}>
            {isCancelled ? 'Cancelled' : order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        </div>

        {!isCancelled ? (
          <div>
            {/* Step track */}
            <div className="flex items-start">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i < effectiveStep;
                const isCurrent   = i === effectiveStep;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {/* Left connector */}
                    {i > 0 && (
                      <div className={`absolute left-0 top-[14px] w-1/2 h-0.5 ${isCompleted || isCurrent ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                    )}
                    {/* Right connector */}
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`absolute right-0 top-[14px] w-1/2 h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                    )}
                    {/* Circle */}
                    <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted ? 'bg-emerald-500 text-white' :
                      isCurrent   ? 'bg-forest-900 text-white ring-4 ring-forest-100' :
                                    'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted
                        ? <CheckCircle2 className="h-4 w-4" />
                        : isCurrent
                        ? <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        : <span className="text-[10px] font-black">{i + 1}</span>
                      }
                    </div>
                    <p className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
                      isCurrent ? 'text-forest-900' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Current step description */}
            {effectiveStep >= 0 && (
              <p className="text-xs text-center text-gray-500 mt-3 bg-gray-50 rounded-xl py-2 px-4">
                {STATUS_STEPS[effectiveStep]?.description}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">This order was cancelled.</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="font-bold text-gray-900 mb-4">Items ({order.orderItems?.length ?? 0})</h3>
        <div className="space-y-4">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex gap-3 pb-4 last:pb-0 border-b last:border-0 border-gray-50">
              <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center">
                <Package className="h-7 w-7 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{item.productName}</p>
                {item.variantOptions && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">Qty {item.quantity} × {formatPrice(item.unitPrice)}</p>
              </div>
              <p className="font-bold text-gray-900 text-sm flex-shrink-0">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span><span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Total</span><span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      {delivery && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-earth-600" /> Delivery Details
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            {(delivery as Record<string, string>).recipientName && (
              <p className="font-semibold text-gray-900">{(delivery as Record<string, string>).recipientName}</p>
            )}
            {(delivery as Record<string, string>).phone && (
              <p>{(delivery as Record<string, string>).phone}</p>
            )}
            <p>
              {[(delivery as Record<string, string>).stage, (delivery as Record<string, string>).town, (delivery as Record<string, string>).county]
                .filter(Boolean).join(', ')}
              {!(delivery as Record<string, string>).town && [
                (delivery as Record<string, string>).addressLine1 ?? (delivery as Record<string, string>).address_line1,
                (delivery as Record<string, string>).city,
                (delivery as Record<string, string>).county,
              ].filter(Boolean).join(', ')}
            </p>
            {(delivery as Record<string, string>).deliveryMethod && (
              <p className="text-xs text-gray-400 capitalize">
                Method: {((delivery as Record<string, string>).deliveryMethod ?? '').replace('_', ' ')}
              </p>
            )}
            {(delivery as Record<string, string>).preferredProvider && (
              <p className="text-xs text-gray-400">
                Preferred courier: {(delivery as Record<string, string>).preferredProvider}
              </p>
            )}
            {(delivery as Record<string, string>).instructions && (
              <p className="text-xs text-gray-500 italic">
                &ldquo;{(delivery as Record<string, string>).instructions}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dispatch info */}
      {dispatch && (order.status === 'dispatched' || order.status === 'delivered') && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-indigo-600" /> Dispatch Information
          </h3>
          <div className="space-y-1.5 text-sm text-gray-700">
            {dispatch.dispatchedAt && (
              <p><span className="font-semibold">Dispatched:</span> {formatDate(dispatch.dispatchedAt)}</p>
            )}
            {dispatch.provider && (
              <p><span className="font-semibold">Courier:</span> {dispatch.provider}</p>
            )}
            {dispatch.parcelRef && (
              <p><span className="font-semibold">Parcel Ref:</span> <span className="font-mono">{dispatch.parcelRef}</span></p>
            )}
            {dispatch.trackingNo && (
              <p><span className="font-semibold">Tracking No:</span> <span className="font-mono">{dispatch.trackingNo}</span></p>
            )}
            {dispatch.collectionPoint && (
              <p><span className="font-semibold">Collection Point:</span> {dispatch.collectionPoint}</p>
            )}
            {dispatch.dispatchNotes && (
              <p className="text-xs text-gray-600 italic mt-1">{dispatch.dispatchNotes}</p>
            )}
          </div>
        </div>
      )}

      {/* Status-specific banners */}
      {order.status === 'awaiting_dispatch' && (
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 flex gap-3">
          <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-semibold">Your order is being prepared</p>
            <p className="text-xs mt-0.5 text-purple-700">We&apos;ll notify you once it&apos;s on its way.</p>
          </div>
        </div>
      )}
      {order.status === 'pending_payment' && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Awaiting payment confirmation</p>
            <p className="text-xs mt-0.5 text-amber-700">Your order is reserved. Complete payment to confirm it.</p>
          </div>
        </div>
      )}
      {order.status === 'delivered' && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">
            <p className="font-semibold">Order delivered!</p>
            <p className="text-xs mt-0.5 text-emerald-700">We hope you love your purchase.</p>
          </div>
        </div>
      )}

      {/* You may also like */}
      {relatedProducts.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-0.5">Explore More</p>
              <h3 className="font-black text-gray-900">You may also like</h3>
            </div>
            <Link href="/products" className="text-xs font-semibold text-forest-700 hover:text-forest-900 transition-colors">
              Browse all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedProducts.map(p => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
