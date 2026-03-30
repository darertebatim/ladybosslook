import { useState } from 'react';
import { Crown } from 'lucide-react';
import { BreathingExercise } from '@/hooks/useBreathingExercises';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface BreathingExerciseCardProps {
  exercise: BreathingExercise;
  onClick: () => void;
  className?: string;
}

export function BreathingExerciseCard({ exercise, onClick, className }: BreathingExerciseCardProps) {
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addRoutinePlan = useAddRoutinePlan();
  const { isSubscribed } = useSubscription();
  
  const isLocked = exercise.is_premium && !isSubscribed;
  const isPremium = exercise.is_premium;
  
  const { data: existingTask } = useExistingProTask('breathe', exercise.id);
  const isAdded = !!existingTask || justAdded;

  const syntheticTask: RoutinePlanTask = {
    id: `breathe-${exercise.id}`,
    plan_id: 'synthetic-breathe',
    title: exercise.name,
    icon: exercise.emoji || '🌬️',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'breathe',
    pro_link_value: exercise.id,
    tag: 'pro',
  };

  const handleExerciseClick = () => {
    if (isLocked) { haptic.light(); setShowPaywall(true); return; }
    onClick();
  };

  const handleAddToRoutines = () => {
    if (isLocked) { haptic.light(); setShowPaywall(true); return; }
    haptic.light();
    setShowRoutineSheet(true);
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-breathe',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [syntheticTask],
      });
      toast.success(`${exercise.name} added to your routines!`);
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return (
    <>
      <div className={cn("w-full flex items-center gap-3 py-2.5", className)}>
        <button
          onClick={handleExerciseClick}
          className="flex-1 flex items-center gap-3 text-left transition-transform active:scale-[0.98] min-w-0"
        >
          {/* Emoji avatar */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <FluentEmoji emoji={exercise.emoji || '🌬️'} size={28} />
            </div>
            {isPremium && (
              <span className="absolute -top-2 -left-1.5 flex items-center gap-0.5 bg-amber-200 text-amber-900 text-[8px] font-bold px-1 py-0.5 rounded-full shadow-sm">
                <Crown className="h-2 w-2" />
                PLUS
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{exercise.name}</p>
            {exercise.subtitle && (
              <p className="text-xs text-foreground/70 mt-0.5 line-clamp-1">{exercise.subtitle}</p>
            )}
          </div>
        </button>

        {/* Calendar+ / Lock button */}
        {isLocked ? (
          <button
            onClick={() => { haptic.light(); setShowPaywall(true); }}
            className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"
          >
            <span className="text-lg">🔒</span>
          </button>
        ) : (
          <AddedToRoutineButton
            isAdded={isAdded}
            onAddClick={handleAddToRoutines}
            iconOnly
          />
        )}
      </div>

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticTask]}
        routineTitle={exercise.name}
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />

      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
