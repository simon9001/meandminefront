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

  const showSale    = !!(product.salePrice && product.salePrice < product.basePrice);
  const price       = showSale ? product.salePrice! : product.basePrice;
  const hasDiscount = showSale;
  const discount    = showSale ? Math.round((1 - product.salePrice! / product.basePrice) * 100) : 0;
  const savings     = showSale ? product.basePrice - product.salePrice! : 0;
  const badge       = product.isNewArrival ? 'new' : product.isBestSeller ? 'bestseller' : null;
  const outOfStock  = product.status === 'out_of_stock';

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
      className={cn('group relative flex flex-col overflow-hidden transition-all duration-200', className)}
      style={{
        background: 'linear-gradient(160deg, #fdf8f0 0%, #f5ece0 60%, #ede4d0 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 1px 0 0 rgba(255,255,255,0.6) inset, 0 4px 16px rgba(90,60,30,0.14), 0 1px 4px rgba(90,60,30,0.1)',
        border: '1px solid rgba(140,100,60,0.18)',
        borderRadius: '14px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 1px 0 0 rgba(255,255,255,0.6) inset, 0 8px 28px rgba(90,60,30,0.22), 0 2px 8px rgba(90,60,30,0.14)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 1px 0 0 rgba(255,255,255,0.6) inset, 0 4px 16px rgba(90,60,30,0.14), 0 1px 4px rgba(90,60,30,0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Image frame */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #f0e8d8 0%, #e8dcc8 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12) inset',
          borderBottom: '1px solid rgba(140,100,60,0.15)',
        }}
      >
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-400"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-bark-200"><Package className="h-12 w-12" /></div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(42,24,16,0.55)', backdropFilter: 'blur(2px)' }}>
            <span
              className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white rounded-lg"
              style={{ background: 'rgba(42,24,16,0.8)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Out of Stock
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount >= 5 && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-black text-white rounded-full"
              style={{ background: 'linear-gradient(135deg, #e8503a, #c4351f)', boxShadow: '0 2px 5px rgba(196,53,31,0.5), inset 0 1px 0 rgba(255,255,255,0.2)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
            >
              -{discount}%
            </span>
          )}
          {badge === 'new' && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-black text-white rounded-full"
              style={{ background: 'linear-gradient(135deg, #3a9166, #2d7350)', boxShadow: '0 2px 5px rgba(45,115,80,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
            >
              New
            </span>
          )}
          {badge === 'bestseller' && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-black text-white rounded-full"
              style={{ background: 'linear-gradient(135deg, #d49340, #a8641c)', boxShadow: '0 2px 5px rgba(196,123,42,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
            >
              Best Seller
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.category?.name && (
          <span
            className="text-[9px] font-black uppercase tracking-[0.18em]"
            style={{ color: '#c47b2a' }}
          >
            {product.category.name}
          </span>
        )}

        <h3
          className="font-bold text-sm leading-snug line-clamp-2"
          style={{ color: '#2a1810', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}
        >
          {product.name}
        </h3>

        {product.averageRating > 0 && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className="h-3 w-3"
                style={{ fill: i < Math.round(product.averageRating) ? '#c9972e' : 'transparent', color: '#c9972e' }}
              />
            ))}
            <span className="text-[10px] font-bold" style={{ color: '#9c8068' }}>
              {product.averageRating.toFixed(1)}
              {product.reviewCount > 0 && <span className="font-normal"> ({product.reviewCount})</span>}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-lg font-black"
              style={{ color: '#1a3828', textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
            >
              KES {price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs line-through" style={{ color: '#b89f8a' }}>
                KES {product.basePrice.toLocaleString()}
              </span>
            )}
          </div>
          {hasDiscount && savings > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #e8f5ec, #d4eddb)',
                color: '#1e4530',
                border: '1px solid rgba(45,115,80,0.2)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              🏷 Save KES {savings.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isLoading || outOfStock}
          className="mt-2 w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: outOfStock
              ? 'linear-gradient(180deg, #b89f8a, #9c8068)'
              : 'linear-gradient(180deg, #d49340 0%, #c47b2a 45%, #a8641c 100%)',
            boxShadow: outOfStock
              ? '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)'
              : '0 1px 0 rgba(255,255,255,0.22) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 3px 8px rgba(196,123,42,0.38)',
            border: '1px solid rgba(0,0,0,0.2)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
          onMouseDown={(e) => {
            if (!isLoading && !outOfStock) {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(1px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.2) inset';
            }
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.22) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 3px 8px rgba(196,123,42,0.38)';
          }}
        >
          {isLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <ShoppingCart className="h-3.5 w-3.5" />
          }
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
