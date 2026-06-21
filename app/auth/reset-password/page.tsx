'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShoppingBag, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/lib/api/auth';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});
type Form = z.infer<typeof schema>;

function ResetForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const email       = params.get('email') ?? '';
  const token       = params.get('token') ?? '';
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  if (!email || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
        <div className="space-y-4">
          <p className="text-gray-700 font-semibold">Invalid or expired reset link.</p>
          <Link href="/auth/forgot-password" className="text-emerald-600 hover:underline text-sm">
            Request a new one →
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Password updated!</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Your password has been changed. You can now sign in with your new password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="px-8 py-3 rounded-xl bg-[#ff7c2a] text-white font-bold hover:bg-[#e06920] transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  async function onSubmit(data: Form) {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email, token, data.password);
      setDone(true);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Something went wrong. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShoppingBag className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-gray-900">Set new password</h1>
          <p className="text-gray-500 mt-1 text-sm">Choose a strong password for <strong>{email}</strong>.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">New Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  {...register('confirm')}
                  type={showCf ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCf ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p>{error}</p>
                <Link href="/auth/forgot-password" className="text-emerald-600 font-semibold hover:underline">
                  Request a new reset link →
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#ff7c2a] text-white font-bold hover:bg-[#e06920] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Updating…</>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
