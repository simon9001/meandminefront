import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TokenExpiryWatcher } from '@/components/auth/TokenExpiryWatcher';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: { default: 'MeAndMine.shop — Premium Products', template: '%s | MeAndMine.shop' },
  description: 'Quality home goods and lifestyle products at the best prices in Kenya.',
  keywords: ['shopping', 'Kenya', 'home goods', 'online store'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white antialiased">
        <Providers>
          <TokenExpiryWatcher />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
