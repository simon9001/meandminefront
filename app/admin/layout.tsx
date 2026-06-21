'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Package, BarChart2, LogOut, Menu, ChevronRight,
  Tag, Layers, Users, Truck, Boxes, Megaphone, Loader2,
} from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsAdmin } from '@/lib/redux/slices/authSlice';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { toast } from 'sonner';

const nav = [
  { href: '/admin',            label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',     label: 'Orders',         icon: ShoppingBag },
  { href: '/admin/products',   label: 'Products',       icon: Package },
  { href: '/admin/categories', label: 'Categories',     icon: Layers },
  { href: '/admin/inventory',  label: 'Inventory',      icon: Boxes },
  { href: '/admin/users',      label: 'Users',          icon: Users },
  { href: '/admin/discounts',  label: 'Discounts',      icon: Tag },
  { href: '/admin/shipments',  label: 'Shipments',      icon: Truck },
  { href: '/admin/promotions', label: 'Promotions',     icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAppSelector(selectCurrentUser);
  const isAdmin  = useAppSelector(selectIsAdmin);
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutMutation]      = useLogoutMutation();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    if (!user)    { router.push('/auth/login?redirect=/admin'); return; }
    if (!isAdmin) { toast.error('Admin access required'); router.push('/'); }
  }, [mounted, user, isAdmin, router]);

  async function handleLogout() {
    await logoutMutation().unwrap().catch(() => {});
    router.push('/');
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const Sidebar = () => (
    <nav className="flex flex-col h-full skeu-sidebar">
      {/* Logo area */}
      <div
        className="p-4 flex items-center gap-2.5 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
        }}
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(145deg, #3a9166, #2d7350)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-black text-sm tracking-tight" style={{ color: '#f0e8d8', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            Maschon
          </span>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(240,220,180,0.4)' }}>
            Admin Console
          </p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(200,170,130,0.45)' }}>
          Navigation
        </p>
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative group"
              style={active ? {
                background: 'linear-gradient(135deg, rgba(45,115,80,0.4), rgba(37,92,61,0.5))',
                boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 1px 4px rgba(0,0,0,0.3)',
                border: '1px solid rgba(45,115,80,0.4)',
                color: '#f0e8d8',
              } : {
                color: 'rgba(220,200,168,0.92)',
                border: '1px solid transparent',
              }}
            >
              <Icon
                className="h-4 w-4 flex-shrink-0"
                style={{ color: active ? '#7dc4a0' : 'rgba(190,165,130,0.88)' }}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" style={{ color: '#7dc4a0' }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div
        className="p-3 flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.3)',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 mb-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{
              background: 'linear-gradient(145deg, #3a9166, #255c3d)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              color: '#fff',
              textShadow: '0 1px 1px rgba(0,0,0,0.4)',
            }}
          >
            {user?.firstName?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#e8d8c0', textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(200,170,130,0.5)' }}>
              {user?.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150"
          style={{ color: 'rgba(220,120,100,0.8)', border: '1px solid transparent' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(200,50,30,0.15)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,50,30,0.2)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(240,140,120,1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(220,120,100,0.8)';
          }}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen" style={{ background: '#c8b89a' }}>
      {mounted && user && isAdmin ? (
        <>
          {/* Desktop sidebar */}
          <aside className="hidden md:flex flex-col w-56 flex-shrink-0 h-full">
            <Sidebar />
          </aside>

          {/* Mobile sidebar overlay */}
          {open && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="w-56 flex flex-col"><Sidebar /></div>
              <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile topbar */}
            <header
              className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, #4a3020 0%, #3a2418 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                borderBottom: '1px solid rgba(0,0,0,0.4)',
              }}
            >
              <button onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" style={{ color: '#e8d8c0' }} />
              </button>
              <span className="font-black text-sm" style={{ color: '#e8d8c0', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                Admin Console
              </span>
            </header>

            {/* Main content area */}
            <main
              className="flex-1 overflow-y-auto p-4 md:p-6"
              style={{ background: 'linear-gradient(160deg, #d8ccb4 0%, #cabea4 100%)' }}
            >
              {children}
            </main>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #3a9166, #2d7350)',
              boxShadow: '0 4px 12px rgba(45,115,80,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
          <p className="text-xs font-bold text-bark-500 uppercase tracking-widest">Authenticating…</p>
        </div>
      )}
    </div>
  );
}
