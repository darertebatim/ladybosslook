import { CalendarPlus, Check } from 'lucide-react';
import { TaskTemplate } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';

// Map any incoming color to our warm theme tint tokens (peach/mint/lavender/yellow/pink/sky/lime).
type TintKey = 'peach' | 'mint' | 'lavender' | 'yellow' | 'pink' | 'sky' | 'lime';

const tintMap: Record<string, TintKey> = {
  yellow: 'yellow', amber: 'yellow', orange: 'peach', peach: 'peach', red: 'peach', rose: 'pink',
  pink: 'pink', purple: 'lavender', lavender: 'lavender', indigo: 'lavender',
  blue: 'sky', sky: 'sky', teal: 'mint', mint: 'mint', green: 'lime', lime: 'lime',
};

const accentBarMap: Record<TintKey, string> = {
  peach: 'bg-peach-mid',
  mint: 'bg-mint-mid',
  lavender: 'bg-lavender-mid',
  yellow: 'bg-yellow-mid',
  pink: 'bg-pink-mid',
  sky: 'bg-sky-mid',
  lime: 'bg-lime-mid',
};

const selectedBgMap: Record<TintKey, string> = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  yellow: 'bg-yellow',
  pink: 'bg-pink',
  sky: 'bg-sky-mid',
  lime: 'bg-lime-mid',
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
  const raw = (accentColor || template.color || 'lavender').toLowerCase();
  const tint: TintKey = tintMap[raw] || 'lavender';
  const accent = accentBarMap[tint];
  const selectedBg = selectedBgMap[tint];

  const handleClick = () => {
    haptic.light();
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-stretch gap-3 rounded-2xl transition-all overflow-hidden text-left shadow-ios',
        isSelected ? selectedBg : 'bg-card-warm active:brightness-[0.97]'
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
            isSelected ? 'bg-brand' : 'bg-white/70'
          )}
          aria-label={isSelected ? 'Selected' : 'Add'}
        >
          {isSelected ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <CalendarPlus className="h-[18px] w-[18px] text-foreground/70" />
          )}
        </span>
      </div>
    </button>
  );
}
