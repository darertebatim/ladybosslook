import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';
import { useRoutinePlan, useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JournalReminderSettingsProps {
  className?: string;
}

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
};

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const navigate = useNavigate();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { data: routinePlan, isLoading } = useRoutinePlan(JOURNAL_ROUTINE_ID);
  const { data: existingTask } = useExistingProTask('journal');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = existingTask || justAdded;

  // Use Pro Routine tasks if available, otherwise fall back to synthetic
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

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={isAdded ? () => navigate('/app/home') : () => setShowRoutineSheet(true)}
        disabled={isLoading}
        className={cn(
          "w-full gap-2",
          isAdded 
            ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
            : "bg-[#F4ECFE] hover:bg-[#E9DCFC] border-[#E9DCFC] text-foreground"
        )}
      >
        {isAdded ? (
          <>
            <Check className="h-4 w-4" />
            Added — Go to Planner
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Add Journaling to My Routine
          </>
        )}
      </Button>

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={tasksToShow}
        routineTitle={routinePlan?.title || 'Journaling'}
        defaultTag="Journal"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
};
