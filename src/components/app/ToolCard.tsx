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
          'flex flex-col items-center gap-2 p-3 w-20 shrink-0',
          'transition-transform active:scale-95',
          tool.comingSoon && 'opacity-70'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm',
          tool.bgColor
        )}>
          <IconComponent className={cn('h-6 w-6', tool.iconColor)} />
        </div>
        <div className="text-center">
          <span className="text-xs font-medium text-foreground block leading-tight">
            {tool.name}
          </span>
          {tool.comingSoon && (
            <span className="text-[10px] text-muted-foreground">
              Soon
            </span>
          )}
        </div>
      </button>
    );
  }

  // Compact size for Audio & Video section (3-column)
  if (size === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={tool.comingSoon}
        className={cn(
          'flex flex-col items-center gap-2',
          'transition-transform active:scale-95',
          tool.comingSoon && 'opacity-60'
        )}
      >
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm',
          tool.bgColor
        )}>
          <IconComponent className={cn('h-6 w-6', tool.iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {tool.name}
        </span>
      </button>
    );
  }

  // Default size for Wellness Tools (2-column grid cards)
  return (
    <button
      onClick={handleClick}
      disabled={tool.comingSoon}
      className={cn(
        'flex items-start gap-3 p-4 rounded-2xl bg-card',
        'border border-border/50 shadow-sm',
        'transition-transform active:scale-[0.97]',
        tool.comingSoon && 'opacity-60'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
        tool.bgColor
      )}>
        <IconComponent className={cn('h-6 w-6', tool.iconColor)} />
      </div>
      <div className="flex flex-col items-start min-w-0 pt-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight">
          {tool.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
          {tool.description}
        </p>
        {tool.comingSoon && (
          <span className="text-[10px] font-medium text-muted-foreground mt-1">
            Coming Soon
          </span>
        )}
      </div>
    </button>
  );
}
