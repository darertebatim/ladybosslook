import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Sparkles, ArrowUp } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';

interface StreakGoalCompletionCelebrationProps {
  open: boolean;
  streakGoal: number;
  currentStreak: number;
  onClose: () => void;
  onLevelUp: () => void;
}

/**
 * Full-screen celebration when user completes their streak goal challenge.
 * Offers option to level up to a higher goal.
 */
export const StreakGoalCompletionCelebration = ({
  open,
  streakGoal,
  currentStreak,
  onClose,
  onLevelUp,
}: StreakGoalCompletionCelebrationProps) => {
  useEffect(() => {
    if (!open) return;
    haptic.success();
    
    // Confetti burst
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#f97316', '#fb923c', '#fdba74', '#8b5cf6', '#a78bfa'],
    });
  }, [open]);

  if (!open) return null;

  const hasHigherGoals = streakGoal < 50;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #ea580c 0%, #f97316 30%, #fb923c 60%, #fdba74 100%)' }}
    >
      {/* Sparkle dots */}
      <div className="absolute top-20 left-8 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
      <div className="absolute top-32 right-12 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
      <div className="absolute top-48 left-16 w-1 h-1 rounded-full bg-white/25 animate-pulse" />
      <div className="absolute bottom-40 right-8 w-2 h-2 rounded-full bg-white/35 animate-pulse" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Trophy badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-yellow-300/30 blur-2xl" />
          <div
            className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5)',
            }}
          >
            <Flame className="w-10 h-10 text-white mb-1" strokeWidth={1.5} fill="rgba(255,255,255,0.3)" />
            <span className="text-3xl font-bold text-white">{streakGoal}</span>
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          🏆 Challenge Complete!
        </h1>
        <p className="text-white/90 text-lg mb-2">
          You crushed the {streakGoal}-day streak challenge!
        </p>
        <p className="text-white/70 text-sm mb-8">
          Current streak: {currentStreak} days and counting
        </p>

        {/* Buttons */}
        <div className="w-full max-w-xs space-y-3" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          {hasHigherGoals && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                haptic.success();
                onLevelUp();
              }}
              className="w-full h-14 bg-white text-orange-600 font-semibold text-base rounded-2xl hover:bg-white/90 shadow-lg gap-2"
            >
              <ArrowUp className="w-5 h-5" />
              Level Up My Challenge
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full h-12 text-white/80 hover:text-white hover:bg-white/10 font-medium text-sm rounded-2xl"
          >
            {hasHigherGoals ? 'Not Now' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
};
