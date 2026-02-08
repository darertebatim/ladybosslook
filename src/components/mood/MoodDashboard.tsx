import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartColumn, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { useTodayMood } from '@/hooks/useMoodLogs';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { MoodCelebrationSheet } from './MoodCelebrationSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// 5-level mood system
const MOODS = [
  { 
    value: 'great', 
    emoji: '😄', 
    label: 'Great',
    bgColor: 'bg-yellow-200',
    buttonText: 'I feel great!!!',
  },
  { 
    value: 'good', 
    emoji: '🙂', 
    label: 'Good',
    bgColor: 'bg-green-200',
    buttonText: 'I feel good!',
  },
  { 
    value: 'okay', 
    emoji: '😐', 
    label: 'Okay',
    bgColor: 'bg-blue-200',
    buttonText: 'I feel just Okay.',
  },
  { 
    value: 'not_great', 
    emoji: '😔', 
    label: 'Not Great',
    bgColor: 'bg-purple-200',
    buttonText: 'I feel not great...',
  },
  { 
    value: 'bad', 
    emoji: '😢', 
    label: 'Bad',
    bgColor: 'bg-red-200',
    buttonText: 'I feel bad...',
  },
];

// Synthetic task for mood routine
const SYNTHETIC_MOOD_TASK: RoutinePlanTask = {
  id: 'synthetic-mood-task',
  plan_id: 'synthetic-mood',
  title: 'Daily Mood Check-in',
  icon: '😊',
  color: 'yellow',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'mood',
  pro_link_value: null,
  linked_playlist: null,
  tag: 'pro',
};

export function MoodDashboard() {
  const navigate = useNavigate();
  const { autoCompleteMood } = useAutoCompleteProTask();
  const { data: todayMood } = useTodayMood();
  const { data: existingTask } = useExistingProTask('mood');
  const addRoutinePlan = useAddRoutinePlan();
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isAdded = existingTask || justAdded;

  const handleMoodSelect = useCallback((moodValue: string) => {
    haptic.selection();
    setSelectedMood(moodValue);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedMood) return;
    
    setIsSubmitting(true);
    haptic.medium();
    
    try {
      // Auto-complete any mood pro tasks for today
      await autoCompleteMood();
      
      haptic.success();
      
      // Show celebration sheet instead of auto-saving to journal
      setShowCelebration(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to log mood:', error);
      toast.error('Failed to log mood');
      setIsSubmitting(false);
    }
  }, [selectedMood, autoCompleteMood]);

  const handleCelebrationDone = useCallback(() => {
    navigate('/app/home');
  }, [navigate]);

  const handleRoutineClick = () => {
    haptic.light();
    if (isAdded) {
      navigate('/app/home');
    } else {
      setShowRoutineSheet(true);
    }
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-mood',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [SYNTHETIC_MOOD_TASK],
      });
      toast.success('Mood check-in added to your rituals!');
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add ritual:', error);
      toast.error('Failed to add ritual');
    }
  };

  const selectedMoodData = selectedMood ? MOODS.find(m => m.value === selectedMood) : null;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Mood Grid */}
        <div className="flex-1 flex flex-col justify-center px-4">
          {/* Title - always visible */}
          <div className="text-center mb-6">
            <span className="text-lg font-medium text-foreground">
              How are you Feeling?
            </span>
          </div>

          {/* Top row - 3 moods */}
          <div className="flex justify-center gap-3 mb-4">
            {MOODS.slice(0, 3).map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={isSubmitting}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  'active:scale-95 disabled:opacity-50'
                )}
              >
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center relative transition-all',
                  mood.bgColor,
                  selectedMood === mood.value && 'ring-4 ring-foreground/20 scale-110'
                )}>
                  <FluentEmoji emoji={mood.emoji} size={48} />
                  {selectedMood === mood.value && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-background" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
          
          {/* Bottom row - 2 moods */}
          <div className="flex justify-center gap-3">
            {MOODS.slice(3).map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={isSubmitting}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  'active:scale-95 disabled:opacity-50'
                )}
              >
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center relative transition-all',
                  mood.bgColor,
                  selectedMood === mood.value && 'ring-4 ring-foreground/20 scale-110'
                )}>
                  <FluentEmoji emoji={mood.emoji} size={48} />
                  {selectedMood === mood.value && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-background" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Action Bar with iOS safe area */}
        <div 
          className="shrink-0 px-4 pt-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          <div className="flex items-center gap-3">
            {/* Stats Button */}
            <button
              onClick={() => {
                haptic.light();
                navigate('/app/mood/history');
              }}
              className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <ChartColumn className="h-5 w-5 text-background" />
            </button>

            {/* Main "I feel..." Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedMood || isSubmitting}
              className={cn(
                'flex-1 h-12 rounded-full font-semibold text-base transition-all',
                selectedMood 
                  ? 'bg-foreground text-background hover:bg-foreground/90' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Saving...' : (selectedMoodData?.buttonText || 'I feel...')}
            </Button>

            {/* Add to Rituals Button - icon only */}
            <AddedToRoutineButton
              isAdded={!!isAdded}
              onAddClick={handleRoutineClick}
              isLoading={addRoutinePlan.isPending}
              iconOnly
              className="w-12 h-12"
              size="default"
            />
          </div>
        </div>
      </div>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_MOOD_TASK]}
        routineTitle="Daily Mood Check-in"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />

      {/* Mood Celebration Sheet */}
      <MoodCelebrationSheet
        open={showCelebration}
        onOpenChange={setShowCelebration}
        mood={selectedMood}
        onDone={handleCelebrationDone}
      />
    </>
  );
}
