import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMOTION_CATEGORIES, VALENCE_OPTIONS, type Valence } from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface EmotionCategoryProps {
  valence: Valence;
  onSelect: (category: string) => void;
  onBack: () => void;
}

export const EmotionCategory = ({ valence, onSelect, onBack }: EmotionCategoryProps) => {
  const categories = EMOTION_CATEGORIES[valence] || [];
  const valenceOption = VALENCE_OPTIONS.find(v => v.value === valence);

  const handleSelect = (category: string) => {
    haptic.light();
    onSelect(category);
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
        <span className="text-sm text-muted-foreground">Step 2 of 4</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6">
        {/* Selected valence indicator */}
        <div className="mb-6">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">You're feeling</span>
          <div className={cn(
            "inline-block ml-2 px-3 py-1 rounded-full text-sm font-medium",
            valenceOption?.bgClass
          )}>
            {valenceOption?.label}
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            What type of {valence} feeling?
          </h2>
          <p className="text-muted-foreground text-sm">
            Select the category that best describes your emotion.
          </p>
        </div>

        {/* Category options */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleSelect(category.value)}
                className={cn(
                  "px-5 py-3 rounded-full border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <span className="font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
