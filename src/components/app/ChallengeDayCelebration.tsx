import { useEffect, useState } from 'react';
import { Flame, Sparkles, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import confetti from 'canvas-confetti';

interface ChallengeDayCelebrationProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  challengeEmoji: string;
  currentDay: number;
  totalDays: number;
}

const CHALLENGE_CONFETTI_COLORS = [
  '#f97316', // Orange
  '#fb923c', // Light orange
  '#fbbf24', // Amber
  '#ef4444', // Red accent
  '#fdba74', // Soft orange
];

/**
 * Full-page celebration when user completes all challenge tasks for the day.
 * Styled with a warm fiery gradient theme, distinct from the Gold streak celebration.
 */
export const ChallengeDayCelebration = ({
  open,
  onClose,
  challengeTitle,
  challengeEmoji,
  currentDay,
  totalDays,
}: ChallengeDayCelebrationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const progress = Math.round((currentDay / totalDays) * 100);
  const isHalfway = currentDay === Math.ceil(totalDays / 2);
  const isAlmostDone = currentDay >= totalDays - 3 && currentDay < totalDays;
  const isComplete = currentDay >= totalDays;

  useEffect(() => {
    if (!open) {
      setIsAnimating(false);
      setShowStats(false);
      return;
    }

    setIsAnimating(true);
    haptic.success();

    // Burst confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.35, x: 0.5 },
      colors: CHALLENGE_CONFETTI_COLORS,
      scalar: 1.1,
      ticks: 250,
    });

    const t1 = setTimeout(() => setShowStats(true), 500);
    const t2 = setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.3, x: 0.35 },
        colors: CHALLENGE_CONFETTI_COLORS,
        scalar: 0.9,
      });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.3, x: 0.65 },
        colors: CHALLENGE_CONFETTI_COLORS,
        scalar: 0.9,
      });
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  if (!open) return null;

  // Motivational messages based on progress
  let motivationText = "Great work! Keep showing up 💪";
  if (isComplete) {
    motivationText = "You did it! The entire challenge is complete! 🎉";
  } else if (isAlmostDone) {
    motivationText = "So close to the finish line! Don't stop now! 🏁";
  } else if (isHalfway) {
    motivationText = "Halfway there! You're unstoppable! ⚡";
  } else if (currentDay <= 3) {
    motivationText = "Amazing start! Momentum is building! 🚀";
  } else if (currentDay >= 7) {
    motivationText = "A full week in! You're building real discipline 💪";
  }

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[9999] flex flex-col"
        onClick={onClose}
      >
        {/* Warm fiery gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #7c2d12 0%, #9a3412 20%, #c2410c 45%, #ea580c 70%, #f97316 100%)',
          }}
        />

        {/* Radial glow from center */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Subtle ember particles */}
        <div className="absolute top-20 left-8 w-2 h-2 rounded-full bg-amber-300/50 animate-pulse" />
        <div className="absolute top-32 right-10 w-1.5 h-1.5 rounded-full bg-yellow-200/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-48 left-16 w-1 h-1 rounded-full bg-orange-200/50 animate-pulse" style={{ animationDelay: '0.6s' }} />
        <div className="absolute top-40 right-20 w-2 h-2 rounded-full bg-amber-200/30 animate-pulse" style={{ animationDelay: '0.9s' }} />
        <Sparkles className="absolute top-28 right-6 w-4 h-4 text-amber-300/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <Sparkles className="absolute top-56 left-6 w-3 h-3 text-yellow-300/30 animate-pulse" style={{ animationDelay: '0.5s' }} />

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center right-4"
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        {/* Content */}
        <div
          className={cn(
            'relative z-10 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500',
            isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Emoji badge with glow */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full scale-[2] animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 60%)',
              }}
            />
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 0 40px rgba(251, 191, 36, 0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <span className="text-5xl">{challengeEmoji}</span>
            </div>
          </div>

          {/* Day counter - hero number */}
          <div className="mb-2">
            <span
              className="text-6xl font-bold text-white"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
            >
              Day {currentDay}
            </span>
          </div>
          <p className="text-orange-100/80 text-base font-medium mb-1">
            of {totalDays} — {challengeTitle}
          </p>

          {/* Flame icon divider */}
          <Flame
            className="w-6 h-6 text-amber-300/70 my-4"
            fill="rgba(251, 191, 36, 0.3)"
          />

          {/* Progress bar */}
          <div
            className={cn(
              'w-full max-w-[300px] mb-6 transition-all duration-700',
              showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex justify-between text-xs text-orange-100/60 mb-2 font-medium">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-orange-100/40 mt-1.5">
              <span>Day 1</span>
              <span>Day {totalDays}</span>
            </div>
          </div>

          {/* Motivation message */}
          <div
            className={cn(
              'bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3.5 max-w-[300px] mb-8 border border-white/10 transition-all duration-700',
              showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <p className="text-white/90 text-center text-sm font-medium">
              {motivationText}
            </p>
          </div>

          {/* Milestone badges (if applicable) */}
          {(isHalfway || isAlmostDone || currentDay === 7 || currentDay === 1) && (
            <div
              className={cn(
                'flex items-center gap-2 mb-6 transition-all duration-700',
                showStats ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              )}
            >
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-xs font-semibold text-white/90">
                  {isComplete ? '🎉 Challenge Complete!' :
                   isHalfway ? '⚡ Halfway Milestone' :
                   isAlmostDone ? '🏁 Almost There!' :
                   currentDay === 7 ? '🔥 1 Week Strong' :
                   '🚀 Day 1 Unlocked'}
                </span>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-4" />

          {/* CTA Button */}
          <div
            className="w-full flex justify-center"
            style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <Button
              onClick={onClose}
              className="w-full max-w-[320px] h-14 bg-white hover:bg-white/90 text-orange-700 font-bold text-base rounded-2xl shadow-xl border-0"
              style={{
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.15)',
              }}
            >
              Keep Going! 🔥
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};
