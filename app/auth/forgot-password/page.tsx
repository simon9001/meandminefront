'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShoppingBag, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: Form) {
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Check your email</h1>
            <p className="text-gray-500 mt-2 text-sm">
              We sent a password reset link to <strong>{sentEmail}</strong>.
              Open the email and follow the instructions.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left text-sm text-gray-600 space-y-1.5">
            <p className="font-semibold text-gray-800">Didn&apos;t receive it?</p>
            <p>Check your spam/junk folder.</p>
            <p>
              Or{' '}
              <button
                type="button"
                onClick={() => { setSent(false); setError(null); }}
                className="text-emerald-600 font-semibold hover:underline"
              >
                try a different email address
              </button>
              .
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShoppingBag className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-gray-900">Forgot your password?</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
