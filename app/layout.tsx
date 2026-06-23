import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TokenExpiryWatcher } from '@/components/auth/TokenExpiryWatcher';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  metadataBase: new URL('https://meandmine.shop'),
  title: { default: 'MeAndMine.shop — Premium Home & Lifestyle Products', template: '%s | MeAndMine.shop' },
  description: 'Shop premium carpets, bedding, kitchenware, appliances & home décor. Trusted Kenya online store with M-Pesa payments & nationwide delivery.',
  keywords: [
    'online shopping Kenya', 'home goods Kenya', 'carpets Kenya', 'bedding Kenya',
    'kitchenware Kenya', 'appliances Kenya', 'home decor Kenya', 'M-Pesa shopping',
    'nairobi online store', 'buy home products Kenya',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://meandmine.shop',
    siteName: 'MeAndMine.shop',
    title: 'MeAndMine.shop — Premium Home & Lifestyle Products',
    description: 'Shop premium carpets, bedding, kitchenware, appliances & home décor with M-Pesa & nationwide delivery across Kenya.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'MeAndMine.shop — Shop Kenya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeAndMine.shop — Premium Home & Lifestyle Products',
    description: 'Premium home goods delivered across Kenya. Pay with M-Pesa.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: 'https://meandmine.shop' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white antialiased">
        <Providers>
          <TokenExpiryWatcher />
          <Navbar />
          <main className="flex-1">{children}</main>
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
