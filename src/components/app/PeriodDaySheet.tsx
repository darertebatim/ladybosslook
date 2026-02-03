import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { PeriodLog, SYMPTOM_OPTIONS, FLOW_OPTIONS } from '@/lib/periodTracking';
import { Trash2 } from 'lucide-react';
import { useKeyboard } from '@/hooks/useKeyboard';

interface PeriodDaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  existingLog: PeriodLog | null;
  onSave: (data: {
    is_period_day: boolean;
    flow_intensity?: 'light' | 'medium' | 'heavy' | null;
    symptoms?: string[];
    notes?: string | null;
  }) => void;
  isLoading?: boolean;
}

export const PeriodDaySheet = ({
  open,
  onOpenChange,
  date,
  existingLog,
  onSave,
  isLoading = false,
}: PeriodDaySheetProps) => {
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [flowIntensity, setFlowIntensity] = useState<'light' | 'medium' | 'heavy' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isKeyboardOpen } = useKeyboard();

  // Reset form when sheet opens or existing log changes
  useEffect(() => {
    if (open) {
      if (existingLog) {
        setIsPeriodDay(existingLog.is_period_day);
        setFlowIntensity(existingLog.flow_intensity);
        setSymptoms(existingLog.symptoms || []);
        setNotes(existingLog.notes || '');
      } else {
        setIsPeriodDay(true); // Default to period day when logging new
        setFlowIntensity(null);
        setSymptoms([]);
        setNotes('');
      }
    }
  }, [open, existingLog]);

  // Handle keyboard for notes - multi-stage scroll for iOS
  const handleNotesFocus = () => {
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

  const toggleSymptom = (symptomId: string) => {
    haptic.light();
    setSymptoms(prev => 
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSave = () => {
    onSave({
      is_period_day: isPeriodDay,
      flow_intensity: isPeriodDay ? flowIntensity : null,
      symptoms, // Keep symptoms regardless of period day (for PMS tracking)
      notes: notes.trim() || null,
    });
  };

  const handleRemove = () => {
    haptic.light();
    onSave({ is_period_day: false });
  };

  if (!date) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b border-pink-100 py-3">
          <DrawerTitle className="text-pink-800">
            {format(date, 'EEEE, MMMM d')}
          </DrawerTitle>
        </DrawerHeader>

        <div 
          ref={scrollContainerRef}
          className="p-4 space-y-4 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Period day toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Period Day</p>
              <p className="text-xs text-muted-foreground">Mark this day as a period day</p>
            </div>
            <Switch
              checked={isPeriodDay}
              onCheckedChange={(checked) => {
                haptic.light();
                setIsPeriodDay(checked);
              }}
              className="data-[state=checked]:bg-pink-500"
            />
          </div>

          {/* Flow intensity - only show when period day */}
          {isPeriodDay && (
            <div>
              <p className="font-medium text-foreground text-sm mb-2">Flow Intensity</p>
              <div className="flex gap-2">
                {FLOW_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      haptic.light();
                      setFlowIntensity(option.id);
                    }}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-xl border-2 transition-all text-center',
                      flowIntensity === option.id
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-border bg-background hover:border-pink-200'
                    )}
                  >
                    <span className="text-base block">{option.emoji}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms - always visible for PMS/any day tracking */}
          <div>
            <p className="font-medium text-foreground text-sm mb-2">
              Symptoms {!isPeriodDay && <span className="text-muted-foreground font-normal">(PMS, etc.)</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all',
                    symptoms.includes(symptom.id)
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-border bg-background hover:border-pink-200 text-muted-foreground'
                  )}
                >
                  {symptom.emoji} {symptom.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes - always visible */}
          <div>
            <p className="font-medium text-foreground text-sm mb-2">Notes (optional)</p>
            <Textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={handleNotesFocus}
              placeholder="Add any notes about today..."
              className="resize-none h-20 border-pink-200 focus:border-pink-400 text-sm"
            />
          </div>
        </div>

        {/* Actions - with safe area */}
        <div 
          className="shrink-0 p-4 pt-3 border-t border-pink-100 flex gap-3"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {existingLog && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isLoading}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
