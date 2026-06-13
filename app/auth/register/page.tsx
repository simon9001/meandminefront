'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useRegisterMutation } from '@/lib/redux/api/authApi';
import { toast } from 'sonner';

const schema = z.object({
  firstName:    z.string().min(2, 'First name required'),
  lastName:     z.string().min(2, 'Last name required'),
  email:        z.string().email('Invalid email'),
  password:     z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Include uppercase').regex(/[0-9]/, 'Include a number'),
  confirm:      z.string(),
  agreeToTerms: z.literal(true, { error: 'You must agree to the Terms & Conditions to continue' }),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [registerUser, { isLoading }] = useRegisterMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    try {
      await registerUser({ email: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName }).unwrap();
      toast.success('Account created! Check your email for a verification code.');
      router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? (e as Error).message ?? 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShoppingBag className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-1">Start shopping today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {([['firstName', 'First Name'], ['lastName', 'Last Name']] as const).map(([id, label]) => (
                <div key={id}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input {...register(id)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]!.message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" autoComplete="email" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, uppercase + number" className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm Password</label>
              <input {...register('confirm')} type={showPw ? 'text' : 'password'} placeholder="Repeat password" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
            </div>

            {/* ── Mandatory T&C agreement ── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  {...register('agreeToTerms')}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-snug">
                  I have read and I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-emerald-700 font-semibold hover:underline">Terms & Conditions</Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-emerald-700 font-semibold hover:underline">Privacy Policy</Link>.
                  <span className="block mt-1 text-xs text-gray-500">
                    Your personal data will be processed in accordance with Kenya&apos;s
                    Data Protection Act 2019 and the Consumer Protection Act 2012.
                  </span>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-xs text-red-500 mt-2 ml-7">{errors.agreeToTerms.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating Account…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
