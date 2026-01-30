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
          'flex flex-col items-center gap-1.5 w-16 shrink-0',
          'transition-transform active:scale-95',
          tool.comingSoon && 'opacity-70'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          tool.bgColor
        )}>
          <IconComponent className={cn('h-5 w-5', tool.iconColor)} />
        </div>
        <div className="text-center">
          <span className="text-[10px] font-medium text-foreground block leading-tight">
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
          'flex flex-col items-center gap-1.5',
          'transition-transform active:scale-95',
          tool.comingSoon && 'opacity-60'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          tool.bgColor
        )}>
          <IconComponent className={cn('h-5 w-5', tool.iconColor)} />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {tool.name}
        </span>
      </button>
    );
  }

  // Default size for Wellness Tools (2-column grid cards) - compact version
  return (
    <button
      onClick={handleClick}
      disabled={tool.comingSoon}
      className={cn(
        'flex items-center gap-2.5 p-3 rounded-xl bg-card',
        'border border-border/40 shadow-sm',
        'transition-transform active:scale-[0.97]',
        tool.comingSoon && 'opacity-60'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        tool.bgColor
      )}>
        <IconComponent className={cn('h-5 w-5', tool.iconColor)} />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <h3 className="font-semibold text-foreground text-[13px] leading-tight">
          {tool.name}
        </h3>
        <p className="text-[11px] text-muted-foreground leading-tight">
          {tool.description}
        </p>
        {tool.comingSoon && (
          <span className="text-[9px] font-medium text-muted-foreground">
            Coming Soon
          </span>
        )}
      </div>
    </button>
  );
}
