import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  VALENCE_OPTIONS, 
  EMOTION_CATEGORIES,
  NEUTRAL_EMOTIONS,
  getCategoryColor,
  type Valence, 
  type CategoryColor 
} from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface EmotionSelectorProps {
  onComplete: (valence: Valence, category: string, emotions: string[]) => void;
  onBack: () => void;
}

type SelectionState = {
  valence: Valence | null;
  category: string | null;
  emotions: string[]; // Multi-select
};

export const EmotionSelector = ({ onComplete, onBack }: EmotionSelectorProps) => {
  const [selection, setSelection] = useState<SelectionState>({
    valence: null,
    category: null,
    emotions: [],
  });

  const categories = selection.valence ? EMOTION_CATEGORIES[selection.valence] : [];
  const selectedCategoryData = categories.find(c => c.value === selection.category);
  
  // For neutral, use flat emotion list; for others, use category emotions
  const emotions = selection.valence === 'neutral' 
    ? NEUTRAL_EMOTIONS 
    : (selectedCategoryData?.emotions || []);

  // Neutral skips category step
  const isNeutral = selection.valence === 'neutral';

  const handleValenceSelect = useCallback((valence: Valence) => {
    haptic.light();
    setSelection({ valence, category: null, emotions: [] });
  }, []);

  const handleCategorySelect = useCallback((categoryValue: string) => {
    haptic.light();
    setSelection(prev => ({ ...prev, category: categoryValue, emotions: [] }));
  }, []);

  const handleEmotionToggle = useCallback((emotionValue: string) => {
    haptic.light();
    setSelection(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotionValue)
        ? prev.emotions.filter(e => e !== emotionValue)
        : [...prev.emotions, emotionValue]
    }));
  }, []);

  const handleNext = useCallback(() => {
    haptic.medium();
    if (selection.valence && selection.emotions.length > 0) {
      // For neutral, use 'neutral' as category
      const category = isNeutral ? 'neutral' : selection.category;
      if (category) {
        onComplete(selection.valence, category, selection.emotions);
      }
    }
  }, [selection, isNeutral, onComplete]);

  const handleBack = useCallback(() => {
    if (selection.category && !isNeutral) {
      setSelection(prev => ({ ...prev, category: null, emotions: [] }));
    } else if (selection.valence) {
      setSelection({ valence: null, category: null, emotions: [] });
    } else {
      onBack();
    }
  }, [selection, isNeutral, onBack]);

  const getValencePillColor = (valence: Valence, isSelected: boolean): string => {
    const option = VALENCE_OPTIONS.find(v => v.value === valence);
    if (!option) return '';
    return isSelected 
      ? `${option.color.bgActive} ${option.color.textActive}` 
      : `${option.color.bg} ${option.color.text}`;
  };

  const getPillColor = (color: CategoryColor, isSelected: boolean): string => {
    return isSelected 
      ? `${color.bgActive} ${color.textActive}` 
      : `${color.bg} ${color.text}`;
  };

  const currentColor = selection.valence 
    ? getCategoryColor(selection.valence, selection.category || undefined)
    : VALENCE_OPTIONS[0].color;

  // Show emotions when: neutral is selected OR a category is selected
  const showEmotions = (isNeutral && selection.valence) || selection.category;

  return (
    <div 
      className="h-[100dvh] flex flex-col bg-[#F8F9FA]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2 -ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-medium text-foreground">
          Try to dig a little deeper
        </h1>
      </header>

      {/* Content - Columns */}
      <div className="flex-1 flex items-center justify-center px-3 gap-2 overflow-hidden">
        {/* Column 1: Valence */}
        <div className="flex flex-col gap-2.5 shrink-0">
          {VALENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleValenceSelect(option.value)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                "active:scale-95",
                getValencePillColor(option.value, selection.valence === option.value)
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Column 2: Categories (not shown for Neutral) */}
        {selection.valence && !isNeutral && categories.length > 0 && (
          <div className="flex flex-col gap-2 shrink-0 animate-in slide-in-from-right-4 duration-200">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategorySelect(category.value)}
                className={cn(
                  "px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "active:scale-95 flex items-center gap-1",
                  getPillColor(category.color, selection.category === category.value)
                )}
              >
                {category.label}
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        )}

        {/* Column 3: Emotions (multi-select, scrollable for long lists) */}
        {showEmotions && emotions.length > 0 && (
          <ScrollArea className="h-[60vh] shrink-0 animate-in slide-in-from-right-4 duration-200">
            <div className="flex flex-col gap-2 pr-2">
              {emotions.map((emotion) => {
                const isSelected = selection.emotions.includes(emotion.value);
                return (
                  <button
                    key={emotion.value}
                    onClick={() => handleEmotionToggle(emotion.value)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      "active:scale-95 whitespace-nowrap",
                      getPillColor(currentColor, isSelected)
                    )}
                  >
                    {emotion.label}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Bottom: Next button (only shown when emotions are selected) */}
      <div className="shrink-0 pb-safe px-5 py-4">
        {showEmotions && selection.emotions.length > 0 ? (
          <Button 
            onClick={handleNext}
            className="w-full h-12 text-base rounded-xl bg-[#4CAF50] hover:bg-[#43A047] text-white font-medium"
          >
            Next
          </Button>
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            {!selection.valence && "Start by selecting how you're feeling overall"}
            {selection.valence && !showEmotions && "What type of feeling is it?"}
            {showEmotions && selection.emotions.length === 0 && "Select one or more emotions"}
          </p>
        )}
      </div>
    </div>
  );
};
