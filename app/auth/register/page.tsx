'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, UserCircle2, ArrowLeft } from 'lucide-react';
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

const CATEGORIES = ['Carpets', 'Bedding', 'Kitchenware', 'Appliances', 'Home Décor', 'Storage'];

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
    <div className="min-h-screen flex" style={{ background: '#f0e8d8' }}>

      {/* ── Left panel — leather brand ── */}
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
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'rgba(196,123,42,0.15)' }} />
        <div className="absolute top-1/2 right-10 w-52 h-52 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2 w-fit">
          <Image src="/images/logoMaschonpo.png" alt="Maschon" width={52} height={36} className="h-10 w-auto object-contain drop-shadow-md" priority />
          <span className="text-2xl font-black tracking-tighter" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#ff7c2a' }}>Ma</span>
            <span style={{ color: '#f0e8d8' }}>schon</span>
          </span>
        </Link>

        {/* Headline */}
        <div className="relative z-10">
          <div
            className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] mb-5"
            style={{ background: 'rgba(255,124,42,0.15)', border: '1px solid rgba(255,124,42,0.25)', color: '#ff9c5a', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
          >
            Join Maschon Today
          </div>
          <h2 className="text-[2.4rem] font-black leading-[1.15] mb-5" style={{ color: '#f0e8d8', textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
            Your home,<br />elevated.
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'rgba(240,220,180,0.5)' }}>
            Create a free account to track orders, save addresses, and get exclusive member deals.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(0,0,0,0.2)', boxShadow: '0 1px 3px rgba(0,0,0,0.25) inset, 0 1px 0 rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(240,220,180,0.6)' }}
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
      <div className="flex-1 flex flex-col" style={{ background: 'linear-gradient(160deg, #ede4d4 0%, #e0d4c0 100%)' }}>

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

        {/* Raised card */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-10">
          <div
            className="w-full max-w-md p-8 rounded-2xl"
            style={{
              background: 'linear-gradient(160deg, #ffffff 0%, #fdf8f0 60%, #f5ece0 100%)',
              boxShadow: [
                '0 2px 0 rgba(255,255,255,1) inset',
                '0 -1px 0 rgba(0,0,0,0.08) inset',
                '1px 0 0 rgba(255,255,255,0.7) inset',
                '-1px 0 0 rgba(255,255,255,0.4) inset',
                '0 8px 32px rgba(90,60,30,0.2)',
                '0 2px 8px rgba(90,60,30,0.12)',
              ].join(', '),
              border: '1px solid rgba(140,100,60,0.18)',
              borderTopColor: 'rgba(255,255,255,0.85)',
            }}
          >
            {/* Mobile logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-6">
              <Image src="/images/logoMaschonpo.png" alt="Maschon" width={44} height={30} className="h-9 w-auto object-contain" />
              <span className="text-xl font-black tracking-tighter">
                <span style={{ color: '#ff7c2a' }}>Ma</span>
                <span style={{ color: '#111111' }}>schon</span>
              </span>
            </Link>

            {/* Profile icon badge */}
            <div className="flex justify-center mb-5">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #2a2a2a 0%, #111111 55%, #000000 100%)',
                  boxShadow: ['0 2px 0 rgba(255,255,255,0.12) inset', '0 -2px 0 rgba(0,0,0,0.4) inset', '0 6px 20px rgba(0,0,0,0.35)', '0 2px 6px rgba(0,0,0,0.2)'].join(', '),
                  border: '1px solid rgba(0,0,0,0.3)',
                }}
              >
                <UserCircle2 className="h-9 w-9" style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
              </div>
            </div>

            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-black mb-1" style={{ color: '#1a3828', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>
                Create account
              </h1>
              <p className="text-sm" style={{ color: '#9c8068' }}>Join Maschon and start shopping</p>
            </div>

            <hr className="skeu-divider mb-6" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                {([['firstName', 'First Name'], ['lastName', 'Last Name']] as const).map(([id, label]) => (
                  <div key={id}>
                    <label className="block text-xs font-black uppercase tracking-[0.12em] mb-1.5" style={{ color: '#5c4a38', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                      {label}
                    </label>
                    <input {...register(id)} className="skeu-input w-full px-3 py-2.5 rounded-xl text-sm" />
                    {errors[id] && <p className="text-xs mt-1 font-semibold" style={{ color: '#c4351f' }}>{errors[id]!.message}</p>}
                  </div>
                ))}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.12em] mb-1.5" style={{ color: '#5c4a38', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  Email address
                </label>
                <input {...register('email')} type="email" placeholder="you@example.com" autoComplete="email" className="skeu-input w-full px-4 py-3 rounded-xl text-sm" />
                {errors.email && <p className="text-xs mt-1 font-semibold" style={{ color: '#c4351f' }}>{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.12em] mb-1.5" style={{ color: '#5c4a38', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  Password
                </label>
                <div className="relative">
                  <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, uppercase + number" className="skeu-input w-full px-4 py-3 pr-12 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#9c8068' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9c8068'; }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1 font-semibold" style={{ color: '#c4351f' }}>{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.12em] mb-1.5" style={{ color: '#5c4a38', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  Confirm Password
                </label>
                <input {...register('confirm')} type={showPw ? 'text' : 'password'} placeholder="Repeat password" className="skeu-input w-full px-4 py-3 rounded-xl text-sm" />
                {errors.confirm && <p className="text-xs mt-1 font-semibold" style={{ color: '#c4351f' }}>{errors.confirm.message}</p>}
              </div>

              {/* Terms */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'linear-gradient(180deg, #e8dcc8 0%, #f0e4d4 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.1) inset, 0 1px 0 rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    {...register('agreeToTerms')}
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded flex-shrink-0 cursor-pointer accent-black"
                  />
                  <span className="text-sm leading-snug" style={{ color: '#5c4a38' }}>
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="font-bold transition-colors" style={{ color: '#1a3828' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#3a9166'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
                    >Terms & Conditions</Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="font-bold transition-colors" style={{ color: '#1a3828' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#3a9166'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
                    >Privacy Policy</Link>.
                    <span className="block mt-1 text-xs" style={{ color: '#9c8068' }}>
                      Processed under Kenya&apos;s Data Protection Act 2019.
                    </span>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-xs mt-2 ml-7 font-semibold" style={{ color: '#c4351f' }}>{errors.agreeToTerms.message}</p>
                )}
              </div>

              {/* Submit — black embossed */}
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
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account…</> : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <hr className="flex-1 skeu-divider" />
              <span className="text-xs font-black uppercase tracking-widest px-2" style={{ color: '#b89f8a' }}>OR</span>
              <hr className="flex-1 skeu-divider" />
            </div>

            <p className="text-center text-sm" style={{ color: '#9c8068' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-black transition-colors" style={{ color: '#1a3828' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#3a9166'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
