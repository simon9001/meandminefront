'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

function ConfirmContent() {
  const params = useSearchParams();
  const orderNumber = params.get('order');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Order Confirmed! 🎉</h1>
        {orderNumber && <p className="text-gray-500 mt-2">Order #{orderNumber}</p>}
        <p className="text-gray-600 mt-3 max-w-md mx-auto">
          Thank you for your purchase! We&apos;ve sent a confirmation email with your order details. Your items will be delivered within 2–5 business days.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/account/orders" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors">
          <Package className="h-5 w-5" /> Track Order
        </Link>
        <Link href="/products" className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-400 transition-colors">
          Continue Shopping <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return <Suspense><ConfirmContent /></Suspense>;
}
