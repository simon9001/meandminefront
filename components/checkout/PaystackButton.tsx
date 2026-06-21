'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { verifyPayment } from '@/lib/api/orders';
import type { PaystackReference } from '@/lib/types';

declare global {
  interface Window {
    // Covers both v1 (setup/openIframe) and v2 (new + resumeTransaction)
    PaystackPop: {
      new(): { resumeTransaction(accessCode: string): void };
      setup(opts: Record<string, unknown>): { openIframe(): void };
    };
  }
}

interface Props {
  email: string;
  amountKobo: number;
  reference: string;
  onSuccess: (ref: PaystackReference) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function PaystackButton({ email, amountKobo, reference, onSuccess, onCancel, disabled }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PaystackPop) { setLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  async function handlePay() {
    if (!loaded || !window.PaystackPop) {
      toast.error('Payment system not ready, please try again');
      return;
    }

    window.PaystackPop.setup({
      key:       process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email,
      amount:    amountKobo,
      ref:       reference,
      currency:  'KES',
      label:     'Maschon Order',
      metadata:  { custom_fields: [] },
      onSuccess: async (transaction: PaystackReference) => {
        setVerifying(true);
        try {
          await verifyPayment(transaction.reference);
          onSuccess(transaction);
        } catch (e: unknown) {
          toast.error((e as Error).message ?? 'Payment verification failed');
        } finally {
          setVerifying(false);
        }
      },
      onCancel: () => {
        toast.info('Payment cancelled');
        onCancel?.();
      },
    }).openIframe();
  }

  return (
    <button
      onClick={handlePay}
      disabled={disabled || !loaded || verifying}
      className="w-full py-4 rounded-xl bg-[#ff7c2a] text-white font-bold text-lg hover:bg-[#e06920] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 shadow-lg shadow-orange-200"
    >
      {verifying ? (
        <><Loader2 className="h-5 w-5 animate-spin" /> Verifying Payment…</>
      ) : (
        <><Lock className="h-5 w-5" /> Pay Securely with Paystack</>
      )}
    </button>
  );
}
