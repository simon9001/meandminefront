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
  { href: '/admin/discounts',   label: 'Discount Codes', icon: Tag },
  { href: '/admin/shipments',   label: 'Shipments',      icon: Truck },
  { href: '/admin/promotions',  label: 'Promotions',     icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAppSelector(selectCurrentUser);
  const isAdmin  = useAppSelector(selectIsAdmin);
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.push('/auth/login?redirect=/admin'); return; }
    if (!isAdmin) { toast.error('Admin access required'); router.push('/'); }
  }, [mounted, user, isAdmin, router]);

  async function handleLogout() {
    await logoutMutation().unwrap().catch(() => {});
    router.push('/');
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-emerald-600" />
          <span className="font-extrabold text-gray-900 text-sm">Maschon Admin</span>
        </Link>
      </div>

      <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
            {user?.firstName?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </nav>
  );

  // Always render the same outer shell so server and client first renders match.
  // Contents are only shown after mount + auth check to avoid hydration mismatch.
  return (
    <div className="flex h-screen bg-gray-50">
      {mounted && user && isAdmin ? (
        <>
          {/* Desktop sidebar */}
          <aside className="hidden md:flex flex-col w-56 border-r border-gray-100 bg-white flex-shrink-0 h-full">
            <Sidebar />
          </aside>

          {/* Mobile sidebar */}
          {open && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="w-56 bg-white border-r border-gray-100 flex flex-col"><Sidebar /></div>
              <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
              <button onClick={() => setOpen(true)}><Menu className="h-6 w-6 text-gray-600" /></button>
              <span className="font-bold text-gray-900">Admin</span>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}
    </div>
  );
}
