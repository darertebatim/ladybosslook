import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { ToolConfig } from '@/lib/toolsConfig';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Crown } from 'lucide-react';
import { 
  BookOpen, Wind, Droplets, Sparkles, Brain, Dumbbell, Waves,
  Bot, Trophy, Smile, Heart, Timer, Palette, PenLine, ClipboardCheck, Target, Circle, 
  GraduationCap, User, HeartHandshake, LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Wind, Droplets, Sparkles, Brain, Dumbbell, Waves,
  Bot, Trophy, Smile, Heart, Timer, Palette, PenLine, ClipboardCheck, Target, Circle,
  GraduationCap, User, HeartHandshake
};

// Tools that require simora+ subscription
const LOCKED_TOOLS = ['fasting', 'emotions'];

interface ToolCardProps {
  tool: ToolConfig;
  size?: 'default' | 'compact' | 'teaser';
  className?: string;
}

export function ToolCard({ tool, size = 'default', className }: ToolCardProps) {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const IconComponent = iconMap[tool.icon] || Circle;
  const isLocked = LOCKED_TOOLS.includes(tool.id) && !isSubscribed;

  const handleClick = () => {
    if (tool.comingSoon) {
      haptic.light();
      return;
    }
    haptic.light();
    if (isLocked) {
      setShowPaywall(true);
      return;
    }
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

  // Default size for Wellness Tools (2-column grid cards) - with pastel background
  return (
    <>
      <button
        onClick={handleClick}
        disabled={tool.comingSoon}
        className={cn(
          'relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl',
          'shadow-sm border border-black/5',
          'transition-transform active:scale-[0.97]',
          tool.bgColor,
          tool.comingSoon && 'opacity-60',
          className
        )}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/60">
          <IconComponent className={cn('h-4.5 w-4.5', tool.iconColor)} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <h3 className="font-semibold text-foreground text-[13px] leading-tight">
            {tool.name}
          </h3>
          <p className="text-[11px] text-foreground/80 leading-tight truncate">
            {tool.description}
          </p>
          {tool.comingSoon && (
            <span className="text-[9px] font-medium text-muted-foreground">
              Coming Soon
            </span>
          )}
        </div>
        {isLocked && (
          <>
            <div className="absolute -top-2 -left-1 z-10 inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full shadow-sm">
              <Crown className="h-2.5 w-2.5" /> PLUS
            </div>
            <div className="ml-auto flex-shrink-0 p-1.5 rounded-full bg-amber-100">
              <FluentEmoji emoji="🔒" size={18} />
            </div>
          </>
        )}
      </button>
      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
