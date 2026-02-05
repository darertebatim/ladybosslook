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

export function FirstActionCelebration({ isOpen, onClose }: FirstActionCelebrationProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      haptic.success();
      
      // Gentle celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A78BFA', '#F9A8D4', '#FDE68A', '#93C5FD', '#C4B5FD']
      });

      // Delayed heart-shaped burst
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 45,
          origin: { y: 0.5 },
          colors: ['#F472B6', '#A78BFA', '#FCD34D']
        });
      }, 400);
    }
  }, [isOpen, hasTriggeredConfetti]);

  useEffect(() => {
    if (!isOpen) {
      setHasTriggeredConfetti(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm text-center border-none bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/30 dark:to-background overflow-hidden">
        {/* Decorative sparkles */}
        <div className="absolute top-6 left-6 text-violet-400 animate-pulse">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="absolute top-6 right-6 text-pink-400 animate-pulse" style={{ animationDelay: '0.3s' }}>
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="py-8 px-4 relative z-10">
          {/* Heart Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center mb-6 shadow-lg animate-scale-in">
            <Heart className="h-10 w-10 text-white fill-white" />
          </div>

          {/* Main Message */}
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            You showed up 💜
          </h2>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            This was your first action.
            <br />
            <span className="text-sm">Showing up for yourself matters.</span>
          </p>

          <Button 
            onClick={onClose}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
