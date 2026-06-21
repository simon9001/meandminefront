'use client';
import Script from 'next/script';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag, MapPin, Tag, Loader2, ArrowLeft,
  AlertCircle, BookmarkCheck, Plus, Truck, Store, CheckCircle,
  Smartphone, CreditCard, ChevronLeft, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsLoggedIn } from '@/lib/redux/slices/authSlice';
import { useGetCartQuery } from '@/lib/redux/api/cartApi';
import {
  useCreateOrderMutation,
  useInitializePaymentMutation,
  useChargeMpesaMutation,
  useLazyCheckPaymentStatusQuery,
  useValidateDiscountCodeMutation,
  type CreateOrderPayload,
} from '@/lib/redux/api/ordersApi';
import {
  useListAddressesQuery,
  useCreateAddressMutation,
} from '@/lib/redux/api/usersApi';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { CartItem, Address } from '@/lib/types';
import { useListProductsQuery } from '@/lib/redux/api/productsApi';
import { ProductCard } from '@/components/product/ProductCard';

type DeliveryMethod  = 'home_delivery' | 'pickup';
type CheckoutStep    = 'delivery' | 'payment' | 'mpesa_pending';
type PaymentTab      = 'mpesa' | 'card';

// ─── Phone helpers ────────────────────────────────────────────────────────────

const PHONE_REGEX = /^(?:254|\+254|0)?(7|1)\d{8}$/;

function formatPhone(raw: string): string {
  const p = raw.replace(/\s+/g, '');
  if (p.startsWith('+254')) return p;
  if (p.startsWith('254'))  return `+${p}`;
  if (p.startsWith('0'))    return `+254${p.slice(1)}`;
  return `+254${p}`;
}

// ─── Cart helpers ─────────────────────────────────────────────────────────────

function getImg(item: CartItem) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = item.products as any;
  if (!p) return null;
  const media = Array.isArray(p.product_media) ? p.product_media as { url: string; is_primary: boolean }[] : [];
  if (media.length > 0) {
    const primary = media.find((m) => m.is_primary) ?? media[0];
    return primary.url ?? null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRaw(item: CartItem): any { return item as any; }
function getProductName(item: CartItem): string { return (item.products as any)?.name ?? 'Product'; } // eslint-disable-line @typescript-eslint/no-explicit-any
function getUnitPrice(item: CartItem): number   { const r = getRaw(item); return r.unitPrice ?? r.unit_price ?? 0; }
function getProductId(item: CartItem): string   { const r = getRaw(item); return r.productId ?? r.product_id ?? ''; }
function getVariantId(item: CartItem): string | undefined { const r = getRaw(item); return r.variantId ?? r.variant_id ?? undefined; }
function getSupplyId(item: CartItem): string | undefined  { const r = getRaw(item); return r.supplyId  ?? r.supply_id  ?? undefined; }
function getProductSlug(item: CartItem): string { return (item.products as any)?.slug ?? ''; } // eslint-disable-line @typescript-eslint/no-explicit-any

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router     = useRouter();
  const user       = useAppSelector(selectCurrentUser);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth/login?redirect=/checkout');
  }, [isLoggedIn, router]);

  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const { data: productsPage }                 = useListProductsQuery({ limit: 12 });
  const { data: savedAddresses = [] }          = useListAddressesQuery(undefined, { skip: !isLoggedIn });

  const [createOrder,      { isLoading: ordering }]  = useCreateOrderMutation();
  const [initPayment,      { isLoading: initing }]   = useInitializePaymentMutation();
  const [chargeMpesa,      { isLoading: mpesaInit }] = useChargeMpesaMutation();
  const [triggerStatus]                              = useLazyCheckPaymentStatusQuery();
  const [validateDiscount, { isLoading: validating }] = useValidateDiscountCodeMutation();
  const [saveAddressMutation]                        = useCreateAddressMutation();

  // ── Step / flow state ────────────────────────────────────────────────────────
  const [step,         setStep]         = useState<CheckoutStep>('delivery');
  const [paymentTab,   setPaymentTab]   = useState<PaymentTab>('mpesa');
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  // M-Pesa state
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaRef,   setMpesaRef]   = useState('');
  const [mpesaError, setMpesaError] = useState('');
  const [countdown,  setCountdown]  = useState(60);
  const [timedOut,   setTimedOut]   = useState(false);
  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Delivery form state ───────────────────────────────────────────────────────
  const [recipientName,     setRecipientName]     = useState('');
  const [phone,             setPhone]             = useState('');
  const [county,            setCounty]            = useState('');
  const [town,              setTown]              = useState('');
  const [stage,             setStage]             = useState('');
  const [deliveryMethod,    setDeliveryMethod]    = useState<DeliveryMethod>('home_delivery');
  const [preferredProvider, setPreferredProvider] = useState('');
  const [instructions,      setInstructions]      = useState('');
  const [discountCode,      setDiscountCode]      = useState('');
  const [appliedDiscount,   setAppliedDiscount]   = useState<{ amount: number; description: string } | null>(null);
  const [mounted,           setMounted]           = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress,       setSaveAddress]       = useState(true);

  useEffect(() => { setMounted(true); }, []);

  // Stop polling and countdown on unmount
  useEffect(() => () => {
    if (pollingRef.current)   clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // Pre-fill from auth user
  useEffect(() => {
    if (user && !recipientName && savedAddresses.length === 0) {
      setRecipientName(`${user.firstName} ${user.lastName}`);
    }
  }, [user, recipientName, savedAddresses.length]);

  // Pre-fill from default saved address
  useEffect(() => {
    if (savedAddresses.length === 0) return;
    const def = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];
    setSelectedAddressId(def.id);
    setRecipientName(def.recipient_name);
    setPhone(def.phone);
    setTown(def.city);
    setStage(def.address_line1);
    setCounty(def.county ?? '');
    setSaveAddress(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  // Keep M-Pesa phone in sync with delivery phone
  useEffect(() => { if (phone) setMpesaPhone(phone); }, [phone]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const items    = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = appliedDiscount?.amount ?? 0;
  const total    = Math.max(0, subtotal - discount);

  const cartProductIds      = new Set(items.map(getProductId));
  const suggestedProducts   = (productsPage?.data ?? []).filter((p) => !cartProductIds.has(p.id)).slice(0, 6);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function storePending(orderNumber: string) {
    const pending: Record<string, unknown> = { orderNumber };
    if (saveAddress && !selectedAddressId) {
      pending.address = {
        recipientName,
        phone,
        addressLine1: stage || town,
        city:         town,
        county:       county.trim() || undefined,
        isDefault:    savedAddresses.length === 0,
        label:        'Home',
      };
    }
    sessionStorage.setItem('maschon_pending_checkout', JSON.stringify(pending));
  }

  async function applyDiscountCode() {
    if (!discountCode.trim()) return;
    try {
      const res = await validateDiscount({ code: discountCode.trim(), subtotal }).unwrap();
      setAppliedDiscount({ amount: res.discountAmount, description: res.description });
      toast.success(res.description);
    } catch {
      toast.error('Invalid or expired discount code');
    }
  }

  // ── Step 1: create order ──────────────────────────────────────────────────────

  async function handleProceedToPayment() {
    if (!recipientName.trim() || !phone.trim() || !county.trim() || !town.trim()) {
      toast.error('Please fill in all required delivery details');
      return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    try {
      const payload: CreateOrderPayload = {
        items: items.map((i) => ({
          productId: getProductId(i),
          variantId: getVariantId(i),
          supplyId:  getSupplyId(i),
          quantity:  i.quantity,
        })),
        deliveryInfo: {
          recipientName,
          phone,
          county,
          town,
          stage:             stage.trim() || undefined,
          deliveryMethod,
          preferredProvider: preferredProvider.trim() || undefined,
          instructions:      instructions.trim() || undefined,
        },
        discountCode:   appliedDiscount ? discountCode : undefined,
        idempotencyKey: `${user!.id}-${Date.now()}`,
      };

      const order = await createOrder(payload).unwrap();
      setCreatedOrder({ id: order.id, orderNumber: order.orderNumber });
      storePending(order.orderNumber);
      setStep('payment');
    } catch (e: unknown) {
      const err = e as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error ?? err?.data?.message ?? 'Could not create order. Please try again.');
    }
  }

  // ── Step 2a: M-Pesa charge ────────────────────────────────────────────────────

  async function handleMpesaPay() {
    const raw = mpesaPhone.trim();
    if (!raw) { toast.error('Enter your M-Pesa phone number'); return; }
    if (!PHONE_REGEX.test(raw)) {
      setMpesaError('Enter a valid Kenyan phone number, e.g. 0712 345 678');
      return;
    }
    setMpesaError('');
    const formatted = formatPhone(raw);
    try {
      const { reference } = await chargeMpesa({ orderId: createdOrder!.id, phone: formatted }).unwrap();
      setMpesaRef(reference);
      setStep('mpesa_pending');
      startPolling(reference);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string; message?: string } };
      setMpesaError(err?.data?.error ?? err?.data?.message ?? 'Could not initiate M-Pesa payment. Try again.');
    }
  }

  function stopAll() {
    if (pollingRef.current)   clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  function startPolling(reference: string) {
    setCountdown(60);
    setTimedOut(false);

    // Poll Paystack every 3s
    pollingRef.current = setInterval(async () => {
      try {
        const result = await triggerStatus(reference, false);
        const status = result.data?.status;
        if (status === 'success') {
          stopAll();
          router.push(`/checkout/confirm?reference=${encodeURIComponent(reference)}`);
        } else if (status === 'failed') {
          stopAll();
          setMpesaError('Payment failed. Please try again.');
          setStep('payment');
        }
      } catch {
        // ignore transient poll errors
      }
    }, 3000);

    // Count down 60 → 0, then expire
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopAll();
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Step 2b: Card via Paystack inline popup ────────────────────────────────────

  async function handleCardPay() {
    try {
      const { accessCode } = await initPayment(createdOrder!.id).unwrap();
      if (!window.PaystackPop) { toast.error('Payment script not loaded yet. Try again in a moment.'); return; }
      const popup = new window.PaystackPop();
      popup.resumeTransaction(accessCode);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error ?? err?.data?.message ?? 'Failed to open payment. Try again.');
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (!mounted || !isLoggedIn) return null;

  if (cartLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-forest-600" />
      </div>
    );
  }

  if (items.length === 0 && step === 'delivery') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-5">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto" />
        <h1 className="text-xl font-bold text-forest-900">Your cart is empty</h1>
        <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Shop Now
        </Link>
      </div>
    );
  }

  // ── M-Pesa waiting screen ─────────────────────────────────────────────────────

  if (step === 'mpesa_pending') {
    const DURATION   = 60;
    const radius     = 52;
    const circ       = 2 * Math.PI * radius;
    const progress   = countdown / DURATION;
    const dashOffset = circ * (1 - progress);
    const isExpiring = countdown <= 15 && !timedOut;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: 'linear-gradient(160deg, #f0e8d8 0%, #e8dcc8 50%, #ddd0b8 100%)' }}
      >
        <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />

        {/* Dot-grid texture overlay (matching hero) */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%232a1810'/%3E%3C/svg%3E")` }}
        />

        <div className="w-full max-w-md">
          {/* Main card */}
          <div
            className="rounded-3xl p-8 flex flex-col items-center text-center"
            style={{
              background: 'linear-gradient(160deg, #fdf8f0 0%, #f5ece0 60%, #ede4d0 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 20px 60px rgba(90,60,30,0.22), 0 4px 12px rgba(90,60,30,0.14)',
              border: '1px solid rgba(140,100,60,0.18)',
            }}
          >
            {/* ── Timed out state ──────────────────────────────────────── */}
            {timedOut ? (
              <>
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: 'linear-gradient(180deg, #f5e0d8 0%, #e8c8bc 100%)',
                    boxShadow: '0 2px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.1) inset, 0 6px 20px rgba(196,53,31,0.25)',
                    border: '1px solid rgba(196,53,31,0.2)',
                  }}
                >
                  <Clock className="h-10 w-10" style={{ color: '#c4351f' }} />
                </div>

                <h1 className="text-2xl font-black mb-2" style={{ color: '#2a1810', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  Payment Expired
                </h1>
                <p className="text-sm mb-6" style={{ color: '#9c8068' }}>
                  The M-Pesa request timed out. Your order is still reserved — you can try again.
                </p>

                <div
                  className="w-full rounded-2xl p-4 mb-6 text-sm text-left"
                  style={{
                    background: 'linear-gradient(180deg, #e0d4c0 0%, #ede4d4 40%, #f0e8da 100%)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.16) inset, 0 1px 0 rgba(255,255,255,0.5)',
                    border: '1px solid rgba(140,100,60,0.15)',
                  }}
                >
                  <p style={{ color: '#6b4c30' }}>
                    <strong>Tip:</strong> Make sure your M-Pesa is active and has sufficient balance before retrying.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { stopAll(); setMpesaError(''); setTimedOut(false); setStep('payment'); }}
                  className="skeu-btn-primary w-full py-4 rounded-2xl font-black text-white text-sm"
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                {/* ── Active waiting state ─────────────────────────────── */}

                {/* SVG countdown ring + phone icon */}
                <div className="relative mb-6" style={{ width: 140, height: 140 }}>
                  <svg width="140" height="140" className="absolute inset-0 -rotate-90">
                    {/* Track */}
                    <circle
                      cx="70" cy="70" r={radius}
                      fill="none"
                      strokeWidth="7"
                      stroke="rgba(140,100,60,0.15)"
                    />
                    {/* Progress arc */}
                    <circle
                      cx="70" cy="70" r={radius}
                      fill="none"
                      strokeWidth="7"
                      stroke={isExpiring ? '#c4351f' : '#2d7350'}
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${isExpiring ? 'rgba(196,53,31,0.5)' : 'rgba(45,115,80,0.5)'})` }}
                    />
                  </svg>

                  {/* Phone icon disc */}
                  <div
                    className="absolute inset-0 m-4 rounded-full flex flex-col items-center justify-center"
                    style={{
                      background: 'linear-gradient(160deg, #fdf8f0 0%, #f0e8d8 100%)',
                      boxShadow: '0 2px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(0,0,0,0.08) inset, 0 4px 12px rgba(90,60,30,0.18)',
                      border: '1px solid rgba(140,100,60,0.2)',
                    }}
                  >
                    <Smartphone className="h-8 w-8 mb-0.5" style={{ color: '#2d7350' }} />
                    <span
                      className="text-xs font-black tabular-nums"
                      style={{ color: isExpiring ? '#c4351f' : '#2d7350', lineHeight: 1 }}
                    >
                      {countdown}s
                    </span>
                  </div>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-black mb-1" style={{ color: '#2a1810', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  Check Your Phone
                </h1>
                <p className="text-sm mb-1" style={{ color: '#6b4c30' }}>
                  M-Pesa prompt sent to <strong style={{ color: '#2a1810' }}>{mpesaPhone}</strong>
                </p>
                <p className="text-xs mb-6" style={{ color: '#9c8068' }}>
                  Amount: <strong style={{ color: '#1a3828' }}>{formatPrice(total)}</strong>
                </p>

                {/* Steps — inset panel */}
                <div
                  className="w-full rounded-2xl p-5 mb-5 text-left space-y-3"
                  style={{
                    background: 'linear-gradient(180deg, #e0d4c0 0%, #ede4d4 40%, #f0e8da 100%)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.16) inset, 0 1px 0 rgba(255,255,255,0.5)',
                    border: '1px solid rgba(140,100,60,0.15)',
                  }}
                >
                  {[
                    { done: true,  label: 'STK push sent to your phone' },
                    { done: false, label: 'Enter your M-Pesa PIN when prompted' },
                    { done: false, label: 'Waiting for payment confirmation…', loading: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: s.done
                            ? 'linear-gradient(180deg, #3a9166 0%, #255c3d 100%)'
                            : 'linear-gradient(180deg, #e8dcc8 0%, #d4c4b0 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 1px 3px rgba(0,0,0,0.2)',
                          border: '1px solid rgba(0,0,0,0.15)',
                        }}
                      >
                        {s.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        ) : s.loading ? (
                          <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#9c8068' }} />
                        ) : (
                          <span className="text-[9px] font-black" style={{ color: '#9c8068' }}>{i + 1}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium" style={{ color: s.done ? '#1a3828' : '#6b4c30' }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div
                  className="w-full rounded-full h-2 mb-5 overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, #d0c4b0 0%, #e0d4c0 100%)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15) inset',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(countdown / DURATION) * 100}%`,
                      background: isExpiring
                        ? 'linear-gradient(90deg, #e8503a, #c4351f)'
                        : 'linear-gradient(90deg, #3a9166, #255c3d)',
                      boxShadow: isExpiring
                        ? '0 1px 0 rgba(255,255,255,0.3) inset, 0 0 6px rgba(196,53,31,0.4)'
                        : '0 1px 0 rgba(255,255,255,0.3) inset, 0 0 6px rgba(45,115,80,0.4)',
                      transition: 'width 0.9s linear, background 0.3s ease',
                    }}
                  />
                </div>

                {isExpiring && (
                  <p className="text-xs font-semibold mb-4" style={{ color: '#c4351f' }}>
                    Hurry — {countdown} second{countdown !== 1 ? 's' : ''} remaining
                  </p>
                )}

                {mpesaError && (
                  <div
                    className="w-full rounded-xl p-3 mb-4 flex items-start gap-2 text-sm"
                    style={{ background: 'rgba(196,53,31,0.08)', border: '1px solid rgba(196,53,31,0.25)' }}
                  >
                    <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#c4351f' }} />
                    <span style={{ color: '#7a1a0a' }}>{mpesaError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { stopAll(); setMpesaError(''); setStep('payment'); }}
                  className="skeu-btn-secondary w-full py-3 rounded-2xl font-bold text-sm"
                >
                  Didn&apos;t get a push? Go back
                </button>
              </>
            )}
          </div>

          {/* Maschon branding below card */}
          <p className="text-center mt-5 text-xs" style={{ color: 'rgba(90,60,30,0.5)' }}>
            Secured by Paystack · Maschon Kenya
          </p>
        </div>
      </div>
    );
  }

  // ── Shared order summary sidebar ──────────────────────────────────────────────

  const OrderSummary = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-24">
      <h2 className="font-bold text-forest-900">Order Summary</h2>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => {
          const img  = getImg(item);
          const slug = getProductSlug(item);
          return (
            <Link key={item.id} href={slug ? `/products/${slug}` : '#'} className="flex gap-3 items-center group/item">
              <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                {img
                  ? <Image src={img} alt={getProductName(item)} fill className="object-cover group-hover/item:scale-105 transition-transform duration-200" sizes="48px" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300">🛍️</div>
                }
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-gray-700 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {item.quantity}
                </span>
              </div>
              <p className="flex-1 text-xs font-medium text-gray-900 line-clamp-2 leading-snug group-hover/item:text-forest-700 transition-colors">{getProductName(item)}</p>
              <p className="text-xs font-bold text-gray-900 flex-shrink-0">{formatPrice(getUnitPrice(item) * item.quantity)}</p>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-bark-100 pt-3 space-y-2 text-sm">
        <div className="flex justify-between text-bark-600">
          <span>Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        {appliedDiscount && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span><span className="font-medium">-{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-bark-100 pt-3 flex justify-between font-bold text-forest-900">
        <span>Total</span>
        <span className="text-lg">{formatPrice(total)}</span>
      </div>

      {/* CTA changes per step */}
      {step === 'delivery' && (
        <button
          onClick={handleProceedToPayment}
          disabled={ordering}
          className="w-full py-4 rounded-xl bg-forest-900 text-white font-bold text-sm hover:bg-forest-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {ordering
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating order…</>
            : <>Continue to Payment — {formatPrice(total)}</>
          }
        </button>
      )}

      {step === 'payment' && (
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" /> Choose a payment method on the left
        </p>
      )}

      <div className="text-[11px] text-gray-400 text-center">
        <p className="flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" /> Secured by Paystack
        </p>
        <p className="mt-0.5">M-Pesa · Visa · Mastercard accepted</p>
      </div>
    </div>
  );

  // ── Two-column layout ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Paystack inline JS — loaded once on checkout */}
      <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />

      <div className="mb-6">
        {step === 'delivery' ? (
          <Link href="/cart" className="flex items-center gap-2 text-sm text-bark-500 hover:text-forest-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to cart
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep('delivery')}
            className="flex items-center gap-2 text-sm text-bark-500 hover:text-forest-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to delivery
          </button>
        )}

        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-2xl font-bold text-forest-900">Checkout</h1>
          {/* Step pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === 'delivery' ? 'bg-forest-900 text-white' : 'bg-forest-100 text-forest-700'}`}>
              1 · Delivery
            </span>
            <span className="text-bark-300">›</span>
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === 'payment' ? 'bg-forest-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
              2 · Payment
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">

        {/* ── Left column ──────────────────────────────────────────────────────── */}

        {step === 'delivery' ? (

          <div className="space-y-6">
            {/* Delivery details card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-earth-600" />
                <h2 className="font-bold text-gray-900">Delivery Details</h2>
              </div>

              {savedAddresses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <BookmarkCheck className="inline h-3.5 w-3.5 mr-1 text-forest-600" />
                    Saved Addresses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setRecipientName(addr.recipient_name);
                          setPhone(addr.phone);
                          setTown(addr.city);
                          setStage(addr.address_line1);
                          setCounty(addr.county ?? '');
                          setSaveAddress(false);
                        }}
                        className={`relative flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          selectedAddressId === addr.id
                            ? 'border-forest-600 bg-forest-50 ring-1 ring-forest-600'
                            : 'border-gray-200 hover:border-forest-300 bg-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                          {addr.label}
                          {addr.is_default && (
                            <span className="text-[9px] bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded-full font-semibold">Default</span>
                          )}
                        </span>
                        <span className="text-[11px] text-bark-500 max-w-[160px] truncate">
                          {addr.address_line1}, {addr.city}
                        </span>
                        <span className="text-[11px] text-bark-400">{addr.phone}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setRecipientName(user ? `${user.firstName} ${user.lastName}` : '');
                        setPhone(''); setTown(''); setStage(''); setCounty('');
                        setSaveAddress(true);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        selectedAddressId === null
                          ? 'border-forest-600 bg-forest-50 ring-1 ring-forest-600'
                          : 'border-dashed border-gray-300 hover:border-forest-400 bg-white'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5 text-forest-600" />
                      <span className="text-xs font-semibold text-forest-700">New Address</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-100 mt-4" />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Recipient Name *</label>
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name of recipient"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number *</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">County *</label>
                  <input
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="e.g. Nairobi"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Town / Area *</label>
                  <input
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    placeholder="e.g. Westlands"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Stage / Landmark</label>
                  <input
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    placeholder="e.g. Kencom Stage, Next to Equity Bank"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              {/* Delivery method */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Delivery Method *</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('home_delivery')}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                      deliveryMethod === 'home_delivery' ? 'border-forest-600 bg-forest-50' : 'border-gray-200 hover:border-forest-300'
                    }`}
                  >
                    <Truck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${deliveryMethod === 'home_delivery' ? 'text-forest-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-forest-900">Home Delivery</p>
                      <p className="text-xs text-bark-500 mt-0.5">Delivered to your door</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                      deliveryMethod === 'pickup' ? 'border-forest-600 bg-forest-50' : 'border-gray-200 hover:border-forest-300'
                    }`}
                  >
                    <Store className={`h-5 w-5 mt-0.5 flex-shrink-0 ${deliveryMethod === 'pickup' ? 'text-forest-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-forest-900">Click &amp; Collect</p>
                      <p className="text-xs text-bark-500 mt-0.5">Pick up from our collection point</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Preferred Courier (optional)</label>
                <input
                  value={preferredProvider}
                  onChange={(e) => setPreferredProvider(e.target.value)}
                  placeholder="e.g. G4S, Sendy, Fargo — leave blank if no preference"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Delivery Instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="Any special delivery instructions…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
                />
              </div>

              {!selectedAddressId && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-forest-900 transition-colors">
                    Save this address for next time
                  </span>
                </label>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
                <strong>Delivery Info:</strong> Delivery fees are communicated separately and collected on delivery or via M-Pesa before dispatch. Orders are dispatched within 1–3 business days after payment confirmation.{' '}
                <a
                  href="https://wa.me/254757688845"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-green-700 hover:text-green-800 underline underline-offset-2 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>

            {/* Discount code */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Discount Code</h3>
              </div>
              {appliedDiscount ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">{appliedDiscount.description}</p>
                    <p className="text-xs text-green-600">Saves {formatPrice(appliedDiscount.amount)}</p>
                  </div>
                  <button onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }} className="text-xs text-red-500 hover:text-red-700 hover:underline flex-shrink-0">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyDiscountCode()}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 uppercase tracking-widest"
                  />
                  <button
                    onClick={applyDiscountCode}
                    disabled={validating || !discountCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
                  >
                    {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          </div>

        ) : (

          /* ── Payment method selection (step === 'payment') ──────────────────── */

          <div className="space-y-4">

            {/* Order created confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-900">Order #{createdOrder?.orderNumber} reserved</p>
                <p className="text-green-700 text-xs mt-0.5">Complete payment below to confirm your order.</p>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentTab('mpesa')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                    paymentTab === 'mpesa'
                      ? 'bg-green-50 text-green-800 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                    paymentTab === 'card'
                      ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
              </div>

              {/* ── M-Pesa tab ─────────────────────────────────────────────────── */}
              {paymentTab === 'mpesa' && (
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Pay via M-Pesa STK Push</p>
                      <p className="text-xs text-bark-500 mt-0.5">You&apos;ll receive a prompt on your phone — just enter your PIN.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      M-Pesa Phone Number
                    </label>
                    <input
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <p className="text-xs text-bark-400 mt-1">Safaricom M-Pesa number registered in your name.</p>
                  </div>

                  {mpesaError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {mpesaError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleMpesaPay}
                    disabled={mpesaInit || !mpesaPhone.trim()}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                  >
                    {mpesaInit
                      ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending STK Push…</>
                      : <><Smartphone className="h-5 w-5" /> Pay {formatPrice(total)} via M-Pesa</>
                    }
                  </button>

                  <p className="text-[11px] text-gray-400 text-center">
                    By paying, you agree to our terms. M-Pesa charges may apply.
                  </p>
                </div>
              )}

              {/* ── Card tab ───────────────────────────────────────────────────── */}
              {paymentTab === 'card' && (
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Pay by Card</p>
                      <p className="text-xs text-bark-500 mt-0.5">Visa &amp; Mastercard accepted. Secured by Paystack.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {['VISA', 'MC'].map((brand) => (
                      <span key={brand} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 tracking-wide">{brand}</span>
                    ))}
                    <span className="text-xs text-bark-400 ml-1">256-bit SSL encryption</span>
                  </div>

                  <p className="text-sm text-bark-600 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    A secure Paystack payment form will open as a modal on this page. Your card details are never stored on our servers.
                  </p>

                  <button
                    type="button"
                    onClick={handleCardPay}
                    disabled={initing}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
                  >
                    {initing
                      ? <><Loader2 className="h-5 w-5 animate-spin" /> Loading payment form…</>
                      : <><CreditCard className="h-5 w-5" /> Pay {formatPrice(total)} by Card</>
                    }
                  </button>

                  <p className="text-[11px] text-gray-400 text-center">
                    After payment, you&apos;ll be redirected to your order confirmation.
                  </p>
                </div>
              )}
            </div>
          </div>

        )}

        {/* ── Right column: order summary ────────────────────────────────────── */}
        <div>{OrderSummary}</div>
      </div>

      {/* You may also like */}
      {step === 'delivery' && suggestedProducts.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-forest-900">You may also like</h2>
              <p className="text-sm text-bark-500 mt-0.5">Items customers often add before checkout</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-forest-700 hover:text-forest-900 hover:underline transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {suggestedProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
