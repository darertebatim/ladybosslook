import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Settings, Droplets, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useTasksForDate, useCompletionsForDate, useAddGoalProgress, UserTask } from '@/hooks/useTaskPlanner';
import { isWaterTask, createWaterRoutineTask } from '@/lib/waterTracking';
import { WaterInputSheet } from '@/components/app/WaterInputSheet';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan } from '@/hooks/useRoutinePlans';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

// Default water goal when no task exists
const DEFAULT_WATER_GOAL = 64;
const DEFAULT_WATER_UNIT = 'oz';

const AppWater = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date());
  const [showInputSheet, setShowInputSheet] = useState(false);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  
  const prevProgressRef = useRef(0);
  const hasCelebratedRef = useRef(false);

  // Fetch tasks and completions for today
  const { data: tasks = [], isLoading: tasksLoading } = useTasksForDate(selectedDate);
  const { data: completions } = useCompletionsForDate(selectedDate);
  
  const addGoalProgress = useAddGoalProgress();
  const addRoutinePlan = useAddRoutinePlan();

  // Find water task for today
  const waterTask = useMemo(() => {
    return tasks.find(t => isWaterTask(t));
  }, [tasks]);

  // Get goal progress for water task
  const goalProgress = useMemo(() => {
    if (!waterTask || !completions) return localProgress;
    const completion = completions.tasks.find(c => c.task_id === waterTask.id);
    return (completion as any)?.goal_progress || localProgress;
  }, [waterTask, completions, localProgress]);

  // Get goal values (from task or defaults)
  const goalTarget = waterTask?.goal_target || DEFAULT_WATER_GOAL;
  const goalUnit = waterTask?.goal_unit || DEFAULT_WATER_UNIT;
  const progressPercent = Math.min((goalProgress / goalTarget) * 100, 100);
  const goalReached = goalProgress >= goalTarget;

  // Celebration effect when goal is reached
  useEffect(() => {
    if (goalProgress >= goalTarget && prevProgressRef.current < goalTarget && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      haptic.success();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0ea5e9', '#0284c7', '#7dd3fc', '#bae6fd']
      });
    }
    prevProgressRef.current = goalProgress;
  }, [goalProgress, goalTarget]);

  // Handle adding water
  const handleAddWater = useCallback((amount: number) => {
    if (!waterTask) {
      // No task exists - add locally and prompt to add routine
      setLocalProgress(prev => prev + amount);
      haptic.success();
      toast(`+${amount} ${goalUnit}`, {
        description: 'Add water tracking to your routine to save progress!',
        duration: 3000,
        action: {
          label: 'Add Routine',
          onClick: () => setShowRoutineSheet(true),
        },
      });
      return;
    }
    
    addGoalProgress.mutate(
      { taskId: waterTask.id, date: selectedDate, amount },
      {
        onSuccess: (result) => {
          haptic.success();
          toast(`+${amount} ${goalUnit}`, {
            description: `Progress: ${result.newProgress}/${goalTarget}`,
            duration: 2000,
          });
          if (result.streakIncreased) {
            setShowStreakModal(true);
          }
        },
      }
    );
  }, [waterTask, selectedDate, addGoalProgress, goalUnit, goalTarget]);

  // Handle opening settings (edit task)
  const handleOpenSettings = useCallback(() => {
    if (waterTask) {
      navigate(`/app/home/edit/${waterTask.id}`);
    } else {
      // No task - open routine sheet instead
      haptic.light();
      setShowRoutineSheet(true);
    }
  }, [waterTask, navigate]);

  // Handle adding to routine
  const handleOpenRoutineSheet = useCallback(() => {
    haptic.light();
    setShowRoutineSheet(true);
  }, []);

  // Handle saving routine
  const handleSaveRoutine = useCallback((selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    addRoutinePlan.mutate(
      { 
        planId: 'synthetic-water-plan', 
        selectedTaskIds,
        editedTasks: editedTasks.map(t => ({
          ...t,
          pro_link_type: null,
          pro_link_value: null,
        })),
      },
      {
        onSuccess: () => {
          haptic.success();
          toast.success('Water tracking added to your routine!');
          setShowRoutineSheet(false);
          setLocalProgress(0); // Reset local progress, will be saved to task
        },
        onError: (error) => {
          console.error('Error adding routine:', error);
          toast.error('Failed to add routine');
        },
      }
    );
  }, [addRoutinePlan]);

  // Create synthetic task for routine sheet
  const syntheticWaterTask = useMemo(() => createWaterRoutineTask(), []);

  // Format the date display
  const formatDate = () => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    return format(selectedDate, 'EEE, MMM d');
  };

  // Loading state
  if (tasksLoading) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-sky-200 to-sky-50">
        <Droplets className="h-12 w-12 text-sky-500 animate-pulse" />
      </div>
    );
  }

  // Always show the tracking screen (whether task exists or not)
  return (
    <>
      {/*
        Important: avoid extremely high z-index here.
        Radix/shadcn Sheets & Dialogs render in a portal (typically z-50+).
        If this screen sits above them (e.g. z-[9999]), the sheets open *behind* it
        and it looks like buttons "don’t work".
      */}
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
        {/* Sky background with gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #E0F4FF 60%, #FFFFFF 100%)',
          }}
        />

        {/* Clouds decoration */}
        <div className="absolute top-20 left-4 w-24 h-10 bg-white/60 rounded-full blur-sm pointer-events-none" />
        <div className="absolute top-28 left-16 w-16 h-8 bg-white/50 rounded-full blur-sm pointer-events-none" />
        <div className="absolute top-16 right-8 w-20 h-8 bg-white/50 rounded-full blur-sm pointer-events-none" />
        <div className="absolute top-24 right-4 w-12 h-6 bg-white/40 rounded-full blur-sm pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-safe-top">
          <button
            onClick={() => navigate('/app/home')}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="h-5 w-5 text-sky-700" />
          </button>
          
          <h1 className="text-lg font-semibold text-sky-800">{formatDate()}</h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Main content */}
        <div className="relative flex-1 flex flex-col items-center justify-center z-10 px-6">
          {/* Water droplet icon */}
          <Droplets className="h-16 w-16 text-sky-500 mb-4" />
          
          {/* Progress display */}
          <div className="text-center mb-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-bold text-sky-700">
                {Math.round(goalProgress * 10) / 10}
              </span>
              <span className="text-3xl text-sky-500/70">
                /{goalTarget}{goalUnit}
              </span>
            </div>
            <p className="text-sky-600 mt-2">
              Water intake & your goal
            </p>
          </div>

          {/* Goal reached badge */}
          {goalReached && (
            <div className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-semibold flex items-center gap-2">
              <span>🎉</span>
              Goal Reached!
            </div>
          )}
          
          {/* No routine notice */}
          {!waterTask && (
            <p className="mt-4 text-sm text-sky-600/80 text-center">
              Add to routine to track daily
            </p>
          )}
        </div>

        {/* Water wave animation */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          {/* Wave layers */}
          <div 
            className="relative transition-all duration-1000 ease-out"
            style={{ height: `${Math.max(progressPercent * 2.5, 20)}px` }}
          >
            {/* Back wave */}
            <div 
              className="absolute bottom-0 left-0 w-[200%] animate-wave-slow"
              style={{
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(14, 165, 233, 0.4), rgba(2, 132, 199, 0.6))',
                borderRadius: '100% 100% 0 0',
              }}
            />
            {/* Front wave */}
            <div 
              className="absolute bottom-0 left-0 w-[200%] animate-wave"
              style={{
                height: '90%',
                background: 'linear-gradient(to bottom, rgba(56, 189, 248, 0.6), rgba(14, 165, 233, 0.8))',
                borderRadius: '100% 100% 0 0',
              }}
            />
          </div>
          
          {/* Water body */}
          <div 
            className="transition-all duration-1000 ease-out"
            style={{ 
              height: `${Math.min(progressPercent * 3, 250)}px`,
              background: 'linear-gradient(to bottom, rgba(14, 165, 233, 0.8), rgba(2, 132, 199, 1))',
            }}
          >
            {/* Decorative bubbles */}
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
          {/* Settings button */}
          <button
            onClick={() => {
              haptic.light();
              handleOpenSettings();
            }}
            className="w-14 h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center"
          >
            <Settings className="h-6 w-6 text-background" />
          </button>

          {/* Add Water button */}
          <button
            onClick={() => {
              haptic.light();
              setShowInputSheet(true);
            }}
            className="flex-1 max-w-[220px] h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center gap-2 text-background font-semibold"
          >
            <Plus className="h-5 w-5" />
            Add Water
          </button>

          {/* Add to Routine button */}
          <button
            onClick={() => {
              haptic.light();
              handleOpenRoutineSheet();
            }}
            className="w-14 h-14 rounded-full bg-foreground shadow-lg flex items-center justify-center"
          >
            <CalendarPlus className="h-6 w-6 text-background" />
          </button>
        </div>

        {/* Animation styles */}
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
          .animate-wave {
            animation: wave 4s ease-in-out infinite;
          }
          .animate-wave-slow {
            animation: wave-slow 5s ease-in-out infinite;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 4s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Water input sheet */}
      <WaterInputSheet
        open={showInputSheet}
        onOpenChange={setShowInputSheet}
        unit={goalUnit}
        onConfirm={handleAddWater}
      />

      {/* Routine preview sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticWaterTask]}
        routineTitle="Water Tracking"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />

      {/* Streak celebration */}
      <StreakCelebration
        open={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />
    </>
  );
};

export default AppWater;
