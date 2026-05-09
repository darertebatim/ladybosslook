import { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, Crown, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { haptic } from '@/lib/haptics';
import { CachedImage } from '@/components/ui/CachedImage';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { isEmoji } from '@/lib/fluentEmoji';
import { cn } from '@/lib/utils';
import { RoutineBankItem } from '@/hooks/useRoutinesBank';
import { useTranslation } from 'react-i18next';
import { usePeach } from '@/lib/peachPalette';
import { useSubscription } from '@/hooks/useSubscription';

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

const colorBackgrounds: Record<string, string> = {
  yellow: 'bg-yellow',
  pink: 'bg-pink',
  purple: 'bg-lavender',
  blue: 'bg-sky-mid',
  green: 'bg-mint',
  orange: 'bg-peach',
  red: 'bg-pink',
  teal: 'bg-mint',
  indigo: 'bg-lavender',
  rose: 'bg-pink',
  amber: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  sky: 'bg-sky-mid',
  lime: 'bg-lime-mid',
  peach: 'bg-peach',
};

interface FeaturedRoutineCardProps {
  routine: RoutineBankItem;
  onDismiss?: () => void;
  className?: string;
  categoryName?: string;
}

export const FeaturedRoutineCard = memo(function FeaturedRoutineCard({
  routine,
  onDismiss,
  className,
  categoryName,
}: FeaturedRoutineCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const { isSubscribed } = useSubscription();
  const color = routine.color || 'purple';
  const gradient = colorGradients[color] || colorGradients.purple;
  const routineEmoji = routine.emoji && isEmoji(routine.emoji) ? routine.emoji : '✨';
  const peachBg = usePeach(routine.id);

  const handleClick = () => {
    haptic.light();
    onDismiss?.();
    navigate(`/app/routines/${routine.id}`, { state: { from: location.pathname } });
  };

  return (
    <button
      className={cn(
        "relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] border-0",
        className
      )}
      style={{ backgroundColor: peachBg }}
      onClick={handleClick}
    >
      <div className="flex gap-3 p-2">
        {/* Square thumbnail */}
        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden">
          {routine.cover_image_url ? (
            <CachedImage
              src={routine.cover_image_url}
              alt={routine.title}
              loading="lazy"
              decoding="async"
              className={cn(
                "w-full h-full object-cover",
                routine.cover_aspect === '6x4' && "object-bottom"
              )}
            />
          ) : (
            <div className={cn(
              'w-full h-full bg-gradient-to-br flex items-center justify-center',
              gradient
            )}>
              <FluentEmoji emoji={routineEmoji} size={36} className="opacity-60" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Category */}
          {routine.subtitle && (
            <p className="text-[11px] text-foreground/80 truncate">{routine.subtitle}</p>
          )}

          {/* Title */}
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
            {routine.title}
          </h3>

          {/* Badge */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {routine.is_free && !isSubscribed ? (
              <Badge className="rounded-full text-[10px] px-1.5 py-0 shadow-sm h-4 font-semibold text-black border-0 flex items-center gap-0.5" style={{ backgroundColor: '#E8F5A3' }}>
                <FluentEmoji emoji="🔥" size={10} /> FREE
              </Badge>
            ) : !routine.is_free && !isSubscribed ? (
              <Badge className="bg-amber-200 text-amber-700 hover:bg-amber-200 rounded-full text-[10px] px-1.5 py-0 gap-0.5 shadow-sm h-4">
                <Crown className="h-2.5 w-2.5" />
                PLUS
              </Badge>
            ) : null}
            {routine.category && (
              <span className="text-[10px] text-foreground/70 font-medium truncate capitalize">
                {categoryName || routine.category}
              </span>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic.light();
              onDismiss();
            }}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/80 active:scale-95 transition-transform"
            aria-label={t('homePlanner.dismissSuggestion')}
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        )}
      </div>
    </button>
  );
});
