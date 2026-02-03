import { useState } from 'react';
import { useRoutinePlan, useAddRoutinePlan } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
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
  const [justAdded, setJustAdded] = useState(false);
  
  const { data: routinePlan, isLoading } = useRoutinePlan(BREATHE_ROUTINE_ID || undefined);
  const { data: existingTask } = useExistingProTask('breathe');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = existingTask || justAdded;

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
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return (
    <div className={className}>
      {/* Custom styling for the dark breathing page background */}
      <div className="flex items-center gap-2">
        {isAdded ? (
          <>
            <button
              onClick={() => window.location.href = '/app/home'}
              className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] bg-emerald-500/30 text-white text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Added — Go to Planner
            </button>
            <button
              onClick={() => setShowRoutineSheet(true)}
              disabled={addRoutinePlan.isPending}
              className="h-10 w-10 rounded-lg bg-white text-slate-900 flex items-center justify-center shrink-0 active:scale-[0.95] transition-transform"
              title="Add again to routine"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowRoutineSheet(true)}
            disabled={isLoading && !!BREATHE_ROUTINE_ID}
            className="w-full h-10 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all active:scale-[0.98] bg-white/20 hover:bg-white/30 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            Add Breathing to My Routine
          </button>
        )}
      </div>

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
