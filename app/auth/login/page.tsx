'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLoginMutation } from '@/lib/redux/api/authApi';
import { useMergeCartMutation } from '@/lib/redux/api/cartApi';
import { persistor } from '@/lib/redux/store';
import { toast } from 'sonner';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Form = z.infer<typeof schema>;

const CATEGORIES = ['Carpets', 'Bedding', 'Kitchenware', 'Appliances', 'Home Décor', 'Storage'];

function LoginForm() {
  const router   = useRouter();
  const params   = useSearchParams();
  const redirect = params.get('redirect') ?? '/';
  const [showPw, setShowPw] = useState(false);

  const [loginMutation, { isLoading }] = useLoginMutation();
  const [mergeCart] = useMergeCartMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: Form) {
    try {
      const result = await loginMutation(data).unwrap();
      const sid = typeof window !== 'undefined' ? (localStorage.getItem('session_id') ?? '') : '';
      if (sid) await mergeCart({ sessionId: sid }).catch(() => {});
      await persistor.flush();
      toast.success('Welcome back!');
      const role = result.user?.role;
      if (role === 'admin' || role === 'superadmin') {
        router.push('/admin');
      } else {
        router.push(redirect);
      }
    } catch (e: unknown) {
      toast.error(
        (e as { data?: { message?: string } }).data?.message ??
        (e as Error).message ??
        'Login failed. Check your email and password.',
      );
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1a3828] flex-col justify-between p-12 relative overflow-hidden select-none">

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#c47b2a]/20" />
        <div className="absolute top-1/2 right-10 w-52 h-52 rounded-full bg-white/[0.04]" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2 w-fit">
          <span className="text-2xl font-black tracking-tighter text-white">maschon</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#c47b2a] border border-[#c47b2a]/60 rounded px-1.5 py-0.5 mt-0.5">
            home
          </span>
        </Link>

        {/* Headline + description */}
        <div className="relative z-10">
          <h2 className="text-[2.6rem] font-black text-white leading-[1.15] mb-5">
            Kenya&apos;s premium<br />home goods store.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-xs">
            Quality carpets, bedding, kitchenware, appliances &amp; home décor — delivered fast across Kenya.
          </p>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/25 text-xs">
          © {new Date().getFullYear()} Maschon · Nairobi, Kenya
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Back link */}
        <div className="px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1a3828] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
              <span className="text-xl font-black tracking-tighter text-[#1a3828]">maschon</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#c47b2a] border border-[#c47b2a]/50 rounded px-1.5 py-0.5">
                home
              </span>
            </Link>

            <h1 className="text-2xl font-black text-[#1a3828] mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400 mb-8">Sign in to your Maschon account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#1a3828] mb-1.5">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1a3828] placeholder:text-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3828] focus:border-transparent transition-colors"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#1a3828]">Password</label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#c47b2a] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm text-[#1a3828] placeholder:text-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3828] focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3828] transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-[#1a3828] text-white font-bold text-sm hover:bg-[#2d5a40] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="text-[#1a3828] font-bold hover:underline"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
