'use client';
import { useState } from 'react';
import { ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react';
import { useAddToCartMutation } from '@/lib/redux/api/cartApi';
import { useCart } from '@/lib/cart-store';
import { toast } from 'sonner';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface Props {
  product: {
    id: string;
    name: string;
    price?: number;
    basePrice?: number;
    salePrice?: number;
    showSalePrice?: boolean;
    status?: string;
  };
  variantId?: string;
}

export function AddToCartSection({ product, variantId }: Props) {
  const [addToCart, { isLoading }] = useAddToCartMutation();
  const { openCart } = useCart();
  const [qty, setQty] = useState(1);

  const base         = product.basePrice ?? product.price ?? 0;
  const showSale     = !!(product.showSalePrice && product.salePrice && product.salePrice < base);
  const displayPrice = showSale ? product.salePrice! : base;
  const savings      = showSale ? base - product.salePrice! : 0;
  const discount     = showSale ? Math.round((1 - product.salePrice! / base) * 100) : 0;
  const isOutOfStock = product.status === 'out_of_stock';

  async function handleAddToCart() {
    try {
      await addToCart({ productId: product.id, quantity: qty, variantId }).unwrap();
      openCart();
    } catch {
      toast.error('Failed to add to cart. Try again.');
    }
  }

  const waText = encodeURIComponent(
    `Hi MeAndMine.shop, I'd like to order: ${product.name} (KES ${displayPrice.toLocaleString()}). Please confirm availability.`
  );
  const waUrl = `https://wa.me/254757568845?text=${waText}`;

  return (
    <div className="flex flex-col gap-5">

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-black text-forest-900 tracking-tight">
            KES {displayPrice.toLocaleString()}
          </span>
          {showSale && (
            <span className="text-xl text-bark-400 line-through font-medium">
              KES {base.toLocaleString()}
            </span>
          )}
          {showSale && discount >= 5 && (
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-sm font-bold border border-red-100">
              -{discount}%
            </span>
          )}
        </div>
        {showSale && savings > 0 && (
          <span className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
            🏷 You save KES {savings.toLocaleString()}
          </span>
        )}
      </div>

      {/* Stock + Qty on one row */}
      <div className="flex items-center justify-between gap-4">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
            Out of Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            In Stock
          </span>
        )}

        {!isOutOfStock && (
          <div className="flex items-center gap-0 rounded-xl border border-bark-200 overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-bark-500 hover:bg-bark-50 hover:text-forest-900 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 h-10 flex items-center justify-center text-sm font-bold text-forest-900 border-x border-bark-200 bg-cream-50">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-10 h-10 flex items-center justify-center text-bark-500 hover:bg-bark-50 hover:text-forest-900 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Buttons — each full width on its own row */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isLoading || isOutOfStock}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50"
          style={{
            background: isOutOfStock
              ? '#9ca3af'
              : 'linear-gradient(180deg, #ff9248 0%, #e85f00 100%)',
            boxShadow: isOutOfStock
              ? 'none'
              : '0 4px 14px rgba(232,95,0,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
          }}
        >
          {isLoading
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <ShoppingCart className="h-5 w-5" />
          }
          {isLoading ? 'Adding to Cart…' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition-all hover:opacity-95"
          style={{
            background: 'linear-gradient(180deg, #3de07a 0%, #1aad4e 100%)',
            boxShadow: '0 4px 14px rgba(26,173,78,0.3), 0 1px 0 rgba(255,255,255,0.15) inset',
          }}
        >
          <WhatsAppIcon className="h-5 w-5" />
          Order on WhatsApp
        </a>
      </div>
    </div>
  );
}
