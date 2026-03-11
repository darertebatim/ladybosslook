import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface StreakMilestoneCelebrationProps {
  open: boolean;
  streak: number;
  onClose: () => void;
}

const MILESTONE_CONFIG: Record<number, { emoji: string; title: string; message: string }> = {
  3: { emoji: '🔥', title: '3-Day Streak!', message: "You're building momentum. Keep it going!" },
  7: { emoji: '⚡', title: '7-Day Streak!', message: 'A full week of showing up. That takes real commitment.' },
  14: { emoji: '💪', title: '14-Day Streak!', message: "Two weeks strong. You're unstoppable." },
  21: { emoji: '🌟', title: '21-Day Streak!', message: "They say 21 days builds a habit.\nYou just did it." },
  30: { emoji: '👑', title: '30-Day Streak!', message: 'A full month. This is who you are now.' },
  50: { emoji: '🏆', title: '50-Day Streak!', message: "50 days of consistency.\nThat's extraordinary." },
  100: { emoji: '💎', title: '100-Day Streak!', message: "Triple digits. You're a legend." },
};

const CONFETTI_COLORS = ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#8b5cf6'];

/**
 * Full-screen streak milestone celebration.
 * Triggered at specific streak milestones (3, 7, 14, 21, 30, 50, 100).
 */
export const StreakMilestoneCelebration = ({
  open,
  streak,
  onClose,
}: StreakMilestoneCelebrationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const config = MILESTONE_CONFIG[streak] || {
    emoji: '🔥',
    title: `${streak}-Day Streak!`,
    message: `${streak} days of consistency. Incredible.`,
  };

  useEffect(() => {
    if (!open) return;
    setIsAnimating(true);
    haptic.success();

    // Big confetti burst for milestones
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: CONFETTI_COLORS,
      scalar: 1.1,
      ticks: 300,
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4, x: 0.3 },
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 250,
      });
    }, 400);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4, x: 0.7 },
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 250,
      });
    }, 700);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Content */}
      <div
        className={cn(
          'relative w-full max-w-[320px] rounded-3xl p-8 text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        style={{
          background: 'linear-gradient(180deg, #ea580c 0%, #f97316 40%, #fb923c 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle at center, #fbbf24 0%, transparent 70%)' }}
        />

        {/* Sparkle dots */}
        <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
        <div className="absolute top-10 right-8 w-1 h-1 rounded-full bg-white/30 animate-pulse" />
        <div className="absolute bottom-16 left-10 w-1.5 h-1.5 rounded-full bg-white/25 animate-pulse" />

        <div className="relative z-10">
          {/* Emoji */}
          <div className={cn(
            'text-6xl mb-4 transition-transform duration-700',
            isAnimating && 'animate-bounce'
          )}>
            {config.emoji}
          </div>

          {/* Streak number badge */}
          <div className="relative inline-flex items-center justify-center mb-3">
            <div
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5)',
              }}
            >
              <Flame className="w-6 h-6 text-white mb-0.5" strokeWidth={1.5} fill="rgba(255,255,255,0.3)" />
              <span className="text-3xl font-bold text-white leading-none">{streak}</span>
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-6 h-6 text-yellow-200" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {config.title}
          </h1>

          {/* Message */}
          <p className="text-white/80 text-sm mb-8 leading-relaxed whitespace-pre-line">
            {config.message}
          </p>

          {/* Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              haptic.light();
              onClose();
            }}
            className="w-full h-12 bg-white text-orange-600 font-semibold text-base rounded-2xl hover:bg-white/90 shadow-lg gap-2"
          >
            <Flame className="w-5 h-5" />
            Keep Going
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Check if a streak count is a celebration milestone */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

/** Get localStorage key for a milestone to prevent re-showing */
export function getStreakMilestoneKey(milestone: number): string {
  return `simora_streak_milestone_${milestone}`;
}
