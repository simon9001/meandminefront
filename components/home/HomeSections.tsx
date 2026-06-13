'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useListProductsQuery, useListCategoriesQuery } from '@/lib/redux/api/productsApi';
import { ProductCard } from '@/components/product/ProductCard';

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

// ── Static fallbacks for category display ─────────────────────────────────────

const CATEGORY_IMAGES: Record<string, string> = {
  carpets:      '/images/carpet-abstract-beige.jpeg',
  bedding:      '/images/canopy-princess-purple.jpeg',
  kitchenware:  '/images/cooking-pots.jpeg',
  appliances:   '/images/washing-machine-hisense.jpeg',
  'home-decor': '/images/cushion-tribal-black-white.jpeg',
  storage:      '/images/wardrobe-fabric-maroon.jpeg',
  curtains:     '/images/carpet-geometric-green.jpeg',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  carpets:      '🪴',
  bedding:      '🛏️',
  kitchenware:  '🍳',
  appliances:   '⚡',
  'home-decor': '🏺',
  storage:      '📦',
  curtains:     '🪟',
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
              const img   = cat.imageUrl ?? CATEGORY_IMAGES[cat.slug];
              const emoji = CATEGORY_EMOJIS[cat.slug] ?? '🛍️';
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl bg-white border border-bark-100 hover:border-forest-300 hover:bg-forest-50 transition-all text-center shadow-sm hover:shadow-md"
                >
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                    {img ? (
                      <Image src={img} alt={cat.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-forest-50">
                        {emoji}
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
                className="group flex flex-col bg-white rounded-2xl border border-bark-100 hover:border-forest-200 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-cream-50">
                  {item.primaryImageUrl ? (
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-bark-200">🛍️</div>
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
                    KES {((item.showSalePrice && item.salePrice) ? item.salePrice : item.basePrice).toLocaleString()}
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
