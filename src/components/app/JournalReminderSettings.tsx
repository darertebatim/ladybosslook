import { useState } from 'react';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { toast } from 'sonner';

interface JournalReminderSettingsProps {
  className?: string;
}

// Synthetic task for journal - no longer using database routine plans
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
};

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { data: existingTask } = useExistingProTask('journal');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = existingTask || justAdded;

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-journal',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [SYNTHETIC_JOURNAL_TASK],
      });
      toast.success('Journal routine added to your planner!');
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return (
    <div className={className}>
      <AddedToRoutineButton
        isAdded={isAdded}
        onAddClick={() => setShowRoutineSheet(true)}
        isLoading={addRoutinePlan.isPending}
        addText="Add Journaling to My Routine"
        size="sm"
        variant="outline"
      />

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_JOURNAL_TASK]}
        routineTitle="Journaling"
        defaultTag="Journal"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
};