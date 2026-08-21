import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { ToolConfig } from '@/lib/toolsConfig';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Crown, Check, X } from 'lucide-react';
import { useTodayMood } from '@/hooks/useMoodLogs';
import { usePeach } from '@/lib/peachPalette';
import { 
  BookOpen, Wind, Droplets, Sparkles, Brain, Dumbbell, Waves,
  Bot, Trophy, Smile, Heart, Timer, Palette, PenLine, ClipboardCheck, Target, Circle, 
  GraduationCap, User, HeartHandshake, CalendarPlus, Clock, Headphones, Plus, Wand2, Play, Flame, LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Wind, Droplets, Sparkles, Brain, Dumbbell, Waves,
  Bot, Trophy, Smile, Heart, Timer, Palette, PenLine, ClipboardCheck, Target, Circle,
  GraduationCap, User, HeartHandshake, CalendarPlus, Clock, Headphones, Plus, Wand2, Play, Flame
};

// Tools that require simora+ subscription
const LOCKED_TOOLS = ['ai', 'projects'];

interface ToolCardProps {
  tool: ToolConfig;
  size?: 'default' | 'compact' | 'teaser';
  className?: string;
}

export function ToolCard({ tool, size = 'default', className }: ToolCardProps) {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const { data: todayMood } = useTodayMood();
  const [showPaywall, setShowPaywall] = useState(false);
  const IconComponent = iconMap[tool.icon] || Circle;
  const isPremiumTool = LOCKED_TOOLS.includes(tool.id);
  const isLocked = isPremiumTool && !isSubscribed;
  const isMoodTool = tool.id === 'mood';
  const peachBg = usePeach(tool.id);

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
    // Handle special action routes
    if (tool.route === '__action:new-task') {
      // Navigate to home first, then open quick-add after mount
      navigate('/app/home');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('quick-add-open', { detail: { defaultRepeat: 'Daily' } }));
      }, 300);
      return;
    }
    if (tool.route === '__action:new-routine') {
      navigate('/app/routineplayer', { state: { openBuilder: true } });
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
          {tool.emoji ? (
            <FluentEmoji emoji={tool.emoji} size={32} />
          ) : (
            <IconComponent className={cn('h-5 w-5', tool.iconColor)} />
          )}
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

  // Compact size for grid icon cards (5 columns, no horizontal scroll)
  if (size === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={tool.comingSoon}
          className={cn(
            'relative flex flex-col items-center gap-1.5 w-full',
            'transition-transform active:scale-95',
            tool.comingSoon && 'opacity-60',
            className
          )}
        >
          {isPremiumTool && !isSubscribed ? (
            <div className="absolute -top-2.5 left-0 z-10 inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full shadow-sm">
              <Crown className="h-2.5 w-2.5" /> PLUS
            </div>
          ) : !isPremiumTool && !isSubscribed ? (
            <div className="absolute -top-2.5 left-0 z-10 inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-800 bg-[#E2F9F0] px-1.5 py-0.5 rounded-full shadow-sm">
              <FluentEmoji emoji="🔥" size={10} /> FREE
            </div>
          ) : null}
          <div
            className="w-full aspect-square max-w-[68px] rounded-[26px] flex items-center justify-center relative"
            style={{ backgroundColor: peachBg }}
          >
            {tool.emoji ? (
              <FluentEmoji emoji={tool.emoji} size={44} />
            ) : (
              <IconComponent className={cn('h-7 w-7', tool.iconColor)} />
            )}
            {isLocked && (
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-100">
                <FluentEmoji emoji="🔒" size={14} />
              </div>
            )}
            {isMoodTool && !isLocked && (
              todayMood ? (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm bg-emerald-500">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              ) : (
                <span className="absolute -bottom-1.5 -right-1.5 text-[14px] leading-none">⭕️</span>
              )
            )}
          </div>
          <span className="text-[12px] font-medium text-foreground w-full text-center leading-tight line-clamp-2">
            {tool.name}
          </span>
        </button>
        <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
      </>
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
          {tool.emoji ? (
            <FluentEmoji emoji={tool.emoji} size={28} />
          ) : (
            <IconComponent className={cn('h-4.5 w-4.5', tool.iconColor)} />
          )}
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
        {isPremiumTool && !isSubscribed && (
          <div className="absolute -top-2 -left-1 z-10 inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full shadow-sm">
            <Crown className="h-2.5 w-2.5" /> PLUS
          </div>
        )}
        {isLocked && (
          <div className="ml-auto flex-shrink-0 p-1.5 rounded-full bg-amber-100">
            <FluentEmoji emoji="🔒" size={18} />
          </div>
        )}
      </button>
      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
