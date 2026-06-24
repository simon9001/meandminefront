'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Loader2, Star, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { useAddToCartMutation } from '@/lib/redux/api/cartApi';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

interface Props { product: Product; className?: string; }

export function ProductCard({ product, className }: Props) {
  const { openCart } = useCart();
  const [addToCart, { isLoading }] = useAddToCartMutation();

  const showSale   = !!(product.salePrice && product.salePrice < product.basePrice);
  const price      = showSale ? product.salePrice! : product.basePrice;
  const discount   = showSale ? Math.round((1 - product.salePrice! / product.basePrice) * 100) : 0;
  const savings    = showSale ? product.basePrice - product.salePrice! : 0;
  const badge      = product.isNewArrival ? 'new' : product.isBestSeller ? 'bestseller' : null;
  const outOfStock = product.status === 'out_of_stock';

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart({ productId: product.id, quantity: 1 }).unwrap();
      openCart();
    } catch {
      toast.error('Failed to add to cart');
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group flex flex-col rounded-[14px] overflow-hidden border',
        'shadow-[0_4px_16px_rgba(90,60,30,0.14),0_1px_4px_rgba(90,60,30,0.10)]',
        'hover:shadow-[0_8px_28px_rgba(90,60,30,0.22),0_2px_8px_rgba(90,60,30,0.14)]',
        'transition-shadow duration-200 will-change-auto',
        className,
      )}
      style={{
        background:   'linear-gradient(160deg, #fdf8f0 0%, #f5ece0 60%, #ede4d0 100%)',
        borderColor:  'rgba(140,100,60,0.18)',
        // GPU-composite the card so it doesn't glitch during scroll
        transform:    'translateZ(0)',
      }}
    >
      {/* ── Image  ──────────────────────────────────────────────────────────
          padding-top: 75% = (3/4)×100% → reliable 4:3 ratio on every device.
          The fill Image absolutely covers the padding space.
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full flex-shrink-0 overflow-hidden"
        style={{
          paddingTop:   '75%',
          background:   'linear-gradient(180deg, #f0e8d8 0%, #e8dcc8 100%)',
          borderBottom: '1px solid rgba(140,100,60,0.15)',
        }}
      >
        {/* All children are absolute so they sit inside the padding box */}
        <div className="absolute inset-0">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-10 w-10 text-bark-200" />
            </div>
          )}

          {/* Out-of-stock overlay */}
          {outOfStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(42,24,16,0.55)', backdropFilter: 'blur(2px)' }}
            >
              <span
                className="px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white rounded-lg"
                style={{ background: 'rgba(42,24,16,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Out of Stock
              </span>
            </div>
          )}

          {/* Badges — max one discount + one label badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {discount >= 5 && (
              <span
                className="px-2 py-0.5 text-[10px] font-black text-white rounded-full leading-tight"
                style={{ background: 'linear-gradient(135deg, #e8503a, #c4351f)', boxShadow: '0 2px 5px rgba(196,53,31,0.45)' }}
              >
                -{discount}%
              </span>
            )}
            {badge === 'new' && (
              <span
                className="px-2 py-0.5 text-[10px] font-black text-white rounded-full leading-tight"
                style={{ background: 'linear-gradient(135deg, #3a9166, #2d7350)' }}
              >
                New
              </span>
            )}
            {badge === 'bestseller' && (
              <span
                className="px-2 py-0.5 text-[10px] font-black text-white rounded-full leading-tight"
                style={{ background: 'linear-gradient(135deg, #d49340, #a8641c)' }}
              >
                Hot
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Category */}
        {product.category?.name && (
          <span
            className="text-[9px] font-black uppercase tracking-[0.16em] leading-none"
            style={{ color: '#c47b2a' }}
          >
            {product.category.name}
          </span>
        )}

        {/* Name */}
        <h3
          className="font-bold text-[13px] leading-snug line-clamp-2 flex-1"
          style={{ color: '#2a1810' }}
        >
          {product.name}
        </h3>

        {/* Stars */}
        {product.averageRating > 0 && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className="h-2.5 w-2.5 flex-shrink-0"
                style={{
                  fill:  i < Math.round(product.averageRating) ? '#c9972e' : 'transparent',
                  color: '#c9972e',
                }}
              />
            ))}
            <span className="text-[9px] font-bold ml-0.5" style={{ color: '#9c8068' }}>
              {product.averageRating.toFixed(1)}
              {product.reviewCount > 0 && (
                <span className="font-normal opacity-70"> ({product.reviewCount})</span>
              )}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-1.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[15px] font-black leading-none" style={{ color: '#1a3828' }}>
              KES {price.toLocaleString()}
            </span>
            {showSale && (
              <span className="text-[11px] line-through leading-none" style={{ color: '#b89f8a' }}>
                KES {product.basePrice.toLocaleString()}
              </span>
            )}
          </div>
          {showSale && savings > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1"
              style={{
                background: 'linear-gradient(135deg, #e8f5ec, #d4eddb)',
                color:      '#1e4530',
                border:     '1px solid rgba(45,115,80,0.2)',
              }}
            >
              🏷 Save KES {savings.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isLoading || outOfStock}
          className="mt-2 w-full py-2.5 rounded-xl text-[11px] font-black text-white flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: outOfStock
              ? 'linear-gradient(180deg, #b89f8a, #9c8068)'
              : 'linear-gradient(180deg, #d49340 0%, #c47b2a 45%, #a8641c 100%)',
            boxShadow: outOfStock
              ? '0 2px 4px rgba(0,0,0,0.15)'
              : '0 1px 0 rgba(255,255,255,0.22) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 3px 8px rgba(196,123,42,0.38)',
            border:     '1px solid rgba(0,0,0,0.2)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {isLoading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <ShoppingCart className="h-3 w-3 flex-shrink-0" />
          }
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
