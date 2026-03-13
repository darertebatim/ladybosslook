import { useState, useMemo } from 'react';
import { useRoutinePlan, useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { toast } from 'sonner';

// The journal Pro Routine ID - contains the "Daily Reflection & Gratitude" pro task
const JOURNAL_ROUTINE_ID = '51be0466-99fb-4357-b48d-b584376046c5';

// Fallback synthetic task if no Pro Routine exists
const SYNTHETIC_JOURNAL_TASK: RoutinePlanTask = {
  id: 'synthetic-journal-task',
  plan_id: 'synthetic-journal',
  title: 'Daily Journaling',
  icon: '📓',
  color: 'purple',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'journal',
  pro_link_value: null,
  linked_playlist: null,
  tag: 'pro',
};

/** Hook to expose journal routine state for external rendering */
export const useJournalRoutine = () => {
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { data: routinePlan, isLoading } = useRoutinePlan(JOURNAL_ROUTINE_ID);
  const { data: existingTask } = useExistingProTask('journal');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = !!existingTask || justAdded;

  const tasksToShow = useMemo(() => {
    if (routinePlan?.tasks && routinePlan.tasks.length > 0) {
      return routinePlan.tasks;
    }
    return [SYNTHETIC_JOURNAL_TASK];
  }, [routinePlan?.tasks]);

  const usingSynthetic = !routinePlan?.tasks || routinePlan.tasks.length === 0;

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: usingSynthetic ? 'synthetic-journal' : JOURNAL_ROUTINE_ID,
        selectedTaskIds,
        editedTasks,
        syntheticTasks: usingSynthetic ? [SYNTHETIC_JOURNAL_TASK] : undefined,
      });
      toast.success('Journal routine added to your planner!');
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return {
    isAdded,
    isLoading: isLoading || addRoutinePlan.isPending,
    showRoutineSheet,
    setShowRoutineSheet,
    handleSaveRoutine,
    tasksToShow,
    routineTitle: routinePlan?.title || 'Journaling',
    isSaving: addRoutinePlan.isPending,
  };
};
