import { useState } from 'react';
import { Crown, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface GoldStreakLostBannerProps {
  open: boolean;
  previousGoldStreak: number;
  hasShieldsRemaining: boolean;
  shieldsLeft: number;
  onRecover: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

/**
 * Full-screen modal shown when user lost their gold streak (100% completion streak).
 * Offers recovery shield if available.
 */
export const GoldStreakLostBanner = ({
  open,
  previousGoldStreak,
  hasShieldsRemaining,
  shieldsLeft,
  onRecover,
  onDismiss,
  isLoading,
}: GoldStreakLostBannerProps) => {
  const [isAnimating] = useState(true);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={() => { haptic.light(); onDismiss(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className={cn(
          'relative bg-gradient-to-b from-amber-400 to-amber-500 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { haptic.light(); onDismiss(); }}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="grid place-items-center size-20 rounded-2xl bg-amber-300/40 text-white shadow-inner">
            <Crown className="h-9 w-9 fill-white/20 stroke-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-3xl font-bold text-white mb-1">
          {previousGoldStreak} Gold Days
        </div>
        <p className="text-white/70 text-sm mb-4">perfect streak was broken</p>

        {/* Message */}
        <p className="text-white/90 text-sm mb-6 leading-relaxed">
          {hasShieldsRemaining
            ? <>You didn't complete all tasks yesterday. Use a <span className="font-semibold text-white">Recovery Shield</span> to restore your {previousGoldStreak}-day gold streak.</>
            : "You missed completing all tasks. But today is a fresh chance for gold!"
          }
        </p>

        {/* Gold dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array.from({ length: Math.min(previousGoldStreak, 7) }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
              <Crown className="h-2.5 w-2.5 text-white/60" />
            </div>
          ))}
        </div>

        {hasShieldsRemaining ? (
          <>
            <Button
              onClick={() => { haptic.success(); onRecover(); }}
              disabled={isLoading}
              className="w-full bg-white hover:bg-white/90 text-amber-600 font-semibold py-3 rounded-xl mb-2"
            >
              🛡️ Use Recovery Shield
            </Button>
            <p className="text-white/50 text-[10px] mb-2">
              {shieldsLeft} shield{shieldsLeft !== 1 ? 's' : ''} remaining
            </p>
            <button
              onClick={() => { haptic.light(); onDismiss(); }}
              className="text-white/60 text-xs hover:text-white/80 transition-colors"
            >
              Let the gold streak reset
            </button>
          </>
        ) : (
          <Button
            onClick={() => { haptic.light(); onDismiss(); }}
            className="w-full bg-white hover:bg-white/90 text-amber-600 font-semibold py-3 rounded-xl"
          >
            Start Fresh
          </Button>
        )}
      </div>
    </div>
  );
};
