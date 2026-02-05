import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { haptic } from '@/lib/haptics';

interface FirstActionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--ring))',
];

export function FirstActionCelebration({ isOpen, onClose }: FirstActionCelebrationProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      haptic.success();

      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.62 },
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 220,
      });

      setTimeout(() => {
        confetti({
          particleCount: 35,
          spread: 48,
          origin: { y: 0.55 },
          colors: CONFETTI_COLORS,
          scalar: 0.95,
          ticks: 200,
        });
      }, 350);
    }
  }, [isOpen, hasTriggeredConfetti]);

  useEffect(() => {
    if (!isOpen) setHasTriggeredConfetti(false);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="relative p-6 text-center">
          {/* Ambient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background to-background" />

          {/* Decorative sparkles */}
          <div className="absolute top-5 left-5 text-primary/60 animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div
            className="absolute top-6 right-6 text-primary/40 animate-pulse"
            style={{ animationDelay: '0.25s' }}
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="relative">
            {/* Icon */}
            <div className="mx-auto mb-5 grid place-items-center size-20 rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Heart className="h-9 w-9 fill-current" />
            </div>

            {/* Copy */}
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              You showed up for yourself
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Your first action is in.
              <br />
              Keep it small. Keep it kind.
            </p>

            <div className="mt-6">
              <Button onClick={onClose} className="w-full h-11 rounded-xl">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

