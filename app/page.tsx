import { Truck, ShieldCheck, Clock, MessageCircle, RotateCcw } from 'lucide-react';
import { HeroSection } from '@/components/hero/HeroSection';
import {
  CategoriesSection,
  InStockSection,
  DealsSection,
  BestSellersSection,
  NewArrivalsSection,
  HomeDecorSection,
  AppliancesSpotlightSection,
  CarpetsBeddingSection,
} from '@/components/home/HomeSections';
import { Footer } from '@/components/layout/Footer';

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

      {/* ── Appliances Spotlight — hides when no products in backend ── */}
      <AppliancesSpotlightSection />

      {/* ── Carpets & Bedding — hides when no products in backend ── */}
      <CarpetsBeddingSection />

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

      <Footer />
    </div>
  );
}
