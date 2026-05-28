import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { triggerSoftReview } from '@/lib/appReview';
import { recordMoment } from '@/lib/moments';
import { useAuth } from '@/hooks/useAuth';

import journalImg from '@/assets/mood-card-journal.png';
import reflectImg from '@/assets/mood-card-reflect.png';
import planImg from '@/assets/mood-card-plan.png';
import talkImg from '@/assets/mood-card-talk.png';

const ACTIONS = [
  { labelKey: 'moodPage.celebration.actions.journal', image: journalImg, route: '/app/reflections/free-form' },
  { labelKey: 'moodPage.celebration.actions.reflect', image: reflectImg, route: '/app/reflections' },
  { labelKey: 'moodPage.celebration.actions.plan', image: planImg, route: '/app/aiplanner' },
  { labelKey: 'breathePage.complete.actions.talk', image: talkImg, route: '/app/channels' },
];

interface BreathingCompleteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  durationSeconds: number;
  returnTo?: string;
}

export function BreathingCompleteSheet({
  open,
  onOpenChange,
  exerciseName,
  durationSeconds,
  returnTo: explicitReturnTo,
}: BreathingCompleteSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = explicitReturnTo || (location.state as { from?: string } | null)?.from || '/app/home';
  const { user } = useAuth();

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void; completeTask: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* provider not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  useEffect(() => {
    if (open) {
      haptic.success();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#60A5FA', '#34D399'],
      });
      // High-satisfaction moment → ask for a 5-star review (cooldown-protected)
      setTimeout(() => triggerSoftReview('breathe_complete'), 1500);
      if (user?.id) {
        const mins = Math.max(1, Math.round(durationSeconds / 60));
        void recordMoment({
          userId: user.id,
          kind: 'breathe',
          title: `${mins} min of ${exerciseName}`,
          emoji: '🧘',
          payload: { ref_id: `breathe-${Date.now()}`, durationSeconds, exerciseName },
        });
      }
    }
  }, [open]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : t('breathePage.minShort', { count: mins });
  };

  const handleAction = (route: string) => {
    haptic.medium();
    onOpenChange(false);
    navigate(route);
  };

  const handleDone = () => {
    haptic.light();
    onOpenChange(false);
    if (hasActivePlayer) {
      navigate(returnTo);
      routinePlayer!.maximize();
      return;
    }
    navigate(returnTo);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleDone();
        return;
      }
      onOpenChange(isOpen);
    }}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-3xl border-0 px-5 pt-8 pb-6",
          "bg-emerald-100"
        )}
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Header: Emoji + Text */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-200 flex items-center justify-center mb-3">
            <FluentEmoji emoji="🧘" size={40} />
          </div>
          <p className="text-base font-semibold text-black mb-1">
            {t('breathePage.complete.summary', { name: exerciseName, duration: formatDuration(durationSeconds) })}
          </p>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            {t('breathePage.complete.title')}
          </h2>
        </div>

        {/* Back to Home — moved above cards */}
        <Button
          onClick={handleDone}
          variant="ghost"
          className="w-full h-11 rounded-full text-sm bg-white text-black hover:bg-white/90 font-semibold shadow-sm mb-4 flex items-center justify-center gap-2"
        >
          <FluentEmoji emoji={hasActivePlayer ? '▶️' : '🏠'} size={18} />
          <span>{hasActivePlayer ? t('breathePage.complete.continueRoutine') : t('breathePage.complete.backToHome')}</span>
        </Button>

        {/* 2×2 Cards with illustrations */}
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => {
            const label = t(action.labelKey);
            return (
            <button
              key={action.labelKey}
              onClick={() => handleAction(action.route)}
              className={cn(
                "flex flex-col items-center rounded-2xl p-3 pt-4",
                "bg-background/90 backdrop-blur-sm",
                "active:scale-[0.96] transition-all",
              )}
            >
              <img
                src={action.image}
                alt={label}
                className="w-24 h-24 object-contain mb-2"
              />
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {label}
              </span>
            </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
