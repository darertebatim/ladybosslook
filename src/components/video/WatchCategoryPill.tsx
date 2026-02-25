import { cn } from '@/lib/utils';

interface WatchCategoryPillProps {
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function WatchCategoryPill({ name, isSelected, onClick }: WatchCategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
        isSelected
          ? 'bg-white/20 text-white backdrop-blur-sm shadow-[0_0_12px_rgba(255,255,255,0.08)]'
          : 'text-white/50 hover:text-white/70'
      )}
    >
      {name}
    </button>
  );
}
