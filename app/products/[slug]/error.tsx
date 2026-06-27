'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ProductPage error]', error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center gap-6">
      <div className="text-5xl font-black text-bark-200 select-none">!</div>
      <h1 className="text-2xl font-black text-forest-900">Something went wrong</h1>
      <p className="text-bark-500 max-w-sm">
        We couldn&apos;t load this product right now. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl border border-bark-200 text-forest-900 font-semibold text-sm hover:bg-cream-50 transition-colors"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
