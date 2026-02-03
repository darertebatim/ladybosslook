import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useAppReview } from '@/hooks/useAppReview';
import { AppReviewPrompt } from '@/components/app/AppReviewPrompt';
import { FeedbackSheet } from '@/components/app/FeedbackSheet';
import { Check, Sparkles } from 'lucide-react';

interface ReturnCelebrationProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Return Celebration - Strength-first approach
 * 
 * Philosophy: "Simora measures depth of return, not length of absence."
 * - Celebrates showing up, not consecutive days
 * - Welcomes users back after gaps without shame
 * - Reinforces identity: "Your strength is still here"
 */
export const StreakCelebration = ({ open, onClose }: ReturnCelebrationProps) => {
  const { data: presence } = useUserPresence();
  const [isAnimating, setIsAnimating] = useState(false);
  const {
    isPromptOpen,
    isFeedbackOpen,
    checkAndPromptReview,
    handleRating,
    handleFeedbackSubmit,
    handleDismiss,
    closeFeedback,
  } = useAppReview();

  const thisMonthDays = presence?.thisMonthActiveDays || 1;
  const isReturning = presence?.isReturning || false;

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();
    }
  }, [open]);

  // Trigger review prompt on milestones (7, 14, 21 days this month)
  useEffect(() => {
    if (open && (thisMonthDays === 7 || thisMonthDays === 14 || thisMonthDays === 21)) {
      const timer = setTimeout(() => {
        checkAndPromptReview('streak_milestone');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, thisMonthDays, checkAndPromptReview]);

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

  // Strength-first messages (no streak anxiety)
  const getMessage = () => {
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

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Gentle overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content - softer, calmer design */}
      <div 
        className={cn(
          'relative bg-gradient-to-b from-violet-900 to-indigo-900 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gentle sparkle icon instead of fire */}
        <div className={cn(
          'text-5xl mb-4 transition-transform duration-700',
          isAnimating && 'animate-pulse'
        )}>
          {isReturning ? '💜' : '✨'}
        </div>

        {/* Days this month - framed as presence, not performance */}
        <div className={cn(
          'text-4xl font-semibold text-white mb-2 transition-all duration-500 delay-200',
          isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}>
          {thisMonthDays} {thisMonthDays === 1 ? 'day' : 'days'}
        </div>
        <p className="text-white/60 text-sm mb-4">this month</p>

        {/* Message - identity reinforcement */}
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          {getMessage()}
        </p>

        {/* Week presence indicator - checkmarks, not streak counter */}
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

        {/* Present-focused button (not commitment) */}
        <Button
          onClick={onClose}
          className="w-full bg-white hover:bg-white/90 text-violet-900 font-medium py-3 rounded-xl"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          I'm here
        </Button>
      </div>

      {/* App Review Prompt */}
      <AppReviewPrompt
        isOpen={isPromptOpen}
        onRate={handleRating}
        onDismiss={handleDismiss}
      />

      {/* Feedback Sheet for unhappy users */}
      <FeedbackSheet
        isOpen={isFeedbackOpen}
        onSubmit={handleFeedbackSubmit}
        onClose={closeFeedback}
      />
    </div>
  );
};
