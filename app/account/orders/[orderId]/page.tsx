'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin } from 'lucide-react';
import { getMyOrder } from '@/lib/api/orders';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data, isLoading } = useQuery({ queryKey: ['order', orderId], queryFn: () => getMyOrder(orderId) });
  const order = data?.data;

  if (isLoading) return <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />;
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found</div>;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-5">
      <Link href="/account/orders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All Orders
      </Link>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-sm text-gray-500">{formatDate(order.placedAt)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCancelled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{order.status.toUpperCase()}</span>
        </div>

        {/* Progress tracker */}
        {!isCancelled && (
          <div className="flex items-center gap-1 mt-4">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${done ? 'text-emerald-600' : 'text-gray-300'}`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>{done ? '✓' : i + 1}</div>
                    <span className="text-[10px] capitalize hidden sm:block">{step}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-emerald-500' : 'bg-gray-100'}`} />}
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
                {item.variantOptions && <p className="text-xs text-gray-500">{Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}
                <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.shippingFee > 0 && <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{formatPrice(order.shippingFee)}</span></div>}
          {order.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatPrice(order.discountAmount)}</span></div>}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
        </div>
      </div>

      {/* Shipping info */}
      {order.shippingAddress && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /> Delivery Address</h3>
          <p className="text-sm text-gray-600">
            {(order.shippingAddress as { recipientName?: string }).recipientName}<br />
            {(order.shippingAddress as { addressLine1?: string }).addressLine1}<br />
            {(order.shippingAddress as { city?: string }).city}{(order.shippingAddress as { county?: string }).county ? `, ${(order.shippingAddress as { county?: string }).county}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
