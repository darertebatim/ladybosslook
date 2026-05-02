import { CalendarPlus, Check } from 'lucide-react';
import { TaskTemplate } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';

const accentBarMap: Record<string, string> = {
  yellow: 'bg-amber-400',
  pink: 'bg-pink-400',
  purple: 'bg-purple-400',
  blue: 'bg-blue-400',
  green: 'bg-emerald-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
  teal: 'bg-teal-400',
  indigo: 'bg-indigo-400',
  rose: 'bg-rose-400',
  amber: 'bg-amber-400',
  mint: 'bg-teal-300',
  lavender: 'bg-purple-300',
  sky: 'bg-sky-300',
  lime: 'bg-lime-300',
  peach: 'bg-orange-300',
};

interface Props {
  template: TaskTemplate;
  onToggle: () => void;
  isSelected: boolean;
  /** Override the accent bar color (use parent category color for visual cohesion). */
  accentColor?: string;
}

/**
 * Clean white task row used in the redesigned Self-Care Goals (TasksBank) page.
 * Replaces the multicolor pastel TaskTemplateCard for the listing view so the
 * page reads as a unified premium list rather than a rainbow patchwork.
 */
export function CleanTaskRow({ template, onToggle, isSelected, accentColor }: Props) {
  const color = accentColor || template.color || 'purple';
  const accent = accentBarMap[color] || accentBarMap.purple;

  const handleClick = () => {
    haptic.light();
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-stretch gap-3 rounded-2xl bg-white border transition-all overflow-hidden text-left',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-black/[0.06] active:bg-black/[0.02]'
      )}
    >
      {/* Colored accent strip — inherits from the category */}
      <span className={cn('w-1 shrink-0 rounded-r-full', accent)} aria-hidden />

      <div className="flex-1 flex items-center gap-3 py-3 pr-3 min-w-0">
        <FluentEmoji emoji={template.emoji || '📝'} size={28} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
            {template.title}
          </p>
          {template.description && (
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
              {template.description}
            </p>
          )}
        </div>

        <span
          className={cn(
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            isSelected ? 'bg-primary' : 'bg-muted/60'
          )}
          aria-label={isSelected ? 'Selected' : 'Add'}
        >
          {isSelected ? (
            <Check className="h-5 w-5 text-primary-foreground" />
          ) : (
            <CalendarPlus className="h-[18px] w-[18px] text-foreground/70" />
          )}
        </span>
      </div>
    </button>
  );
}
