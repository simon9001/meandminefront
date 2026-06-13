'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { useAddToCartMutation } from '@/lib/redux/api/cartApi';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

interface Props { product: Product; className?: string; }

export function ProductCard({ product, className }: Props) {
  const { openCart } = useCart();
  const [addToCart, { isLoading }] = useAddToCartMutation();

  const showSale    = product.showSalePrice && product.salePrice && product.salePrice < product.basePrice;
  const price       = showSale ? product.salePrice! : product.basePrice;
  const hasDiscount = showSale;
  const discount    = showSale ? Math.round((1 - product.salePrice! / product.basePrice) * 100) : 0;
  const savings     = showSale ? product.basePrice - product.salePrice! : 0;
  const badge       = product.isNewArrival ? 'new' : product.isBestSeller ? 'bestseller' : null;

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
        'group relative flex flex-col bg-white rounded-2xl border border-bark-100 hover:border-forest-200 hover:shadow-lg transition-all duration-200 overflow-hidden',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-50">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-bark-200">🛍️</div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount >= 5 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              -{discount}%
            </span>
          )}
          {badge === 'new' && (
            <span className="px-2 py-0.5 rounded-full bg-forest-600 text-white text-[10px] font-bold">New</span>
          )}
          {badge === 'bestseller' && (
            <span className="px-2 py-0.5 rounded-full bg-earth-600 text-white text-[10px] font-bold">Best Seller</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-earth-600">
          {product.category?.name ?? ''}
        </span>
        <h3 className="font-semibold text-forest-900 text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.averageRating > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-amber-400">
              {'★'.repeat(Math.round(product.averageRating))}{'☆'.repeat(5 - Math.round(product.averageRating))}
            </span>
            <span className="text-[10px] font-semibold text-forest-900">{product.averageRating.toFixed(1)}</span>
            {product.reviewCount > 0 && (
              <span className="text-[10px] text-bark-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-1 flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-forest-900">
              KES {price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-bark-400 line-through">
                KES {product.basePrice.toLocaleString()}
              </span>
            )}
          </div>
          {hasDiscount && savings > 0 && (
            <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold">
              🏷 You save KES {savings.toLocaleString()}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isLoading || product.status === 'out_of_stock'}
          className="mt-1 w-full py-2.5 rounded-xl bg-forest-900 text-white text-xs font-bold hover:bg-forest-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShoppingCart className="h-3.5 w-3.5" />
          )}
          {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
