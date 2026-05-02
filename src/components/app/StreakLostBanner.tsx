import { useState, useEffect } from 'react';
import { Flame, Shield, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { StreakLostPushPrompt } from '@/components/app/StreakLostPushPrompt';
import { useAuth } from '@/hooks/useAuth';
import { usePushPermission } from '@/hooks/usePushPermission';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [isAnimating] = useState(true);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const { user } = useAuth();
  const { needsAttention } = usePushPermission();

  // Chain push prompt after the streak-lost modal closes (only if PN missing
  // and user hasn't been asked about this in the last 7 days).
  const handleDismissChain = () => {
    onDismiss();
    if (!user?.id || !needsAttention) return;
    const lastShown = localStorage.getItem('streakLostPushPromptShown');
    if (lastShown) {
      const days = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (days < 7) return;
    }
    localStorage.setItem('streakLostPushPromptShown', Date.now().toString());
    // Slight delay so the close animation completes first
    setTimeout(() => setShowPushPrompt(true), 350);
  };

  if (!open) return null;

  return (
    <>
    <OverlayPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={() => { haptic.light(); handleDismissChain(); }}
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
          onClick={() => { haptic.light(); handleDismissChain(); }}
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
          {t('streakLost.day', { n: previousStreak })}
        </div>
        <p className="text-white/70 text-sm mb-4">{t('streak.wasLost')}</p>

        {/* Message */}
        <p className="text-white/90 text-sm mb-6 leading-relaxed">
          {hasShieldsRemaining
            ? <>{t('streakLost.missedDay')} <span className="font-semibold text-white">{t('streak.recoveryShield')}</span> {t('streakLost.toRestoreStreak', { n: previousStreak })}</>
            : t('streakLost.streakReset')
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
              {t('streakLost.useShield')}
            </Button>
            <p className="text-white/50 text-[10px] mb-2">
              {t('streakLost.shieldsRemaining', { n: shieldsLeft, count: shieldsLeft })}
            </p>
            <Button
              onClick={() => { haptic.light(); handleDismissChain(); }}
              variant="ghost"
              className="w-full text-white bg-white/15 text-xs font-medium rounded-xl"
            >
              {t('streakLost.letReset')}
            </Button>
          </>
        ) : !isSubscribed ? (
          <>
            <p className="text-white/80 text-xs mb-3">
              {t('streakLost.noShieldsLeft')} <span className="font-semibold text-white">Rilo Plus</span>.
            </p>
            <Button
              onClick={() => { haptic.light(); handleDismissChain(); onSubscribe?.(); }}
              className="w-full bg-white text-red-600 font-semibold py-3 rounded-xl mb-2"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {t('streakLost.getPlus')}
            </Button>
            <Button
              onClick={() => { haptic.light(); handleDismissChain(); }}
              variant="ghost"
              className="w-full text-white bg-white/15 text-xs font-medium rounded-xl"
            >
              {t('streakLost.startFresh')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-white/80 text-xs mb-3">
              {t('streakLost.allShieldsUsed')}
            </p>
            <Button
              onClick={() => { haptic.light(); handleDismissChain(); }}
              className="w-full bg-white text-red-600 font-semibold py-3 rounded-xl"
            >
              {t('streakLost.startFresh')}
            </Button>
          </>
        )}
      </div>
    </div>
    </OverlayPortal>
    {user?.id && (
      <StreakLostPushPrompt
        userId={user.id}
        open={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
        lostStreak={previousStreak}
      />
    )}
    </>
  );
};
