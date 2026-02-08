import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CONTEXT_OPTIONS, getEmotionLabel, type Valence } from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useKeyboard } from '@/hooks/useKeyboard';

// Valence-based colors matching the first page buttons
const VALENCE_COLORS: Record<Valence, { text: string; selectedBg: string; selectedText: string }> = {
  pleasant: { text: 'text-orange-600', selectedBg: 'bg-orange-500', selectedText: 'text-white' },
  neutral: { text: 'text-blue-600', selectedBg: 'bg-blue-500', selectedText: 'text-white' },
  unpleasant: { text: 'text-purple-600', selectedBg: 'bg-purple-500', selectedText: 'text-white' },
};

interface EmotionContextProps {
  valence: Valence;
  category: string;
  emotions: string[]; // Now accepts array
  onSave: (contexts: string[], notes: string) => void;
  onBack: () => void;
  isSaving: boolean;
}

export const EmotionContext = ({ 
  valence, 
  category, 
  emotions, 
  onSave, 
  onBack,
  isSaving 
}: EmotionContextProps) => {
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isKeyboardOpen } = useKeyboard();

  // Get labels for all selected emotions
  const emotionLabels = emotions.map(e => getEmotionLabel(valence, category, e));
  const emotionDisplayText = emotionLabels.join(', ').toLowerCase();
  
  // Get valence-based colors
  const valenceColors = VALENCE_COLORS[valence];

  // Handle keyboard - scroll textarea into view when focused
  const handleNotesFocus = () => {
    // Multi-stage scroll to ensure visibility on iOS
    const scrollIntoView = () => {
      notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    
    // Initial delay for keyboard to start appearing
    setTimeout(scrollIntoView, 100);
    // After keyboard animation
    setTimeout(scrollIntoView, 300);
  };

  // Auto-scroll when keyboard opens while textarea is focused
  useEffect(() => {
    if (isKeyboardOpen && document.activeElement === notesRef.current) {
      setTimeout(() => {
        notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isKeyboardOpen]);

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

  const handleBack = () => {
    haptic.light();
    onBack();
  };

  return (
    <div 
      className="h-[100dvh] flex flex-col bg-[#F8F9FA]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center px-4 py-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-0.5 -ml-2 px-2 py-2 text-foreground/80 active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-5 py-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Title with emotions highlighted using valence color */}
        <h2 className="text-xl font-semibold text-foreground mb-6">
          What made you feel{' '}
          <span className={valenceColors.text}>{emotionDisplayText}</span>?
        </h2>

        {/* Context grid - Finch style with valence-colored selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CONTEXT_OPTIONS.map((context) => {
            const isSelected = selectedContexts.includes(context.value);
            return (
              <button
                key={context.value}
                onClick={() => toggleContext(context.value)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                  "active:scale-95",
                  isSelected
                    ? cn(valenceColors.selectedBg, valenceColors.selectedText)
                    : "bg-[#ECEFF1] text-[#546E7A]"
                )}
              >
                {context.label}
              </button>
            );
          })}
        </div>

        {/* Notes textarea */}
        <Textarea
          ref={notesRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={handleNotesFocus}
          placeholder="Add details or more reflection..."
          className="min-h-[140px] resize-none rounded-2xl bg-white border-slate-200 text-base"
        />
      </div>

      {/* Save button */}
      <div className="shrink-0 p-5 pb-safe">
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