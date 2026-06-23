'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/lib/types';

interface Props {
  products:     Product[];
  categoryHref: string;
}

const SCROLL_AMOUNT = 320;

export function YouMayAlsoLike({ products, categoryHref }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(dir: 'left' | 'right') {
    rowRef.current?.scrollBy({ left: dir === 'right' ? SCROLL_AMOUNT : -SCROLL_AMOUNT, behavior: 'smooth' });
  }

  return (
    <div className="mt-16 pt-8 border-t border-bark-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-forest-900">You may also like</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="h-8 w-8 rounded-full border border-bark-200 flex items-center justify-center hover:bg-cream-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-forest-900" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="h-8 w-8 rounded-full border border-bark-200 flex items-center justify-center hover:bg-cream-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-forest-900" />
          </button>
          <Link
            href={categoryHref}
            className="text-sm font-semibold text-forest-700 hover:text-forest-900 transition-colors ml-1"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Horizontal scroll strip — no auto-scroll, user-controlled */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-[calc(50%-8px)] sm:w-56 md:w-60">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
