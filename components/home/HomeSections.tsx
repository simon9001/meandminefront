'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LayoutGrid, Layers, Utensils, Zap, Sparkles, Package, Wind, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useListProductsQuery, useListCategoriesQuery } from '@/lib/redux/api/productsApi';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryBanner } from '@/components/home/CategoryBanner';

// ── Skeletons ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-bark-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-bark-100" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-2.5 bg-bark-100 rounded w-16" />
        <div className="h-4 bg-bark-100 rounded w-full" />
        <div className="h-4 bg-bark-100 rounded w-3/4" />
        <div className="h-6 bg-bark-100 rounded w-24 mt-2" />
        <div className="h-9 bg-bark-100 rounded-xl mt-1" />
      </div>
    </div>
  );
}

function CompactSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-bark-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-bark-100" />
      <div className="p-3 flex flex-col gap-1.5">
        <div className="h-2 bg-bark-100 rounded w-12" />
        <div className="h-3 bg-bark-100 rounded w-full" />
        <div className="h-3 bg-bark-100 rounded w-3/4" />
        <div className="h-3 bg-bark-100 rounded w-16 mt-1" />
      </div>
    </div>
  );
}

const CAT_ICONS: Record<string, ReactNode> = {
  carpets:      <LayoutGrid className="h-6 w-6 text-earth-600" />,
  bedding:      <Layers className="h-6 w-6 text-earth-600" />,
  kitchenware:  <Utensils className="h-6 w-6 text-earth-600" />,
  appliances:   <Zap className="h-6 w-6 text-earth-600" />,
  'home-decor': <Sparkles className="h-6 w-6 text-earth-600" />,
  storage:      <Package className="h-6 w-6 text-earth-600" />,
  curtains:     <Wind className="h-6 w-6 text-earth-600" />,
};

// ── Categories Section ─────────────────────────────────────────────────────────

export function CategoriesSection() {
  const { data: categories = [], isLoading } = useListCategoriesQuery(undefined, { pollingInterval: 30_000 });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Browse by Type</p>
          <h2 className="text-2xl font-black text-forest-900">Shop by Category</h2>
        </div>
        <Link href="/products" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 transition-colors">
          All categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl bg-white border border-bark-100 animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-bark-100" />
                <div className="h-3 bg-bark-100 rounded w-14" />
              </div>
            ))
          : categories.slice(0, 6).map((cat) => {
              const img  = cat.imageUrl ?? null;
              const icon = CAT_ICONS[cat.slug] ?? <ShoppingBag className="h-6 w-6 text-earth-600" />;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl bg-white border border-bark-100 hover:border-forest-300 hover:bg-forest-50 transition-colors text-center shadow-sm"
                >
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                    {img ? (
                      <Image src={img} alt={cat.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-forest-50">
                        {icon}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-bark-700 group-hover:text-forest-800 transition-colors leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}

// ── In Stock Now Section ───────────────────────────────────────────────────────

export function InStockSection() {
  const { data: apiResponse, isLoading } = useListProductsQuery({ limit: 12, sort: 'popular' }, { pollingInterval: 30_000 });
  const products = apiResponse?.data ?? [];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Available Today</p>
          <h2 className="text-2xl font-black text-forest-900">In Stock Now</h2>
        </div>
        <Link href="/products" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 transition-colors">
          Browse all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <CompactSkeleton key={i} />)
          : products.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                className="group flex flex-col bg-white rounded-2xl border border-bark-100 hover:border-forest-200 transition-colors overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-cream-50">
                  {item.primaryImageUrl ? (
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-bark-200"><Package className="h-8 w-8" /></div>
                  )}
                </div>
                <div className="p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-earth-500">
                    {item.category?.name ?? ''}
                  </span>
                  <p className="text-xs font-semibold text-forest-900 leading-tight mt-0.5 line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-forest-700 mt-1">
                    KES {(item.salePrice && item.salePrice < item.basePrice ? item.salePrice : item.basePrice).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

// ── Best Sellers Section ───────────────────────────────────────────────────────

export function BestSellersSection() {
  const { data: apiResponse, isLoading } = useListProductsQuery({ featured: true, limit: 10 }, { pollingInterval: 30_000 });
  const products = apiResponse?.data ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Customer Favourites</p>
          <h2 className="text-2xl font-black text-forest-900">Best Sellers</h2>
        </div>
        <Link href="/products" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 transition-colors">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

// ── New Arrivals Section ───────────────────────────────────────────────────────

export function NewArrivalsSection() {
  const { data: apiResponse, isLoading } = useListProductsQuery({ sort: 'newest', limit: 10 }, { pollingInterval: 30_000 });
  const products = apiResponse?.data ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Just Landed</p>
          <h2 className="text-2xl font-black text-forest-900">New Arrivals</h2>
        </div>
        <Link href="/products?sort=newest" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 transition-colors">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

// ── Deals & Offers Section ────────────────────────────────────────────────────

function getNextSunday(): Date {
  const d = new Date();
  const daysUntil = d.getDay() === 0 ? 7 : 7 - d.getDay();
  d.setDate(d.getDate() + daysUntil);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
  };
}

export function DealsSection() {
  const target = useMemo(() => getNextSunday(), []);
  // Initialize with zeros so server and client render identically.
  // useEffect sets the real value after hydration, then ticks every second.
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setTime(getTimeLeft(target));
    const id = setInterval(() => setTime(getTimeLeft(target)), 1_000);
    return () => clearInterval(id);
  }, [target]);

  const { data: apiResponse, isLoading } = useListProductsQuery({ sort: 'popular', limit: 20 }, { pollingInterval: 60_000 });
  const all = apiResponse?.data ?? [];

  // Prefer products on sale; fall back to any popular products
  const sale    = all.filter((p) => p.salePrice && p.salePrice < p.basePrice);
  const products = (sale.length >= 3 ? sale : all).slice(0, 8);

  if (!isLoading && products.length === 0) return null;

  const UNITS = [
    { label: 'Days',    value: time.days },
    { label: 'Hours',   value: time.hours },
    { label: 'Mins',    value: time.minutes },
    { label: 'Secs',    value: time.seconds },
  ] as const;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="rounded-2xl overflow-hidden border border-bark-100 bg-white flex flex-col lg:flex-row">

        {/* Left: timer panel */}
        <div className="lg:w-[210px] flex-shrink-0 bg-forest-900 p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-white font-black text-xl leading-tight">Deals &amp; Offers</h2>
            <p className="text-forest-300 text-sm mt-1">Limited time discounts</p>
          </div>

          {/* Countdown blocks */}
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {UNITS.map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-white font-black text-2xl leading-none tabular-nums">
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-forest-300 text-[9px] font-bold uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          <Link href="/products" className="inline-flex items-center gap-1.5 text-earth-400 hover:text-earth-300 transition-colors text-sm font-semibold mt-auto">
            View all deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Right: product strip */}
        <div className="flex-1 p-4 overflow-x-auto">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[140px] flex-shrink-0 animate-pulse">
                    <div className="aspect-square rounded-xl bg-bark-100 mb-2" />
                    <div className="h-3 bg-bark-100 rounded w-20 mb-1.5" />
                    <div className="h-4 bg-bark-100 rounded w-12" />
                  </div>
                ))
              : products.map((p) => {
                  const onSale   = !!(p.salePrice && p.salePrice < p.basePrice);
                  const discount = onSale ? Math.round((1 - p.salePrice! / p.basePrice) * 100) : 0;
                  const price    = onSale ? p.salePrice! : p.basePrice;
                  return (
                    <Link key={p.id} href={`/products/${p.slug}`}
                      className="w-[140px] flex-shrink-0 group">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-cream-50 border border-bark-100 group-hover:border-forest-200 transition-colors mb-2">
                        {p.primaryImageUrl ? (
                          <Image
                            src={p.primaryImageUrl} alt={p.name} fill
                            className="object-cover"
                            sizes="140px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-bark-200"><Package className="h-8 w-8" /></div>
                        )}
                        {onSale && (
                          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black whitespace-nowrap">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-forest-900 leading-tight line-clamp-2">{p.name}</p>
                      <p className="text-xs font-black text-forest-700 mt-0.5">
                        KES {price.toLocaleString()}
                      </p>
                    </Link>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Appliances Spotlight Section ──────────────────────────────────────────────

export function AppliancesSpotlightSection() {
  const { data, isLoading } = useListProductsQuery({ category: 'appliances', limit: 1 });
  if (!isLoading && !data?.data?.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Hot Sellers</p>
          <h2 className="text-2xl font-black text-forest-900">Appliances &amp; Dispensers</h2>
        </div>
        <Link href="/products?category=appliances" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 transition-colors">
          Shop all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CategoryBanner
          href="/products?category=appliances"
          category="appliances"
          productIndex={0}
          overlayClass="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
          fallbackGradient="bg-forest-900"
          className="md:row-span-2 aspect-[3/4] md:aspect-auto"
          sizes="(max-width: 768px) 100vw, 33vw"
        >
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="text-earth-300 text-xs font-bold uppercase tracking-widest">Appliances</span>
            <h3 className="text-white font-black text-xl mt-1">Hot &amp; Cold Dispensers</h3>
            <p className="text-white/70 text-sm mt-1">Sonar · Ailyons · Signature · 12 Month Warranty</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-white font-semibold text-sm group-hover:gap-2.5 transition-all">View products <ArrowRight className="h-4 w-4" /></span>
          </div>
        </CategoryBanner>
        <CategoryBanner
          href="/products?category=appliances"
          category="appliances"
          productIndex={1}
          overlayClass="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
          fallbackGradient="bg-bark-800"
          className="aspect-[4/3]"
          sizes="(max-width: 768px) 100vw, 33vw"
        >
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="text-earth-300 text-xs font-bold uppercase tracking-widest">Appliances</span>
            <h3 className="text-white font-bold text-base mt-0.5">Microwave Ovens</h3>
          </div>
        </CategoryBanner>
        <CategoryBanner
          href="/products?category=appliances"
          category="appliances"
          productIndex={2}
          overlayClass="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
          fallbackGradient="bg-earth-800"
          className="aspect-[4/3]"
          sizes="(max-width: 768px) 100vw, 33vw"
        >
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="text-earth-300 text-xs font-bold uppercase tracking-widest">Appliances</span>
            <h3 className="text-white font-bold text-base mt-0.5">Fridges &amp; Freezers</h3>
          </div>
        </CategoryBanner>
      </div>
    </section>
  );
}

// ── Carpets & Bedding Section ──────────────────────────────────────────────────

export function CarpetsBeddingSection() {
  const { data: carpetsData, isLoading: loadingCarpets } = useListProductsQuery({ category: 'carpets', limit: 1 });
  const { data: beddingData, isLoading: loadingBedding } = useListProductsQuery({ category: 'bedding', limit: 1 });
  const isLoading = loadingCarpets || loadingBedding;
  if (!isLoading && !carpetsData?.data?.length && !beddingData?.data?.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="grid md:grid-cols-2 gap-4">
        <CategoryBanner
          href="/products?category=carpets"
          category="carpets"
          productIndex={0}
          overlayClass="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"
          fallbackGradient="bg-earth-800"
          className="aspect-[16/9]"
        >
          <div className="absolute inset-0 flex flex-col justify-center p-8">
            <p className="text-earth-300 text-xs font-bold uppercase tracking-widest">New Collection</p>
            <h3 className="text-white font-black text-3xl mt-2 leading-tight">Premium<br />Carpets</h3>
            <p className="text-white/70 text-sm mt-2">Geometric, abstract &amp; art deco styles</p>
            <span className="mt-4 inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">Shop Carpets <ArrowRight className="h-4 w-4" /></span>
          </div>
        </CategoryBanner>
        <CategoryBanner
          href="/products?category=bedding"
          category="bedding"
          productIndex={0}
          overlayClass="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"
          fallbackGradient="bg-forest-800"
          className="aspect-[16/9]"
        >
          <div className="absolute inset-0 flex flex-col justify-center p-8">
            <p className="text-earth-300 text-xs font-bold uppercase tracking-widest">Bedroom Essentials</p>
            <h3 className="text-white font-black text-3xl mt-2 leading-tight">Bed Canopies<br />&amp; Nets</h3>
            <p className="text-white/70 text-sm mt-2">Princess, four-post &amp; ceiling styles</p>
            <span className="mt-4 inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">Shop Bedding <ArrowRight className="h-4 w-4" /></span>
          </div>
        </CategoryBanner>
      </div>
    </section>
  );
}

// ── Home Décor & Storage Section ───────────────────────────────────────────────

export function HomeDecorSection() {
  const { data: decorResponse, isLoading: decorLoading } = useListProductsQuery({ category: 'home-decor', limit: 4 }, { pollingInterval: 30_000 });
  const { data: storageResponse, isLoading: storageLoading } = useListProductsQuery({ category: 'storage', limit: 4 }, { pollingInterval: 30_000 });

  const products  = [...(decorResponse?.data ?? []), ...(storageResponse?.data ?? [])];
  const isLoading = decorLoading || storageLoading;

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Style Your Space</p>
          <h2 className="text-2xl font-black text-forest-900">Home Décor & Storage</h2>
        </div>
        <Link href="/products?category=home-decor" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 transition-colors">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
