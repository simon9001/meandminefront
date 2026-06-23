'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useListPromotionsQuery } from '@/lib/redux/api/promotionsApi';

const INTERVAL = 4500;
const FADE_MS  = 400;

interface Props {
  wrapperClassName?: string;
}

export function HeroSlideshow({ wrapperClassName }: Props) {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  const { data: apiSlides = [] } = useListPromotionsQuery({ type: 'hero_slide' }, { pollingInterval: 30_000 });

  const slides = apiSlides.map((s) => ({
    image:   s.imageUrl ?? '',
    eyebrow: s.eyebrow ?? '',
    title:   s.title,
    sub:     s.subtitle ?? '',
    offer:   s.offerText ?? '',
    offerBg: s.offerBg ?? 'bg-earth-500',
    href:    s.ctaUrl,
  }));

  useEffect(() => {
    if (slides.length > 0 && index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length]);

  function goTo(i: number) {
    if (i === index) return;
    setVisible(false);
    setTimeout(() => { setIndex(i); setVisible(true); }, FADE_MS);
  }

  const outerCls = wrapperClassName ?? 'h-full min-h-[480px]';

  if (!slides.length) {
    return (
      <div className={cn('relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-earth-900 flex flex-col justify-end p-8', outerCls)}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <p className="text-earth-300 text-xs font-bold uppercase tracking-widest mb-2">Kenya&apos;s Home Store</p>
        <h2 className="text-white font-black text-3xl lg:text-4xl leading-tight">Carpets · Canopies<br />Kitchenware & More</h2>
        <p className="text-white/60 text-sm mt-2">Delivered across Kenya</p>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <div className={cn('relative overflow-hidden', outerCls)}>
      {/* Image */}
      <div className={cn('absolute inset-0 transition-opacity duration-[400ms]', visible ? 'opacity-100' : 'opacity-0')}>
        {slide.image && (
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 420px, 520px"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Text overlay */}
      <Link
        href={slide.href}
        className={cn('absolute inset-0 flex flex-col justify-end p-8 transition-opacity duration-[400ms]', visible ? 'opacity-100' : 'opacity-0')}
      >
        <p className="text-earth-300 text-xs font-bold uppercase tracking-widest mb-2">{slide.eyebrow}</p>
        <h2 className="text-white font-black text-3xl lg:text-4xl leading-tight">{slide.title}</h2>
        <p className="text-white/70 text-sm mt-1.5">{slide.sub}</p>
        <div className="flex items-center gap-3 mt-4">
          {slide.offer && (
            <span className={cn('px-4 py-1.5 rounded-full text-white font-black text-sm', slide.offerBg)}>{slide.offer}</span>
          )}
          <span className="inline-flex items-center gap-1 text-white font-semibold text-sm">
            Shop now <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70')}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
