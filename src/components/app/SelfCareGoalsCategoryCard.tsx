import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';
import type { RoutineBankCategory } from '@/hooks/useRoutinesBank';

const colorBackgrounds: Record<string, string> = {
  yellow: 'bg-amber-50 border-amber-200/60',
  pink: 'bg-pink-50 border-pink-200/60',
  purple: 'bg-purple-50 border-purple-200/60',
  blue: 'bg-blue-50 border-blue-200/60',
  green: 'bg-emerald-50 border-emerald-200/60',
  orange: 'bg-orange-50 border-orange-200/60',
  red: 'bg-red-50 border-red-200/60',
  teal: 'bg-teal-50 border-teal-200/60',
  indigo: 'bg-indigo-50 border-indigo-200/60',
  rose: 'bg-rose-50 border-rose-200/60',
  amber: 'bg-amber-50 border-amber-200/60',
  mint: 'bg-teal-50 border-teal-200/60',
  lavender: 'bg-purple-50 border-purple-200/60',
  sky: 'bg-sky-50 border-sky-200/60',
  lime: 'bg-lime-50 border-lime-200/60',
  peach: 'bg-orange-50 border-orange-200/60',
};

const colorGradients: Record<string, string> = {
  yellow: 'from-amber-400/80 to-amber-600/90',
  pink: 'from-pink-400/80 to-pink-600/90',
  purple: 'from-purple-400/80 to-purple-600/90',
  blue: 'from-blue-400/80 to-blue-600/90',
  green: 'from-emerald-400/80 to-emerald-600/90',
  orange: 'from-orange-400/80 to-orange-600/90',
  red: 'from-red-400/80 to-red-600/90',
  teal: 'from-teal-400/80 to-teal-600/90',
  indigo: 'from-indigo-400/80 to-indigo-600/90',
  rose: 'from-rose-400/80 to-rose-600/90',
  amber: 'from-amber-400/80 to-amber-600/90',
  mint: 'from-teal-300/80 to-teal-500/90',
  lavender: 'from-purple-300/80 to-purple-500/90',
  sky: 'from-sky-300/80 to-sky-500/90',
  lime: 'from-lime-300/80 to-lime-500/90',
  peach: 'from-orange-300/80 to-orange-500/90',
};

interface Props {
  category: RoutineBankCategory;
  taskCount?: number;
  className?: string;
}

export const SelfCareGoalsCategoryCard = memo(function SelfCareGoalsCategoryCard({ category, taskCount, className }: Props) {
  const navigate = useNavigate();
  const color = category.color || 'purple';
  const bgColor = colorBackgrounds[color] || colorBackgrounds.purple;
  const gradient = colorGradients[color] || colorGradients.purple;

  const handleClick = () => {
    haptic.light();
    navigate(`/app/tasksbank/${category.slug}`);
  };

  return (
    <button
      className={cn(
        "relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
        "border shadow-sm",
        bgColor,
        className
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3 p-2">
        {/* Emoji thumbnail */}
        <div className={cn(
          'h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br flex items-center justify-center',
          gradient
        )}>
          <FluentEmoji emoji={category.emoji || '✨'} size={36} className="opacity-80" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h3 className="font-bold text-sm text-foreground line-clamp-1 leading-snug">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
              {category.description}
            </p>
          )}
          {taskCount !== undefined && taskCount > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {taskCount} goals
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
