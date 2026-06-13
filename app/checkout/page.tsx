'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { ShoppingBag, MapPin, Tag, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsLoggedIn } from '@/lib/redux/slices/authSlice';
import { useGetCartQuery } from '@/lib/redux/api/cartApi';
import {
  useCreateOrderMutation,
  useInitializePaymentMutation,
  useValidateDiscountCodeMutation,
  type CreateOrderPayload,
} from '@/lib/redux/api/ordersApi';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { CartItem } from '@/lib/types';

declare global {
  interface Window {
    PaystackPop: {
      setup(opts: Record<string, unknown>): { openIframe(): void };
    };
  }
}

const SHIPPING_RATES = {
  nairobi:   { label: 'Nairobi (Same day / Next day)', fee: 250 },
  upcountry: { label: 'Upcountry (2–4 business days)',  fee: 450 },
};

function getImg(item: CartItem) {
  return item.products?.primaryImageUrl ?? (item.products as { primary_image_url?: string })?.primary_image_url ?? null;
}

export default function CheckoutPage() {
  const router     = useRouter();
  const user       = useAppSelector(selectCurrentUser);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth/login?redirect=/checkout');
  }, [isLoggedIn, router]);

  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const [createOrder,       { isLoading: ordering }]  = useCreateOrderMutation();
  const [initializePayment, { isLoading: initing }]   = useInitializePaymentMutation();
  const [validateDiscount,  { isLoading: validating }] = useValidateDiscountCodeMutation();

  const [zone, setZone]                       = useState<'nairobi' | 'upcountry'>('nairobi');
  const [recipientName, setRecipientName]     = useState('');
  const [phone, setPhone]                     = useState('');
  const [addressLine1, setAddressLine1]       = useState('');
  const [city, setCity]                       = useState('Nairobi');
  const [county, setCounty]                   = useState('');
  const [note, setNote]                       = useState('');
  const [discountCode, setDiscountCode]       = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number; description: string } | null>(null);
  const [step, setStep]                       = useState<'form' | 'processing' | 'done'>('form');

  // Pre-fill name from auth user
  useEffect(() => {
    if (user && !recipientName) setRecipientName(`${user.firstName} ${user.lastName}`);
  }, [user, recipientName]);

  const items    = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = SHIPPING_RATES[zone].fee;
  const discount = appliedDiscount?.amount ?? 0;
  const total    = Math.max(0, subtotal + shipping - discount);

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

  async function handlePay() {
    if (!addressLine1.trim() || !phone.trim() || !recipientName.trim()) {
      toast.error('Please fill in all required delivery details');
      return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) { toast.error('Payment not configured. Contact support.'); return; }

    setStep('processing');
    try {
      const payload: CreateOrderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          supplyId:  i.supplyId  ?? null,
          quantity:  i.quantity,
        })),
        shippingFee:    shipping,
        discountCode:   appliedDiscount ? discountCode : undefined,
        customerNote:   note.trim() || undefined,
        idempotencyKey: `${user!.id}-${Date.now()}`,
      };

      const order = await createOrder(payload).unwrap();
      const { authorizationUrl, reference } = await initializePayment(order.id).unwrap();

      if (typeof window.PaystackPop !== 'undefined') {
        window.PaystackPop.setup({
          key:      paystackKey,
          email:    user!.email,
          amount:   Math.round(total * 100),
          currency: 'KES',
          ref:      reference,
          metadata: {
            custom_fields: [
              { display_name: 'Order Number',   variable_name: 'order_number',   value: order.orderNumber },
              { display_name: 'Customer Name',  variable_name: 'customer_name',  value: recipientName },
              { display_name: 'Delivery Zone',  variable_name: 'delivery_zone',  value: zone },
              { display_name: 'Address',        variable_name: 'address',        value: addressLine1 },
            ],
          },
          callback: () => {
            setStep('done');
            toast.success('Payment successful! Order confirmed.');
            setTimeout(() => router.push(`/account/orders/${order.id}`), 1800);
          },
          onClose: () => {
            setStep('form');
            toast.info('Payment cancelled — your order is saved. Complete payment from My Orders.');
            router.push(`/account/orders/${order.id}`);
          },
        }).openIframe();
      } else {
        window.location.href = authorizationUrl;
      }
    } catch (e: unknown) {
      setStep('form');
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Order failed. Please try again.');
    }
  }

  if (!isLoggedIn) return null;

  if (cartLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-forest-600" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-5">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold text-forest-900">Order Confirmed!</h1>
        <p className="text-bark-500">Redirecting to your orders…</p>
        <Loader2 className="h-6 w-6 animate-spin text-forest-600 mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
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

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link href="/cart" className="flex items-center gap-2 text-sm text-bark-500 hover:text-forest-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to cart
          </Link>
          <h1 className="text-2xl font-bold text-forest-900 mt-3">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left — delivery form */}
          <div className="space-y-6">
            {/* Auth banner */}
            <div className="flex items-center gap-3 p-3 bg-forest-50 rounded-xl border border-forest-100">
              <CheckCircle className="h-5 w-5 text-forest-700 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-forest-900">Signed in as {user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-forest-600 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Delivery details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-earth-600" />
                <h2 className="font-bold text-gray-900">Delivery Details</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Recipient Name *</label>
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone *</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">City *</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nairobi"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Street Address *</label>
                  <input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street, building, estate, area"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">County</label>
                  <input
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="e.g. Nairobi County"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              {/* Zone picker */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Delivery Zone *</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(Object.entries(SHIPPING_RATES) as [keyof typeof SHIPPING_RATES, (typeof SHIPPING_RATES)[keyof typeof SHIPPING_RATES]][]).map(([key, z]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setZone(key)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                        zone === key ? 'border-forest-600 bg-forest-50' : 'border-gray-200 hover:border-forest-300'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        zone === key ? 'border-forest-600' : 'border-gray-300'
                      }`}>
                        {zone === key && <div className="h-2 w-2 rounded-full bg-forest-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-forest-900">{z.label}</p>
                        <p className="text-xs text-bark-500 mt-0.5">KES {z.fee}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Order Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Special delivery instructions…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
                />
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

          {/* Right — order summary */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-24">
              <h2 className="font-bold text-forest-900">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => {
                  const img = getImg(item);
                  return (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                        {img
                          ? <Image src={img} alt={item.products.name} fill className="object-cover" sizes="48px" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300">🛍️</div>
                        }
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-gray-700 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <p className="flex-1 text-xs font-medium text-gray-900 line-clamp-2 leading-snug">{item.products.name}</p>
                      <p className="text-xs font-bold text-gray-900 flex-shrink-0">{formatPrice(item.unitPrice * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-bark-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-bark-600">
                  <span>Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-bark-600">
                  <span>Shipping</span><span className="font-medium">{formatPrice(shipping)}</span>
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

              <button
                onClick={handlePay}
                disabled={step === 'processing' || ordering || initing}
                className="w-full py-4 rounded-xl bg-forest-900 text-white font-bold text-sm hover:bg-forest-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {(step === 'processing' || ordering || initing)
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
                  : <>Pay {formatPrice(total)} with Paystack</>
                }
              </button>

              <div className="text-[11px] text-gray-400 text-center space-y-1">
                <p className="flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Secured by Paystack
                </p>
                <p>M-Pesa · Visa · Mastercard accepted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
