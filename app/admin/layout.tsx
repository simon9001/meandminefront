'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Package, LogOut, Menu, X,
  Tag, Layers, Users, Truck, Boxes, Megaphone, Loader2, BarChart2,
  ShieldAlert, ScrollText, TrendingUp,
} from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsAdmin } from '@/lib/redux/slices/authSlice';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { toast } from 'sonner';

const nav = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',     label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/products',   label: 'Products',   icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Layers },
  { href: '/admin/inventory',  label: 'Inventory',  icon: Boxes },
  { href: '/admin/users',      label: 'Users',      icon: Users },
  { href: '/admin/discounts',  label: 'Discounts',  icon: Tag },
  { href: '/admin/shipments',  label: 'Shipments',  icon: Truck },
  { href: '/admin/promotions', label: 'Promotions', icon: Megaphone },
];

const superAdminNav = [
  { href: '/admin/superadmin', label: 'Deep Analytics', icon: TrendingUp },
  { href: '/admin/audit',      label: 'Audit Logs',     icon: ScrollText },
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

  const SidebarContent = () => (
    <nav className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-100 flex-shrink-0">
        <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">MeAndMine</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Admin</p>
        </div>
        <button
          className="ml-auto md:hidden p-1 text-gray-400 hover:text-gray-700"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Super admin exclusive section */}
        {user?.role === 'superadmin' && (
          <div className="pt-3 mt-3 border-t border-gray-100">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3" /> Super Admin
            </p>
            {superAdminNav.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-purple-700 text-white'
                      : 'text-purple-500 hover:text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.firstName?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {mounted && user && isAdmin ? (
        <>
          {/* Desktop sidebar */}
          <aside className="hidden md:flex flex-col w-52 flex-shrink-0 h-full">
            <SidebarContent />
          </aside>

          {/* Mobile overlay */}
          {open && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="w-52 flex flex-col shadow-xl"><SidebarContent /></div>
              <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile topbar */}
            <header className="md:hidden h-14 flex items-center gap-3 px-4 bg-white border-b border-gray-100 flex-shrink-0">
              <button onClick={() => setOpen(true)} className="text-gray-500 hover:text-gray-900 transition-colors">
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-bold text-gray-900">Admin</span>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-5 md:p-8">
              {children}
            </main>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Authenticating…</span>
        </div>
      )}
    </div>
  );
}
