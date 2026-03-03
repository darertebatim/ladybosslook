import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { RoutineBankItem } from '@/hooks/useRoutinesBank';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { isEmoji } from '@/lib/fluentEmoji';
import { X, Crown } from 'lucide-react';
import { CachedImage } from '@/components/ui/CachedImage';

interface RoutineBankCardProps {
  routine: RoutineBankItem;
  onClick?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

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
};

const colorBackgrounds: Record<string, string> = {
  yellow: 'bg-amber-50',
  pink: 'bg-pink-50',
  purple: 'bg-purple-50',
  blue: 'bg-blue-50',
  green: 'bg-emerald-50',
  orange: 'bg-orange-50',
  red: 'bg-red-50',
  teal: 'bg-teal-50',
  indigo: 'bg-indigo-50',
  rose: 'bg-rose-50',
  amber: 'bg-amber-50',
  mint: 'bg-teal-50',
};

export function RoutineBankCard({ 
  routine, 
  onClick, 
  onDismiss,
  variant = 'default',
  className,
}: RoutineBankCardProps) {
  const color = routine.color || 'purple';
  const gradient = colorGradients[color] || colorGradients.purple;
  const bgColor = colorBackgrounds[color] || colorBackgrounds.purple;
  const routineEmoji = routine.emoji && isEmoji(routine.emoji) ? routine.emoji : '✨';

  const handleClick = () => {
    haptic.light();
    onClick?.();
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-3 p-3 rounded-2xl w-full text-left transition-all active:scale-[0.98]',
          bgColor
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
          gradient
        )}>
          <FluentEmoji emoji={routineEmoji} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{routine.title}</h3>
          {routine.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{routine.subtitle}</p>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Free / Plus badge - outside card overflow */}
      {routine.is_free ? (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-green-500 hover:bg-green-500 text-white rounded-full text-xs px-2 py-0.5 shadow-sm">
          FREE
        </Badge>
      ) : (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-amber-200 text-amber-700 hover:bg-amber-200 rounded-full text-xs gap-1 shadow-sm">
          <Crown className="h-3 w-3" />
          PLUS
        </Badge>
      )}
      <button 
        className={cn(
          "overflow-hidden cursor-pointer transition-all active:scale-[0.98] w-full text-left rounded-2xl shadow-lg border border-border/50",
          className
        )}
        onClick={handleClick}
      >
        {/* Title Header Section */}
        <div className={cn(
          'px-3 py-3 rounded-t-2xl h-[3.75rem] flex items-start',
          bgColor
        )}>
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
            {routine.title}
          </h3>
        </div>

        {/* Square Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-b-2xl">
          {routine.cover_image_url ? (
            <CachedImage
              src={routine.cover_image_url}
              alt={routine.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn(
              'w-full h-full bg-gradient-to-br flex items-center justify-center',
              gradient
            )}>
              <FluentEmoji emoji={routineEmoji} size={72} className="opacity-40" />
            </div>
          )}
          
          {/* Close/Dismiss button */}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptic.light();
                onDismiss();
              }}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 active:scale-95 transition-transform z-10"
              aria-label="Dismiss suggestion"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>
      </button>
    </div>
  );
}
