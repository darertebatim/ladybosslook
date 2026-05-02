import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

const headerBgMap: Record<string, string> = {
  yellow: 'bg-amber-100/70',
  pink: 'bg-pink-100/70',
  purple: 'bg-purple-100/70',
  blue: 'bg-blue-100/70',
  green: 'bg-emerald-100/70',
  orange: 'bg-orange-100/70',
  red: 'bg-red-100/70',
  teal: 'bg-teal-100/70',
  indigo: 'bg-indigo-100/70',
  rose: 'bg-rose-100/70',
  amber: 'bg-amber-100/70',
  mint: 'bg-teal-100/70',
  lavender: 'bg-purple-100/70',
  sky: 'bg-sky-100/70',
  lime: 'bg-lime-100/70',
  peach: 'bg-orange-100/70',
};

interface Props {
  name: string;
  emoji?: string;
  description?: string | null;
  color: string;
  count: number;
  defaultOpen?: boolean;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  children: ReactNode;
}

export function CategorySection({
  name,
  emoji,
  description,
  color,
  count,
  defaultOpen,
  onSeeAll,
  seeAllLabel,
  children,
}: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const headerBg = headerBgMap[color] || headerBgMap.purple;

  const toggle = () => {
    haptic.light();
    setOpen((o) => !o);
  };

  return (
    <section className="px-4 mt-4 first:mt-2">
      <button
        onClick={toggle}
        className={cn(
          'w-full flex items-center gap-3 rounded-2xl px-3 py-3 active:scale-[0.99] transition-transform text-left',
          headerBg
        )}
      >
        <span className="shrink-0 w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">
          <FluentEmoji emoji={emoji || '✨'} size={24} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-foreground line-clamp-1">{name}</h2>
            <span className="text-[11px] font-semibold text-foreground/60">{count}</span>
          </div>
          {description && (
            <p className="text-[11px] text-foreground/60 line-clamp-1 mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-foreground/60 transition-transform shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="w-full flex items-center justify-center gap-1 py-2.5 text-sm font-semibold text-primary active:opacity-70 transition-opacity"
            >
              {seeAllLabel || 'See all'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
