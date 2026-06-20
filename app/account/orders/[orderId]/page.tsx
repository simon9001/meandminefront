'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, Truck, Info } from 'lucide-react';
import { getMyOrder } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_STEPS = ['pending_payment', 'awaiting_dispatch', 'dispatched', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending_payment:   'Payment',
  awaiting_dispatch: 'Processing',
  dispatched:        'Dispatched',
  delivered:         'Delivered',
};

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data, isLoading } = useQuery({ queryKey: ['order', orderId], queryFn: () => getMyOrder(orderId) });
  const order = data?.data;

  if (isLoading) return <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />;
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found</div>;

  const isCancelled = order.status === 'cancelled';
  const currentStep = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const effectiveStep = currentStep === -1 ? (isCancelled ? -1 : 0) : currentStep;

  const delivery = order.deliveryInfo ?? order.shippingAddress;
  const dispatch = order.dispatchInfo;

  return (
    <div className="space-y-5">
      <Link href="/account/orders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All Orders
      </Link>

      {/* Header + status tracker */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-sm text-gray-500">{formatDate(order.placedAt)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isCancelled
              ? 'bg-red-50 text-red-600'
              : order.status === 'delivered'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-blue-50 text-blue-700'
          }`}>
            {isCancelled ? 'CANCELLED' : order.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {!isCancelled && (
          <div className="flex items-center gap-1 mt-4">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= effectiveStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${done ? 'text-emerald-600' : 'text-gray-300'}`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="text-[10px] hidden sm:block text-center">{STATUS_LABELS[step]}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < effectiveStep ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="font-bold text-gray-900 mb-4">Items</h3>
        <div className="space-y-4">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                {item.variantOptions && (
                  <p className="text-xs text-gray-500">
                    {Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
                <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatPrice(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
            <span>Total</span><span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      {delivery && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" /> Delivery Details
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            {(delivery as Record<string, string>).recipientName && (
              <p className="font-medium text-gray-900">{(delivery as Record<string, string>).recipientName}</p>
            )}
            {(delivery as Record<string, string>).phone && (
              <p>{(delivery as Record<string, string>).phone}</p>
            )}
            <p>
              {[(delivery as Record<string, string>).stage, (delivery as Record<string, string>).town, (delivery as Record<string, string>).county]
                .filter(Boolean).join(', ')}
              {/* Legacy format fallback */}
              {!(delivery as Record<string, string>).town && [
                (delivery as Record<string, string>).addressLine1 ?? (delivery as Record<string, string>).address_line1,
                (delivery as Record<string, string>).city,
                (delivery as Record<string, string>).county,
              ].filter(Boolean).join(', ')}
            </p>
            {(delivery as Record<string, string>).deliveryMethod && (
              <p className="text-xs text-gray-500 capitalize">
                Method: {((delivery as Record<string, string>).deliveryMethod ?? '').replace('_', ' ')}
              </p>
            )}
            {(delivery as Record<string, string>).preferredProvider && (
              <p className="text-xs text-gray-500">
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

      {/* Dispatch info — shown once dispatched */}
      {dispatch && (order.status === 'dispatched' || order.status === 'delivered') && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-indigo-600" /> Dispatch Information
          </h3>
          <div className="space-y-1 text-sm text-gray-700">
            {dispatch.dispatchedAt && (
              <p><span className="font-medium">Dispatched on:</span> {formatDate(dispatch.dispatchedAt)}</p>
            )}
            {dispatch.provider && (
              <p><span className="font-medium">Courier:</span> {dispatch.provider}</p>
            )}
            {dispatch.parcelRef && (
              <p><span className="font-medium">Parcel Reference:</span> <span className="font-mono">{dispatch.parcelRef}</span></p>
            )}
            {dispatch.trackingNo && (
              <p><span className="font-medium">Tracking Number:</span> <span className="font-mono">{dispatch.trackingNo}</span></p>
            )}
            {dispatch.collectionPoint && (
              <p><span className="font-medium">Collection Point:</span> {dispatch.collectionPoint}</p>
            )}
            {dispatch.dispatchNotes && (
              <p className="text-xs text-gray-600 italic mt-1">{dispatch.dispatchNotes}</p>
            )}
          </div>
        </div>
      )}

      {/* Awaiting dispatch info */}
      {order.status === 'awaiting_dispatch' && (
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 flex gap-3">
          <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-semibold">Your order is being prepared</p>
            <p className="text-xs mt-0.5 text-purple-700">We&apos;ll send you an email with dispatch details once your order is on the way.</p>
          </div>
        </div>
      )}

      {/* Pending payment info */}
      {order.status === 'pending_payment' && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Awaiting payment confirmation</p>
            <p className="text-xs mt-0.5 text-amber-700">Your order is reserved. Complete payment to confirm it.</p>
          </div>
        </div>
      )}
    </div>
  );
}
