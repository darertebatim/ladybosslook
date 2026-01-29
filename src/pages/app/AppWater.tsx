import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasksForDate, useCompletionsForDate, useAddGoalProgress } from '@/hooks/useTaskPlanner';
import { isWaterTask, createWaterRoutineTask } from '@/lib/waterTracking';
import { WaterTrackingScreen } from '@/components/app/WaterTrackingScreen';
import { WaterSettingsSheet } from '@/components/app/WaterSettingsSheet';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan } from '@/hooks/useRoutinePlans';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

const AppWater = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date());
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);

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
    if (!waterTask || !completions) return 0;
    const completion = completions.tasks.find(c => c.task_id === waterTask.id);
    return (completion as any)?.goal_progress || 0;
  }, [waterTask, completions]);

  // Handle adding water
  const handleAddWater = useCallback((amount: number) => {
    if (!waterTask) return;
    
    addGoalProgress.mutate(
      { taskId: waterTask.id, date: selectedDate, amount },
      {
        onSuccess: (result) => {
          haptic.success();
          const unit = waterTask.goal_unit || 'oz';
          toast(`+${amount} ${unit}`, {
            description: `Progress: ${result.newProgress}/${waterTask.goal_target}`,
            duration: 2000,
          });
          if (result.streakIncreased) {
            setShowStreakModal(true);
          }
        },
      }
    );
  }, [waterTask, selectedDate, addGoalProgress]);

  // Handle opening settings (edit task)
  const handleOpenSettings = useCallback(() => {
    if (waterTask) {
      navigate(`/app/home/edit/${waterTask.id}`);
    }
  }, [waterTask, navigate]);

  // Handle adding to routine
  const handleOpenRoutineSheet = useCallback(() => {
    haptic.light();
    setShowRoutineSheet(true);
  }, []);

  // Handle saving routine
  const handleSaveRoutine = useCallback((selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    // Use synthetic plan ID for water tracking
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

  // Loading state
  if (tasksLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-sky-200 to-sky-50">
        <Droplets className="h-12 w-12 text-sky-500 animate-pulse" />
      </div>
    );
  }

  // If water task exists, show tracking screen
  if (waterTask) {
    return (
      <>
        <WaterTrackingScreen
          task={waterTask}
          date={selectedDate}
          goalProgress={goalProgress}
          onClose={() => navigate('/app/home')}
          onAddWater={handleAddWater}
          onOpenSettings={handleOpenSettings}
          onOpenRoutineSheet={handleOpenRoutineSheet}
        />

        {/* Settings sheet for editing task */}
        <WaterSettingsSheet
          open={showSettingsSheet}
          onOpenChange={setShowSettingsSheet}
          task={waterTask}
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
  }

  // No water task - show onboarding
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden">
      {/* Sky background with gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #E0F4FF 60%, #FFFFFF 100%)',
        }}
      />

      {/* Clouds decoration */}
      <div className="absolute top-20 left-4 w-24 h-10 bg-white/60 rounded-full blur-sm" />
      <div className="absolute top-28 left-16 w-16 h-8 bg-white/50 rounded-full blur-sm" />
      <div className="absolute top-16 right-8 w-20 h-8 bg-white/50 rounded-full blur-sm" />
      <div className="absolute top-24 right-4 w-12 h-6 bg-white/40 rounded-full blur-sm" />

      {/* Header */}
      <div 
        className="relative z-10 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => navigate('/app/home')}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-sky-700" />
        </button>
        
        <h1 className="text-lg font-semibold text-sky-800">Water Tracking</h1>
        
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main content - onboarding */}
      <div className="relative flex-1 flex flex-col items-center justify-center z-10 px-6">
        {/* Water droplet icon */}
        <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center mb-6">
          <Droplets className="h-12 w-12 text-sky-500" />
        </div>
        
        {/* Title and description */}
        <h2 className="text-2xl font-bold text-sky-800 mb-2 text-center">
          Stay Hydrated 💧
        </h2>
        <p className="text-sky-600 text-center mb-8 max-w-xs">
          Track your daily water intake and build a healthy hydration habit.
        </p>

        {/* Add to routine button */}
        <Button
          onClick={handleOpenRoutineSheet}
          size="lg"
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add to My Routine
        </Button>
      </div>

      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
        <div 
          className="absolute bottom-0 left-0 w-[200%] h-full animate-wave"
          style={{
            background: 'linear-gradient(to bottom, rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.6))',
            borderRadius: '100% 100% 0 0',
          }}
        />
      </div>

      {/* Routine preview sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticWaterTask]}
        routineTitle="Water Tracking"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />

      {/* Animation styles */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
        }
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AppWater;
