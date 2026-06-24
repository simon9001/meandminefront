import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[14px] border border-bark-100 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5ece0 60%, #ede4d0 100%)' }}>
      {/* padding-top: 75% mirrors ProductCard's reliable 4:3 image frame */}
      <div className="relative w-full flex-shrink-0" style={{ paddingTop: '75%' }}>
        <div className="absolute inset-0"><Skeleton className="w-full h-full rounded-none" /></div>
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-2 w-14" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-5 w-20 mt-1" />
        <Skeleton className="h-9 w-full rounded-xl mt-1" />
      </div>
    </div>
  );
}
