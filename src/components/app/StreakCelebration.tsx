import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StreakCelebrationProps {
  open: boolean;
  onClose: () => void;
  isFirstAction?: boolean; // When true, shows special first-action celebration
}

const CONFETTI_COLORS = [
  '#a855f7', // violet-500
  '#8b5cf6', // violet-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
];

/**
 * Unified Celebration Component - Strength-first approach
 * 
 * Philosophy: "Simora measures depth of return, not length of absence."
 * - Celebrates showing up, not consecutive days
 * - Welcomes users back after gaps without shame
 * - Reinforces identity: "Your strength is still here"
 * - Special celebration for first action ever
 */
export const StreakCelebration = ({ open, onClose, isFirstAction = false }: StreakCelebrationProps) => {
  const { data: presence } = useUserPresence();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const thisMonthDays = presence?.thisMonthActiveDays || 1;
  const isReturning = presence?.isReturning || false;

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();

      // Trigger confetti for first action celebration
      if (isFirstAction && !hasTriggeredConfetti) {
        setHasTriggeredConfetti(true);
        
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.5 },
          colors: CONFETTI_COLORS,
          scalar: 0.9,
          ticks: 220,
        });

        setTimeout(() => {
          confetti({
            particleCount: 35,
            spread: 48,
            origin: { y: 0.45 },
            colors: CONFETTI_COLORS,
            scalar: 0.95,
            ticks: 200,
          });
        }, 350);
      }
    }
  }, [open, isFirstAction, hasTriggeredConfetti]);

  useEffect(() => {
    if (!open) {
      setHasTriggeredConfetti(false);
    }
  }, [open]);

  if (!open) return null;

  const lastActiveDate = presence?.lastActiveDate 
    ? new Date(presence.lastActiveDate)
    : new Date();

  // Generate week days for presence indicator (checkmarks, not streak)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      date: day,
      label: format(day, 'EEEEE'),
      isActive: day <= lastActiveDate && presence?.showedUpToday,
      isToday: isSameDay(day, new Date()),
    };
  });

  // Messages based on context
  const getMessage = () => {
    if (isFirstAction) {
      return "Your first action is in.\nKeep it small. Keep it kind.";
    }
    if (isReturning) {
      return "Your strength is still here. Welcome back.";
    }
    if (thisMonthDays === 1) {
      return "You showed up. That's strength.";
    }
    if (thisMonthDays <= 3) {
      return "You're here again. ✨";
    }
    if (thisMonthDays === 7) {
      return "7 days this month. You keep showing up.";
    }
    if (thisMonthDays >= 14) {
      return "You've shown up so many times. That's real strength.";
    }
    return `${thisMonthDays} days this month. You're building something.`;
  };

  const getTitle = () => {
    if (isFirstAction) {
      return "You showed up for yourself";
    }
    return `${thisMonthDays} ${thisMonthDays === 1 ? 'day' : 'days'}`;
  };

  const getSubtitle = () => {
    if (isFirstAction) {
      return null;
    }
    return "this month";
  };

  const getIcon = () => {
    if (isFirstAction) {
      return <Heart className="h-9 w-9 fill-current" />;
    }
    if (isReturning) {
      return '💜';
    }
    return '✨';
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Gentle overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div 
        className={cn(
          'relative bg-gradient-to-b from-violet-900 to-indigo-900 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={cn(
          'mb-4 transition-transform duration-700 flex justify-center',
          isAnimating && 'animate-pulse'
        )}>
          {isFirstAction ? (
            <div className="grid place-items-center size-20 rounded-2xl bg-violet-500 text-white shadow-lg">
              {getIcon()}
            </div>
          ) : (
            <span className="text-5xl">{getIcon()}</span>
          )}
        </div>

        {/* Title */}
        <div className={cn(
          'text-2xl font-semibold text-white mb-2 transition-all duration-500 delay-200',
          isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          !isFirstAction && 'text-4xl'
        )}>
          {getTitle()}
        </div>
        
        {/* Subtitle */}
        {getSubtitle() && (
          <p className="text-white/60 text-sm mb-4">{getSubtitle()}</p>
        )}

        {/* Message */}
        <p className="text-white/80 text-sm mb-6 leading-relaxed whitespace-pre-line">
          {getMessage()}
        </p>

        {/* Week presence indicator - only show for non-first-action */}
        {!isFirstAction && (
          <div className="flex justify-center gap-2 mb-6">
            {weekDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div 
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all',
                    day.isToday
                      ? 'bg-violet-500 text-white ring-2 ring-violet-300'
                      : day.isActive
                      ? 'bg-violet-500/50 text-white'
                      : 'bg-white/10 text-white/40'
                  )}
                >
                  {day.isActive || day.isToday ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    day.label
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Button */}
        <Button
          onClick={onClose}
          className="w-full bg-white hover:bg-white/90 text-violet-900 font-medium py-3 rounded-xl"
        >
          {isFirstAction ? (
            'Continue'
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              I'm here
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
