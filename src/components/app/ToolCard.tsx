import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { ToolConfig } from '@/lib/toolsConfig';
import { 
  BookOpen, Wind, Droplets, Sparkles, Brain, Dumbbell, Waves,
  Bot, Trophy, Smile, Heart, Timer, Palette, PenLine, ClipboardCheck, Target, Circle, LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Wind, Droplets, Sparkles, Brain, Dumbbell, Waves,
  Bot, Trophy, Smile, Heart, Timer, Palette, PenLine, ClipboardCheck, Target, Circle
};

interface ToolCardProps {
  tool: ToolConfig;
  size?: 'default' | 'compact' | 'teaser';
}

export function ToolCard({ tool, size = 'default' }: ToolCardProps) {
  const navigate = useNavigate();
  
  // Get the icon component from the map
  const IconComponent = iconMap[tool.icon] || Circle;

  const handleClick = () => {
    if (tool.comingSoon) {
      haptic.light();
      return;
    }
    haptic.light();
    navigate(tool.route);
  };

  // Teaser size for Coming Soon horizontal scroll
  if (size === 'teaser') {
    return (
      <button
        onClick={handleClick}
        disabled={tool.comingSoon}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 p-4 w-24 shrink-0',
          'rounded-2xl transition-all duration-300',
          'bg-white/40 dark:bg-white/5 backdrop-blur-sm',
          'border border-white/60 dark:border-white/10',
          'shadow-sm',
          tool.comingSoon && 'opacity-70'
        )}
      >
        {/* Icon Container */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br shadow-md',
          tool.iconGradient
        )}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>

        {/* Title */}
        <span className="text-xs font-medium text-foreground/80 text-center leading-tight">
          {tool.name}
        </span>

        {/* Coming Soon Badge */}
        {tool.comingSoon && (
          <span className="absolute -top-1 -right-1 text-[8px] font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
            Soon
          </span>
        )}
      </button>
    );
  }

  // Compact size for Audio & Video section
  if (size === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={tool.comingSoon}
        className={cn(
          'group relative overflow-hidden rounded-2xl p-3 aspect-square',
          'flex flex-col items-center justify-center gap-2',
          'bg-gradient-to-br backdrop-blur-md',
          'border border-white/40 dark:border-white/10',
          'shadow-sm hover:shadow-lg',
          'transition-all duration-300 active:scale-[0.97]',
          'hover:-translate-y-0.5',
          tool.gradient,
          tool.comingSoon && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Decorative glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon Container */}
        <div className={cn(
          'relative w-11 h-11 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br shadow-lg',
          'group-hover:scale-105 transition-transform duration-300',
          tool.iconGradient
        )}>
          <IconComponent className="h-5 w-5 text-white drop-shadow-sm" />
        </div>

        {/* Title */}
        <h3 className="relative font-semibold text-foreground text-xs leading-tight text-center">
          {tool.name}
        </h3>

        {/* Coming Soon Badge */}
        {tool.comingSoon && (
          <span className="absolute top-2 right-2 text-[8px] font-semibold bg-white/80 dark:bg-black/40 text-muted-foreground px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            Soon
          </span>
        )}
      </button>
    );
  }

  // Default size for Wellness Tools
  return (
    <button
      onClick={handleClick}
      disabled={tool.comingSoon}
      className={cn(
        'group relative overflow-hidden rounded-3xl p-4 aspect-[4/3]',
        'flex flex-col items-start justify-between',
        'bg-gradient-to-br backdrop-blur-md',
        'border border-white/50 dark:border-white/10',
        'shadow-md hover:shadow-xl',
        'transition-all duration-300 active:scale-[0.98]',
        'hover:-translate-y-1',
        tool.gradient,
        tool.comingSoon && 'opacity-60 cursor-not-allowed'
      )}
    >
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon Container */}
      <div className={cn(
        'relative w-12 h-12 rounded-2xl flex items-center justify-center',
        'bg-gradient-to-br shadow-lg',
        'group-hover:scale-105 group-hover:shadow-xl transition-all duration-300',
        tool.iconGradient
      )}>
        <IconComponent className="h-6 w-6 text-white drop-shadow-sm" />
      </div>

      {/* Text Content */}
      <div className="relative mt-auto">
        <h3 className="font-bold text-foreground text-sm leading-tight">
          {tool.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">
          {tool.description}
        </p>
      </div>

      {/* Coming Soon Badge */}
      {tool.comingSoon && (
        <span className="absolute top-3 right-3 text-[9px] font-semibold bg-white/80 dark:bg-black/40 text-muted-foreground px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
          Coming Soon
        </span>
      )}
    </button>
  );
}
