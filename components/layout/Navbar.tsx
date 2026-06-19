'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, User, ShoppingCart, LogOut, Settings, Package, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { useGetCartQuery } from '@/lib/redux/api/cartApi';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsAdmin, clearCredentials } from '@/lib/redux/slices/authSlice';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { useListPromotionsQuery } from '@/lib/redux/api/promotionsApi';
import { useListCategoriesQuery } from '@/lib/redux/api/productsApi';

const FALLBACK_CATEGORIES = [
  { name: 'Carpets',     slug: 'carpets' },
  { name: 'Curtains',    slug: 'curtains' },
  { name: 'Bedding',     slug: 'bedding' },
  { name: 'Kitchenware', slug: 'kitchenware' },
  { name: 'Home Décor',  slug: 'home-decor' },
  { name: 'Appliances',  slug: 'appliances' },
  { name: 'Storage',     slug: 'storage' },
];

const STATIC_PROMO_SLIDES = [
  {
    id: '1',
    bg: 'bg-[#0b7a8a]',
    tags: ['Redberry', 'Mika', 'Rashnik', 'Selven'],
    label: 'Kitchenware Deals',
    offer: 'UP TO 40% OFF',
    offerStyle: 'bg-white text-[#0b7a8a]',
    cta: 'SHOP NOW',
    ctaStyle: 'bg-[#f5c518] text-black',
    href: '/products?category=kitchenware',
  },
  {
    id: '2',
    bg: 'bg-forest-900',
    tags: ['Carpets', 'Canopies', 'Curtains', 'Cushions'],
    label: 'Home Textiles',
    offer: 'FROM KES 980',
    offerStyle: 'bg-white text-forest-900',
    cta: 'SHOP NOW',
    ctaStyle: 'bg-earth-500 text-white',
    href: '/products?category=carpets',
  },
  {
    id: '3',
    bg: 'bg-[#1a4fa0]',
    tags: ['Hisense', 'Ecomax', 'Syinix', 'Sonar'],
    label: 'Appliances Week',
    offer: 'UP TO 30% OFF',
    offerStyle: 'bg-white text-[#1a4fa0]',
    cta: 'SHOP NOW',
    ctaStyle: 'bg-[#f5c518] text-black',
    href: '/products?category=appliances',
  },
  {
    id: '4',
    bg: 'bg-earth-800',
    tags: ['Wardrobes', 'Shoe Racks', 'Drying Racks', 'Organizers'],
    label: 'Storage & Home',
    offer: 'PRICES FROM KES 450',
    offerStyle: 'bg-white text-earth-800',
    cta: 'SHOP NOW',
    ctaStyle: 'bg-[#f5c518] text-black',
    href: '/products?category=storage',
  },
  {
    id: '5',
    bg: 'bg-[#1a3828]',
    tags: ['Nairobi Same Day', 'Nationwide 2–4 Days', 'M-Pesa', 'Cash on Delivery'],
    label: 'Fast Delivery',
    offer: 'FREE DELIVERY KES 3,000+',
    offerStyle: 'bg-earth-400 text-white',
    cta: 'ORDER NOW',
    ctaStyle: 'bg-white text-forest-900',
    href: '/products',
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#25D366"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [scrolled, setScrolled]         = useState(false);
  const [promoIndex, setPromoIndex]     = useState(0);
  const [promoVisible, setPromoVisible] = useState(true);
  const [profileOpen, setProfileOpen]   = useState(false);
  // Prevent hydration mismatch: auth state from redux-persist is only available
  // on the client after rehydration. Render a neutral placeholder until mounted.
  const [mounted, setMounted]           = useState(false);
  const profileRef                      = useRef<HTMLDivElement>(null);
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const { openCart } = useCart();
  const { data: cart } = useGetCartQuery();
  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  // Redux auth state — updates instantly on login/logout anywhere in the app
  const user    = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => { setMounted(true); }, []);

  // Promo banners — fall back to static until API loads
  const { data: apiPromos = [] } = useListPromotionsQuery({ type: 'navbar_banner' });

  // Category nav — fall back to static list until API loads
  const { data: apiCategories = [] } = useListCategoriesQuery();
  const CATEGORIES = apiCategories.length > 0 ? apiCategories : FALLBACK_CATEGORIES;
  const PROMO_SLIDES = apiPromos.length > 0
    ? apiPromos.map((s) => ({
        id:         s.id,
        bg:         s.bgColor         ?? 'bg-forest-900',
        tags:       s.tags,
        label:      s.title,
        offer:      s.offerText       ?? '',
        offerStyle: s.offerBadgeStyle ?? 'bg-white text-forest-900',
        cta:        s.ctaText,
        ctaStyle:   s.ctaStyle        ?? 'bg-earth-500 text-white',
        href:       s.ctaUrl,
      }))
    : STATIC_PROMO_SLIDES;

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    try {
      await logoutMutation().unwrap();
    } catch {
      // If the server call fails, still clear locally
      dispatch(clearCredentials());
    }
    router.push('/');
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (PROMO_SLIDES.length <= 1) return;
    const timer = setInterval(() => {
      setPromoVisible(false);
      setTimeout(() => {
        setPromoIndex((i) => (i + 1) % PROMO_SLIDES.length);
        setPromoVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PROMO_SLIDES.length]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/products?search=${encodeURIComponent(searchQ.trim())}`);
  }

  const slide = PROMO_SLIDES[promoIndex % Math.max(PROMO_SLIDES.length, 1)];

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-shadow duration-200',
      scrolled ? 'shadow-md' : 'shadow-none'
    )}>

      {/* ── Promo banner + dots — hidden for admin/superadmin; deferred until mounted ── */}
      {(!mounted || !isAdmin) && (
        <>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              scrolled ? 'max-h-0' : 'max-h-14'
            )}
          >
            <Link
              href={slide.href}
              className={cn(
                'flex items-center gap-0 h-12 w-full transition-opacity duration-300',
                slide.bg,
                promoVisible ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* Left: label + brand tags */}
              <div className="flex items-center gap-3 px-4 flex-1 min-w-0 overflow-hidden">
                <span className="hidden sm:block text-white/60 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                  {slide.label}
                </span>
                <span className="hidden sm:block text-white/30 flex-shrink-0">|</span>
                <div className="flex items-center gap-2 overflow-hidden">
                  {slide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex-shrink-0 text-white font-bold text-xs sm:text-sm tracking-wide hidden sm:block"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Center: offer badge */}
              <div className="flex-shrink-0 px-4">
                <span className={cn(
                  'px-4 py-1 rounded-full font-black text-sm sm:text-base whitespace-nowrap',
                  slide.offerStyle
                )}>
                  {slide.offer}
                </span>
              </div>

              {/* Right: CTA */}
              <div className={cn(
                'flex-shrink-0 h-full flex items-center px-5 sm:px-8 font-black text-sm tracking-widest whitespace-nowrap',
                slide.ctaStyle
              )}>
                {slide.cta}
              </div>
            </Link>
          </div>

        </>
      )}

      {/* ── Main navbar bar ── */}
      <div className="bg-white border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 mr-2">
              <Image
                src="/images/logoMaschonpo.png"
                alt="Maschon"
                width={60}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
              <span className="text-2xl font-black tracking-tighter text-forest-900">Maschon</span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search carpets, curtains, bedding, kitchenware…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-forest-900 placeholder:text-bark-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent focus:bg-white transition"
                />
              </div>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              {/* WhatsApp shortcut */}
              <a
                href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 text-xs font-semibold text-bark-600 hover:text-forest-800 transition-colors"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Join our WhatsApp group
              </a>

              {/* Cart */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5 text-bark-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Auth — placeholder until client hydrates, then Sign In or avatar */}
              {!mounted ? (
                <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse" />
              ) : user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                    aria-label="Profile menu"
                  >
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-forest-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 select-none">
                      {user.avatarUrl
                        ? <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" sizes="32px" />
                        : <span>{user.firstName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}</span>
                      }
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-forest-900 max-w-[80px] truncate">
                      {user.firstName}
                    </span>
                    <ChevronDown className={cn('hidden sm:block h-3.5 w-3.5 text-bark-400 transition-transform duration-200', profileOpen && 'rotate-180')} />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-gray-100 shadow-lg py-2 z-50 overflow-hidden">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="font-bold text-forest-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-bark-400 truncate mt-0.5">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-bark-700 hover:bg-forest-50 hover:text-forest-800 transition-colors"
                        >
                          <User className="h-4 w-4 flex-shrink-0" />
                          My Profile
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-bark-700 hover:bg-forest-50 hover:text-forest-800 transition-colors"
                        >
                          <Package className="h-4 w-4 flex-shrink-0" />
                          My Orders
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-bark-700 hover:bg-forest-50 hover:text-forest-800 transition-colors"
                          >
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-50 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-forest-900 text-white hover:bg-forest-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-5 w-5 text-bark-600" /> : <Menu className="h-5 w-5 text-bark-600" />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* ── Category bar (desktop) — hidden for admin/superadmin; deferred until mounted ── */}
      {(!mounted || !isAdmin) && (
        <div className="hidden md:block bg-white border-b border-gray-100">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-0.5 h-10 overflow-x-auto scrollbar-none">
              <Link
                href="/products"
                className="flex-shrink-0 px-4 py-1.5 text-xs font-bold text-forest-800 uppercase tracking-wider hover:bg-forest-50 rounded-lg transition-colors"
              >
                All
              </Link>
              <span className="text-bark-200 mx-1">|</span>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-bark-600 uppercase tracking-wider hover:text-forest-800 hover:bg-forest-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark-400" />
              <input
                type="search"
                placeholder="Search products…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 bg-gray-50"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-forest-900 text-white rounded-xl text-sm font-medium">
              Go
            </button>
          </form>

          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="text-center py-2.5 px-1 text-[11px] font-medium text-bark-700 bg-gray-50 rounded-xl hover:bg-forest-50 hover:text-forest-800 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex gap-2">
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold text-forest-800 bg-forest-50 rounded-xl"
            >
              View All Products
            </Link>
            <a
              href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#25D366] rounded-xl"
            >
              <WhatsAppIcon className="h-4 w-4 text-white" />
              Join our WhatsApp group
            </a>
          </div>

          {/* Mobile auth links — deferred until mounted to avoid hydration mismatch */}
          {mounted && user ? (
            <div className="border-t border-gray-100 pt-3 space-y-1">
              <div className="flex items-center gap-3 px-2 py-2 mb-1">
                <div className="h-8 w-8 rounded-full bg-forest-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {user.firstName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-forest-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-bark-400 truncate">{user.email}</p>
                </div>
              </div>
              {[
                { href: '/account', label: 'My Profile', icon: User },
                { href: '/account/orders', label: 'My Orders', icon: Package },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-bark-700 hover:bg-forest-50 hover:text-forest-800 rounded-xl transition-colors">
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-white bg-forest-900 rounded-xl hover:bg-forest-700 transition-colors"
            >
              <User className="h-4 w-4" /> Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
