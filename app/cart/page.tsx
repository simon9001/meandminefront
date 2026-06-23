'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Loader2, Package } from 'lucide-react';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '@/lib/redux/api/cartApi';
import { formatPrice } from '@/lib/utils';
import { TrustBadges } from '@/components/product/TrustBadges';
import type { CartItem } from '@/lib/types';

export default function CartPage() {
  const { data: cart, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const items    = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  function getImg(item: CartItem) {
    return item.products?.primaryImageUrl ?? (item.products as { primary_image_url?: string })?.primary_image_url ?? null;
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart ({items.length})</h1>
        {items.length > 0 && (
          <button
            onClick={() => clearCart()}
            disabled={isClearing}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {isClearing ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 space-y-5">
          <ShoppingCart className="h-20 w-20 text-gray-200 mx-auto" />
          <div>
            <p className="text-xl font-bold text-gray-900">Your cart is empty</p>
            <p className="text-gray-500 mt-1">Looks like you haven&apos;t added anything yet</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-emerald-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const img = getImg(item);
              return (
                <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    {img
                      ? <Image src={img} alt={item.products.name} fill className="object-cover" sizes="96px" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="h-8 w-8" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.products.slug}`}>
                      <p className="font-semibold text-gray-900 hover:text-emerald-600 line-clamp-2 transition-colors">
                        {item.products.name}
                      </p>
                    </Link>
                    {item.product_variants && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.product_variants.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) removeItem(item.id);
                            else updateItem({ itemId: item.id, quantity: item.quantity - 1 });
                          }}
                          className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                          className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link href="/products" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mt-2">
              <ArrowLeft className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-white">
              <h2 className="font-bold text-gray-900">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">
                    {subtotal >= 3000 ? 'FREE' : 'Calculated at checkout'}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
              >
                Checkout <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-xs text-gray-400 text-center">Secure checkout with Paystack</p>
            </div>
            <TrustBadges compact />
          </div>
        </div>
      )}
    </div>
  );
}
