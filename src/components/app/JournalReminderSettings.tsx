import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useRoutinePlan, useAddRoutinePlan } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { toast } from 'sonner';

interface JournalReminderSettingsProps {
  className?: string;
}

// The journal Pro Routine ID - contains the "Daily Reflection & Gratitude" pro task
const JOURNAL_ROUTINE_ID = '51be0466-99fb-4357-b48d-b584376046c5';

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  
  const { data: routinePlan, isLoading } = useRoutinePlan(JOURNAL_ROUTINE_ID);
  const addRoutinePlan = useAddRoutinePlan();

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!routinePlan?.tasks) return;
    
    try {
      await addRoutinePlan.mutateAsync({
        planId: JOURNAL_ROUTINE_ID,
        selectedTaskIds,
        editedTasks,
      });
      toast.success('Journal routine added to your planner!');
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
        disabled={isLoading}
        className="w-full gap-2 bg-[#F4ECFE] hover:bg-[#E9DCFC] border-[#E9DCFC] text-foreground"
      >
        <Sparkles className="h-4 w-4" />
        Add Journaling to My Routine
      </Button>

      {/* Routine Preview Sheet - opens directly like playlists */}
      {routinePlan?.tasks && (
        <RoutinePreviewSheet
          open={showRoutineSheet}
          onOpenChange={setShowRoutineSheet}
          tasks={routinePlan.tasks}
          routineTitle={routinePlan.title}
          onSave={handleSaveRoutine}
          isSaving={addRoutinePlan.isPending}
        />
      )}
    </div>
  );
};
