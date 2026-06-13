'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useListPromotionsQuery } from '@/lib/redux/api/promotionsApi';

const STATIC_SLIDES = [
  {
    image:   '/images/carpet-geometric-green.jpeg',
    eyebrow: 'New Collection',
    title:   'Premium Carpets',
    sub:     'Geometric & abstract styles',
    offer:   'FROM KES 2,500',
    offerBg: 'bg-earth-500',
    href:    '/products?category=carpets',
  },
  {
    image:   '/images/cooking-pots.jpeg',
    eyebrow: 'Kitchenware Deals',
    title:   'Cookware Sets',
    sub:     'Mika · Redberry · Rashnik',
    offer:   'UP TO 40% OFF',
    offerBg: 'bg-red-500',
    href:    '/products?category=kitchenware',
  },
  {
    image:   '/images/canopy-princess-purple.jpeg',
    eyebrow: 'Bedroom Essentials',
    title:   'Bed Canopies & Nets',
    sub:     'Princess · Four-post · Ceiling',
    offer:   'FROM KES 1,800',
    offerBg: 'bg-forest-600',
    href:    '/products?category=bedding',
  },
  {
    image:   '/images/water-dispenser-red.jpeg',
    eyebrow: 'Appliances Week',
    title:   'Hot & Cold Dispensers',
    sub:     'Sonar · Ailyons · Signature',
    offer:   'UP TO 30% OFF',
    offerBg: 'bg-red-500',
    href:    '/products?category=appliances',
  },
  {
    image:   '/images/cushion-tribal-black-white.jpeg',
    eyebrow: 'Style Your Space',
    title:   'Home Décor',
    sub:     'Cushions · Contact paper · More',
    offer:   'FROM KES 450',
    offerBg: 'bg-earth-600',
    href:    '/products?category=home-decor',
  },
];

const INTERVAL = 4500;
const FADE_MS  = 400;

export function HeroSlideshow() {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  const { data: apiSlides = [] } = useListPromotionsQuery({ type: 'hero_slide' });

  const slides = apiSlides.length > 0
    ? apiSlides.map((s) => ({
        image:   s.imageUrl ?? '',
        eyebrow: s.eyebrow ?? '',
        title:   s.title,
        sub:     s.subtitle ?? '',
        offer:   s.offerText ?? '',
        offerBg: s.offerBg ?? 'bg-earth-500',
        href:    s.ctaUrl,
      }))
    : STATIC_SLIDES;

  // If the slide count changed and index is now out of range, reset
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

  if (!slides.length) return null;

  const slide = slides[index];

  return (
    <div className="relative h-full min-h-[480px] overflow-hidden">
      {/* Image */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-[400ms]',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
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
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Text overlay */}
      <Link
        href={slide.href}
        className={cn(
          'absolute inset-0 flex flex-col justify-end p-8 transition-opacity duration-[400ms]',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <p className="text-earth-300 text-xs font-bold uppercase tracking-widest mb-2">
          {slide.eyebrow}
        </p>
        <h2 className="text-white font-black text-3xl lg:text-4xl leading-tight">
          {slide.title}
        </h2>
        <p className="text-white/70 text-sm mt-1.5">{slide.sub}</p>

        <div className="flex items-center gap-3 mt-4">
          {slide.offer && (
            <span className={cn('px-4 py-1.5 rounded-full text-white font-black text-sm', slide.offerBg)}>
              {slide.offer}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-white font-semibold text-sm">
            Shop now <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Progress dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              )}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-4 right-5 text-white/50 text-xs font-bold tabular-nums z-10">
        {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
    </div>
  );
}
