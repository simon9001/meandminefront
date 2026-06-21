import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { HeroSlideshow } from '@/components/hero/HeroSlideshow';
import { CategoryBanner } from '@/components/home/CategoryBanner';
import {
  CategoriesSection,
  InStockSection,
  BestSellersSection,
  NewArrivalsSection,
  HomeDecorSection,
} from '@/components/home/HomeSections';

function WhatsAppHeroIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">

      {/* ── Hero ── */}
      <section className="relative bg-forest-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="relative max-w-7xl mx-auto md:grid md:grid-cols-[1fr_420px] lg:grid-cols-[1fr_500px]">

          {/* LEFT: Copy + CTAs */}
          <div className="px-6 sm:px-8 lg:px-14 py-14 md:py-20 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-earth-600/20 border border-earth-500/30 text-earth-300 text-xs font-semibold uppercase tracking-widest mb-5 w-fit">
              <MapPin className="h-3.5 w-3.5" /> Nationwide Delivery · Kenya
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
              Your Home.<br />
              <span className="text-earth-400">Your Style.</span>
            </h1>
            <p className="text-base text-forest-200 mb-8 max-w-md leading-relaxed">
              Carpets, canopies, kitchenware, appliances & décor — sourced from trusted
              suppliers and delivered across Kenya.
            </p>
            <div className="flex flex-wrap gap-3 relative z-10">
              <Link
                href="/products"
                className="relative z-10 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-earth-600 text-white font-bold hover:bg-earth-500 transition-colors shadow-lg shadow-earth-900/40"
              >
                Shop Now <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold hover:bg-[#20b358] transition-colors shadow-lg shadow-green-900/30"
              >
                <WhatsAppHeroIcon />
                Order on WhatsApp
              </a>
            </div>
          </div>

          {/* RIGHT: Hero slideshow (desktop) */}
          <div className="hidden md:flex items-center justify-center p-6">
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <HeroSlideshow />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div className="text-white" style={{ backgroundColor: '#ff7c2a' }}>
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

      {/* ── Shop by Category — live from backend ── */}
      <CategoriesSection />

      {/* ── Best Sellers — live from backend ── */}
      <BestSellersSection />

      {/* ── M-Pesa / WhatsApp promo cards ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-forest-900 p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="text-4xl">📱</span>
              <h3 className="text-white font-black text-xl mt-3 leading-tight">Pay with M-Pesa.<br />Instant & Secure.</h3>
              <p className="text-forest-300 text-sm mt-2">Lipa na M-Pesa Paybill accepted at checkout. No card needed.</p>
            </div>
            <Link href="/products" className="mt-4 self-start inline-flex items-center gap-1.5 text-earth-400 font-semibold text-sm hover:text-earth-300 transition-colors">
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl bg-earth-50 border border-earth-200 p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="text-4xl">💬</span>
              <h3 className="text-forest-900 font-black text-xl mt-3 leading-tight">Prefer WhatsApp?<br />We&apos;ve got you.</h3>
              <p className="text-bark-600 text-sm mt-2">Chat directly, confirm your order, ask about bulk pricing or availability.</p>
            </div>
            <a
              href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20b358] transition-colors shadow-md shadow-green-900/20"
            >
              <WhatsAppHeroIcon />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

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

      {/* ── Why Maschon ── */}
      <section className="mt-16 bg-white border-t border-b border-bark-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { emoji: '🔒', title: 'Verified Suppliers',    sub: 'Every product sourced from vetted Kenyan suppliers' },
              { emoji: '🚚', title: 'Fast Delivery',         sub: 'Nairobi same-day · Nationwide 2–4 days' },
              { emoji: '↩️', title: '7-Day Returns',         sub: 'Changed your mind? Easy, no-hassle returns.' },
              { emoji: '💬', title: '24/7 WhatsApp Support', sub: 'Real humans, not bots. We reply fast.' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-2xl">
                  {item.emoji}
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
