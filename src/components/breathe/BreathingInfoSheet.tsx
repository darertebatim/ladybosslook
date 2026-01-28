import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BreathingExercise } from '@/hooks/useBreathingExercises';
import { Wind } from 'lucide-react';

interface BreathingInfoSheetProps {
  exercise: BreathingExercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
}

export function BreathingInfoSheet({ 
  exercise, 
  open, 
  onOpenChange,
  onStart 
}: BreathingInfoSheetProps) {
  if (!exercise) return null;

  const hasInhaleHold = exercise.inhale_hold_seconds > 0;
  const hasExhaleHold = exercise.exhale_hold_seconds > 0;

  const steps = [
    { label: 'Inhale', seconds: exercise.inhale_seconds, method: exercise.inhale_method },
    ...(hasInhaleHold ? [{ label: 'Hold', seconds: exercise.inhale_hold_seconds }] : []),
    { label: 'Exhale', seconds: exercise.exhale_seconds, method: exercise.exhale_method },
    ...(hasExhaleHold ? [{ label: 'Hold', seconds: exercise.exhale_hold_seconds }] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="bg-[#5C5A8D] border-white/10 rounded-t-3xl"
      >
        <SheetHeader className="text-left mb-6">
          <div className="text-4xl mb-2">{exercise.emoji}</div>
          <SheetTitle className="text-2xl font-bold text-white">
            {exercise.name}
          </SheetTitle>
          <p className="text-white/70">{exercise.description}</p>
        </SheetHeader>

        {/* Breathing pattern visualization */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Breathing Pattern</h4>
          <div className="flex items-center justify-around">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-white">{step.seconds}s</span>
                </div>
                <span className="text-sm text-white/80">{step.label}</span>
                {step.method && (
                  <span className="text-xs text-white/50 capitalize">{step.method}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <Button
          onClick={onStart}
          className="w-full h-14 text-lg font-semibold bg-white text-[#5C5A8D] hover:bg-white/90 rounded-2xl"
        >
          <Wind className="h-5 w-5 mr-2" />
          Start Breathing
        </Button>
      </SheetContent>
    </Sheet>
  );
}
