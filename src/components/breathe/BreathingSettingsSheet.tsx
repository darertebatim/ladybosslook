import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BreathingExercise } from '@/hooks/useBreathingExercises';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface BreathingSettingsSheetProps {
  exercise: BreathingExercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  onStart: () => void;
}

const DURATION_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
];

export function BreathingSettingsSheet({
  exercise,
  open,
  onOpenChange,
  selectedDuration,
  onDurationChange,
  onStart,
}: BreathingSettingsSheetProps) {
  if (!exercise) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="bg-[#5C5A8D] border-white/10 rounded-t-3xl"
      >
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{exercise.emoji}</span>
            {exercise.name}
          </SheetTitle>
        </SheetHeader>

        {/* Duration selection */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Duration</h4>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onDurationChange(option.value)}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-medium transition-all',
                  selectedDuration === option.value
                    ? 'bg-white text-[#5C5A8D]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cycle info */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Cycle duration</span>
            <span className="text-white font-medium">
              {exercise.inhale_seconds + exercise.inhale_hold_seconds + 
               exercise.exhale_seconds + exercise.exhale_hold_seconds}s
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-white/60">Estimated cycles</span>
            <span className="text-white font-medium">
              ~{Math.floor(selectedDuration / 
                (exercise.inhale_seconds + exercise.inhale_hold_seconds + 
                 exercise.exhale_seconds + exercise.exhale_hold_seconds)
              )} cycles
            </span>
          </div>
        </div>

        {/* Start button */}
        <Button
          onClick={onStart}
          className="w-full h-14 text-lg font-semibold bg-white text-[#5C5A8D] hover:bg-white/90 rounded-2xl"
        >
          <Play className="h-5 w-5 mr-2" />
          Begin Session
        </Button>
      </SheetContent>
    </Sheet>
  );
}
