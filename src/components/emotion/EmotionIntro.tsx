import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface EmotionIntroProps {
  onStart: () => void;
}

export const EmotionIntro = ({ onStart }: EmotionIntroProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-violet-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm text-center">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center mb-8">
          <Heart className="w-12 h-12 text-violet-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Name Your Emotion
        </h1>

        {/* Description */}
        <p className="text-muted-foreground leading-relaxed mb-8">
          Sometimes, what we feel is not so obvious. Naming the emotion can help gain better control and understanding of ourselves.
        </p>

        {/* Benefits list */}
        <div className="space-y-3 text-left w-full mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span>Build emotional awareness</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span>Understand your triggers</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span>Track patterns over time</span>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="w-full max-w-sm">
        <Button 
          onClick={onStart}
          className="w-full h-14 text-lg rounded-2xl bg-violet-500 hover:bg-violet-600"
        >
          Start
        </Button>
      </div>
    </div>
  );
};
