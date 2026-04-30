import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { triggerSoftReview } from '@/lib/appReview';

import journalImg from '@/assets/mood-card-journal.png';
import reflectImg from '@/assets/mood-card-reflect.png';
import planImg from '@/assets/mood-card-plan.png';
import talkImg from '@/assets/mood-card-talk.png';

const ACTIONS = [
  {
    label: 'Write Reflection',
    image: journalImg,
    route: '/app/reflections/free-form',
  },
  {
    label: 'Self Reflection',
    image: reflectImg,
    route: '/app/reflections',
  },
  {
    label: 'Start My Plan',
    image: planImg,
    route: '/app/home',
  },
  {
    label: 'Talk it Out',
    image: talkImg,
    route: '/app/channels',
  },
];

interface BreathingCompleteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  durationSeconds: number;
}

export function BreathingCompleteSheet({
  open,
  onOpenChange,
  exerciseName,
  durationSeconds,
}: BreathingCompleteSheetProps) {
  const navigate = useNavigate();

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
    }
  }, [open]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
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
      navigate('/app/home');
      routinePlayer!.maximize();
      return;
    }
    navigate('/app/home');
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
          <p className="text-sm font-medium text-foreground/50 mb-1">
            {exerciseName} · {formatDuration(durationSeconds)}
          </p>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            Great Job! What's Next<br />on Your Journey?
          </h2>
        </div>

        {/* 2×2 Cards with illustrations */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleAction(action.route)}
              className={cn(
                "flex flex-col items-center rounded-2xl p-3 pt-4",
                "bg-background/90 backdrop-blur-sm",
                "active:scale-[0.96] transition-all",
              )}
            >
              <img
                src={action.image}
                alt={action.label}
                className="w-24 h-24 object-contain mb-2"
              />
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Back to Home / Back to Player */}
        <Button
          onClick={handleDone}
          variant="ghost"
          className="w-full h-10 rounded-full text-sm bg-orange-200/60 text-orange-900 hover:bg-orange-200/80"
        >
          {hasActivePlayer ? 'Continue Routine ▶' : 'Back to Home'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
