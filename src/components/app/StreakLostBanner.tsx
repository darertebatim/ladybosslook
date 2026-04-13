import { useState } from 'react';
import { Flame, Shield, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { OverlayPortal } from '@/components/app/OverlayPortal';

interface StreakLostBannerProps {
  open: boolean;
  previousStreak: number;
  hasShieldsRemaining: boolean;
  shieldsLeft: number;
  isSubscribed: boolean;
  onRecover: () => void;
  onDismiss: () => void;
  onSubscribe?: () => void;
  isLoading?: boolean;
}

/**
 * Full-screen modal shown when user lost their regular streak.
 * Offers recovery shield if available.
 */
export const StreakLostBanner = ({
  open,
  previousStreak,
  hasShieldsRemaining,
  shieldsLeft,
  isSubscribed,
  onRecover,
  onDismiss,
  onSubscribe,
  isLoading,
}: StreakLostBannerProps) => {
  const [isAnimating] = useState(true);

  if (!open) return null;

  return (
    <OverlayPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={() => { haptic.light(); onDismiss(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className={cn(
          'relative bg-gradient-to-b from-red-400 to-red-500 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { haptic.light(); onDismiss(); }}
          className="absolute top-4 right-4 text-white/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="grid place-items-center size-20 rounded-2xl bg-red-300/40 text-white shadow-inner">
            <span className="text-4xl">💔</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-3xl font-bold text-white mb-1">
          Day {previousStreak}
        </div>
        <p className="text-white/70 text-sm mb-4">streak was lost</p>

        {/* Message */}
        <p className="text-white/90 text-sm mb-6 leading-relaxed">
          {hasShieldsRemaining
            ? <>You missed a day. Use a <span className="font-semibold text-white">Recovery Shield</span> to restore your {previousStreak}-day streak.</>
            : "Your streak has reset. But showing up today starts a new one."
          }
        </p>

        {/* Flame dots */}
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: Math.min(previousStreak, 7) }).map((_, i) => (
            <Flame
              key={i}
              className="h-4 w-4 text-white/40 fill-white/20"
            />
          ))}
        </div>

        {hasShieldsRemaining ? (
          <>
            <Button
              onClick={() => { haptic.success(); onRecover(); }}
              disabled={isLoading}
              className="w-full bg-white text-red-600 font-semibold py-3 rounded-xl mb-2"
            >
              🛡️ Use Recovery Shield
            </Button>
            <p className="text-white/50 text-[10px] mb-2">
              {shieldsLeft} shield{shieldsLeft !== 1 ? 's' : ''} remaining
            </p>
            <Button
              onClick={() => { haptic.light(); onDismiss(); }}
              variant="ghost"
              className="w-full text-white bg-white/15 text-xs font-medium rounded-xl"
            >
              Let the streak reset
            </Button>
          </>
        ) : !isSubscribed ? (
          <>
            <p className="text-white/80 text-xs mb-3">
              No shields left. Unlock more with <span className="font-semibold text-white">Simora Plus</span>.
            </p>
            <Button
              onClick={() => { haptic.light(); onDismiss(); onSubscribe?.(); }}
              className="w-full bg-white text-red-600 font-semibold py-3 rounded-xl mb-2"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Get Simora Plus
            </Button>
            <Button
              onClick={() => { haptic.light(); onDismiss(); }}
              variant="ghost"
              className="w-full text-white bg-white/15 text-xs font-medium rounded-xl"
            >
              Start Fresh
            </Button>
          </>
        ) : (
          <>
            <p className="text-white/80 text-xs mb-3">
              All recovery shields have been used. Time for a fresh start.
            </p>
            <Button
              onClick={() => { haptic.light(); onDismiss(); }}
              className="w-full bg-white text-red-600 font-semibold py-3 rounded-xl"
            >
              Start Fresh
            </Button>
          </>
        )}
      </div>
    </div>
    </OverlayPortal>
  );
};
