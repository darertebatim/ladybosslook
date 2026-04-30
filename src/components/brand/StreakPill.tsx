import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  onClick?: () => void;
  className?: string;
}

/** Gradient flame chip used in headers to surface the active streak. */
export function StreakPill({ count, onClick, className }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: 'spring' }}
      className={cn(
        'flex items-center gap-1 px-2.5 py-1 rounded-full shadow-sm bg-gradient-streak text-white',
        'active:scale-95 transition-transform',
        className,
      )}
      aria-label={`Streak ${count}`}
    >
      <Flame className="w-3.5 h-3.5 fill-current" />
      <span className="text-[13px] font-bold">{count}</span>
    </motion.button>
  );
}