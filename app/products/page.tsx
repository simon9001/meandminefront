'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal, ChevronDown, AlertCircle, ArrowRight, Package,
  LayoutGrid, Layers, Utensils, Zap, Sparkles, Wind, Star,
} from 'lucide-react';
import { useListProductsQuery, useListCategoriesQuery } from '@/lib/redux/api/productsApi';
import type { ProductFilters } from '@/lib/redux/api/productsApi';
import { ProductCard } from '@/components/product/ProductCard';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';

// ── Category visual config ────────────────────────────────────────────────────

const CAT_CFG: Record<string, { icon: React.ReactNode; gradient: string; iconColor: string }> = {
  carpets:       { icon: <LayoutGrid className="h-7 w-7" />, gradient: 'from-forest-50 to-forest-100', iconColor: 'text-forest-700' },
  bedding:       { icon: <Layers className="h-7 w-7" />,     gradient: 'from-cream-50 to-cream-100',   iconColor: 'text-forest-600' },
  kitchenware:   { icon: <Utensils className="h-7 w-7" />,   gradient: 'from-earth-50 to-earth-100',   iconColor: 'text-earth-600'  },
  appliances:    { icon: <Zap className="h-7 w-7" />,        gradient: 'from-forest-50 to-earth-50',   iconColor: 'text-forest-700' },
  'home-decor':  { icon: <Sparkles className="h-7 w-7" />,   gradient: 'from-earth-50 to-cream-100',   iconColor: 'text-earth-500'  },
  storage:       { icon: <Package className="h-7 w-7" />,    gradient: 'from-bark-100 to-cream-100',   iconColor: 'text-bark-600'   },
  curtains:      { icon: <Wind className="h-7 w-7" />,       gradient: 'from-cream-50 to-forest-50',   iconColor: 'text-forest-600' },
};
const DEFAULT_CFG = { icon: <Package className="h-7 w-7" />, gradient: 'from-bark-100 to-cream-100', iconColor: 'text-bark-500' };

// ── Shared skeletons ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-[14px] border border-bark-100 overflow-hidden animate-pulse"
      style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5ece0 60%, #ede4d0 100%)' }}>
      {/* mirrors ProductCard's paddingTop: 75% image frame */}
      <div className="relative w-full flex-shrink-0" style={{ paddingTop: '75%' }}>
        <div className="absolute inset-0 bg-bark-100" />
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2 bg-bark-100 rounded w-14" />
        <div className="h-3.5 bg-bark-100 rounded w-full" />
        <div className="h-3.5 bg-bark-100 rounded w-3/4" />
        <div className="h-5 bg-bark-100 rounded w-20 mt-1.5" />
        <div className="h-9 bg-bark-100 rounded-xl mt-1" />
      </div>
    </div>
  );
}

function MiniSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2.5 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-gray-100 rounded w-full" />
        <div className="h-2 bg-gray-100 rounded w-10" />
        <div className="h-2.5 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-[52px] w-[52px] bg-gray-100 rounded-lg flex-shrink-0" />
    </div>
  );
}

// ── Mini product card (used inside category blocks) ───────────────────────────

function MiniProductCard({ product }: { product: Product }) {
  const price = product.salePrice && product.salePrice < product.basePrice
    ? product.salePrice
    : product.basePrice;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream-50 border border-transparent hover:border-bark-100 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-bark-700 line-clamp-2 leading-tight group-hover:text-forest-900 transition-colors">
          {product.name}
        </p>
        <p className="text-[10px] text-bark-400 mt-0.5">From</p>
        <p className="text-xs font-bold text-forest-800">{formatPrice(price)}</p>
      </div>
      <div className="relative h-[52px] w-[52px] flex-shrink-0 rounded-lg overflow-hidden bg-cream-50 border border-bark-100">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="52px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-5 w-5 text-bark-200" />
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Category block: banner + 4×2 mini product grid ───────────────────────────

function CategoryBlock({ cat }: { cat: { id: string; name: string; slug: string; imageUrl?: string } }) {
  const { data, isLoading } = useListProductsQuery(
    { category: cat.slug, limit: 8, sort: 'popular' },
    { pollingInterval: 60_000 },
  );
  const products = data?.data ?? [];
  const cfg      = CAT_CFG[cat.slug] ?? DEFAULT_CFG;

  if (!isLoading && products.length === 0) return null;

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-2xl border border-bark-100 overflow-hidden shadow-sm">
      {/* Category banner */}
      <div className={`md:w-[190px] flex-shrink-0 bg-gradient-to-br ${cfg.gradient} p-5 flex flex-col justify-between relative overflow-hidden min-h-[160px] md:min-h-[200px]`}>
        {cat.imageUrl && (
          <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover opacity-20" sizes="190px" />
        )}
        <div className="relative z-10">
          <div className={`mb-3 ${cfg.iconColor}`}>{cfg.icon}</div>
          <h3 className="font-black text-forest-900 text-base leading-tight">{cat.name}</h3>
        </div>
        <Link
          href={`/products?category=${cat.slug}`}
          className="relative z-10 inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-600 bg-white/80 hover:bg-white transition-colors rounded-lg px-3 py-1.5 w-fit mt-4 border border-bark-100"
        >
          Explore all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 4×2 product mini-grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-bark-50">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <MiniSkeleton key={i} />)
          : products.slice(0, 8).map((p) => <MiniProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

// ── Recommended items ─────────────────────────────────────────────────────────

function RecommendedSection() {
  const { data, isLoading } = useListProductsQuery({ sort: 'rating', limit: 5 }, { pollingInterval: 60_000 });
  const products = data?.data ?? [];
  if (!isLoading && products.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-5">
        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
        <h2 className="text-xl font-black text-gray-900">Recommended items</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

// ── Discovery view (no filter active) ────────────────────────────────────────

function DiscoveryView() {
  const { data: categories = [], isLoading: catsLoading } = useListCategoriesQuery(undefined, { pollingInterval: 60_000 });

  return (
    <div className="space-y-4">
      {catsLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))
        : categories.map((cat) => <CategoryBlock key={cat.id} cat={cat} />)}
      <RecommendedSection />
    </div>
  );
}

// ── Browse view (filter / search active) ─────────────────────────────────────

const SORTS: { value: ProductFilters['sort'] | ''; label: string }[] = [
  { value: '',           label: 'Recommended'       },
  { value: 'newest',    label: 'Newest'             },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'rating',    label: 'Top Rated'          },
  { value: 'popular',   label: 'Most Popular'       },
];

const PAGE_SIZE = 20;

function BrowseView({
  search, category, sort, page,
  setParam,
}: {
  search: string; category: string; sort: ProductFilters['sort'] | ''; page: number;
  setParam: (key: string, value: string) => void;
}) {
  const router = useRouter();
  const { data: apiResponse, isLoading, isFetching, isError } = useListProductsQuery({
    page,
    limit: PAGE_SIZE,
    search:   search   || undefined,
    category: category || undefined,
    sort:     sort     || undefined,
  }, { pollingInterval: 30_000 });

  const products   = apiResponse?.data ?? [];
  const meta       = apiResponse?.meta;
  const totalCount = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  if (isError) return (
    <div className="flex flex-col items-center py-20 gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-bark-300" />
      <p className="text-lg font-semibold text-forest-900">Could not load products</p>
      <p className="text-bark-500 text-sm">Check your connection or try again.</p>
      <button onClick={() => router.refresh()}
        className="px-5 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors">
        Retry
      </button>
    </div>
  );

  return (
    <>
      <p className="text-sm text-bark-500 mb-6">
        {isLoading ? 'Loading…' : `${totalCount} product${totalCount !== 1 ? 's' : ''}`}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-semibold text-forest-900">No products found</p>
          <p className="text-bark-500 mt-1">Try adjusting your filters or search terms</p>
          <button onClick={() => router.push('/products')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={cn(
          'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 transition-opacity duration-200',
          isFetching ? 'opacity-60' : 'opacity-100',
        )}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-bark-200 text-sm font-medium disabled:opacity-40 hover:bg-forest-50 transition-colors">
            ← Previous
          </button>
          <span className="text-sm text-bark-600">Page {page} of {totalPages}</span>
          <button onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl border border-bark-200 text-sm font-medium disabled:opacity-40 hover:bg-forest-50 transition-colors">
            Next →
          </button>
        </div>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ProductsPageContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const search   = searchParams.get('search')   ?? '';
  const category = searchParams.get('category') ?? '';
  const sort     = (searchParams.get('sort') ?? '') as ProductFilters['sort'] | '';
  const page     = Number(searchParams.get('page') ?? 1);

  const { data: categories = [] } = useListCategoriesQuery(undefined, { pollingInterval: 30_000 });

  const isFiltered = !!(search || category || sort);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.push(`/products?${p.toString()}`);
  }

  const catName = categories.find((c) => c.slug === category)?.name ?? category;
  const title   = search ? `Search: "${search}"` : category ? catName : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-forest-900">{title}</h1>

        {isFiltered && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-bark-200 rounded-xl bg-white text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-bark-400" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors',
                showFilters ? 'bg-forest-900 text-white border-forest-900' : 'bg-white text-bark-700 border-bark-200 hover:bg-forest-50',
              )}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        )}
      </div>

      {/* Category filter chips — horizontal scroll on mobile, wrap on sm+ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setParam('category', '')}
          className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors',
            !category ? 'bg-forest-900 text-white' : 'bg-white border border-bark-200 text-bark-600 hover:bg-forest-50 hover:text-forest-800')}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat.slug} onClick={() => setParam('category', cat.slug)}
            className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors',
              category === cat.slug ? 'bg-forest-900 text-white' : 'bg-white border border-bark-200 text-bark-600 hover:bg-forest-50 hover:text-forest-800')}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {isFiltered
        ? <BrowseView search={search} category={category} sort={sort} page={page} setParam={setParam} />
        : <DiscoveryView />
      }
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[200px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
        ))}
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
