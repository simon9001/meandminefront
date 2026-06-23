'use client';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight, Play, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductMedia } from '@/lib/types';

interface Props { media: ProductMedia[]; productName: string; }

export function ProductGallery({ media, productName }: Props) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const current = media[active];
  const isImage = !current || current.mediaType === 'image';

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current || !zoomed) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  function prev() { setActive((a) => (a === 0 ? media.length - 1 : a - 1)); }
  function next() { setActive((a) => (a === media.length - 1 ? 0 : a + 1)); }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        ref={imgRef}
        className={cn(
          'relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 select-none',
          isImage && 'cursor-zoom-in',
          zoomed && 'cursor-zoom-out',
        )}
        onMouseEnter={() => isImage && setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {current ? (
          <>
            {isImage ? (
              <>
                <Image
                  src={current.url}
                  alt={current.altText ?? productName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {/* Zoom overlay */}
                {zoomed && (
                  <div
                    className="absolute inset-0 bg-no-repeat bg-white"
                    style={{
                      backgroundImage: `url(${current.url})`,
                      backgroundSize: '200%',
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <video src={current.url} controls className="w-full h-full object-contain" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="h-16 w-16" /></div>
        )}

        {/* Zoom hint */}
        {isImage && !zoomed && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <ZoomIn className="h-3 w-3" /> Hover to zoom
          </div>
        )}

        {/* Arrows */}
        {media.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 shadow hover:bg-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 shadow hover:bg-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
                i === active ? 'border-emerald-500 shadow-sm' : 'border-gray-200 hover:border-gray-400',
              )}
            >
              {m.mediaType === 'image' ? (
                <Image src={m.thumbnailUrl ?? m.url} alt={`View ${i + 1}`} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
