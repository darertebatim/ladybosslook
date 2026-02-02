import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CONTEXT_OPTIONS, VALENCE_OPTIONS, getCategoryByValue, type Valence } from '@/lib/emotionData';
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

  const valenceOption = VALENCE_OPTIONS.find(v => v.value === valence);
  const categoryData = getCategoryByValue(valence, category);
  const emotionLabel = categoryData?.emotions.find(e => e.value === emotion)?.label || emotion;

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
        <span className="text-sm text-muted-foreground">Step 4 of 4</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
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
          <span className="text-muted-foreground">→</span>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            valenceOption?.bgClass
          )}>
            {emotionLabel}
          </div>
        </div>

        {/* Context prompt */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            What made you feel {emotionLabel.toLowerCase()}?
          </h2>
          <p className="text-muted-foreground text-sm">
            Select any that apply (optional)
          </p>
        </div>

        {/* Context grid */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {CONTEXT_OPTIONS.map((context) => {
            const isSelected = selectedContexts.includes(context.value);
            return (
              <button
                key={context.value}
                onClick={() => toggleContext(context.value)}
                className={cn(
                  "px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "bg-violet-100 text-violet-700 border-violet-300"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                )}
              >
                {context.label}
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Add details or more reflection... (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was happening? What were you thinking?"
            className="min-h-[100px] resize-none rounded-xl"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="p-6 border-t border-border/50">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 text-lg rounded-2xl bg-green-500 hover:bg-green-600"
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
