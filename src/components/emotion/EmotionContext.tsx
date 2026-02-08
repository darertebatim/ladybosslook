import { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Loader2, Heart, Cloud, Briefcase, GraduationCap,
  Dumbbell, HeartPulse, Home, Palette, Moon, Users, Wallet, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CONTEXT_OPTIONS, getEmotionLabel, type Valence, type ContextOption } from '@/lib/emotionData';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useKeyboard } from '@/hooks/useKeyboard';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Cloud, Briefcase, GraduationCap, Dumbbell, HeartPulse,
  Home, Palette, Moon, Users, Wallet, MapPin
};

// Valence-based colors matching the first page buttons
const VALENCE_COLORS: Record<Valence, { text: string; selectedBg: string; selectedText: string }> = {
  pleasant: { text: 'text-orange-600', selectedBg: 'bg-orange-500', selectedText: 'text-white' },
  neutral: { text: 'text-blue-600', selectedBg: 'bg-blue-500', selectedText: 'text-white' },
  unpleasant: { text: 'text-purple-600', selectedBg: 'bg-purple-500', selectedText: 'text-white' },
};

interface EmotionContextProps {
  valence: Valence;
  category: string;
  emotions: string[];
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
    const scrollIntoView = () => {
      notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    setTimeout(scrollIntoView, 100);
    setTimeout(scrollIntoView, 300);
  };

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
      className="h-[100dvh] flex flex-col bg-[#F4F5F7]"
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
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">
          What's making you feel{' '}
          <span className={valenceColors.text}>{emotionDisplayText}</span>?
        </h2>

        {/* Context grid - Me+ style with icons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {CONTEXT_OPTIONS.map((context: ContextOption) => {
            const isSelected = selectedContexts.includes(context.value);
            const IconComponent = ICON_MAP[context.icon];
            
            return (
              <button
                key={context.value}
                onClick={() => toggleContext(context.value)}
                className={cn(
                  "flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-200",
                  "active:scale-95",
                  isSelected
                    ? cn(valenceColors.selectedBg, valenceColors.selectedText)
                    : "bg-white text-foreground/80"
                )}
              >
                {IconComponent && (
                  <IconComponent className="h-6 w-6 mb-1.5" />
                )}
                <span className="text-xs font-medium text-center leading-tight">
                  {context.label}
                </span>
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
          placeholder="Add Note"
          className="min-h-[80px] resize-none rounded-2xl bg-white border-0 text-base shadow-sm"
        />
      </div>

      {/* Save button */}
      <div className="shrink-0 p-5 pb-safe">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 text-base rounded-xl bg-foreground hover:bg-foreground/90 text-background font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Because of this.'
          )}
        </Button>
      </div>
    </div>
  );
};