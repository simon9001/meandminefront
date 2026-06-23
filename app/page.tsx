import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, Clock, MessageCircle, RotateCcw } from 'lucide-react';
import { HeroSection } from '@/components/hero/HeroSection';
import { CategoryBanner } from '@/components/home/CategoryBanner';
import {
  CategoriesSection,
  InStockSection,
  DealsSection,
  BestSellersSection,
  NewArrivalsSection,
  HomeDecorSection,
} from '@/components/home/HomeSections';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">

      {/* ── Hero: 3-column on desktop, full slideshow on mobile ── */}
      <HeroSection />

      {/* ── Trust strip ── */}
      <div className="text-white" style={{ backgroundColor: '#c47b2a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> Same-day dispatch — Nairobi orders before 12 PM</span>
            <span className="hidden md:flex items-center gap-2"><Clock className="h-4 w-4" /> Upcountry delivery 2–4 days</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Buyer protection on every order</span>
          </div>
        </div>
      </div>

      {/* ── In Stock Now — live from backend ── */}
      <InStockSection />

      {/* ── Deals & Offers — sale products with countdown ── */}
      <DealsSection />

      {/* ── Shop by Category — live from backend ── */}
      <CategoriesSection />

      {/* ── Best Sellers — live from backend ── */}
      <BestSellersSection />

      {/* ── New Arrivals — live from backend ── */}
      <NewArrivalsSection />

      {/* ── Appliances Spotlight ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-1">Hot Sellers</p>
            <h2 className="text-2xl font-black text-forest-900">Appliances & Dispensers</h2>
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

      {/* ── Carpets & Bedding Banner ── */}
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

      {/* ── Home Décor & Storage — live from backend ── */}
      <HomeDecorSection />

      {/* ── Why MeAndMine.shop ── */}
      <section className="mt-16 bg-white border-t border-b border-bark-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <ShieldCheck className="h-6 w-6 text-forest-700" />, title: 'Verified Suppliers',    sub: 'Every product sourced from vetted Kenyan suppliers' },
              { icon: <Truck className="h-6 w-6 text-forest-700" />,       title: 'Fast Delivery',         sub: 'Nairobi same-day · Nationwide 2–4 days' },
              { icon: <RotateCcw className="h-6 w-6 text-forest-700" />,   title: '7-Day Returns',         sub: 'Changed your mind? Easy, no-hassle returns.' },
              { icon: <MessageCircle className="h-6 w-6 text-forest-700" />, title: '24/7 WhatsApp Support', sub: 'Real humans, not bots. We reply fast.' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-forest-900 text-sm">{item.title}</p>
                  <p className="text-xs text-bark-500 mt-1 leading-relaxed">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pb-16" />
    </div>
  );
}
