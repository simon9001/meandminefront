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
    <header className="sticky top-0 z-50">

      {/* ── Promo banner + dots — hidden for admin/superadmin; deferred until mounted ── */}
      {(!mounted || !isAdmin) && (
        <>
          <div className={cn('overflow-hidden transition-all duration-300 ease-in-out', scrolled ? 'max-h-0' : 'max-h-14')}>
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

      {/* ── Main navbar bar — dark wood; blurred glass when scrolled ── */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.97)',
          backdropFilter:       scrolled ? 'blur(16px) saturate(140%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(140%)' : 'none',
          boxShadow: scrolled
            ? '0 2px 16px rgba(0,0,0,0.12)'
            : '0 1px 0 rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.07)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          transition: 'box-shadow 0.35s ease',
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 mr-2">
              <Image
                src="/images/logoMaschonpo.png"
                alt="Maschon"
                width={60}
                height={40}
                className="h-9 sm:h-10 w-auto object-contain drop-shadow-md"
                priority
              />
              <span className="hidden sm:inline text-xl lg:text-2xl font-black tracking-tighter" style={{ transition: 'color 0.35s ease' }}>
                <span style={{ color: '#ff7c2a' }}>Ma</span>
                <span style={{ color: '#111111' }}>schon</span>
              </span>
            </Link>

            {/* Search — inset/recessed */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#888888' }} />
                <input
                  type="search"
                  placeholder="Search carpets, curtains, bedding, kitchenware…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="skeu-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-shrink-0">
              <a
                href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ color: '#333333', border: '1px solid rgba(0,0,0,0.12)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.color = '#ff7c2a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#333333'; }}
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>

              {/* Cart */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2.5 rounded-xl transition-all"
                style={{ background: 'transparent' }}
                aria-label="Open cart"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                <ShoppingCart className="h-5 w-5" style={{ color: '#ff7c2a' }} />
                {itemCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-white text-[9px] font-black"
                    style={{
                      background: 'linear-gradient(135deg, #e8503a, #c4351f)',
                      boxShadow: '0 1px 3px rgba(196,53,31,0.6)',
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {!mounted ? (
                <div className="h-9 w-9 rounded-xl animate-pulse" style={{ background: 'rgba(0,0,0,0.08)' }} />
              ) : user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 transition-all"
                    style={{
                      background: profileOpen ? 'rgba(0,0,0,0.08)' : '#f4f4f4',
                      border: '1px solid rgba(0,0,0,0.12)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      borderRadius: '999px',
                      padding: '4px 6px 4px 4px',
                    }}
                    onMouseEnter={(e) => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.07)'; }}
                    onMouseLeave={(e) => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = '#f4f4f4'; }}
                    aria-label="Profile menu"
                  >
                    <div
                      className="relative h-7 w-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-black flex-shrink-0 select-none"
                      style={{
                        background: 'linear-gradient(145deg, #111111, #333333)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                        color: '#fff',
                        textShadow: '0 1px 1px rgba(0,0,0,0.4)',
                      }}
                    >
                      {user.avatarUrl
                        ? <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" sizes="28px" />
                        : <span>{user.firstName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}</span>
                      }
                    </div>
                    <span className="hidden sm:block text-sm font-bold max-w-[80px] truncate pr-1" style={{ color: '#111111' }}>
                      {user.firstName}
                    </span>
                    <ChevronDown className={cn('hidden sm:block h-3.5 w-3.5 mr-1 transition-transform duration-200', profileOpen && 'rotate-180')} style={{ color: 'rgba(0,0,0,0.4)' }} />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-52 py-2 z-50 overflow-hidden"
                      style={{
                        background: 'linear-gradient(160deg, #fdf8f0 0%, #f0e8d8 100%)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 28px rgba(90,60,30,0.25), 0 2px 8px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(140,100,60,0.2)',
                        borderRadius: '14px',
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(140,100,60,0.12)', boxShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
                        <p className="font-black text-sm truncate" style={{ color: '#1a3828' }}>{user.firstName} {user.lastName}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#9c8068' }}>{user.email}</p>
                      </div>

                      <div className="py-1">
                        {[
                          { href: '/account',        label: 'My Profile', icon: User },
                          { href: '/account/orders', label: 'My Orders',  icon: Package },
                          ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: Settings }] : []),
                        ].map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                            style={{ color: '#5c4a38' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(45,115,80,0.08)'; (e.currentTarget as HTMLElement).style.color = '#1a3828'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#5c4a38'; }}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {label}
                          </Link>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px solid rgba(140,100,60,0.12)', boxShadow: '-0 -1px 0 rgba(255,255,255,0.6)' }} className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                          style={{ color: '#c4351f' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(196,53,31,0.06)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
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
                  className="flex items-center gap-1.5 text-sm font-bold rounded-full text-white transition-all"
                  style={{
                    background: 'linear-gradient(180deg, #2a2a2a 0%, #111111 55%, #000000 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.1) inset, 0 2px 6px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(0,0,0,0.3)',
                    padding: '7px 10px 7px 10px',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #3a3a3a 0%, #222 55%, #111 100%)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #2a2a2a 0%, #111111 55%, #000000 100%)'; }}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline pr-1">Sign In</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2.5 rounded-xl transition-all"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen
                  ? <X    className="h-5 w-5" style={{ color: '#ff7c2a' }} />
                  : <Menu className="h-5 w-5" style={{ color: '#ff7c2a' }} />
                }
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* ── Category bar — visible at top, hides on scroll ── */}
      {(!mounted || !isAdmin) && (
        <div
          className={cn('hidden md:block overflow-hidden transition-all duration-300 ease-in-out', scrolled ? 'max-h-0' : 'max-h-12')}
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-0.5 h-9 overflow-x-auto scrollbar-none">
              <Link
                href="/products"
                className="flex-shrink-0 px-4 py-1 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                style={{ color: '#ff7c2a' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,124,42,0.12)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                All
              </Link>
              <span style={{ color: 'rgba(0,0,0,0.15)' }} className="mx-1">|</span>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="flex-shrink-0 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg whitespace-nowrap"
                  style={{ color: 'rgba(0,0,0,0.6)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,124,42,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ff7c2a'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.6)'; }}
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
        <div
          className="md:hidden py-4 px-4 space-y-4"
          style={{
            background: 'linear-gradient(180deg, #3a2418, #2e1c10)',
            borderBottom: '2px solid rgba(0,0,0,0.4)',
          }}
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9c8068' }} />
              <input
                type="search"
                placeholder="Search products…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="skeu-input w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
              />
            </div>
            <button type="submit" className="skeu-btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white">
              Go
            </button>
          </form>

          <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="text-center py-3 px-1 text-[11px] font-semibold rounded-xl transition-all leading-tight"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex gap-2">
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-bold rounded-xl skeu-btn-secondary"
            >
              All Products
            </Link>
            <a
              href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl"
              style={{
                background: 'linear-gradient(180deg, #2ecc71, #25D366, #1da851)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 3px 8px rgba(37,211,102,0.4)',
                border: '1px solid rgba(0,0,0,0.15)',
              }}
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          </div>

          {mounted && user ? (
            <div className="pt-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 px-2 py-2 mb-1">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(145deg, #111111, #333333)', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
                >
                  {user.firstName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#ffffff' }}>{user.firstName} {user.lastName}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.email}</p>
                </div>
              </div>
              {[
                { href: '/account',        label: 'My Profile', icon: User },
                { href: '/account/orders', label: 'My Orders',  icon: Package },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all"
                  style={{ color: 'rgba(255,255,255,0.85)', border: '1px solid transparent' }}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all"
                style={{ color: 'rgba(220,120,100,0.9)' }}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="skeu-btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm font-black text-white rounded-xl"
            >
              <User className="h-4 w-4" /> Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
