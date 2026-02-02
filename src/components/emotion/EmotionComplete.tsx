import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';

interface EmotionCompleteProps {
  onDone: () => void;
}

export const EmotionComplete = ({ onDone }: EmotionCompleteProps) => {
  useEffect(() => {
    // Celebration effects
    haptic.success();
    
    // Confetti burst
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-green-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm text-center">
        {/* Success icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Well done!
        </h1>

        {/* Message */}
        <p className="text-muted-foreground leading-relaxed mb-4">
          You are getting closer to understanding yourself even more!
        </p>

        <p className="text-sm text-muted-foreground">
          Your emotion has been saved in your history.
        </p>
      </div>

      {/* Done button */}
      <div className="w-full max-w-sm">
        <Button 
          onClick={onDone}
          className="w-full h-14 text-lg rounded-2xl bg-violet-500 hover:bg-violet-600"
        >
          Done
        </Button>
      </div>
    </div>
  );
};
