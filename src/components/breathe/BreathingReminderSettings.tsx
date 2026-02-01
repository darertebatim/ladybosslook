import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Wind } from 'lucide-react';
import { useRoutinePlan, useAddRoutinePlan } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';

interface BreathingReminderSettingsProps {
  className?: string;
}

// Fallback breathing routine tasks when no Pro Routine exists
const FALLBACK_BREATHING_TASKS: RoutinePlanTask[] = [
  {
    id: 'breathe-task-1',
    plan_id: 'synthetic-breathe',
    title: 'Morning Breathing Exercise',
    icon: '🌬️',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'breathe',
    pro_link_value: null, // Opens breathe page
  },
];

// The breathe Pro Routine ID - create one in admin if needed
// For now, we use a fallback synthetic routine
const BREATHE_ROUTINE_ID = null; // Set to actual ID if Pro Routine exists

export const BreathingReminderSettings = ({ className }: BreathingReminderSettingsProps) => {
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  
  const { data: routinePlan, isLoading } = useRoutinePlan(BREATHE_ROUTINE_ID || undefined);
  const addRoutinePlan = useAddRoutinePlan();

  // Use Pro Routine tasks if available, otherwise fallback
  const tasks = routinePlan?.tasks || FALLBACK_BREATHING_TASKS;
  const routineTitle = routinePlan?.title || 'Breathing Routine';

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      if (BREATHE_ROUTINE_ID && routinePlan?.tasks) {
        // Has a linked Pro Routine - use the normal flow
        await addRoutinePlan.mutateAsync({
          planId: BREATHE_ROUTINE_ID,
          selectedTaskIds,
          editedTasks,
        });
      } else {
        // No linked routine - we need to create tasks directly
        // The RoutinePreviewSheet edits will be applied when saving
        const editedTask = editedTasks[0];
        if (editedTask || selectedTaskIds.length > 0) {
          await addRoutinePlan.mutateAsync({
            planId: 'synthetic-breathe',
            selectedTaskIds,
            editedTasks,
            syntheticTasks: FALLBACK_BREATHING_TASKS,
          });
        }
      }
      toast.success('Breathing routine added to your planner!');
      setShowRoutineSheet(false);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowRoutineSheet(true)}
        disabled={isLoading && !!BREATHE_ROUTINE_ID}
        className="w-full gap-2 bg-white/20 hover:bg-white/30 border-white/30 text-white"
      >
        <Sparkles className="h-4 w-4" />
        Add Breathing to My Routine
      </Button>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={tasks}
        routineTitle={routineTitle}
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
};
