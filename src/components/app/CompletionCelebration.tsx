import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trophy, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { haptic } from '@/lib/haptics';

interface CompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  roundName: string;
}

export function CompletionCelebration({ 
  isOpen, 
  onClose, 
  courseName, 
  roundName 
}: CompletionCelebrationProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      haptic.success();
      
      // Fire confetti from both sides
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        // Left side confetti
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1']
        });
        
        // Right side confetti
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Center burst
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1']
        });
      }, 500);
    }
  }, [isOpen, hasTriggeredConfetti]);

  // Reset confetti trigger when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasTriggeredConfetti(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center border-none bg-gradient-to-b from-background to-muted overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 text-yellow-400 animate-pulse">
          <Star className="h-6 w-6 fill-current" />
        </div>
        <div className="absolute top-4 right-4 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <Star className="h-6 w-6 fill-current" />
        </div>
        <div className="absolute top-12 left-12 text-primary/50 animate-bounce" style={{ animationDelay: '0.3s' }}>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="absolute top-12 right-12 text-primary/50 animate-bounce" style={{ animationDelay: '0.7s' }}>
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="py-8 px-4 relative z-10">
          {/* Trophy Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg animate-scale-in">
            <Trophy className="h-10 w-10 text-white" />
          </div>

          {/* Success Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Course Completed!</span>
          </div>

          {/* Main Message */}
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Congratulations! 🎉
          </h2>
          
          <p className="text-muted-foreground mb-2">
            You've successfully completed
          </p>
          
          <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
            <h3 className="font-semibold text-lg text-foreground">{courseName}</h3>
            <p className="text-sm text-muted-foreground">{roundName}</p>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Your dedication has paid off! You can still access all your course materials anytime.
          </p>

          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}