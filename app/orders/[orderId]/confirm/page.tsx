'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Package, ArrowRight, RefreshCcw } from 'lucide-react';
import { useVerifyPaymentMutation } from '@/lib/redux/api/ordersApi';

type Status = 'verifying' | 'success' | 'failed';

export default function OrderConfirmPage() {
  const { orderId }   = useParams<{ orderId: string }>();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const reference     = searchParams.get('reference') ?? searchParams.get('trxref') ?? '';
  const [status, setStatus]   = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [verifyPayment]       = useVerifyPaymentMutation();

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found. Please check your orders.');
      return;
    }
    verifyPayment(reference)
      .unwrap()
      .then(() => setStatus('success'))
      .catch((err: { data?: { message?: string } }) => {
        setStatus('failed');
        setMessage(err?.data?.message ?? 'Payment verification failed. If you were charged, contact support.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (status === 'verifying') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-forest-600" />
        <p className="text-forest-900 font-semibold text-lg">Confirming your payment…</p>
        <p className="text-bark-500 text-sm">Please wait, do not close this page.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-600 mt-3 max-w-md mx-auto">
            Your order has been confirmed. We&apos;ll send a confirmation email shortly. Expect delivery within 2–5 business days.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={`/account/orders/${orderId}`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-700 transition-colors"
          >
            <Package className="h-5 w-5" /> Track Order
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-400 transition-colors"
          >
            Continue Shopping <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Payment Not Confirmed</h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">{message}</p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => router.push(`/account/orders/${orderId}`)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-700 transition-colors"
        >
          <RefreshCcw className="h-5 w-5" /> View Order & Retry
        </button>
        <Link
          href="/products"
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-400 transition-colors"
        >
          Continue Shopping <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
