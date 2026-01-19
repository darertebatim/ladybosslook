import * as LucideIcons from 'lucide-react';
import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoutinePlan } from '@/hooks/useRoutinePlans';

interface RoutinePlanCardProps {
  plan: RoutinePlan;
  onClick?: () => void;
  variant?: 'default' | 'compact';
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
};

export function RoutinePlanCard({ plan, onClick, variant = 'default' }: RoutinePlanCardProps) {
  const IconComponent = (LucideIcons as any)[plan.icon] || LucideIcons.Sparkles;
  const gradient = colorGradients[plan.color] || colorGradients.yellow;
  const bgColor = colorBackgrounds[plan.color] || colorBackgrounds.yellow;

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-3 rounded-2xl w-full text-left transition-all active:scale-[0.98]',
          bgColor
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
          gradient
        )}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{plan.title}</h3>
          {plan.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{plan.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{plan.estimated_minutes}m</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden w-full min-w-0 transition-all active:scale-[0.98] aspect-[4/5]"
    >
      {/* Cover Image or Gradient - Full Card */}
      {plan.cover_image_url ? (
        <img
          src={plan.cover_image_url}
          alt={plan.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={cn(
          'absolute inset-0 w-full h-full bg-gradient-to-br flex items-center justify-center',
          gradient
        )}>
          <IconComponent className="w-16 h-16 text-white/30" />
        </div>
      )}
      
      {/* Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Points badge - Top Right */}
      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span>{plan.points}</span>
      </div>

      {/* Content - Overlaid at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <h3 className="font-semibold text-white line-clamp-2 text-sm drop-shadow-md">{plan.title}</h3>
        {plan.subtitle && (
          <p className="text-xs text-white/70 line-clamp-1 mt-0.5">{plan.subtitle}</p>
        )}
        
        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{plan.estimated_minutes} min</span>
          </div>
          {plan.average_rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{plan.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
