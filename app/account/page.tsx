'use client';
import Link from 'next/link';
import { ShoppingBag, Heart, MapPin, ArrowRight, Settings } from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

export default function AccountPage() {
  const user = useAppSelector(selectCurrentUser);

  const cards = [
    { icon: ShoppingBag, label: 'My Orders',   description: 'Track, return, or buy things again',   href: '/account/orders',    color: 'bg-blue-50 text-blue-600' },
    { icon: Heart,       label: 'Wishlist',    description: 'Items saved for later',                href: '/account/wishlist',  color: 'bg-pink-50 text-pink-600' },
    { icon: MapPin,      label: 'Addresses',   description: 'Manage delivery addresses',            href: '/account/addresses', color: 'bg-amber-50 text-amber-600' },
    { icon: Settings,    label: 'Profile',     description: 'Update your name and preferences',    href: '/account/profile',   color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 text-white">
        <p className="text-forest-200 text-sm">Welcome back,</p>
        <h2 className="text-2xl font-bold mt-1">{user?.firstName} {user?.lastName}</h2>
        <p className="text-forest-300 text-sm mt-1">{user?.email}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, label, description, href, color }) => (
          <Link key={href} href={href} className="group flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
