import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center gap-6">
      <div className="text-6xl font-black text-bark-200 select-none">404</div>
      <h1 className="text-2xl font-black text-forest-900">Product not found</h1>
      <p className="text-bark-500 max-w-sm">
        This product may have been removed, or the server is still waking up.
        Try refreshing in a moment.
      </p>
      <div className="flex gap-3">
        <a
          href=""
          className="px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800 transition-colors"
        >
          Retry
        </a>
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
