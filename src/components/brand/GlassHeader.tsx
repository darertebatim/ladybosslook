import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  /** Optional content rendered below the title row (e.g. WeekStrip). */
  below?: ReactNode;
  className?: string;
}

/**
 * Glass header shell — translucent backdrop-blur container with three-slot title row.
 * Backgrounds resolve via CSS vars (warm tones in light, deep tones in dark).
 */
export function GlassHeader({ left, center, right, below, className }: Props) {
  return (
    <div
      className={cn(
        'px-4 pt-1 pb-2 rounded-b-2xl',
        'bg-card-warm/60 backdrop-blur-2xl backdrop-saturate-150',
        'shadow-[0_2px_10px_hsl(22_53%_12%/0.06)]',
        className,
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center h-9 gap-2">
        <div className="flex items-center gap-1 text-fg-warm">{left}</div>
        <div className="flex justify-center text-fg-warm">{center}</div>
        <div className="flex justify-end items-center text-fg-warm">{right}</div>
      </div>
      {below}
    </div>
  );
}