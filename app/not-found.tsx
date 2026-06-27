import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center gap-6">
      <div className="text-6xl font-black text-bark-200 select-none">404</div>
      <h1 className="text-2xl font-black text-forest-900">Page not found</h1>
      <p className="text-bark-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
