import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BreathingExercise } from '@/hooks/useBreathingExercises';
import { Wind, Sparkles } from 'lucide-react';
import { useAddRoutinePlan } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';

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
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const addRoutinePlan = useAddRoutinePlan();

  if (!exercise) return null;

  const hasInhaleHold = exercise.inhale_hold_seconds > 0;
  const hasExhaleHold = exercise.exhale_hold_seconds > 0;

  const steps = [
    { label: 'Inhale', seconds: exercise.inhale_seconds, method: exercise.inhale_method },
    ...(hasInhaleHold ? [{ label: 'Hold', seconds: exercise.inhale_hold_seconds, subLabel: 'after inhale' }] : []),
    { label: 'Exhale', seconds: exercise.exhale_seconds, method: exercise.exhale_method },
    ...(hasExhaleHold ? [{ label: 'Hold', seconds: exercise.exhale_hold_seconds, subLabel: 'after exhale' }] : []),
  ];

  // Create a task for this specific exercise
  const exerciseTask: RoutinePlanTask = {
    id: `breathe-${exercise.id}`,
    plan_id: 'synthetic-breathe',
    title: exercise.name,
    icon: exercise.emoji || '🫁',
    duration_minutes: 5,
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'breathe',
    pro_link_value: exercise.id,
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-breathe',
        selectedTaskIds,
        editedTasks,
      });
      toast.success('Breathing exercise added to your routine!');
      setShowRoutineSheet(false);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return (
    <>
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
                  {step.subLabel && (
                    <span className="text-xs text-white/40">{step.subLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onStart}
              className="w-full h-14 text-lg font-semibold bg-white text-[#5C5A8D] hover:bg-white/90 rounded-2xl"
            >
              <Wind className="h-5 w-5 mr-2" />
              Start Breathing
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowRoutineSheet(true)}
              className="w-full h-12 font-medium bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-2xl"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Add to My Routine
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[exerciseTask]}
        routineTitle={exercise.name}
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </>
  );
}
