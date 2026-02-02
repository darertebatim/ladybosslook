import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VALENCE_OPTIONS, type Valence } from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface EmotionValenceProps {
  onSelect: (valence: Valence) => void;
  onBack: () => void;
}

export const EmotionValence = ({ onSelect, onBack }: EmotionValenceProps) => {
  const handleSelect = (valence: Valence) => {
    haptic.light();
    onSelect(valence);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border/50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">Step 1 of 4</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Prompt */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            How are you feeling?
          </h2>
          <p className="text-muted-foreground text-sm">
            Start by taking a minute to pause and notice what you are feeling right now.
          </p>
        </div>

        {/* Valence options */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          {VALENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full py-5 px-6 rounded-2xl border-2 text-left transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                option.bgClass
              )}
            >
              <span className="text-lg font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Hint */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          There's no right or wrong answer. All emotions are valid.
        </p>
      </div>
    </div>
  );
};
