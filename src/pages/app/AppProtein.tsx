import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Settings, Beef, CalendarPlus, Check } from 'lucide-react';
import { BackButtonCircle } from '@/components/app/BackButton';
import { format } from 'date-fns';
import { useTasksForDate, useCompletionsForDate, useAddGoalProgress, useCreateTask } from '@/hooks/useTaskPlanner';
import { isProteinTask, createProteinRoutineTask } from '@/lib/proteinTracking';
import { ProteinInputSheet } from '@/components/app/ProteinInputSheet';
import { DailyGoalSheet } from '@/components/app/DailyGoalSheet';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';

const DEFAULT_PROTEIN_GOAL = 100;
const DEFAULT_PROTEIN_UNIT = 'g';

const AppProtein = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date());
  const [showInputSheet, setShowInputSheet] = useState(false);
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  const prevProgressRef = useRef(0);
  const hasCelebratedRef = useRef(false);

  const { data: tasks = [], isLoading: tasksLoading } = useTasksForDate(selectedDate);
  const { data: completions } = useCompletionsForDate(selectedDate);

  const addGoalProgress = useAddGoalProgress();
  const createTask = useCreateTask();
  const queryClient = useQueryClient();
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const proteinTask = useMemo(() => tasks.find((task) => isProteinTask(task)), [tasks]);

  const goalProgress = useMemo(() => {
    if (!proteinTask || !completions) return localProgress;
    const completion = completions.tasks.find((c) => c.task_id === proteinTask.id);
    return (completion as any)?.goal_progress || localProgress;
  }, [proteinTask, completions, localProgress]);

  const goalTarget = proteinTask?.goal_target || DEFAULT_PROTEIN_GOAL;
  const goalUnit = proteinTask?.goal_unit || DEFAULT_PROTEIN_UNIT;
  const progressPercent = Math.min((goalProgress / goalTarget) * 100, 100);
  const goalReached = goalProgress >= goalTarget;

  useEffect(() => {
    if (goalProgress >= goalTarget && prevProgressRef.current < goalTarget && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      haptic.success();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fb923c', '#f97316', '#ea580c', '#fdba74', '#fed7aa'],
      });
    }
    prevProgressRef.current = goalProgress;
  }, [goalProgress, goalTarget]);

  const handleAddProtein = useCallback((amount: number) => {
    if (!proteinTask) {
      setLocalProgress((prev) => prev + amount);
      haptic.success();
      toast(`+${amount} ${goalUnit}`, {
        description: t('tier1.protein.addToRoutineDesc'),
        duration: 3000,
        action: {
          label: t('tier1.protein.addRoutine'),
          onClick: () => setShowRoutineSheet(true),
        },
      });
      return;
    }

    addGoalProgress.mutate(
      { taskId: proteinTask.id, date: selectedDate, amount },
      {
        onSuccess: (result) => {
          haptic.success();
          toast(`+${amount} ${goalUnit}`, {
            description: t('tier1.protein.progressFormat', { current: result.newProgress, target: goalTarget }),
            duration: 2000,
          });
          if (result.streakIncreased) {
            setShowStreakModal(true);
          }
        },
      }
    );
  }, [proteinTask, selectedDate, addGoalProgress, goalUnit, goalTarget, t]);

  const handleOpenSettings = useCallback(() => {
    haptic.light();
    setShowGoalSheet(true);
  }, []);

  const handleCreateWithGoal = useCallback((target: number) => {
    setIsSavingRoutine(true);
    createTask.mutate(
      {
        title: 'Hit Protein Goal 🍗',
        emoji: '🍗',
        color: 'peach',
        repeat_pattern: 'daily',
        scheduled_time: null,
        tag: 'pro',
        reminder_enabled: false,
        pro_link_type: 'protein',
        pro_link_value: null,
        goal_enabled: true,
        goal_type: 'count',
        goal_target: target,
        goal_unit: DEFAULT_PROTEIN_UNIT,
      },
      {
        onSuccess: () => {
          haptic.success();
          toast.success(`Daily goal set to ${target}${DEFAULT_PROTEIN_UNIT}`);
          setShowGoalSheet(false);
          setIsSavingRoutine(false);
          queryClient.invalidateQueries({ queryKey: ['planner-tasks-for-date'] });
        },
        onError: () => {
          toast.error(t('tier1.protein.addFailed'));
          setIsSavingRoutine(false);
        },
      }
    );
  }, [createTask, queryClient, t]);


  const handleSaveRoutine = useCallback((_selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    const editedProtein = editedTasks.find((task) => task.id === 'protein-routine-template');

    setIsSavingRoutine(true);

    createTask.mutate(
      {
        title: editedProtein?.title || 'Hit Protein Goal 🍗',
        emoji: editedProtein?.icon || '🍗',
        color: editedProtein?.color || 'peach',
        repeat_pattern: editedProtein?.repeatPattern || 'daily',
        scheduled_time: editedProtein?.scheduledTime || null,
        tag: 'pro',
        reminder_enabled: editedProtein?.reminderEnabled || false,
        pro_link_type: 'protein',
        pro_link_value: null,
        goal_enabled: true,
        goal_type: 'count',
        goal_target: DEFAULT_PROTEIN_GOAL,
        goal_unit: DEFAULT_PROTEIN_UNIT,
      },
      {
        onSuccess: () => {
          haptic.success();
          toast.success(t('tier1.protein.addedToRoutines'));
          setShowRoutineSheet(false);
          setLocalProgress(0);
          setIsSavingRoutine(false);
          queryClient.invalidateQueries({ queryKey: ['planner-tasks-for-date'] });
        },
        onError: (error) => {
          console.error('Error adding protein task:', error);
          toast.error(t('tier1.protein.addFailed'));
          setIsSavingRoutine(false);
        },
      }
    );
  }, [createTask, queryClient, t]);

  const syntheticProteinTask = useMemo(() => createProteinRoutineTask(), []);

  const formatDate = () => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    if (isToday) return t('tier1.common.today');
    return format(selectedDate, 'EEE, MMM d');
  };

  if (!subLoading && !isSubscribed) {
    return (
      <>
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-orange-200 to-orange-50 px-6 text-center">
          <BackButtonCircle />
          <Beef className="h-16 w-16 text-orange-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('tier1.protein.plusFeatureTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('tier1.protein.plusFeatureDesc')}</p>
          <button
            onClick={() => { haptic.light(); setShowPaywall(true); }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold"
          >
            {t('tier1.common.unlockWithPlus')}
          </button>
        </div>
        <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
      </>
    );
  }

  if (tasksLoading) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-orange-200 to-orange-50">
        <Beef className="h-12 w-12 text-orange-500 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #FFD8A8 0%, #FFE8CC 30%, #FFF4E6 60%, #FFFFFF 100%)',
          }}
        />

        {/* Header */}
        <div
          className="relative z-10 flex items-center justify-between px-4 pt-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <BackButtonCircle className="bg-white/40 text-orange-700" />
          <h1 className="text-lg font-semibold text-orange-800">{formatDate()}</h1>
          <div className="w-10" />
        </div>

        {/* Main content */}
        <div className="relative flex-1 flex flex-col items-center justify-center z-10 px-6">
          <Beef className="h-16 w-16 text-orange-500 mb-4" />

          <div className="text-center mb-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-bold text-orange-700">
                {Math.round(goalProgress * 10) / 10}
              </span>
              <span className="text-3xl text-orange-500/70">
                /{goalTarget}{goalUnit}
              </span>
            </div>
            <p className="text-orange-600 mt-2">{t('tier1.protein.intakeGoal')}</p>
          </div>

          {goalReached && (
            <div className="mt-4 px-4 py-2 bg-success text-white rounded-full text-sm font-semibold flex items-center gap-2">
              <span>🎉</span>
              {t('tier1.protein.goalReached')}
            </div>
          )}

          {!proteinTask && (
            <p className="mt-4 text-sm text-orange-600/80 text-center">
              {t('tier1.protein.addToTrack')}
            </p>
          )}
        </div>

        {/* Fill animation */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <div
            className="relative transition-all duration-1000 ease-out"
            style={{ height: `${Math.max(progressPercent * 2.5, 60)}px` }}
          >
            <div
              className="absolute bottom-0 left-0 w-[200%] animate-wave-slow"
              style={{
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(249, 115, 22, 0.4), rgba(234, 88, 12, 0.6))',
                borderRadius: '100% 100% 0 0',
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-[200%] animate-wave"
              style={{
                height: '90%',
                background: 'linear-gradient(to bottom, rgba(251, 146, 60, 0.6), rgba(249, 115, 22, 0.8))',
                borderRadius: '100% 100% 0 0',
              }}
            />
          </div>

          <div
            className="transition-all duration-1000 ease-out"
            style={{
              height: `${Math.max(Math.min(progressPercent * 3, 250), 80)}px`,
              background: 'linear-gradient(to bottom, rgba(249, 115, 22, 0.85), rgba(234, 88, 12, 1))',
            }}
          >
            <div className="absolute bottom-8 left-[20%] w-3 h-3 bg-white/30 rounded-full animate-float" />
            <div className="absolute bottom-16 left-[40%] w-2 h-2 bg-white/25 rounded-full animate-float-delayed" />
            <div className="absolute bottom-12 right-[30%] w-4 h-4 bg-white/20 rounded-full animate-float" />
            <div className="absolute bottom-20 right-[15%] w-2 h-2 bg-white/30 rounded-full animate-float-delayed" />
          </div>
        </div>

        {/* Bottom actions */}
        <div
          className="relative z-10 flex items-center justify-center gap-4 pb-8 px-6"
          style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => { haptic.light(); handleOpenSettings(); }}
            className="w-14 h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center"
          >
            <Settings className="h-6 w-6 text-background" />
          </button>

          <button
            onClick={() => { haptic.light(); setShowInputSheet(true); }}
            className="flex-1 max-w-[220px] h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center gap-2 text-background font-semibold"
          >
            <Plus className="h-5 w-5" />
            {t('tier1.protein.addProtein')}
          </button>

          {proteinTask ? (
            <>
              <button
                onClick={() => { haptic.light(); navigate('/app/home'); }}
                className="w-14 h-14 rounded-full bg-success shadow-lg flex items-center justify-center"
                title={t('tier1.protein.addedGoToPlanner')}
              >
                <Check className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => { haptic.light(); setShowRoutineSheet(true); }}
                className="w-10 h-10 rounded-full bg-foreground shadow-lg flex items-center justify-center"
                title={t('tier1.protein.addAgain')}
              >
                <CalendarPlus className="h-5 w-5 text-background" />
              </button>
            </>
          ) : (
            <button
              onClick={() => { haptic.light(); setShowRoutineSheet(true); }}
              className="w-14 h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center"
            >
              <CalendarPlus className="h-6 w-6 text-background" />
            </button>
          )}
        </div>

        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-25%); }
          }
          @keyframes wave-slow {
            0%, 100% { transform: translateX(-25%); }
            50% { transform: translateX(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(-10px) scale(1); opacity: 0.25; }
            50% { transform: translateY(-30px) scale(1.15); opacity: 0.4; }
          }
          .animate-wave { animation: wave 4s ease-in-out infinite; }
          .animate-wave-slow { animation: wave-slow 5s ease-in-out infinite; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-float-delayed { animation: float-delayed 4s ease-in-out infinite; }
        `}</style>
      </div>

      <DailyGoalSheet
        open={showGoalSheet}
        onOpenChange={setShowGoalSheet}
        task={proteinTask}
        title="Protein Goal"
        unit={goalUnit}
        presets={[60, 80, 100, 120, 140, 160, 180, 200]}
        defaultTarget={DEFAULT_PROTEIN_GOAL}
        onCreate={handleCreateWithGoal}
        isCreating={isSavingRoutine}
      />

      <ProteinInputSheet
        open={showInputSheet}
        onOpenChange={setShowInputSheet}
        unit={goalUnit}
        onConfirm={handleAddProtein}
      />

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticProteinTask]}
        routineTitle={t('tier1.protein.routineTitle')}
        onSave={handleSaveRoutine}
        isSaving={isSavingRoutine}
      />

      <StreakCelebration open={showStreakModal} onClose={() => setShowStreakModal(false)} />
    </>
  );
};

export default AppProtein;
