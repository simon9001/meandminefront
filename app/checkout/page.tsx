'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag, MapPin, Tag, Loader2, ArrowLeft,
  AlertCircle, BookmarkCheck, Plus, Truck, Store, CheckCircle,
} from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsLoggedIn } from '@/lib/redux/slices/authSlice';
import { useGetCartQuery } from '@/lib/redux/api/cartApi';
import {
  useCreateOrderMutation,
  useInitializePaymentMutation,
  useVerifyPaymentMutation,
  useValidateDiscountCodeMutation,
  type CreateOrderPayload,
} from '@/lib/redux/api/ordersApi';
import {
  useListAddressesQuery,
  useCreateAddressMutation,
} from '@/lib/redux/api/usersApi';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { CartItem } from '@/lib/types';
import { useListProductsQuery } from '@/lib/redux/api/productsApi';
import { ProductCard } from '@/components/product/ProductCard';

declare global {
  interface Window {
    PaystackPop: {
      setup: (opts: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

type DeliveryMethod = 'home_delivery' | 'pickup';

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

function getProductName(item: CartItem): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (item.products as any)?.name ?? 'Product';
}

function getUnitPrice(item: CartItem): number {
  const r = getRaw(item);
  return r.unitPrice ?? r.unit_price ?? 0;
}

function getProductId(item: CartItem): string {
  const r = getRaw(item);
  return r.productId ?? r.product_id ?? '';
}

function getVariantId(item: CartItem): string | undefined {
  const r = getRaw(item);
  return r.variantId ?? r.variant_id ?? undefined;
}

function getSupplyId(item: CartItem): string | undefined {
  const r = getRaw(item);
  return r.supplyId ?? r.supply_id ?? undefined;
}

function getProductSlug(item: CartItem): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (item.products as any)?.slug ?? '';
}

export default function CheckoutPage() {
  const router     = useRouter();
  const user       = useAppSelector(selectCurrentUser);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth/login?redirect=/checkout');
  }, [isLoggedIn, router]);

  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const { data: productsPage } = useListProductsQuery({ limit: 12 });
  const { data: savedAddresses = [] } = useListAddressesQuery(undefined, { skip: !isLoggedIn });
  const [createOrder,       { isLoading: ordering }]  = useCreateOrderMutation();
  const [initializePayment, { isLoading: initing }]   = useInitializePaymentMutation();
  const [verifyPayment,     { isLoading: verifying }] = useVerifyPaymentMutation();
  const [validateDiscount,  { isLoading: validating }] = useValidateDiscountCodeMutation();
  const [saveAddressMutation] = useCreateAddressMutation();

  // Delivery info state
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
  const [step,              setStep]              = useState<'form' | 'processing' | 'done'>('form');
  const [mounted,           setMounted]           = useState(false);

  // Saved address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress,       setSaveAddress]       = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Pre-fill name from auth user (only when no saved addresses)
  useEffect(() => {
    if (user && !recipientName && savedAddresses.length === 0) {
      setRecipientName(`${user.firstName} ${user.lastName}`);
    }
  }, [user, recipientName, savedAddresses.length]);

  // Pre-fill form from user's default saved address on first load
  useEffect(() => {
    if (savedAddresses.length === 0) return;
    const def = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];
    setSelectedAddressId(def.id);
    setRecipientName(def.recipient_name);
    setPhone(def.phone);
    setTown(def.city);              // city → town
    setStage(def.address_line1);   // address_line1 → stage/area
    setCounty(def.county ?? '');
    setSaveAddress(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  const items    = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = appliedDiscount?.amount ?? 0;
  const total    = Math.max(0, subtotal - discount);

  const cartProductIds = new Set(items.map(getProductId));
  const suggestedProducts = (productsPage?.data ?? [])
    .filter((p) => !cartProductIds.has(p.id))
    .slice(0, 6);

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
    if (!recipientName.trim() || !phone.trim() || !county.trim() || !town.trim()) {
      toast.error('Please fill in all required delivery details');
      return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setStep('processing');
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
      const { reference } = await initializePayment(order.id).unwrap();

      setStep('form');

      if (!window.PaystackPop) {
        toast.error('Payment system not ready — please refresh and try again');
        return;
      }

      window.PaystackPop.setup({
        key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email:    user!.email,
        amount:   Math.round(total * 100),
        ref:      reference,
        currency: 'KES',
        label:    'Maschon Order',
        onSuccess: async (txn: { reference: string }) => {
          setStep('processing');
          try {
            await verifyPayment(txn.reference).unwrap();
            // Save address if user opted in and it's a new entry
            if (saveAddress && !selectedAddressId) {
              saveAddressMutation({
                recipientName,
                phone,
                addressLine1: stage || town,
                city:         town,
                county:       county.trim() || undefined,
                isDefault:    savedAddresses.length === 0,
                label:        'Home',
              }).catch(() => {});
            }
            router.push(`/checkout/confirm?order=${order.orderNumber}`);
          } catch {
            toast.error('Payment received but verification failed — contact support with ref: ' + txn.reference);
            setStep('form');
          }
        },
        onCancel: () => {
          toast.info('Payment cancelled');
          setStep('form');
        },
      }).openIframe();
    } catch (e: unknown) {
      setStep('form');
      const err = e as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error ?? err?.data?.message ?? 'Order failed. Please try again.');
    }
  }

  if (!mounted) return null;
  if (!isLoggedIn) return null;

  if (cartLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-forest-600" />
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
          {/* Delivery details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-earth-600" />
              <h2 className="font-bold text-gray-900">Delivery Details</h2>
            </div>

            {/* Saved address picker */}
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
                  placeholder="e.g. Kencom Stage, Nextto Equity Bank"
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

            {/* Save address checkbox — only shown when entering a new address */}
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

            {/* Delivery policy note */}
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

        {/* Right — order summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-24">
            <h2 className="font-bold text-forest-900">Order Summary</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => {
                const img  = getImg(item);
                const slug = getProductSlug(item);
                return (
                  <Link
                    key={item.id}
                    href={slug ? `/products/${slug}` : '#'}
                    className="flex gap-3 items-center group/item"
                  >
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

            <button
              onClick={handlePay}
              disabled={step === 'processing' || ordering || initing || verifying}
              className="w-full py-4 rounded-xl bg-forest-900 text-white font-bold text-sm hover:bg-forest-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {(step === 'processing' || ordering || initing || verifying)
                ? <><Loader2 className="h-5 w-5 animate-spin" /> {verifying ? 'Verifying…' : 'Processing…'}</>
                : <>Pay {formatPrice(total)} — Secure Checkout</>
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

      {/* You may also like */}
      {suggestedProducts.length > 0 && (
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
