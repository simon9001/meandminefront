'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductMedia } from '@/lib/types';

interface Props {
  primaryImageUrl?: string;
  media?: ProductMedia[];
  productName: string;
  badge?: 'bestseller' | 'new' | null;
  discount?: number;
}

export function ImageGallery({ primaryImageUrl, media, productName, badge, discount }: Props) {
  const images: { url: string; thumb?: string; alt?: string }[] = [];

  if (media && media.length > 0) {
    [...media]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((m) => images.push({ url: m.url, thumb: m.thumbnailUrl, alt: m.altText }));
  } else if (primaryImageUrl) {
    images.push({ url: primaryImageUrl });
  }

  const [active, setActive] = useState(0);
  const current = images[active];
  const count = images.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-50 border border-bark-100">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt ?? productName}
            fill
            priority
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-bark-200">
            <Package className="h-16 w-16" />
          </div>
        )}

        {badge === 'bestseller' && (
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-earth-600 text-white text-xs font-bold">Best Seller</span>
        )}
        {badge === 'new' && (
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-forest-600 text-white text-xs font-bold">New Arrival</span>
        )}
        {discount !== undefined && discount >= 5 && (
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">-{discount}%</span>
        )}

        {/* Prev / next arrows on the main image */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + count) % count)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-forest-900" />
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % count)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-forest-900" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    idx === active ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  )}
                  aria-label={`Image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                'relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                'w-16 h-16 sm:w-[72px] sm:h-[72px]',
                idx === active
                  ? 'border-earth-500 shadow-md opacity-100'
                  : 'border-bark-100 opacity-60 hover:opacity-100 hover:border-bark-300'
              )}
            >
              <Image
                src={img.thumb ?? img.url}
                alt={img.alt ?? `${productName} view ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
