import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMOTION_CATEGORIES, VALENCE_OPTIONS, getCategoryByValue, type Valence } from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface EmotionSpecificProps {
  valence: Valence;
  category: string;
  onSelect: (emotion: string) => void;
  onBack: () => void;
}

export const EmotionSpecific = ({ valence, category, onSelect, onBack }: EmotionSpecificProps) => {
  const categoryData = getCategoryByValue(valence, category);
  const emotions = categoryData?.emotions || [];
  const valenceOption = VALENCE_OPTIONS.find(v => v.value === valence);

  const handleSelect = (emotion: string) => {
    haptic.light();
    onSelect(emotion);
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
        <span className="text-sm text-muted-foreground">Step 3 of 4</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            valenceOption?.bgClass
          )}>
            {valenceOption?.label}
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {categoryData?.label}
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            More specifically...
          </h2>
          <p className="text-muted-foreground text-sm">
            Which word best captures how you feel?
          </p>
        </div>

        {/* Emotion options */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-wrap gap-3">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => handleSelect(emotion.value)}
                className={cn(
                  "px-5 py-3 rounded-full border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  valenceOption?.bgClass
                )}
              >
                <span className="font-medium">{emotion.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
