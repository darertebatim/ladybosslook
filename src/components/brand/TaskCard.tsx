import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import SealCheck from '@/components/app/SealCheck';
import { cn } from '@/lib/utils';
import { TINT_BG, TINT_BG_MID, type TintKey } from './tints';

export interface BrandTaskCardData {
  emoji: string;
  title: string;
  /** e.g. "🌅 7:00 AM" */
  time?: string;
  /** e.g. "Daily" */
  repeat?: string;
  /** e.g. "6/8 cups" */
  goal?: string;
  done?: boolean;
  tint: TintKey;
}

interface Props {
  task: BrandTaskCardData;
  index?: number;
  onToggle?: () => void;
  className?: string;
}

/**
 * Brand task card matching /admin/brand/mock — colored emoji circle, subtitle row,
 * title with optional strike-through, and SealCheck completion control.
 */
export function TaskCard({ task, index = 0, onToggle, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06 }}
      className={cn(
        'rounded-3xl overflow-hidden shadow-card-warm',
        task.done ? TINT_BG_MID[task.tint] : 'bg-card-warm',
        className,
      )}
    >
      <div className="flex items-center gap-2 pl-3 pr-4 py-5">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', TINT_BG[task.tint])}>
          <FluentEmoji emoji={task.emoji} size={26} />
        </div>

        <div className="flex-1 min-w-0">
          {(task.time || task.repeat || task.goal) && (
            <div className="flex items-center gap-1.5 text-fg-warm-muted">
              {task.time && <span className="text-[11px]">{task.time}</span>}
              {task.time && task.repeat && <span className="text-[11px]">•</span>}
              {task.repeat && <span className="text-[11px]">{task.repeat}</span>}
              {task.goal && <span className="text-[11px]">•</span>}
              {task.goal && <span className="text-[11px] font-medium">{task.goal}</span>}
            </div>
          )}
          <p className={cn(
            'text-[15px] font-semibold leading-tight text-fg-warm',
            task.done && 'line-through',
          )}>
            {task.title}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="w-9 h-9 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.done ? (
            <SealCheck className="w-9 h-9 text-teal-400" />
          ) : (
            <span className="w-9 h-9 rounded-full border-2 bg-transparent border-fg-warm/40" />
          )}
        </button>
      </div>
    </motion.div>
  );
}