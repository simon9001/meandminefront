'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { useListProductsQuery, useListCategoriesQuery } from '@/lib/redux/api/productsApi';
import type { ProductFilters } from '@/lib/redux/api/productsApi';
import { SlidersHorizontal, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SORTS: { value: ProductFilters['sort'] | ''; label: string }[] = [
  { value: '',          label: 'Recommended' },
  { value: 'newest',   label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',   label: 'Top Rated' },
  { value: 'popular',  label: 'Most Popular' },
];

const PAGE_SIZE = 20;

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

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const search   = searchParams.get('search')   ?? '';
  const category = searchParams.get('category') ?? '';
  const sort     = (searchParams.get('sort') ?? '') as ProductFilters['sort'] | '';
  const page     = Number(searchParams.get('page') ?? 1);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.push(`/products?${p.toString()}`);
  }

  const { data: apiResponse, isLoading, isFetching, isError } = useListProductsQuery({
    page,
    limit: PAGE_SIZE,
    search:   search   || undefined,
    category: category || undefined,
    sort:     sort     || undefined,
  }, { pollingInterval: 30_000 });

  const { data: categories = [] } = useListCategoriesQuery(undefined, { pollingInterval: 30_000 });

  const products   = apiResponse?.data ?? [];
  const meta       = apiResponse?.meta;
  const totalCount = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const title = search
    ? `Search: "${search}"`
    : category
      ? (categories.find((c) => c.slug === category)?.name ?? category)
      : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-forest-900">{title}</h1>
          <p className="text-sm text-bark-500 mt-0.5">
            {isLoading ? 'Loading…' : `${totalCount} product${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-bark-200 rounded-xl bg-white text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-bark-400" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors',
              showFilters
                ? 'bg-forest-900 text-white border-forest-900'
                : 'bg-white text-bark-700 border-bark-200 hover:bg-forest-50'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Category chips — from backend */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setParam('category', '')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-colors',
            !category
              ? 'bg-forest-900 text-white'
              : 'bg-white border border-bark-200 text-bark-600 hover:bg-forest-50 hover:text-forest-800'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setParam('category', cat.slug)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-colors',
              category === cat.slug
                ? 'bg-forest-900 text-white'
                : 'bg-white border border-bark-200 text-bark-600 hover:bg-forest-50 hover:text-forest-800'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-bark-300" />
          <p className="text-lg font-semibold text-forest-900">Could not load products</p>
          <p className="text-bark-500 text-sm">Check your connection or try again.</p>
          <button
            onClick={() => router.refresh()}
            className="px-5 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton grid */}
      {isLoading && !isError && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Products grid */}
      {!isLoading && !isError && (
        products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-forest-900">No products found</p>
            <p className="text-bark-500 mt-1">Try adjusting your filters or search terms</p>
            <button
              onClick={() => router.push('/products')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={cn(
            'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 transition-opacity duration-200',
            isFetching ? 'opacity-60' : 'opacity-100'
          )}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      )}

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setParam('page', String(page - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-bark-200 text-sm font-medium disabled:opacity-40 hover:bg-forest-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-bark-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setParam('page', String(page + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl border border-bark-200 text-sm font-medium disabled:opacity-40 hover:bg-forest-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 bg-bark-100 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-bark-100 rounded w-24 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-white rounded-2xl border border-bark-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-bark-100" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-3 bg-bark-100 rounded w-16" />
                <div className="h-4 bg-bark-100 rounded w-full" />
                <div className="h-9 bg-bark-100 rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
