'use client';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useListProductsQuery } from '@/lib/redux/api/productsApi';

interface Props {
  href: string;
  category: string;
  /** Which product from the sorted list to use as the background image (0-based). */
  productIndex?: number;
  overlayClass?: string;
  fallbackGradient?: string;
  className?: string;
  sizes?: string;
  children: React.ReactNode;
}

/**
 * Editorial banner that auto-fetches a real Cloudinary product image for the
 * given category. Falls back to a dark gradient when no image is available yet.
 */
export function CategoryBanner({
  href,
  category,
  productIndex = 0,
  overlayClass = 'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent',
  fallbackGradient = 'bg-forest-900',
  className,
  sizes = '(max-width: 768px) 100vw, 50vw',
  children,
}: Props) {
  const { data } = useListProductsQuery({ category, limit: 3, sort: 'popular' });
  const products = data?.data ?? [];
  const imageUrl =
    products[productIndex]?.primaryImageUrl ??
    products[0]?.primaryImageUrl ??
    null;

  return (
    <Link href={href} className={cn('group relative rounded-3xl overflow-hidden', className)}>
      {/* Background — Cloudinary image or gradient fallback */}
      <div className={cn('absolute inset-0', fallbackGradient)}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes={sizes}
          />
        )}
      </div>
      {/* Gradient overlay */}
      <div className={overlayClass} />
      {/* Text / CTA content */}
      {children}
    </Link>
  );
}
