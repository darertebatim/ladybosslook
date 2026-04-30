import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface WeekStripDay {
  /** Single-letter label (M, T, W, ...) */
  label: string;
  /** Day-of-month number to display in the circle. */
  date: number;
  isToday?: boolean;
  isPast?: boolean;
  /** Show green completion dot below the circle. */
  completed?: boolean;
}

interface Props {
  days: WeekStripDay[];
  className?: string;
}

/**
 * Compact 7-day strip. Today's circle is filled with brand-primary.
 * Past completed days show a green dot beneath.
 */
export function WeekStrip({ days, className }: Props) {
  return (
    <div className={cn('flex gap-1 justify-between mt-1.5 pb-0.5', className)}>
      {days.map((day, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 + i * 0.025 }}
          className="flex flex-col items-center gap-0.5 flex-1"
        >
          <span className="text-[9px] font-medium text-fg-warm-muted">{day.label}</span>
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold',
              day.isToday
                ? 'bg-brand text-white'
                : day.isPast
                  ? 'text-fg-warm-muted border-[1.5px] border-border-warm'
                  : 'text-fg-warm border-[1.5px] border-border-warm',
            )}
          >
            {day.date}
          </div>
          <div className={cn('w-1 h-1 rounded-full', day.completed ? 'bg-success' : 'bg-transparent')} />
        </motion.div>
      ))}
    </div>
  );
}