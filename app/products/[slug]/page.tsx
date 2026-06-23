import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Check } from 'lucide-react';
import { PRODUCTS, staticToProduct } from '@/lib/static-products';
import { getReviews } from '@/lib/mock-reviews';
import { ProductInteractiveSection } from '@/components/product/ProductInteractiveSection';
import { YouMayAlsoLike } from '@/components/product/YouMayAlsoLike';
import type { Product } from '@/lib/types';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

interface ApiReview {
  id: string;
  rating: number;
  title?: string;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
  user_profiles?: { first_name: string; last_name: string } | null;
}

async function fetchReviews(productId: string): Promise<ApiReview[]> {
  try {
    const res = await fetch(`${API}/reviews/product/${productId}?limit=10`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []) as ApiReview[];
  } catch {
    return [];
  }
}

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as Product;
  } catch {
    return null;
  }
}

async function fetchRelated(categorySlug: string, excludeId: string): Promise<Product[]> {
  try {
    const res = await fetch(
      `${API}/products?category=${categorySlug}&limit=8&status=active`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items = (json.data ?? []) as Product[];
    return items.filter((p) => p.id !== excludeId).slice(0, 8);
  } catch {
    return [];
  }
}

async function resolveProduct(slug: string): Promise<{ product: Product; isStatic: boolean } | null> {
  const staticEntry = PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  if (staticEntry) return { product: staticToProduct(staticEntry), isStatic: true };

  const liveProduct = await fetchProduct(slug);
  if (liveProduct) return { product: liveProduct, isStatic: false };

  return null;
}

export async function generateStaticParams() {
  return PRODUCTS
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProduct(slug);
  if (!resolved) return { title: 'Product Not Found' };
  const { product } = resolved;

  const description = product.shortDescription ?? `Buy ${product.name} at the best price in Kenya. Fast delivery & M-Pesa accepted.`;
  const image = product.primaryImageUrl ?? '/og-image.jpg';
  const url = `https://meandmine.shop/products/${slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${product.name} | MeAndMine.shop`,
      description,
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      siteName: 'MeAndMine.shop',
      locale: 'en_KE',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | MeAndMine.shop`,
      description,
      images: [image],
    },
  };
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-amber-400 text-lg leading-none select-none">
      {'★'.repeat(filled)}
      {'☆'.repeat(5 - filled)}
    </span>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveProduct(slug);
  if (!resolved) notFound();

  const { product, isStatic } = resolved;

  const showSale     = !!(product.showSalePrice && product.salePrice && product.salePrice < product.basePrice);
  const discount     = showSale ? Math.round((1 - product.salePrice! / product.basePrice) * 100) : 0;
  const badge        = product.isNewArrival ? 'new' : product.isBestSeller ? 'bestseller' : null;
  const categoryName = product.category?.name ?? '';
  const categorySlug = product.category?.slug ?? categoryName.toLowerCase().replace(/\s+/g, '-');
  const categoryHref = `/products?category=${categorySlug}`;
  const description  = product.shortDescription ?? product.fullDescription ?? '';

  // Reviews
  const apiReviews = isStatic ? [] : await fetchReviews(product.id);
  const reviews    = isStatic ? getReviews(product.id) : apiReviews;

  // Related products — static list or live API
  const staticEntry = PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  const related: Product[] = staticEntry
    ? PRODUCTS
        .filter((p) => p.category === staticEntry.category && p.id !== staticEntry.id)
        .slice(0, 8)
        .map(staticToProduct)
    : (categorySlug ? await fetchRelated(categorySlug, product.id) : []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-bark-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-forest-900 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <Link href="/products" className="hover:text-forest-900 transition-colors">Products</Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        {categoryName && (
          <>
            <Link href={categoryHref} className="hover:text-forest-900 transition-colors">{categoryName}</Link>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          </>
        )}
        <span className="text-forest-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* ── Main grid: image gallery + product info (client component handles variants) ── */}
      <ProductInteractiveSection product={product} badge={badge} discount={discount} />

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <div className="mt-16 pt-8 border-t border-bark-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-forest-900">Customer Reviews</h2>
            {product.averageRating > 0 && product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <StarRow rating={product.averageRating} />
                <span className="text-sm font-bold text-forest-900">{product.averageRating.toFixed(1)} / 5</span>
                <span className="text-sm text-bark-500">({product.reviewCount})</span>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {isStatic
              ? (reviews as ReturnType<typeof getReviews>).map((review) => (
                  <div key={review.id} className="p-5 rounded-2xl border border-bark-100 bg-white space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-800 font-bold text-sm flex-shrink-0">
                        {review.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-forest-900">{review.author}</span>
                          {review.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">
                              <Check className="h-2.5 w-2.5" /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400 text-sm leading-none">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          <span className="text-[11px] text-bark-400">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-bark-700 leading-relaxed">{review.text}</p>
                  </div>
                ))
              : (reviews as ApiReview[]).map((review) => {
                  const profile  = review.user_profiles;
                  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Customer';
                  const initials = fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                  const date     = new Date(review.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
                  return (
                    <div key={review.id} className="p-5 rounded-2xl border border-bark-100 bg-white space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-800 font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-forest-900">{fullName}</span>
                            {review.is_verified_purchase && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">
                                <Check className="h-2.5 w-2.5" /> Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-amber-400 text-sm leading-none">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            <span className="text-[11px] text-bark-400">{date}</span>
                          </div>
                          {review.title && (
                            <p className="text-sm font-semibold text-forest-900 mt-1">{review.title}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-bark-700 leading-relaxed">{review.body}</p>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      {/* ── You may also like ── */}
      <YouMayAlsoLike products={related} categoryHref={categoryHref} />
    </div>
  );
}
