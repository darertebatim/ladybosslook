import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BreathingExercise } from '@/hooks/useBreathingExercises';

interface BreathingInfoSheetProps {
  exercise: BreathingExercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

export function BreathingInfoSheet({ 
  exercise, 
  open, 
  onOpenChange,
  onDismiss 
}: BreathingInfoSheetProps) {
  if (!exercise) return null;

  const hasInhaleHold = exercise.inhale_hold_seconds > 0;
  const hasExhaleHold = exercise.exhale_hold_seconds > 0;

  // Build phases array for display
  const phases = [
    { 
      label: 'Inhale', 
      seconds: exercise.inhale_seconds, 
      method: exercise.inhale_method === 'nose' ? 'Nose' : 'Mouth',
      icon: '○→' // Expanding
    },
    ...(hasInhaleHold ? [{ 
      label: 'Hold', 
      seconds: exercise.inhale_hold_seconds, 
      method: null,
      icon: '●' // Filled/static
    }] : []),
    { 
      label: 'Exhale', 
      seconds: exercise.exhale_seconds, 
      method: exercise.exhale_method === 'nose' ? 'Nose' : 'Mouth',
      icon: '←○' // Contracting
    },
    ...(hasExhaleHold ? [{ 
      label: 'Hold', 
      seconds: exercise.exhale_hold_seconds, 
      method: null,
      icon: '●' // Filled/static
    }] : []),
  ];

  const handleOkay = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="bg-card border-border rounded-t-3xl"
      >
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{exercise.emoji}</span>
            <SheetTitle className="text-xl font-bold text-foreground">
              {exercise.name}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Phase breakdown visualization */}
        <div className="bg-muted rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-around">
            {phases.map((phase, index) => (
              <div key={index} className="flex flex-col items-center">
                {/* Icon circle */}
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-2">
                  <span className="text-lg text-foreground">{phase.icon}</span>
                </div>
                {/* Label */}
                <span className="text-sm font-medium text-foreground">{phase.label}</span>
                {/* Duration */}
                <span className="text-xs text-muted-foreground">{phase.seconds}s</span>
                {/* Method */}
                {phase.method && (
                  <span className="text-xs text-muted-foreground/70 mt-0.5">{phase.method}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {exercise.description && (
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {exercise.description}
          </p>
        )}

        {/* Okay button */}
        <Button
          onClick={handleOkay}
          className="w-full h-12 font-semibold rounded-2xl"
        >
          Okay
        </Button>
      </SheetContent>
    </Sheet>
  );
}
