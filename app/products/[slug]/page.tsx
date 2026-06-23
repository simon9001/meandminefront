import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Check, Package, Truck, ShieldCheck } from 'lucide-react';
import { PRODUCTS, staticToProduct } from '@/lib/static-products';
import { getReviews } from '@/lib/mock-reviews';
import { AddToCartSection } from '@/components/product/AddToCartSection';
import { ProductCard } from '@/components/product/ProductCard';
import { ShareButtons } from '@/components/product/ShareButtons';
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

function descriptionToFeatures(description: string): string[] {
  return description.split(/[.。]/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveProduct(slug);
  if (!resolved) notFound();

  const { product, isStatic } = resolved;

  const showSale = !!(product.showSalePrice && product.salePrice && product.salePrice < product.basePrice);
  const discount = showSale ? Math.round((1 - product.salePrice! / product.basePrice) * 100) : 0;
  const badge         = product.isNewArrival ? 'new' : product.isBestSeller ? 'bestseller' : null;
  const categoryName  = product.category?.name ?? '';
  const categorySlug  = product.category?.slug ?? categoryName.toLowerCase().replace(/\s+/g, '-');
  const categoryHref  = `/products?category=${categorySlug}`;
  const description   = product.shortDescription ?? product.fullDescription ?? '';
  const features      = description ? descriptionToFeatures(description) : [];

  // Reviews: mock for static products, real API data for DB products
  const apiReviews = isStatic ? [] : await fetchReviews(product.id);
  const reviews    = isStatic ? getReviews(product.id) : apiReviews;

  // Related: static only; for live products this could be extended to API later
  const staticEntry = PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  const related = staticEntry
    ? PRODUCTS
        .filter((p) => p.category === staticEntry.category && p.id !== staticEntry.id)
        .slice(0, 4)
        .map(staticToProduct)
    : [];

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

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
        {/* Left — Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-50 border border-bark-100">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-bark-200"><Package className="h-16 w-16" /></div>
          )}
          {badge === 'bestseller' && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-earth-600 text-white text-xs font-bold">Best Seller</span>
          )}
          {badge === 'new' && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-forest-600 text-white text-xs font-bold">New Arrival</span>
          )}
          {discount >= 5 && (
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">-{discount}%</span>
          )}
        </div>

        {/* Right — Details */}
        <div className="flex flex-col gap-5">
          {categoryName && (
            <Link
              href={categoryHref}
              className="self-start px-3 py-1 rounded-full border border-earth-300 text-earth-700 text-[11px] font-bold uppercase tracking-widest hover:bg-earth-50 transition-colors"
            >
              {categoryName}
            </Link>
          )}

          <h1 className="text-3xl font-black text-forest-900 leading-tight">{product.name}</h1>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-2">
              <StarRow rating={product.averageRating} />
              <span className="text-sm font-bold text-forest-900">{product.averageRating.toFixed(1)}</span>
              {product.reviewCount > 0 && (
                <span className="text-sm text-bark-500">({product.reviewCount} reviews)</span>
              )}
            </div>
          )}

          {description && (
            <p className="text-bark-600 text-sm leading-relaxed">{description}</p>
          )}

          {features.length > 0 && (
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-bark-700">
                  <Check className="h-4 w-4 text-forest-600 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <AddToCartSection product={{
            id:            product.id,
            name:          product.name,
            basePrice:     product.basePrice,
            salePrice:     product.salePrice,
            showSalePrice: product.showSalePrice,
            status:        product.status,
          }} />

          <div className="pt-1 border-t border-bark-100">
            <ShareButtons productName={product.name} slug={product.slug} />
          </div>
        </div>
      </div>

      {/* Product details section */}
      <div className="mt-16 pt-8 border-t border-bark-100">
        <h2 className="text-xl font-black text-forest-900 mb-6">Product Details</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryName && (
            <div className="p-4 rounded-2xl bg-cream-50 border border-bark-100 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-earth-600">Category</p>
              <p className="text-sm font-semibold text-forest-900">{categoryName}</p>
            </div>
          )}
          <div className="p-4 rounded-2xl bg-cream-50 border border-bark-100 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-earth-600">Stock Status</p>
            <p className={`text-sm font-semibold flex items-center gap-1.5 ${product.status === 'out_of_stock' ? 'text-red-600' : 'text-green-700'}`}>
              <span className={`h-1.5 w-1.5 rounded-full inline-block ${product.status === 'out_of_stock' ? 'bg-red-500' : 'bg-green-500'}`} />
              {product.status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
            <Package className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-900">Free Nairobi Delivery</p>
              <p className="text-xs text-green-700 mt-0.5">On orders over KES 3,000</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-forest-50 border border-forest-100">
            <Truck className="h-5 w-5 text-forest-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-forest-900">Nationwide Shipping</p>
              <p className="text-xs text-forest-700 mt-0.5">2–4 business days upcountry</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-earth-50 border border-earth-100">
            <ShieldCheck className="h-5 w-5 text-earth-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-earth-900">Quality Guaranteed</p>
              <p className="text-xs text-earth-700 mt-0.5">7-day returns accepted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section */}
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
              /* Mock reviews (static products) */
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
              /* Real reviews (DB products) */
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

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-bark-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-forest-900">More in {categoryName}</h2>
            <Link href={categoryHref} className="text-sm font-semibold text-forest-700 hover:text-forest-900 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
