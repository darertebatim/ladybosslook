import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Check } from 'lucide-react';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useRoutinePlan, useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmotionIntroProps {
  onStart: () => void;
}

// Synthetic task for emotion routine
const SYNTHETIC_EMOTION_TASK: RoutinePlanTask = {
  id: 'synthetic-emotion-task',
  plan_id: 'synthetic-emotion',
  title: 'Name Your Emotion',
  icon: '💜',
  color: 'lavender',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'emotion',
  pro_link_value: null,
  linked_playlist: null,
};

export const EmotionIntro = ({ onStart }: EmotionIntroProps) => {
  const navigate = useNavigate();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { data: existingTask } = useExistingProTask('emotion');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = existingTask || justAdded;

  const handleClose = () => {
    navigate('/app/home');
  };

  const handleRoutineClick = () => {
    if (isAdded) {
      navigate('/app/home');
    } else {
      setShowRoutineSheet(true);
    }
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-emotion',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [SYNTHETIC_EMOTION_TASK],
      });
      toast.success('Emotion check-in added to your routine!');
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error('Failed to add routine');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#6B7CFF]">
      {/* Close button */}
      <div className="p-4">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {/* Emoji cloud illustration */}
        <div className="relative mb-12">
          {/* Cloud shape */}
          <div className="w-48 h-32 bg-white/20 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="w-40 h-28 bg-white/15 rounded-full blur-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          
          {/* Emojis */}
          <div className="relative flex items-center gap-3 text-5xl">
            <span className="transform -rotate-12 animate-pulse">⚡</span>
            <span className="transform scale-110">💖</span>
            <span className="transform rotate-12">😊</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-white text-center mb-6">
          Name your emotion
        </h1>

        {/* Description */}
        <p className="text-white/80 text-center text-lg leading-relaxed max-w-xs mb-auto">
          Sometimes, what we feel is not so obvious. Naming the emotion can help us gain better control and understanding of ourselves.
        </p>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-8 space-y-3">
        <Button 
          onClick={onStart}
          className="w-full h-14 text-lg font-medium rounded-full bg-white hover:bg-white/90 text-[#6B7CFF]"
        >
          Start
        </Button>

        <Button 
          variant="ghost"
          onClick={handleRoutineClick}
          disabled={addRoutinePlan.isPending}
          className={cn(
            "w-full h-12 rounded-full gap-2",
            isAdded 
              ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-white"
              : "bg-white/10 hover:bg-white/20 text-white"
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
              Add to My Routine
            </>
          )}
        </Button>
      </div>

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_EMOTION_TASK]}
        routineTitle="Emotion Check-in"
        defaultTag="Wellness"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
};
