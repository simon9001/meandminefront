'use client';
import Link from 'next/link';
import { ChevronRight, LayoutGrid, Layers, Utensils, Zap, Sparkles, Package, Wind } from 'lucide-react';
import { useListCategoriesQuery } from '@/lib/redux/api/productsApi';
import { HeroSlideshow } from './HeroSlideshow';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  carpets:       <LayoutGrid className="h-4 w-4" />,
  bedding:       <Layers className="h-4 w-4" />,
  kitchenware:   <Utensils className="h-4 w-4" />,
  appliances:    <Zap className="h-4 w-4" />,
  'home-decor':  <Sparkles className="h-4 w-4" />,
  storage:       <Package className="h-4 w-4" />,
  curtains:      <Wind className="h-4 w-4" />,
};

const FALLBACK_CATS = [
  { id: '1', slug: 'carpets',     name: 'Carpets' },
  { id: '2', slug: 'bedding',     name: 'Bedding & Canopies' },
  { id: '3', slug: 'kitchenware', name: 'Kitchenware' },
  { id: '4', slug: 'appliances',  name: 'Appliances' },
  { id: '5', slug: 'home-decor',  name: 'Home Décor' },
  { id: '6', slug: 'storage',     name: 'Storage & Shelves' },
  { id: '7', slug: 'curtains',    name: 'Curtains' },
];

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function HeroSection() {
  const { data: apiCats = [] } = useListCategoriesQuery();
  const cats = (apiCats.length ? apiCats : FALLBACK_CATS).slice(0, 7);

  return (
    <section className="bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

        {/* ── Mobile: full-width slideshow ── */}
        <div className="lg:hidden rounded-2xl overflow-hidden">
          <HeroSlideshow />
        </div>

        {/* ── Desktop: 3-column layout ── */}
        <div className="hidden lg:grid grid-cols-[210px_1fr_186px] gap-3 h-[320px]">

          {/* LEFT: Category sidebar */}
          <aside className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {cats.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`flex items-center gap-2.5 px-4 py-[9px] text-sm text-gray-700 hover:bg-gray-50 hover:text-forest-900 transition-colors group border-b border-gray-50 last:border-b-0 ${i === 0 ? 'bg-gray-50/70 text-forest-900' : ''}`}
              >
                <span className={`flex-shrink-0 transition-colors ${i === 0 ? 'text-forest-700' : 'text-gray-400 group-hover:text-forest-700'}`}>
                  {CATEGORY_ICONS[cat.slug] ?? <Package className="h-4 w-4" />}
                </span>
                <span className="truncate font-medium">{cat.name}</span>
              </Link>
            ))}
            <Link
              href="/products"
              className="flex items-center justify-between px-4 py-[9px] text-sm text-gray-500 hover:text-forest-900 hover:bg-gray-50 transition-colors mt-auto border-t border-gray-100"
            >
              <span>More categories</span>
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            </Link>
          </aside>

          {/* CENTER: Hero slideshow */}
          <div className="rounded-xl overflow-hidden">
            <HeroSlideshow wrapperClassName="h-full" />
          </div>

          {/* RIGHT: WhatsApp promo card */}
          <div className="rounded-xl bg-gradient-to-b from-forest-900 to-[#0c1a0e] p-5 flex flex-col overflow-hidden relative">
            {/* Subtle dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23ffffff'/%3E%3C/svg%3E")` }}
            />
            <div className="relative flex-1">
              <div className="h-9 w-9 rounded-lg bg-[#25D366]/20 flex items-center justify-center text-[#25D366] mb-3">
                <WhatsAppIcon />
              </div>
              <p className="text-earth-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">WhatsApp Deal</p>
              <h3 className="text-white font-black text-[15px] leading-snug">
                Order via WhatsApp &amp; get KES&nbsp;200&nbsp;off
              </h3>
              <p className="text-forest-300 text-xs mt-2 leading-relaxed">
                Send us your order on WhatsApp and enjoy an exclusive discount on your first purchase.
              </p>
            </div>
            <a
              href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-4 block text-center py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-bold hover:bg-[#20b358] transition-colors shadow-lg shadow-green-900/30"
            >
              Get offer
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
