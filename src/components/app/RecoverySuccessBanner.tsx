import { useState } from 'react';
import { Shield, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { OverlayPortal } from '@/components/app/OverlayPortal';

interface RecoverySuccessBannerProps {
  open: boolean;
  restoredStreak: number;
  type: 'streak' | 'gold';
  onClose: () => void;
}

const CONFETTI_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24'];

/**
 * Full-screen success modal shown after user successfully recovers a streak.
 * Explains what to do next to keep the streak alive.
 */
export const RecoverySuccessBanner = ({
  open,
  restoredStreak,
  type,
  onClose,
}: RecoverySuccessBannerProps) => {
  const [isAnimating] = useState(true);

  useEffect(() => {
    if (open) {
      haptic.success();
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.5 },
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 200,
      });
    }
  }, [open]);

  if (!open) return null;

  const isGold = type === 'gold';

  return (
    <OverlayPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className={cn(
          'relative bg-gradient-to-b rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
          isGold
            ? 'from-emerald-400 to-emerald-500'
            : 'from-emerald-400 to-emerald-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="grid place-items-center size-20 rounded-2xl bg-emerald-300/40 text-white shadow-inner">
            <Shield className="h-9 w-9 fill-white/20 stroke-white" />
          </div>
        </div>

        {/* Success checkmark */}
        <div className="flex justify-center mb-2">
          <CheckCircle className="h-6 w-6 text-white fill-emerald-300" />
        </div>

        {/* Title */}
        <div className="text-2xl font-bold text-white mb-1">
          {isGold ? 'Gold Streak Restored!' : 'Streak Restored!'}
        </div>
        <p className="text-white/70 text-sm mb-4">
          Back to {restoredStreak} {isGold ? 'gold ' : ''}days
        </p>

        {/* What to do next */}
        <div className="bg-white/15 rounded-xl p-4 mb-6 text-left">
          <p className="text-white font-semibold text-xs mb-2">To keep your streak alive:</p>
          <ul className="text-white/90 text-xs space-y-1.5">
            {isGold ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">✅</span>
                  <span>Complete <strong>all</strong> your tasks today</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">🏅</span>
                  <span>Complete 3 tasks to earn a gold badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">⚡</span>
                  <span>Don't miss a day — gold streaks need perfection</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">✅</span>
                  <span>Complete <strong>at least one</strong> action today</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">🔥</span>
                  <span>Keep showing up every day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">🛡️</span>
                  <span>Recovery shields are limited — use them wisely</span>
                </li>
              </>
            )}
          </ul>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-white hover:bg-white/90 text-emerald-600 font-semibold py-3 rounded-xl"
        >
          Let's Go! 🚀
        </Button>
      </div>
    </div>
    </OverlayPortal>
  );
};
