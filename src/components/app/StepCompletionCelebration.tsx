import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OverlayPortal } from '@/components/app/OverlayPortal';

interface StepCompletionCelebrationProps {
  open: boolean;
  onClose: () => void;
  completedStep: number;
  newTaskCount: number;
}

const CONFETTI_COLORS = ['#34d399', '#6ee7b7', '#a78bfa', '#c084fc', '#fbbf24', '#fb923c'];

export const StepCompletionCelebration = ({
  open,
  onClose,
  completedStep,
  newTaskCount,
}: StepCompletionCelebrationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();
      if (!hasTriggeredConfetti) {
        setHasTriggeredConfetti(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.45 },
          colors: CONFETTI_COLORS,
          scalar: 0.9,
          ticks: 200,
        });
      }
    }
  }, [open, hasTriggeredConfetti]);

  useEffect(() => {
    if (!open) setHasTriggeredConfetti(false);
  }, [open]);

  if (!open) return null;

  const nextStep = completedStep + 1;

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[100] flex flex-col justify-end pb-[env(safe-area-inset-bottom)]"
        onClick={onClose}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Floating icon above card */}
          <div className="mb-[-36px] z-20">
            <div
              className={cn(
                'w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl transition-all duration-700',
                isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              )}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Card */}
          <div
            className={cn(
              'relative z-10 w-full bg-gray-800/95 rounded-t-3xl px-6 pt-16 pb-8 transition-all duration-500',
              isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step badge */}
            <div className={cn(
              'text-center mb-2 transition-all duration-500 delay-150',
              isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            )}>
              <span className="text-5xl font-bold text-emerald-400">
                Step {completedStep}
              </span>
            </div>
            <p className="text-center text-white/50 text-sm mb-4">
              complete ✓
            </p>

            {/* Message */}
            <p className="text-center text-white/80 text-sm leading-relaxed mb-6">
              Great progress! You've finished all tasks{'\n'}
              in Step {completedStep}. {newTaskCount} new task{newTaskCount > 1 ? 's' : ''} from{'\n'}
              Step {nextStep} {newTaskCount > 1 ? 'are' : 'is'} now being added to your planner.
            </p>

            {/* Next step indicator */}
            <div className={cn(
              'flex items-center justify-center gap-3 mb-8 transition-all duration-700 delay-300',
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                <span className="text-emerald-400 font-semibold text-sm">Step {completedStep}</span>
                <ArrowRight className="w-4 h-4 text-white/40" />
                <span className="text-white font-semibold text-sm">Step {nextStep}</span>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={onClose}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl text-base"
            >
              Let's keep going
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};
