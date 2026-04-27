import { useEffect, useState } from 'react';
import { getDay } from 'date-fns';
import { useAppReview } from '@/hooks/useAppReview';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Flame, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoftReviewPrompt } from './SoftReviewPrompt';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { useShareContent } from '@/hooks/useShareContent';
import streakFlameImg from '@/assets/streak-flame-3d.png';

interface StreakCelebrationProps {
  open: boolean;
  onClose: () => void;
  isFirstAction?: boolean;
  onShowGoalSelection?: () => void;
  shouldShowGoalSelection?: boolean;
  currentStreak?: number;
}

const CONFETTI_COLORS = [
  '#fb923c', '#f97316', '#ea580c', '#fbbf24', '#fcd34d',
];

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Me+-inspired Streak Day Celebration
 * Shows daily streak count with flame icon, week progress bar, and motivational message.
 */
export const StreakCelebration = ({
  open,
  onClose,
  isFirstAction = false,
  onShowGoalSelection,
  shouldShowGoalSelection = false,
  currentStreak = 1,
}: StreakCelebrationProps) => {
  const { maybeRequestReview, shouldShowForStreak } = useAppReview();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  const { handleShare } = useShareContent({
    title: `${currentStreak}-day streak on Rilo 🔥`,
    text: `🔥 ${currentStreak}-day streak on Rilo! Building habits one day at a time.`,
    source: 'streak_milestone',
    contentId: `${currentStreak}d`,
  });

  const handleClose = async () => {
    onClose();
    if (shouldShowGoalSelection && onShowGoalSelection) {
      setTimeout(() => onShowGoalSelection(), 300);
      return;
    }
    if (shouldShowForStreak(currentStreak)) {
      setTimeout(() => setShowReviewPrompt(true), 300);
    }
  };

  const handleAcceptReview = async () => {
    setShowReviewPrompt(false);
    await maybeRequestReview('streak_celebration');
  };

  const handleDeclineReview = () => {
    setShowReviewPrompt(false);
  };

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();
      if (!hasTriggeredConfetti) {
        setHasTriggeredConfetti(true);
        confetti({
          particleCount: 60, spread: 55, origin: { y: 0.4 },
          colors: CONFETTI_COLORS, scalar: 0.9, ticks: 200,
        });
        if (currentStreak >= 7) {
          setTimeout(() => {
            confetti({
              particleCount: 40, spread: 45, origin: { y: 0.35 },
              colors: CONFETTI_COLORS, scalar: 0.95, ticks: 180,
            });
          }, 350);
        }
      }
    }
  }, [open, hasTriggeredConfetti, currentStreak]);

  useEffect(() => {
    if (!open) setHasTriggeredConfetti(false);
  }, [open]);

  if (!open) return null;

  // Current day of week (0=Sun), convert to Mon-start index (0=Mon)
  const jsDay = getDay(new Date()); // 0=Sun
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun

  // How many days this week the user has been active (streak capped to week position)
  const streakDaysThisWeek = Math.min(currentStreak, todayIndex + 1);

  const getMessage = () => {
    if (currentStreak === 1) return "A streak is born! Keep it up\nevery day to help it grow.";
    if (currentStreak === 2) return "Two in a row! You're\nbuilding momentum.";
    if (currentStreak === 3) return "Your habit is getting stronger—\nlet's keep it going!";
    if (currentStreak <= 6) return "You're on fire! Keep showing up.";
    return `${currentStreak} days strong! Nothing can stop you.`;
  };

  // Week progress percentage (out of 7 days)
  const progressPercent = Math.min((streakDaysThisWeek / 7) * 100, 100);

  return (
    <OverlayPortal>
    <div
      className="fixed inset-0 z-[10100] flex flex-col justify-end pb-[env(safe-area-inset-bottom)]"
      onClick={handleClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Content wrapper to keep flame above card */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Flame icon floating above the card */}
        <div className="mb-[-40px] z-20">
          <img
            src={streakFlameImg}
            alt="Streak flame"
            className={cn(
              'w-24 h-24 object-contain drop-shadow-2xl transition-all duration-700',
              isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            )}
          />
        </div>

        {/* Card */}
        <div
          className={cn(
            'relative z-10 w-full bg-gray-800/95 rounded-t-3xl px-6 pt-14 pb-8 transition-all duration-500',
            isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Streak count */}
          <div className={cn(
            'text-center mb-1 transition-all duration-500 delay-150',
            isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          )}>
            <span className="text-6xl font-bold text-orange-400">
              {currentStreak}
            </span>
          </div>
          <p className="text-center text-white/50 text-sm mb-4">
            {currentStreak === 1 ? 'day streak' : 'days streak'}
          </p>

          {/* Message */}
          <p className="text-center text-white/80 text-sm leading-relaxed whitespace-pre-line mb-6">
            {getMessage()}
          </p>

          {/* Week progress bar */}
          <div className="mb-2">
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${progressPercent}%`,
                  background: 'repeating-linear-gradient(45deg, #fb923c, #fb923c 6px, #fdba74 6px, #fdba74 12px)',
                }}
              />
            </div>
            {/* Small flame indicator below the bar */}
            {progressPercent > 0 && (
              <div className="relative h-0">
                <div
                  className="absolute -top-[22px] -translate-x-1/2 transition-all duration-700"
                  style={{ left: `${progressPercent}%` }}
                >
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                    <Flame className="w-3 h-3 text-white" fill="currentColor" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Weekday labels */}
          <div className="flex justify-between px-1 mb-8">
            {WEEKDAY_LABELS.map((label, i) => {
              const isActive = i < streakDaysThisWeek;
              const isToday = i === todayIndex;
              return (
                <span
                  key={i}
                  className={cn(
                    'text-xs font-medium w-6 text-center transition-colors',
                    isToday
                      ? 'text-orange-400 font-bold'
                      : isActive
                      ? 'text-orange-400/60'
                      : 'text-white/30'
                  )}
                >
                  {label}
                </span>
              );
            })}
          </div>

          {/* CTA */}
          <div className="flex gap-2">
            <Button
              onClick={(e) => { e.stopPropagation(); haptic.light(); handleShare(); }}
              className="px-4 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl text-base"
              aria-label="Share streak"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-base"
            >
              I'm committed
            </Button>
          </div>
        </div>
      </div>

      <SoftReviewPrompt
        isOpen={showReviewPrompt}
        onClose={handleDeclineReview}
        onAccept={handleAcceptReview}
      />
    </div>
    </OverlayPortal>
  );
};
