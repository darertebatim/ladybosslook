import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { RoutineBankItem } from '@/hooks/useRoutinesBank';

interface RoutineBankCardProps {
  routine: RoutineBankItem;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

// Helper to check if string is emoji
const isEmoji = (str: string) => 
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u.test(str);

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
  variant = 'default' 
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
          <span className="text-2xl">{routineEmoji}</span>
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
    <Card 
      className="overflow-hidden rounded-2xl border-border/50 cursor-pointer hover:shadow-lg hover:border-border transition-all hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleClick}
    >
      {/* Image Section - aspect-square */}
      <div className="relative aspect-square">
        {routine.cover_image_url ? (
          <img
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
            <span className="text-6xl opacity-40">{routineEmoji}</span>
          </div>
        )}
        
        {/* Bottom Gradient for Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Category badge - top left */}
        {routine.category && routine.category !== 'general' && (
          <Badge variant="secondary" className="absolute top-2 left-2 rounded-full capitalize">
            {routine.category}
          </Badge>
        )}
        
        {/* Title Overlay */}
        <h3 className="absolute bottom-2 left-2 right-2 font-semibold text-sm text-white line-clamp-2 drop-shadow-md z-10">
          {routine.title}
        </h3>
      </div>
      
      {/* Content Section */}
      <div className="p-3">
        {routine.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-2">{routine.subtitle}</p>
        )}
      </div>
    </Card>
  );
}
