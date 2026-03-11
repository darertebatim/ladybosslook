import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useAppReview } from '@/hooks/useAppReview';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Heart, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoftReviewPrompt } from './SoftReviewPrompt';
import { WeeklyPresenceGrid } from './WeeklyPresenceGrid';

interface StreakCelebrationProps {
  open: boolean;
  onClose: () => void;
  isFirstAction?: boolean;
  onShowGoalSelection?: () => void;
  shouldShowGoalSelection?: boolean;
  /** Current consecutive day streak count */
  streakCount?: number;
}

const CONFETTI_COLORS = [
  '#fb923c', // orange-400
  '#f97316', // orange-500
  '#ea580c', // orange-600
  '#fbbf24', // amber-400
  '#fcd34d', // amber-300
];

/**
 * Daily Streak Celebration - shows current consecutive day streak.
 * Triggered every time user completes their first action of the day.
 */
export const StreakCelebration = ({ 
  open, 
  onClose, 
  isFirstAction = false,
  onShowGoalSelection,
  shouldShowGoalSelection = false,
  streakCount = 1,
}: StreakCelebrationProps) => {
  const { maybeRequestReview, shouldShowForStreak } = useAppReview();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  const handleClose = async () => {
    onClose();
    
    if (shouldShowGoalSelection && onShowGoalSelection) {
      setTimeout(() => {
        onShowGoalSelection();
      }, 300);
      return;
    }
    
    if (shouldShowForStreak(streakCount)) {
      setTimeout(() => {
        setShowReviewPrompt(true);
      }, 300);
    }
  };

  const handleAcceptReview = async () => {
    setShowReviewPrompt(false);
    await maybeRequestReview();
  };

  const handleDeclineReview = () => {
    setShowReviewPrompt(false);
  };

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();

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

  const getMessage = () => {
    if (isFirstAction) {
      return "Your first action is in.\nKeep it small. Keep it kind.";
    }
    if (streakCount >= 100) {
      return "Triple digits. You're a legend. 💎";
    }
    if (streakCount >= 50) {
      return "50+ days of consistency.\nThat's extraordinary. 🏆";
    }
    if (streakCount >= 30) {
      return "A full month. This is who you are now. 👑";
    }
    if (streakCount >= 21) {
      return "They say 21 days builds a habit.\nYou just did it. 🌟";
    }
    if (streakCount >= 14) {
      return "Two weeks strong. You're unstoppable. 💪";
    }
    if (streakCount >= 7) {
      return "A full week of showing up. That takes real commitment. ⚡";
    }
    if (streakCount >= 3) {
      return "You're building momentum. Keep it going! 🔥";
    }
    if (streakCount === 2) {
      return "Day 2. You came back. That's everything.";
    }
    return "You showed up. That's strength.";
  };

  const getTitle = () => {
    if (isFirstAction) {
      return "You showed up for yourself";
    }
    return `${streakCount} ${streakCount === 1 ? 'day' : 'days'}`;
  };

  const getSubtitle = () => {
    if (isFirstAction) return null;
    return "streak";
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Gentle overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div 
        className={cn(
          'relative bg-gradient-to-b from-orange-400 to-orange-500 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
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
            <div className="grid place-items-center size-20 rounded-2xl bg-orange-400 text-white shadow-lg">
              <Heart className="h-9 w-9 fill-current" />
            </div>
          ) : (
            <div className="grid place-items-center size-20 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5)',
              }}
            >
              <Flame className="h-10 w-10 text-white" strokeWidth={1.5} fill="rgba(255,255,255,0.3)" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className={cn(
          'text-2xl font-semibold text-white mb-1 transition-all duration-500 delay-200',
          isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          !isFirstAction && 'text-4xl font-bold'
        )}>
          {getTitle()}
        </div>
        
        {/* Subtitle */}
        {getSubtitle() && (
          <p className="text-white/70 text-lg font-medium mb-3">{getSubtitle()}</p>
        )}

        {/* Message */}
        <p className="text-white/80 text-sm mb-6 leading-relaxed whitespace-pre-line">
          {getMessage()}
        </p>

        {/* Weekly presence grid - only show for non-first-action */}
        {!isFirstAction && (
          <div className="mb-6">
            <WeeklyPresenceGrid variant="dark" />
          </div>
        )}

        {/* Button */}
        <Button
          onClick={handleClose}
          className="w-full bg-white hover:bg-white/90 text-orange-600 font-medium py-3 rounded-xl"
        >
          {isFirstAction ? (
            'Continue'
          ) : (
            <>
              <Flame className="h-4 w-4 mr-2" />
              Keep Going
            </>
          )}
        </Button>
      </div>

      {/* Soft Review Prompt */}
      <SoftReviewPrompt
        isOpen={showReviewPrompt}
        onClose={handleDeclineReview}
        onAccept={handleAcceptReview}
      />
    </div>
  );
};
