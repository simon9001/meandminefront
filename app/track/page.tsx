import { Suspense } from 'react';
import TrackInner from './TrackInner';

export const metadata = { title: 'Track Your Order' };

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-forest-900 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TrackInner />
    </Suspense>
  );
}
