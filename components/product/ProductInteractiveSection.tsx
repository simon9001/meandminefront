'use client';
import { useState, useMemo } from 'react';
import { ImageGallery } from './ImageGallery';
import { AddToCartSection } from './AddToCartSection';
import { ShareButtons } from './ShareButtons';
import type { Product, ProductVariant } from '@/lib/types';

interface Props {
  product:  Product;
  badge:    'new' | 'bestseller' | null;
  discount: number;
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-amber-400 text-lg leading-none select-none">
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  );
}

export function ProductInteractiveSection({ product, badge, discount }: Props) {
  const colorVariants = useMemo(
    () => (product.variants ?? []).filter((v) => 'color' in v.options),
    [product.variants]
  );
  const sizeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => 'size' in v.options),
    [product.variants]
  );

  const [selectedColor, setSelectedColor] = useState<ProductVariant | null>(
    colorVariants.length > 0 ? colorVariants[0] : null
  );
  const [selectedSize, setSelectedSize] = useState<ProductVariant | null>(null);

  // Size images take priority → color images → general images
  const filteredMedia = useMemo(() => {
    const allMedia = product.media ?? [];
    if (selectedSize) {
      const sizeMedia = allMedia.filter((m) => m.variantId === selectedSize.id);
      if (sizeMedia.length > 0) return sizeMedia;
    }
    if (selectedColor && colorVariants.length > 0) {
      const colorMedia = allMedia.filter((m) => m.variantId === selectedColor.id);
      if (colorMedia.length > 0) return colorMedia;
    }
    return allMedia;
  }, [selectedColor, selectedSize, colorVariants.length, product.media]);

  // The effective base (respects sale price) + size addition
  const basePrice = useMemo(() =>
    product.salePrice && product.showSalePrice && product.salePrice < product.basePrice
      ? product.salePrice
      : product.basePrice,
  [product.basePrice, product.salePrice, product.showSalePrice]);

  const effectivePrice = useMemo(
    () => basePrice + (selectedSize?.additionalPrice ?? 0),
    [basePrice, selectedSize],
  );

  const cartVariantId  = selectedSize?.id ?? selectedColor?.id;
  const categoryName   = product.category?.name ?? '';
  const categorySlug   = product.category?.slug ?? categoryName.toLowerCase().replace(/\s+/g, '-');
  const categoryHref   = `/products?category=${categorySlug}`;
  const description    = product.shortDescription ?? product.fullDescription ?? '';

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

      {/* ── Left: image gallery ── */}
      <ImageGallery
        primaryImageUrl={product.primaryImageUrl}
        media={filteredMedia}
        productName={product.name}
        badge={badge}
        discount={discount}
      />

      {/* ── Right: product info card ── */}
      <div
        className="flex flex-col rounded-3xl p-6 lg:p-8 gap-0"
        style={{
          background: 'linear-gradient(160deg, #fdfaf5 0%, #f7f1e8 100%)',
          border: '1px solid rgba(196,123,42,0.12)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}
      >
        {/* Category badge */}
        {categoryName && (
          <a
            href={categoryHref}
            className="self-start mb-3 px-3 py-1 rounded-full border border-earth-300 text-earth-700 text-[10px] font-bold uppercase tracking-widest hover:bg-earth-50 transition-colors"
          >
            {categoryName}
          </a>
        )}

        {/* Title */}
        <h1 className="text-2xl lg:text-3xl font-black text-forest-900 leading-tight mb-3">
          {product.name}
        </h1>

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <StarRow rating={product.averageRating} />
            <span className="text-sm font-bold text-forest-900">{product.averageRating.toFixed(1)}</span>
            {product.reviewCount > 0 && (
              <span className="text-sm text-bark-500">({product.reviewCount} reviews)</span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-bark-500 text-sm leading-relaxed mb-4">{description}</p>
        )}

        <div className="border-t border-bark-100 my-1" />

        {/* ── Color selector ── */}
        {colorVariants.length > 0 && (
          <div className="mt-4 mb-1">
            <p className="text-xs font-bold text-bark-500 uppercase tracking-wider mb-2.5">
              Color — <span className="text-forest-900 normal-case font-semibold tracking-normal">{selectedColor?.options.color ?? ''}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colorVariants.map((cv) => (
                <button
                  key={cv.id}
                  type="button"
                  title={cv.options.color}
                  onClick={() => setSelectedColor(cv)}
                  className="relative h-9 w-9 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: cv.options.colorHex ?? cv.options.color,
                    borderColor: selectedColor?.id === cv.id ? '#2d5016' : 'rgba(0,0,0,0.12)',
                    boxShadow: selectedColor?.id === cv.id
                      ? '0 0 0 3px rgba(45,80,22,0.2)'
                      : '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Size selector ── */}
        {sizeVariants.length > 0 && (
          <div className="mt-4 mb-1">
            <p className="text-xs font-bold text-bark-500 uppercase tracking-wider mb-2.5">Size</p>
            <div className="flex flex-wrap gap-2">
              {sizeVariants.map((sv) => {
                const isSelected = selectedSize?.id === sv.id;
                return (
                  <button
                    key={sv.id}
                    type="button"
                    onClick={() => setSelectedSize(isSelected ? null : sv)}
                    className="flex flex-col items-center px-4 py-2 rounded-xl border-2 text-sm transition-all"
                    style={{
                      borderColor: isSelected ? '#2d5016' : 'rgba(0,0,0,0.10)',
                      background:  isSelected ? '#f0f7e8' : 'rgba(255,255,255,0.7)',
                      color:       isSelected ? '#2d5016' : '#374151',
                      boxShadow:   isSelected ? '0 0 0 2px rgba(45,80,22,0.15)' : 'none',
                    }}
                  >
                    <span className="font-semibold">{sv.options.size}</span>
                    <span className="text-[10px] opacity-60 mt-0.5">
                      KES {(basePrice + sv.additionalPrice).toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Add to cart (price + stock + qty + buttons) ── */}
        <div className="mt-5">
          <AddToCartSection
            product={{
              id:            product.id,
              name:          product.name,
              basePrice:     effectivePrice,
              salePrice:     undefined,
              showSalePrice: false,
              status:        product.status,
            }}
            variantId={cartVariantId}
          />
        </div>

        {/* Share */}
        <div className="mt-5 pt-4 border-t border-bark-100">
          <ShareButtons productName={product.name} slug={product.slug} />
        </div>
      </div>
    </div>
  );
}
