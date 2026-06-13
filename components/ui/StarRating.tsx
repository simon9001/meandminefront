import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };

export function StarRating({ rating, max = 5, size = 'md', showCount, interactive, onChange, className }: Props) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn('relative', interactive && 'cursor-pointer hover:scale-110 transition-transform')}
          >
            <Star
              className={cn(sizes[size], filled ? 'fill-amber-400 text-amber-400' : partial ? 'fill-amber-200 text-amber-400' : 'fill-gray-200 text-gray-200')}
            />
          </button>
        );
      })}
      {showCount !== undefined && (
        <span className="ml-1 text-sm text-gray-500">({showCount.toLocaleString()})</span>
      )}
    </div>
  );
}
