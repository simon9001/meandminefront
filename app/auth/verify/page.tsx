'use client';
import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useVerifyOtpMutation, useResendVerificationMutation } from '@/lib/redux/api/authApi';
import { useMergeCartMutation } from '@/lib/redux/api/cartApi';
import { persistor } from '@/lib/redux/store';
import { toast } from 'sonner';

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email  = params.get('email') ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp,  { isLoading }]  = useVerifyOtpMutation();
  const [resendCode, { isLoading: resending }] = useResendVerificationMutation();
  const [mergeCart] = useMergeCartMutation();

  function handleChange(i: number, v: string) {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d)) handleVerify(next.join(''));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  async function handleVerify(code?: string) {
    const finalCode = code ?? otp.join('');
    if (finalCode.length < 6) { toast.error('Enter all 6 digits'); return; }
    try {
      await verifyOtp({ email, otp: finalCode }).unwrap();
      const sid = typeof window !== 'undefined' ? (localStorage.getItem('session_id') ?? '') : '';
      if (sid) {
        try {
          await mergeCart({ sessionId: sid }).unwrap();
          localStorage.removeItem('session_id');
        } catch {
          // non-critical — user can re-add items
        }
      }
      await persistor.flush();
      toast.success('Email verified! Welcome aboard.');
      router.push('/');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Invalid code');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
  }

  async function handleResend() {
    try {
      await resendCode({ email }).unwrap();
      toast.success('New code sent!');
    } catch { toast.error('Failed to resend'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Verify your email</h1>
        <p className="text-gray-500 mt-2">We sent a 6-digit code to <strong>{email}</strong></p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6 space-y-6">
          <div className="flex gap-3 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                inputMode="numeric"
                className="h-14 w-12 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              />
            ))}
          </div>

          <button onClick={() => handleVerify()} disabled={isLoading || otp.some((d) => !d)} className="w-full py-3.5 rounded-xl bg-[#ff7c2a] text-white font-bold hover:bg-[#e06920] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</> : 'Verify Email'}
          </button>

          <p className="text-sm text-gray-500">
            Didn&apos;t receive the code?{' '}
            <button onClick={handleResend} disabled={resending} className="text-emerald-600 font-semibold hover:underline disabled:opacity-50">
              {resending ? 'Sending…' : 'Resend'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>;
}
