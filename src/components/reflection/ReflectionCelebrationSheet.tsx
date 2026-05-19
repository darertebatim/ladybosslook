import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { Share2 } from 'lucide-react';
import { useShareContent } from '@/hooks/useShareContent';
import { triggerSoftReview } from '@/lib/appReview';

import academyImg from '@/assets/reflection-card-academy.png';
import listenImg from '@/assets/reflection-card-listen.png';
import presenceImg from '@/assets/reflection-card-presence.png';
import breatheImg from '@/assets/mood-card-breathing.png';

const ACTIONS = [
  { label: 'Education', image: academyImg, route: '/app/player?category=course' },
  { label: 'Listen', image: listenImg, route: '/app/player' },
  { label: 'Breathe', image: breatheImg, route: '/app/breathe' },
  { label: 'Self-Care Goals', image: presenceImg, route: '/app/balance' },
];

interface ReflectionCelebrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function ReflectionCelebrationSheet({
  open,
  onOpenChange,
  onDone,
}: ReflectionCelebrationSheetProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => triggerSoftReview('reflection_complete'), 1500);
    }
  }, [open]);

  const { handleShare } = useShareContent({
    title: 'I just reflected on Rilo 💭',
    text: 'Took a moment to reflect today. Small habits, big momentum.',
    source: 'reflection_complete',
  });

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* provider not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const handleAction = (action: typeof ACTIONS[number]) => {
    haptic.medium();
    onOpenChange(false);
    navigate(action.route, { replace: true });
  };

  const handleDone = () => {
    haptic.light();
    onOpenChange(false);
    if (hasActivePlayer) {
      navigate('/app/home', { replace: true });
      routinePlayer!.maximize();
      return;
    }
    navigate('/app/home', { replace: true });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleDone();
        } else {
          onOpenChange(isOpen);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className={cn(
          'rounded-t-3xl border-0 px-5 pt-8 pb-6',
          'bg-purple-100',
        )}
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-purple-200">
            <FluentEmoji emoji="📓" size={40} />
          </div>
          <p className="text-sm font-medium text-foreground/50 mb-1">
            Nice work — you reflected today.
          </p>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            Keep the momentum going
          </h2>
        </div>

        {/* 2×2 cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleAction(action)}
              className={cn(
                'flex flex-col items-center rounded-2xl p-3 pt-4',
                'bg-background/90 backdrop-blur-sm',
                'active:scale-[0.96] transition-all',
              )}
            >
              <img
                src={action.image}
                alt={action.label}
                loading="lazy"
                width={512}
                height={512}
                className="w-24 h-24 object-contain mb-2"
              />
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => { haptic.light(); handleShare(); }}
            className="h-11 px-4 rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold shadow-sm"
            aria-label="Share reflection"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleDone}
            className="flex-1 h-11 rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold shadow-sm"
          >
            {hasActivePlayer ? 'Continue Routine ▶' : 'Back to Home Planner'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}