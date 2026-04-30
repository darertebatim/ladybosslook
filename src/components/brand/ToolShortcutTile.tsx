import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';
import { TINT_BG, type TintKey } from './tints';

interface Props {
  emoji: string;
  label: string;
  tint: TintKey;
  completed?: boolean;
  index?: number;
  onClick?: () => void;
}

/**
 * Tool shortcut tile — colored emoji circle with label and optional completion dot.
 * Used inside a 4-column grid on Home/Tools (currently hidden behind a flag).
 */
export function ToolShortcutTile({ emoji, label, tint, completed, index = 0, onClick }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.04 }}
      className="flex flex-col items-center gap-1 py-2.5 rounded-2xl bg-card-warm shadow-card-warm active:scale-95 transition-transform min-h-[64px]"
    >
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', TINT_BG[tint])}>
        <FluentEmoji emoji={emoji} size={22} />
      </div>
      <span className="text-[10px] font-medium text-fg-warm-muted">{label}</span>
      <div className={cn('w-1 h-1 rounded-full mt-0.5', completed ? 'bg-success' : 'bg-transparent')} />
    </motion.button>
  );
}