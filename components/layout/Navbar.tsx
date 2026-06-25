'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, User, ShoppingCart, LogOut, Settings, Package, ChevronDown, Home, Heart, LayoutGrid } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className={className} aria-hidden="true">
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
  const [mounted, setMounted]           = useState(false);
  const profileRef                      = useRef<HTMLDivElement>(null);
  const router    = useRouter();
  const pathname  = usePathname();
  const dispatch  = useAppDispatch();
  const { openCart } = useCart();

  const user    = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const [logoutMutation] = useLogoutMutation();

  const { data: cart } = useGetCartQuery(undefined, { skip: !mounted || !user });
  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const { data: apiPromos = [] } = useListPromotionsQuery({ type: 'navbar_banner' });
  const PROMO_SLIDES = apiPromos.map((s) => ({
    id: s.id, bg: s.bgColor ?? 'bg-gray-900',
    label: s.title, offer: s.offerText ?? '', offerStyle: s.offerBadgeStyle ?? 'bg-white text-gray-900',
    cta: s.ctaText, ctaStyle: s.ctaStyle ?? 'bg-gray-700 text-white', href: s.ctaUrl, tags: s.tags,
  }));

  const { data: apiCategories = [] } = useListCategoriesQuery();
  const CATEGORIES = apiCategories.length > 0 ? apiCategories : FALLBACK_CATEGORIES;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    setMenuOpen(false);
    try { await logoutMutation().unwrap(); } catch { dispatch(clearCredentials()); }
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
      setTimeout(() => { setPromoIndex((i) => (i + 1) % PROMO_SLIDES.length); setPromoVisible(true); }, 350);
    }, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PROMO_SLIDES.length]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) { router.push(`/products?search=${encodeURIComponent(searchQ.trim())}`); setMenuOpen(false); }
  }

  const showPromo = mounted && !isAdmin && PROMO_SLIDES.length > 0;
  const slide     = PROMO_SLIDES[promoIndex % Math.max(PROMO_SLIDES.length, 1)];

  return (
    <>
      <header className="sticky top-0 z-40">

        {/* Promo banner */}
        {showPromo && slide && (
          <div className={cn('overflow-hidden transition-all duration-300', scrolled ? 'max-h-0' : 'max-h-14')}>
            <Link
              href={slide.href}
              className={cn('flex items-center h-12 w-full transition-opacity duration-300', slide.bg, promoVisible ? 'opacity-100' : 'opacity-0')}
            >
              <div className="flex items-center gap-3 px-4 flex-1 min-w-0 overflow-hidden">
                <span className="hidden sm:block text-white/60 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">{slide.label}</span>
                <span className="hidden sm:block text-white/20">|</span>
                {slide.tags.map((tag) => (
                  <span key={tag} className="flex-shrink-0 text-white font-semibold text-xs hidden sm:block">{tag}</span>
                ))}
              </div>
              <div className="flex-shrink-0 px-4">
                <span className={cn('px-4 py-1 rounded-full font-bold text-sm whitespace-nowrap', slide.offerStyle)}>{slide.offer}</span>
              </div>
              <div className={cn('flex-shrink-0 h-full flex items-center px-5 sm:px-8 font-semibold text-sm whitespace-nowrap', slide.ctaStyle)}>{slide.cta}</div>
            </Link>
          </div>
        )}

        {/* Main bar */}
        <div className={cn(
          'bg-white border-b border-gray-100 transition-shadow duration-300',
          scrolled && 'shadow-sm'
        )}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-16">

              {/* Logo */}
              <Link href="/" className="flex-shrink-0 flex items-center gap-1.5 mr-1 sm:mr-2">
                <Image
                  src="/images/logoMaschonpo.png"
                  alt="MeAndMine.shop"
                  width={60} height={40}
                  className="h-8 sm:h-9 w-auto object-contain"
                  priority
                />
                <span className="text-[13px] sm:text-xl font-black tracking-tighter">
                  <span style={{ color: '#c47b2a' }}>MeAnd</span>
                  <span className="text-gray-900">Mine.shop</span>
                </span>
              </Link>

              {/* Desktop search */}
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Search carpets, curtains, bedding, kitchenware…"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-gray-400 transition-colors"
                  />
                </div>
              </form>

              {/* Right icons */}
              <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">

                {/* WhatsApp — desktop only */}
                <a
                  href="https://wa.me/254757568845"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>

                {/* Cart */}
                <button
                  type="button"
                  onClick={openCart}
                  className="relative p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  aria-label="Open cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>

                {/* Auth */}
                {!mounted ? (
                  <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
                ) : user ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={cn(
                        'flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-colors',
                        profileOpen ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'
                      )}
                      aria-label="Profile menu"
                    >
                      <div className="relative h-7 w-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {user.avatarUrl
                          ? <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" sizes="28px" />
                          : <span>{user.firstName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}</span>
                        }
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-gray-800 max-w-[80px] truncate">{user.firstName}</span>
                      <ChevronDown className={cn('hidden sm:block h-3.5 w-3.5 text-gray-400 transition-transform duration-200', profileOpen && 'rotate-180')} />
                    </button>

                    {/* Profile dropdown */}
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
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
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" /> {label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-50 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <LogOut className="h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                )}

                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile search row — hides on scroll */}
          <div className={cn(
            'md:hidden px-4 overflow-hidden transition-all duration-300',
            scrolled ? 'max-h-0 pb-0 opacity-0' : 'max-h-16 pb-3 opacity-100'
          )}>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search products…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-gray-400 transition-colors"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Desktop category bar — hides on scroll */}
        {mounted && !isAdmin && (
          <div className={cn(
            'hidden md:block bg-white border-b border-gray-100 overflow-hidden transition-all duration-300',
            scrolled ? 'max-h-0' : 'max-h-11'
          )}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-1 h-10 overflow-x-auto">
                <Link
                  href="/products"
                  className="flex-shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  All
                </Link>
                <span className="text-gray-200 mx-1">|</span>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className="flex-shrink-0 px-3 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md whitespace-nowrap transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile drawer backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 md:hidden transition-opacity duration-300',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer — right side */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full z-50 md:hidden flex flex-col transition-transform duration-300 ease-in-out bg-white',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ width: 'min(280px, 82vw)', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)' }}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-8 pb-6 relative" style={{ background: 'linear-gradient(135deg, #1a3828 0%, #2d5016 100%)' }}>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          {!mounted ? (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-white/20 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full border-2 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {user.avatarUrl
                  ? <Image src={user.avatarUrl} alt="Avatar" width={56} height={56} className="object-cover w-full h-full" />
                  : <span>{user.firstName?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-base truncate">{user.firstName} {user.lastName}</p>
                <p className="text-white/60 text-xs truncate mt-0.5">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="h-7 w-7 text-white/70" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Welcome</p>
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-white/70 text-xs underline underline-offset-2 hover:text-white transition-colors"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav items ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Primary links */}
          <div className="py-2">
            {[
              { href: '/',                 label: 'Home',        icon: Home,        exact: true },
              { href: '/account',          label: 'My Profile',  icon: User,        exact: true },
              { href: '/account/orders',   label: 'My Orders',   icon: Package },
              { href: '/account/wishlist', label: 'Wishlist',    icon: Heart },
            ].map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors',
                    active ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
                  )}
                  style={active ? { backgroundColor: '#c47b2a' } : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="mx-6 border-t border-gray-100" />

          {/* Categories */}
          <div className="py-2">
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors',
                pathname === '/products' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
              )}
              style={pathname === '/products' ? { backgroundColor: '#c47b2a' } : undefined}
            >
              <LayoutGrid className="h-5 w-5 flex-shrink-0" />
              All Products
            </Link>

            {CATEGORIES.map((cat) => {
              const href   = `/products?category=${cat.slug}`;
              const active = pathname.includes(`category=${cat.slug}`);
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors',
                    active ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  style={active ? { backgroundColor: '#c47b2a' } : undefined}
                >
                  <span className="h-5 w-5 flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: active ? 'white' : '#9ca3af' }}>
                    {cat.name.slice(0, 2)}
                  </span>
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="mx-6 border-t border-gray-100" />

          {/* WhatsApp + Admin */}
          <div className="py-2">
            <a
              href="https://wa.me/254757568845"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <WhatsAppIcon className="h-5 w-5 flex-shrink-0" />
              WhatsApp
            </a>

            {mounted && isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin') ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
                )}
                style={pathname.startsWith('/admin') ? { backgroundColor: '#c47b2a' } : undefined}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* ── Logout / Sign in at bottom ── */}
        <div className="flex-shrink-0 border-t border-gray-100 py-2">
          {mounted && user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Logout
            </button>
          ) : mounted && !user ? (
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-5 w-5 flex-shrink-0" />
              Sign In
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}
