'use client';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingCart, Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '@/lib/redux/api/cartApi';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { isOpen, closeCart } = useCart();
  const { data: cart, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();

  const items     = cart?.items ?? [];
  const subtotal  = cart?.subtotal ?? 0;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  function getImg(item: typeof items[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = item.products as any;
    if (!p) return null;
    // Derive from joined product_media (primary first, then first available)
    const media = Array.isArray(p.product_media) ? p.product_media as { url: string; is_primary: boolean }[] : [];
    if (media.length > 0) {
      const primary = media.find((m) => m.is_primary) ?? media[0];
      return primary.url ?? null;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getUnitPrice(item: typeof items[0]): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return item.unitPrice ?? (item as any).unit_price ?? 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getProductName(item: typeof items[0]): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = item.products as any;
    if (!p) return 'Product';
    return p.name ?? 'Product';
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={closeCart} aria-hidden="true" />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bark-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-forest-900">Your Cart</h2>
            {itemCount > 0 && (
              <span className="flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-forest-900 text-white text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <button type="button" onClick={closeCart} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Close cart">
            <X className="h-5 w-5 text-bark-600" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="h-16 w-16 rounded-full bg-cream-50 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-bark-300" />
            </div>
            <div>
              <p className="font-semibold text-forest-900">Your cart is empty</p>
              <p className="text-sm text-bark-500 mt-1">Add some products to get started</p>
            </div>
            <button type="button" onClick={closeCart} className="mt-2 px-6 py-2.5 rounded-xl bg-[#ff7c2a] text-white text-sm font-bold hover:bg-[#e06920] transition-colors">
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
              {items.map((item) => {
                const img = getImg(item);
                return (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-bark-50 last:border-0">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-cream-50 flex-shrink-0">
                      {img ? (
                        <Image src={img} alt={getProductName(item)} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-bark-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-forest-900 line-clamp-2 leading-snug">
                        {getProductName(item)}
                      </p>
                      {item.product_variants && (
                        <p className="text-[10px] text-bark-400 mt-0.5">
                          {Object.entries(item.product_variants.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-sm font-black text-forest-900 mt-1">
                        {formatPrice(getUnitPrice(item) * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-bark-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) removeItem(item.id);
                              else updateItem({ itemId: item.id, quantity: item.quantity - 1 });
                            }}
                            className="px-2 py-1 hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="h-3 w-3 text-bark-600" />
                          </button>
                          <span className="px-2.5 py-1 text-xs font-bold text-forest-900 border-x border-bark-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                            className="px-2 py-1 hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="h-3 w-3 text-bark-600" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-bark-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-bark-100 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-bark-600">Subtotal</span>
                <span className="text-base font-black text-forest-900">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[11px] text-bark-400">Delivery fee calculated at checkout</p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full text-center py-3.5 rounded-xl bg-[#ff7c2a] text-white font-bold text-sm hover:bg-[#e06920] transition-colors"
              >
                Proceed to Checkout
              </Link>
              <button
                type="button"
                onClick={() => clearCart()}
                className="w-full text-center py-2.5 rounded-xl border border-bark-200 text-bark-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
