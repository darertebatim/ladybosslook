import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { haptic } from '@/lib/haptics';

interface StarRatingProps {
  rating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

export function StarRating({ rating = 0, onRate, readonly = false, size = 'md' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  const handleStarClick = (star: number) => {
    haptic.selection();
    onRate?.(star);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('flex items-center', gapClasses[size])}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className="transition-colors"
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => handleStarClick(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                star <= displayRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
      {!readonly && displayRating > 0 && (
        <span className="text-sm font-medium text-primary animate-in fade-in duration-200">
          {ratingLabels[displayRating]}
        </span>
      )}
    </div>
  );
}
