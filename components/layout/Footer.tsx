import Link from 'next/link';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-forest-950 text-forest-300 mt-auto">
      {/* Top band */}
      <div className="border-b border-forest-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-2xl font-black tracking-tighter text-white">MeAndMine.shop</span>
              </div>
              <p className="text-sm text-forest-400 leading-relaxed max-w-xs mb-5">
                Kenya&apos;s trusted home goods store. Carpets, curtains, bedding & more — delivered nationwide.
              </p>
              <div className="space-y-2.5">
                <a href="mailto:support@meandmine.shop" className="flex items-center gap-2 text-sm text-forest-400 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-earth-500 flex-shrink-0" />
                  support@meandmine.shop
                </a>
                <a href="tel:+254757568845" className="flex items-center gap-2 text-sm text-forest-400 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-earth-500 flex-shrink-0" />
                  0757 568 845
                </a>
                <a
                  href="https://chat.whatsapp.com/JlHbNPqsvZVKIExyeSAYsQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-forest-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366] flex-shrink-0" />
                  WhatsApp us
                </a>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Shop</h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'All Products',  href: '/products' },
                  { label: 'Carpets',       href: '/products?category=carpets' },
                  { label: 'Curtains',      href: '/products?category=curtains' },
                  { label: 'Bedding',       href: '/products?category=bedding' },
                  { label: 'Kitchenware',   href: '/products?category=kitchenware' },
                  { label: 'New Arrivals',  href: '/products?sort=newest' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Support</h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Track My Order',  href: '/account/orders' },
                  { label: 'My Account',      href: '/account' },
                  { label: 'Returns Policy',  href: '/terms#returns' },
                  { label: 'Delivery Info',   href: '/terms#delivery' },
                  { label: 'Privacy Policy',  href: '/privacy' },
                  { label: 'Terms of Service',href: '/terms' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Delivery partners */}
            <div>
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-3">Delivery Partners</h3>
                <div className="flex flex-wrap gap-2">
                  {['DHL', 'Aramex', 'Fargo', 'EasyCoach', 'Little'].map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#ff7c2a' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-forest-600">© {new Date().getFullYear()} MeAndMine.shop. All rights reserved. Nairobi, Kenya.</p>
        <div className="flex items-center gap-3 text-xs text-forest-600">
          <span className="flex items-center gap-1">🔒 SSL Secured</span>
          <span>·</span>
          <span>Registered in Kenya</span>
          <span>·</span>
          <span>KRA Compliant</span>
        </div>
      </div>
    </footer>
  );
}
