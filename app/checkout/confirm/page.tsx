'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { useVerifyPaymentMutation } from '@/lib/redux/api/ordersApi';
import { useCreateAddressMutation } from '@/lib/redux/api/usersApi';
import type { Address } from '@/lib/types';

function ConfirmContent() {
  const params    = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref');
  const directOrder = params.get('order');

  const [verifyPayment]  = useVerifyPaymentMutation();
  const [saveAddress]    = useCreateAddressMutation();
  const [status, setStatus]           = useState<'verifying' | 'success' | 'failed'>(reference ? 'verifying' : 'success');
  const [orderNumber, setOrderNumber] = useState(directOrder ?? '');
  const [errorRef, setErrorRef]       = useState('');
  const didRun = useRef(false);

  useEffect(() => {
    if (!reference || didRun.current) return;
    didRun.current = true;

    async function verify() {
      try {
        await verifyPayment(reference!).unwrap();

        try {
          const raw = sessionStorage.getItem('meandmine_pending_checkout');
          if (raw) {
            const pending = JSON.parse(raw) as { orderNumber?: string; address?: Omit<Address, 'id'> };
            if (pending.orderNumber) setOrderNumber(pending.orderNumber);
            if (pending.address)     saveAddress({ ...pending.address, phone: pending.address.phone ?? '' }).catch(() => {});
            sessionStorage.removeItem('meandmine_pending_checkout');
          }
        } catch {
          // sessionStorage failure is non-critical
        }

        setStatus('success');
      } catch {
        setErrorRef(reference!);
        setStatus('failed');
      }
    }

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'verifying') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
        <p className="text-lg font-semibold text-gray-700">Confirming your payment…</p>
        <p className="text-sm text-gray-500">Please wait — do not close this page.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Payment Could Not Be Verified</h1>
          <p className="text-gray-600 mt-3 max-w-md mx-auto">
            If money left your account, please contact us immediately and include this reference:
          </p>
          <p className="mt-2 font-mono font-bold text-gray-900 bg-gray-100 rounded-lg px-4 py-2 inline-block">{errorRef}</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/account/orders" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-700 transition-colors">
            <Package className="h-5 w-5" /> My Orders
          </Link>
          <Link href="/checkout" className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-400 transition-colors">
            Try Again <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Order Confirmed!</h1>
        {orderNumber && <p className="text-gray-500 mt-2">Order #{orderNumber}</p>}
        <p className="text-gray-600 mt-3 max-w-md mx-auto">
          Thank you for your purchase! We&apos;ve sent a confirmation email with your order details.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/account/orders" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff7c2a] text-white font-bold hover:bg-[#e06920] transition-colors">
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
