'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, LogOut, ChevronRight, MapPin, Settings, User } from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { toast } from 'sonner';

const nav = [
  { href: '/account',             label: 'Overview',   icon: User,      exact: true },
  { href: '/account/profile',     label: 'Profile',    icon: Settings },
  { href: '/account/orders',      label: 'My Orders',  icon: ShoppingBag },
  { href: '/account/wishlist',    label: 'Wishlist',   icon: Heart },
  { href: '/account/addresses',   label: 'Addresses',  icon: MapPin },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAppSelector(selectCurrentUser);
  const [logoutMutation] = useLogoutMutation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !user) router.push('/auth/login?redirect=/account');
  }, [user, router, mounted]);

  async function handleLogout() {
    await logoutMutation().unwrap().catch(() => {});
    toast.success('Logged out');
    router.push('/');
  }

  if (!mounted || !user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Account</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
            <div className="p-4 border-b border-gray-50 bg-gray-50">
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-lg mb-2 flex-shrink-0">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" sizes="40px" />
                ) : (
                  <span>{user.firstName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <nav className="p-2">
              {nav.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-4 w-4" />}
                  </Link>
                );
              })}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </nav>
          </div>
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
