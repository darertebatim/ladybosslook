import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  VALENCE_OPTIONS, 
  EMOTION_CATEGORIES, 
  getCategoryColor,
  type Valence, 
  type EmotionCategory,
  type CategoryColor 
} from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface EmotionSelectorProps {
  onComplete: (valence: Valence, category: string, emotion: string) => void;
  onBack: () => void;
}

type SelectionState = {
  valence: Valence | null;
  category: string | null;
  emotion: string | null; // For emotions with sub-emotions
};

export const EmotionSelector = ({ onComplete, onBack }: EmotionSelectorProps) => {
  const [selection, setSelection] = useState<SelectionState>({
    valence: null,
    category: null,
    emotion: null,
  });

  const categories = selection.valence ? EMOTION_CATEGORIES[selection.valence] : [];
  const selectedCategoryData = categories.find(c => c.value === selection.category);
  const emotions = selectedCategoryData?.emotions || [];
  const subEmotions = selection.emotion && selectedCategoryData?.subEmotions?.[selection.emotion] 
    ? selectedCategoryData.subEmotions[selection.emotion] 
    : [];

  // Determine current depth
  const getDepth = (): number => {
    if (!selection.valence) return 0;
    if (!selection.category) return 1;
    if (!selection.emotion && subEmotions.length === 0) return 2;
    if (selection.emotion && subEmotions.length > 0) return 3;
    return 2;
  };

  const handleValenceSelect = useCallback((valence: Valence) => {
    haptic.light();
    setSelection({ valence, category: null, emotion: null });
  }, []);

  const handleCategorySelect = useCallback((categoryValue: string) => {
    haptic.light();
    const category = categories.find(c => c.value === categoryValue);
    
    // If category has no emotions (like "Numb"), complete immediately
    if (category && category.emotions.length === 0) {
      if (selection.valence) {
        onComplete(selection.valence, categoryValue, categoryValue);
      }
      return;
    }
    
    setSelection(prev => ({ ...prev, category: categoryValue, emotion: null }));
  }, [categories, selection.valence, onComplete]);

  const handleEmotionSelect = useCallback((emotionValue: string) => {
    haptic.light();
    const emotionOption = emotions.find(e => e.value === emotionValue);
    
    // If emotion has sub-emotions, drill deeper
    if (emotionOption?.hasSubEmotions && selectedCategoryData?.subEmotions?.[emotionValue]) {
      setSelection(prev => ({ ...prev, emotion: emotionValue }));
      return;
    }
    
    // Otherwise, complete the flow
    if (selection.valence && selection.category) {
      haptic.medium();
      onComplete(selection.valence, selection.category, emotionValue);
    }
  }, [emotions, selectedCategoryData, selection.valence, selection.category, onComplete]);

  const handleSubEmotionSelect = useCallback((subEmotionValue: string) => {
    haptic.medium();
    if (selection.valence && selection.category) {
      onComplete(selection.valence, selection.category, subEmotionValue);
    }
  }, [selection.valence, selection.category, onComplete]);

  const handleBack = useCallback(() => {
    if (selection.emotion) {
      setSelection(prev => ({ ...prev, emotion: null }));
    } else if (selection.category) {
      setSelection(prev => ({ ...prev, category: null, emotion: null }));
    } else if (selection.valence) {
      setSelection(prev => ({ valence: null, category: null, emotion: null }));
    } else {
      onBack();
    }
  }, [selection, onBack]);

  const getValenceColor = (valence: Valence, isSelected: boolean): string => {
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
      <div className="flex-1 flex items-center justify-center px-4 gap-3 overflow-hidden">
        {/* Column 1: Valence */}
        <div className="flex flex-col gap-2.5 shrink-0">
          {VALENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleValenceSelect(option.value)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                "active:scale-95",
                getValenceColor(option.value, selection.valence === option.value)
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Column 2: Categories */}
        {selection.valence && categories.length > 0 && (
          <div className="flex flex-col gap-2 shrink-0 animate-in slide-in-from-right-4 duration-200">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategorySelect(category.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "active:scale-95 flex items-center gap-1",
                  getPillColor(category.color, selection.category === category.value)
                )}
              >
                {category.label}
                {category.emotions.length > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Column 3: Emotions */}
        {selection.category && emotions.length > 0 && !selection.emotion && (
          <div className="flex flex-col gap-2 shrink-0 animate-in slide-in-from-right-4 duration-200">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => handleEmotionSelect(emotion.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "active:scale-95 flex items-center gap-1",
                  getPillColor(currentColor, false)
                )}
              >
                {emotion.label}
                {emotion.hasSubEmotions && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Column 4: Sub-emotions (only for 3-level deep emotions) */}
        {selection.emotion && subEmotions.length > 0 && (
          <div className="flex flex-col gap-2 shrink-0 animate-in slide-in-from-right-4 duration-200 max-h-[60vh] overflow-y-auto">
            {subEmotions.map((subEmotion) => (
              <button
                key={subEmotion.value}
                onClick={() => handleSubEmotionSelect(subEmotion.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "active:scale-95",
                  getPillColor(currentColor, false)
                )}
              >
                {subEmotion.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="shrink-0 pb-safe px-6 py-4">
        <p className="text-xs text-center text-muted-foreground">
          {getDepth() === 0 && "Start by selecting how you're feeling overall"}
          {getDepth() === 1 && "What type of feeling is it?"}
          {getDepth() === 2 && "Which word best captures your emotion?"}
          {getDepth() === 3 && "Let's get even more specific"}
        </p>
      </div>
    </div>
  );
};
