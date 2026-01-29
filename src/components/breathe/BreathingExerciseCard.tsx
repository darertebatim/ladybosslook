import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { BreathingExercise } from '@/hooks/useBreathingExercises';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

interface BreathingExerciseCardProps {
  exercise: BreathingExercise;
  onClick: () => void;
}

export function BreathingExerciseCard({ exercise, onClick }: BreathingExerciseCardProps) {
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const addRoutinePlan = useAddRoutinePlan();

  // Calculate total cycle duration
  const cycleDuration = 
    exercise.inhale_seconds + 
    exercise.inhale_hold_seconds + 
    exercise.exhale_seconds + 
    exercise.exhale_hold_seconds;

  // Create a synthetic task for this specific exercise
  const syntheticTask: RoutinePlanTask = {
    id: `breathe-${exercise.id}`,
    plan_id: 'synthetic-breathe',
    title: exercise.name,
    icon: exercise.emoji || '🌬️',
    duration_minutes: 5,
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'breathe',
    pro_link_value: exercise.id, // Link to specific exercise
  };

  const handleAddToRoutine = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    haptic.light();
    setShowRoutineSheet(true);
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-breathe',
        selectedTaskIds,
        editedTasks,
      });
      toast.success(`${exercise.name} added to your routine!`);
      setShowRoutineSheet(false);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add to routine');
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left p-4 rounded-2xl transition-all',
          'bg-card border border-border shadow-sm',
          'hover:shadow-md active:scale-[0.98]'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Emoji */}
          <div className="text-3xl flex-shrink-0">{exercise.emoji}</div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg">{exercise.name}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-0.5">
              {exercise.description}
            </p>
            
            {/* Timing info */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {cycleDuration}s cycle
              </span>
              {exercise.inhale_hold_seconds > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  with holds
                </span>
              )}
            </div>
          </div>

          {/* Add to routine button */}
          <button
            onClick={handleAddToRoutine}
            className="flex-shrink-0 p-2.5 rounded-full bg-foreground hover:bg-foreground/90 transition-colors"
            aria-label="Add to routine"
          >
            <CalendarPlus className="h-5 w-5 text-background" />
          </button>
        </div>
      </button>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticTask]}
        routineTitle={exercise.name}
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </>
  );
}
