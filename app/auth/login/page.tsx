'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Loader2, Eye, EyeOff, ArrowLeft, UserCircle2 } from 'lucide-react';
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

function safeRedirect(raw: string | null): string {
  if (!raw) return '/';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

function LoginForm() {
  const router   = useRouter();
  const params   = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
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
    <div className="min-h-screen flex" style={{ background: '#f0e8d8' }}>

      {/* ── Left panel — leather brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden select-none"
        style={{
          background: [
            'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
            'repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(255,255,255,0.015) 8px, rgba(255,255,255,0.015) 9px)',
            'linear-gradient(160deg, #1e4530 0%, #1a3828 50%, #112418 100%)',
          ].join(', '),
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'rgba(196,123,42,0.15)' }} />
        <div className="absolute top-1/2 right-10 w-52 h-52 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2 w-fit">
          <Image
            src="/images/logoMaschonpo.png"
            alt="Maschon"
            width={52}
            height={36}
            className="h-10 w-auto object-contain drop-shadow-md"
            priority
          />
          <span className="text-2xl font-black tracking-tighter" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#ff7c2a' }}>Ma</span>
            <span style={{ color: '#f0e8d8' }}>schon</span>
          </span>
        </Link>

        {/* Headline */}
        <div className="relative z-10">
          <div
            className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] mb-5"
            style={{
              background: 'rgba(255,124,42,0.15)',
              border: '1px solid rgba(255,124,42,0.25)',
              color: '#ff9c5a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            Kenya&apos;s #1 Home Store
          </div>
          <h2 className="text-[2.4rem] font-black leading-[1.15] mb-5" style={{ color: '#f0e8d8', textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
            Quality goods,<br />fast delivery.
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'rgba(240,220,180,0.5)' }}>
            Carpets, bedding, kitchenware, appliances &amp; home décor — delivered fast across Kenya.
          </p>

          {/* Category pills — inset style */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25) inset, 0 1px 0 rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(240,220,180,0.6)',
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(240,220,180,0.2)' }}>
          © {new Date().getFullYear()} Maschon · Nairobi, Kenya
        </p>
      </div>

      {/* ── Right panel — parchment + raised card ── */}
      <div
        className="flex-1 flex flex-col"
        style={{ background: 'linear-gradient(160deg, #ede4d4 0%, #e0d4c0 100%)' }}
      >
        {/* Back link */}
        <div className="px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#7a6248' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#7a6248'; }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>
        </div>

        {/* Centered raised card */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div
            className="w-full max-w-sm p-8 rounded-2xl"
            style={{
              background: 'linear-gradient(160deg, #ffffff 0%, #fdf8f0 60%, #f5ece0 100%)',
              boxShadow: [
                '0 2px 0 rgba(255,255,255,1) inset',
                '0 -1px 0 rgba(0,0,0,0.08) inset',
                '1px 0 0 rgba(255,255,255,0.7) inset',
                '-1px 0 0 rgba(255,255,255,0.4) inset',
                '0 8px 32px rgba(90,60,30,0.2)',
                '0 2px 8px rgba(90,60,30,0.12)',
                '0 1px 0 rgba(90,60,30,0.08)',
              ].join(', '),
              border: '1px solid rgba(140,100,60,0.18)',
              borderTopColor: 'rgba(255,255,255,0.85)',
            }}
          >
            {/* Mobile logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
              <Image
                src="/images/logoMaschonpo.png"
                alt="Maschon"
                width={44}
                height={30}
                className="h-9 w-auto object-contain"
              />
              <span className="text-xl font-black tracking-tighter">
                <span style={{ color: '#ff7c2a' }}>Ma</span>
                <span style={{ color: '#111111' }}>schon</span>
              </span>
            </Link>

            {/* Profile icon badge */}
            <div className="flex justify-center mb-6">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #2a2a2a 0%, #111111 55%, #000000 100%)',
                  boxShadow: [
                    '0 2px 0 rgba(255,255,255,0.12) inset',
                    '0 -2px 0 rgba(0,0,0,0.4) inset',
                    '0 6px 20px rgba(0,0,0,0.35)',
                    '0 2px 6px rgba(0,0,0,0.2)',
                  ].join(', '),
                  border: '1px solid rgba(0,0,0,0.3)',
                }}
              >
                <UserCircle2 className="h-9 w-9" style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
              </div>
            </div>

            {/* Header */}
            <div className="mb-7 text-center">
              <h1
                className="text-2xl font-black mb-1"
                style={{ color: '#1a3828', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
              >
                Welcome back
              </h1>
              <p className="text-sm" style={{ color: '#9c8068' }}>Sign in to your Maschon account</p>
            </div>

            {/* Divider under header */}
            <hr className="skeu-divider mb-6" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* Email */}
              <div>
                <label
                  className="block text-xs font-black uppercase tracking-[0.12em] mb-2"
                  style={{ color: '#5c4a38', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}
                >
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="skeu-input w-full px-4 py-3 rounded-xl text-sm"
                />
                {errors.email && (
                  <p
                    className="text-xs mt-1.5 font-semibold"
                    style={{ color: '#c4351f' }}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-xs font-black uppercase tracking-[0.12em]"
                    style={{ color: '#5c4a38', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-bold transition-colors"
                    style={{ color: '#c4551f' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#a84518'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#c4551f'; }}
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
                    className="skeu-input w-full px-4 py-3 pr-12 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#9c8068' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9c8068'; }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs mt-1.5 font-semibold" style={{ color: '#c4351f' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-1 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{
                  background: 'linear-gradient(180deg, #2a2a2a 0%, #111111 50%, #000000 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 4px 12px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(0,0,0,0.4)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #3a3a3a 0%, #222222 50%, #111111 100%)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #2a2a2a 0%, #111111 50%, #000000 100%)'; }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.3) inset'; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.12) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 4px 12px rgba(0,0,0,0.35)'; }}
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
              <hr className="flex-1 skeu-divider" />
              <span
                className="text-xs font-black uppercase tracking-widest px-2"
                style={{ color: '#b89f8a' }}
              >
                OR
              </span>
              <hr className="flex-1 skeu-divider" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm" style={{ color: '#9c8068' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-black transition-colors"
                style={{ color: '#1a3828' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#3a9166'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
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
