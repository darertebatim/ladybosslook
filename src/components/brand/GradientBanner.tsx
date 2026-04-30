import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  /** Hide the trailing chevron when the banner isn't actionable. */
  hideChevron?: boolean;
}

/**
 * Orange gradient banner with decorative blob — used by Quiz / Promo / Mood / Weekly banners.
 * Solid white text per the contrast rule for gradients.
 */
export function GradientBanner({ icon, title, subtitle, onClick, className, hideChevron }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        'w-full rounded-3xl p-3.5 relative overflow-hidden',
        'bg-gradient-orange shadow-[0_4px_14px_hsl(14_82%_56%/0.25)]',
        'active:scale-[0.99] transition-transform',
        className,
      )}
    >
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/20" />
      <div className="relative z-10 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-white/25 text-white">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-bold leading-tight">{title}</p>
          {subtitle && <p className="text-white/80 text-[10px] mt-0.5">{subtitle}</p>}
        </div>
        {!hideChevron && <ChevronRight className="w-4 h-4 text-white/90 shrink-0" />}
      </div>
    </motion.button>
  );
}