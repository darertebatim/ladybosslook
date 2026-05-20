import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChartColumn, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { useTodayMood, useCreateMoodLog } from '@/hooks/useMoodLogs';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { MoodCelebrationSheet } from './MoodCelebrationSheet';
import { MoodRoutinePromptSheet } from './MoodRoutinePromptSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getSubmoods } from '@/lib/submoods';

// 5-level mood system (labels/buttonText resolved via i18n at render time)
const MOODS = [
  { value: 'great', emoji: '😄', bgColor: 'bg-yellow-200' },
  { value: 'good', emoji: '🙂', bgColor: 'bg-green-200' },
  { value: 'okay', emoji: '😐', bgColor: 'bg-blue-200' },
  { value: 'not_great', emoji: '😔', bgColor: 'bg-purple-200' },
  { value: 'bad', emoji: '😢', bgColor: 'bg-red-200' },
] as const;

export function MoodDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { autoCompleteMood } = useAutoCompleteProTask();
  const { data: todayMood } = useTodayMood();
  const createMoodLog = useCreateMoodLog();
  const { data: existingTask, isLoading: existingTaskLoading } = useExistingProTask('mood');
  const addRoutinePlan = useAddRoutinePlan();
  
  // Synthetic task for mood routine — title localized via t()
  const SYNTHETIC_MOOD_TASK: RoutinePlanTask = {
    id: 'synthetic-mood-task',
    plan_id: 'synthetic-mood',
    title: t('moodPage.syntheticTaskTitle'),
    icon: '🫧',
    color: 'blue',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'mood',
    pro_link_value: null,
    linked_playlist: null,
    tag: 'pro',
  };

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSubmoods, setSelectedSubmoods] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRoutinePrompt, setShowRoutinePrompt] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [neverPrompt] = useState(() => localStorage.getItem('mood_routine_never') === 'true');
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const isAdded = existingTask || justAdded;

  const handleMoodSelect = useCallback((moodValue: string) => {
    haptic.selection();
    setSelectedMood(moodValue);
    setSelectedSubmoods([]);
    setStep(2);
  }, []);

  const handleToggleSubmood = useCallback((label: string) => {
    haptic.selection();
    setSelectedSubmoods((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  }, []);

  const handleBackToMoods = useCallback(() => {
    haptic.light();
    setStep(1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedMood) return;
    
    setIsSubmitting(true);
    haptic.medium();
    
    try {
      // Save mood check-in in emotion logs (separate from journal entries)
      const moodLabel = t(`moodPage.moods.${selectedMood}`, { defaultValue: selectedMood });
      const baseContent = t('moodPage.feelingDailyText', { mood: moodLabel.toLowerCase() });
      const content = selectedSubmoods.length > 0
        ? `${baseContent} (${selectedSubmoods.join(', ')})`
        : baseContent;
      await createMoodLog.mutateAsync({
        mood: selectedMood,
        content,
      });

      // Auto-complete any mood pro tasks for today
      await autoCompleteMood();
      
      haptic.success();
      
      // Always show celebration first
      setShowCelebration(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to log mood:', error);
      toast.error(t('moodPage.logFailed'));
      setIsSubmitting(false);
    }
  }, [selectedMood, selectedSubmoods, autoCompleteMood, createMoodLog, t]);

  const handleCelebrationDone = useCallback(() => {
    navigate('/app/home');
  }, [navigate]);

  // Intercept action clicks from celebration to show routine prompt
  const handleCelebrationAction = useCallback((route: string): boolean => {
    // Only intercept when we know for sure the user has NOT added it yet.
    // While the query is loading (existingTask === undefined), assume added
    // to avoid showing the prompt to users who already have the routine.
    if (existingTask === false && !justAdded && !neverPrompt && !existingTaskLoading) {
      setPendingRoute(route);
      setShowRoutinePrompt(true);
      return true; // intercept
    }
    return false; // let celebration handle navigation
  }, [existingTask, justAdded, neverPrompt, existingTaskLoading]);

  const handleRoutinePromptAdd = useCallback(() => {
    setShowRoutinePrompt(false);
    setShowRoutineSheet(true);
  }, []);

  const handleRoutinePromptSkip = useCallback(() => {
    setShowRoutinePrompt(false);
    if (pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
    }
  }, [pendingRoute, navigate]);

  const handleRoutinePromptNever = useCallback(() => {
    localStorage.setItem('mood_routine_never', 'true');
    setShowRoutinePrompt(false);
    if (pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
    }
  }, [pendingRoute, navigate]);

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
      toast.success(t('moodPage.addedToRoutines'));
      setShowRoutineSheet(false);
      setJustAdded(true);
      // Navigate to pending route after adding
      if (pendingRoute) {
        navigate(pendingRoute);
        setPendingRoute(null);
      }
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error(t('moodPage.addRoutineFailed'));
    }
  };

  const selectedMoodData = selectedMood ? MOODS.find(m => m.value === selectedMood) : null;
  const submoods = getSubmoods(selectedMood);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Step 1: Mood Grid */}
        {step === 1 && (
        <div className="flex-1 flex flex-col justify-center px-4">
          {/* Title - always visible */}
          <div className="text-center mb-6">
            <span className="text-2xl font-bold text-foreground">
              {t('moodPage.howAreYouFeeling')}
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
                  {t(`moodPage.moods.${mood.value}`)}
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
                  {t(`moodPage.moods.${mood.value}`)}
                </span>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Step 2: Submood selection */}
        {step === 2 && selectedMoodData && (
          <div className="flex-1 flex flex-col px-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={handleBackToMoods}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Back to moods"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <span className="text-sm font-medium text-foreground">Today</span>
              <div className="w-10" />
            </div>

            <div className="flex flex-col items-center mt-4 mb-6">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                selectedMoodData.bgColor
              )}>
                <FluentEmoji emoji={selectedMoodData.emoji} size={56} />
              </div>
              <h2 className="mt-5 text-center text-2xl font-bold text-foreground px-4 leading-tight">
                How would you describe how you're feeling?
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pb-6">
              {submoods.map((label) => {
                const active = selectedSubmoods.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => handleToggleSubmood(label)}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-base font-medium transition-all active:scale-95',
                      active
                        ? 'bg-foreground text-background'
                        : 'bg-white text-foreground shadow-sm'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Bar with iOS safe area */}
        <div 
          className="shrink-0 px-4 pt-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          {step === 1 ? (
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
              onClick={() => selectedMood && setStep(2)}
              disabled={!selectedMood || isSubmitting}
              className={cn(
                'flex-1 h-12 rounded-full font-semibold text-base transition-all',
                selectedMood 
                  ? 'bg-foreground text-background hover:bg-foreground/90' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {selectedMoodData
                ? t(`moodPage.buttonText.${selectedMoodData.value}`)
                : t('moodPage.iFeel')}
            </Button>

            {/* Add to Routines Button - icon only */}
            <AddedToRoutineButton
              isAdded={!!isAdded}
              onAddClick={handleRoutineClick}
              isLoading={addRoutinePlan.isPending}
              iconOnly
              className="w-12 h-12"
              size="default"
            />
          </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 rounded-full font-semibold text-base bg-foreground text-background hover:bg-foreground/90"
            >
              {isSubmitting ? t('moodPage.saving') : "Here's how I feel."}
            </Button>
          )}
        </div>
      </div>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_MOOD_TASK]}
        routineTitle={t('moodPage.syntheticTaskTitle')}
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />

      {/* Routine Prompt Sheet - shown before celebration if not in routine */}
      <MoodRoutinePromptSheet
        open={showRoutinePrompt}
        onOpenChange={setShowRoutinePrompt}
        mood={selectedMood}
        onAddToRoutine={handleRoutinePromptAdd}
        onSkip={handleRoutinePromptSkip}
        onNever={handleRoutinePromptNever}
      />

      {/* Mood Celebration Sheet */}
      <MoodCelebrationSheet
        open={showCelebration}
        onOpenChange={setShowCelebration}
        mood={selectedMood}
        onDone={handleCelebrationDone}
        onActionClick={handleCelebrationAction}
      />
    </>
  );
}
