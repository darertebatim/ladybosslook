import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CONTEXT_OPTIONS, getValenceColor, getCategoryByValue, getCategoryColor, type Valence } from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface EmotionContextProps {
  valence: Valence;
  category: string;
  emotion: string;
  onSave: (contexts: string[], notes: string) => void;
  onBack: () => void;
  isSaving: boolean;
}

export const EmotionContext = ({ 
  valence, 
  category, 
  emotion, 
  onSave, 
  onBack,
  isSaving 
}: EmotionContextProps) => {
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const valenceColor = getValenceColor(valence);
  const categoryData = getCategoryByValue(valence, category);
  const categoryColor = getCategoryColor(valence, category);
  
  // Find emotion label - check both direct emotions and sub-emotions
  let emotionLabel = emotion;
  const directEmotion = categoryData?.emotions.find(e => e.value === emotion);
  if (directEmotion) {
    emotionLabel = directEmotion.label;
  } else if (categoryData?.subEmotions) {
    for (const subList of Object.values(categoryData.subEmotions)) {
      const subEmotion = subList.find(e => e.value === emotion);
      if (subEmotion) {
        emotionLabel = subEmotion.label;
        break;
      }
    }
  }

  const toggleContext = (context: string) => {
    haptic.light();
    setSelectedContexts(prev => 
      prev.includes(context)
        ? prev.filter(c => c !== context)
        : [...prev, context]
    );
  };

  const handleSave = () => {
    haptic.medium();
    onSave(selectedContexts, notes);
  };

  return (
    <div 
      className="h-[100dvh] flex flex-col bg-[#F8F9FA]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center px-4 py-3 border-b border-border/30">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-2 -ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">Add context</span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {/* Selected emotion display */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium",
            valenceColor.bg, valenceColor.text
          )}>
            {valence.charAt(0).toUpperCase() + valence.slice(1)}
          </div>
          <span className="text-muted-foreground text-sm">→</span>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium",
            categoryColor.bg, categoryColor.text
          )}>
            {categoryData?.label}
          </div>
          <span className="text-muted-foreground text-sm">→</span>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium",
            categoryColor.bgActive, categoryColor.textActive
          )}>
            {emotionLabel}
          </div>
        </div>

        {/* Context prompt */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            What made you feel {emotionLabel.toLowerCase()}?
          </h2>
          <p className="text-muted-foreground text-sm">
            Select any that apply (optional)
          </p>
        </div>

        {/* Context grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {CONTEXT_OPTIONS.map((context) => {
            const isSelected = selectedContexts.includes(context.value);
            return (
              <button
                key={context.value}
                onClick={() => toggleContext(context.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  "active:scale-95",
                  isSelected
                    ? "bg-[#4CAF50] text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                )}
              >
                {context.label}
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Add details or more reflection... (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was happening? What were you thinking?"
            className="min-h-[100px] resize-none rounded-xl bg-white border-slate-200"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="shrink-0 p-5 pb-safe border-t border-border/30 bg-[#F8F9FA]">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 text-base rounded-xl bg-[#4CAF50] hover:bg-[#43A047] text-white font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
};
