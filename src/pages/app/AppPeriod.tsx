import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings, Heart, ChevronLeft, ChevronRight, CalendarPlus, Check } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { 
  usePeriodSettings, 
  usePeriodLogsForMonth, 
  usePredictedDays,
  useCycleStatusWithLoading,
  useLogPeriodDay,
  useDeletePeriodLog
} from '@/hooks/usePeriodTracker';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useCreateTask } from '@/hooks/useTaskPlanner';
import { PeriodOnboarding } from '@/components/app/PeriodOnboarding';
import { PeriodDaySheet } from '@/components/app/PeriodDaySheet';
import { PeriodSettingsSheet } from '@/components/app/PeriodSettingsSheet';
import { PeriodCalendar } from '@/components/app/PeriodCalendar';
import { PeriodCycleInsights } from '@/components/app/PeriodCycleInsights';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// Synthetic task for period routine
const SYNTHETIC_PERIOD_TASK: RoutinePlanTask = {
  id: 'period-routine-template',
  plan_id: 'synthetic-period',
  title: 'Period Tracker',
  icon: '❤️',
  color: 'pink',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'period',
  pro_link_value: null,
  linked_playlist: null,
};

const AppPeriod = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDaySheet, setShowDaySheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  
  const { status, settings, isLoading, hasCompletedOnboarding } = useCycleStatusWithLoading();
  const { data: monthLogs = [] } = usePeriodLogsForMonth(currentMonth);
  const { predictedPeriodDays, ovulationDays } = usePredictedDays(currentMonth);
  const { data: existingTask } = useExistingProTask('period');
  
  const logPeriodDay = useLogPeriodDay();
  const deletePeriodLog = useDeletePeriodLog();
  const createTask = useCreateTask();

  const isAdded = existingTask || justAdded;

  // Handle saving routine - create period task directly
  const handleSaveRoutine = useCallback((selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    const editedPeriod = editedTasks.find(t => t.id === 'period-routine-template');
    
    setIsSavingRoutine(true);
    
    createTask.mutate(
      {
        title: editedPeriod?.title || 'Period Tracker ❤️',
        emoji: editedPeriod?.icon || '❤️',
        color: (editedPeriod?.color || 'pink') as 'pink',
        repeat_pattern: editedPeriod?.repeatPattern || 'daily',
        scheduled_time: editedPeriod?.scheduledTime || null,
        tag: editedPeriod?.tag || 'Period',
        reminder_enabled: editedPeriod?.reminderEnabled || false,
        pro_link_type: 'period',
        pro_link_value: null,
      },
      {
        onSuccess: () => {
          haptic.success();
          toast.success('Period tracking added to your routine!');
          setShowRoutineSheet(false);
          setJustAdded(true);
          setIsSavingRoutine(false);
          queryClient.invalidateQueries({ queryKey: ['planner-tasks-for-date'] });
        },
        onError: (error) => {
          console.error('Error adding period task:', error);
          toast.error('Failed to add period tracking');
          setIsSavingRoutine(false);
        },
      }
    );
  }, [createTask, queryClient]);

  // Get logged period days for current month
  const loggedPeriodDays = useMemo(() => {
    const days = new Set<string>();
    monthLogs.forEach(log => {
      if (log.is_period_day) {
        days.add(log.date);
      }
    });
    return days;
  }, [monthLogs]);

  // Handle month navigation
  const handlePrevMonth = useCallback(() => {
    haptic.light();
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    haptic.light();
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    haptic.light();
    setSelectedDate(date);
    setShowDaySheet(true);
  }, []);

  // Handle log save
  const handleSaveLog = useCallback(async (data: {
    is_period_day: boolean;
    flow_intensity?: 'light' | 'medium' | 'heavy' | null;
    symptoms?: string[];
    notes?: string | null;
  }) => {
    if (!selectedDate) return;
    
    try {
      if (data.is_period_day) {
        await logPeriodDay.mutateAsync({
          date: selectedDate,
          ...data,
        });
        
        haptic.success();
        
        // Confetti for first day of a new period
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const prevDay = format(new Date(selectedDate.getTime() - 86400000), 'yyyy-MM-dd');
        const wasYesterdayPeriod = loggedPeriodDays.has(prevDay);
        
        if (!wasYesterdayPeriod && !loggedPeriodDays.has(dateStr)) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#EC4899', '#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3'],
          });
        }
        
        toast.success('Period logged!');
      } else {
        await deletePeriodLog.mutateAsync(selectedDate);
        haptic.light();
        toast.success('Log removed');
      }
      
      setShowDaySheet(false);
    } catch (error) {
      console.error('Error saving period log:', error);
      toast.error('Failed to save');
    }
  }, [selectedDate, logPeriodDay, deletePeriodLog, loggedPeriodDays]);

  // Get existing log for selected date
  const selectedDateLog = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return monthLogs.find(log => log.date === dateStr) || null;
  }, [selectedDate, monthLogs]);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-pink-200 to-rose-50">
        <Heart className="h-12 w-12 text-pink-500 animate-pulse" />
      </div>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <PeriodOnboarding />;
  }

  return (
    <>
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
        {/* Rose gradient background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 30%, #FFF1F2 60%, #FFFFFF 100%)',
          }}
        />

        {/* Decorative floating petals */}
        <div className="absolute top-20 left-6 w-8 h-8 bg-pink-200/40 rounded-full blur-sm pointer-events-none animate-float" />
        <div className="absolute top-32 right-8 w-6 h-6 bg-rose-200/50 rounded-full blur-sm pointer-events-none animate-float-delayed" />
        <div className="absolute top-24 right-24 w-4 h-4 bg-pink-300/30 rounded-full blur-sm pointer-events-none animate-float" />

        {/* Fixed Header */}
        <header 
          className="relative z-10 shrink-0 flex items-center justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}
        >
          <button
            onClick={() => {
              haptic.light();
              navigate('/app/home');
            }}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <X className="h-5 w-5 text-pink-700" />
          </button>
          
          <h1 className="text-lg font-semibold text-pink-800">Period Tracker</h1>
          
          <button
            onClick={() => {
              haptic.light();
              setShowSettingsSheet(true);
            }}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <Settings className="h-5 w-5 text-pink-700" />
          </button>
        </header>

        {/* Content - no scroll needed */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Cycle status display */}
          <PeriodCycleInsights status={status} />

          {/* Month navigation */}
          <div className="relative z-10 flex items-center justify-between px-6 py-2">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronLeft className="h-5 w-5 text-pink-700" />
            </button>
            
            <h2 className="text-base font-semibold text-pink-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronRight className="h-5 w-5 text-pink-700" />
            </button>
          </div>

          {/* Calendar */}
          <div className="relative z-10 flex-1 px-4 flex flex-col">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm flex-1">
              <PeriodCalendar
                currentMonth={currentMonth}
                loggedPeriodDays={loggedPeriodDays}
                predictedPeriodDays={predictedPeriodDays}
                ovulationDays={ovulationDays}
                onDateSelect={handleDateSelect}
              />
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-[10px] text-pink-700">Period</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2 border-dashed border-pink-400" />
                <span className="text-[10px] text-pink-600">Predicted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-[10px] text-amber-700">Ovulation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom action */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 px-6 bg-gradient-to-t from-white/90 to-transparent pt-6"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => {
              haptic.light();
              setSelectedDate(new Date());
              setShowDaySheet(true);
            }}
            className="flex-1 max-w-[220px] h-14 rounded-full bg-pink-500 shadow-lg flex items-center justify-center gap-2 text-white font-semibold active:scale-[0.98] transition-transform"
          >
            <Heart className="h-5 w-5" />
            Log Today
          </button>

          {/* Add to Routine button */}
          {isAdded ? (
            <>
              {/* Added state - show check with re-add option */}
              <button
                onClick={() => {
                  haptic.light();
                  navigate('/app/home');
                }}
                className="w-12 h-12 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                title="Added — Go to Planner"
              >
                <Check className="h-5 w-5 text-white" />
              </button>
              {/* Re-add button */}
              <button
                onClick={() => {
                  haptic.light();
                  setShowRoutineSheet(true);
                }}
                className="w-10 h-10 rounded-full bg-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                title="Add again"
              >
                <CalendarPlus className="h-4 w-4 text-background" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                haptic.light();
                setShowRoutineSheet(true);
              }}
              className="w-12 h-12 rounded-full bg-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              title="Add to Routine"
            >
              <CalendarPlus className="h-5 w-5 text-background" />
            </button>
          )}
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
            50% { transform: translateY(-15px) scale(1.1); opacity: 0.6; }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(-8px) scale(1); opacity: 0.3; }
            50% { transform: translateY(-25px) scale(1.15); opacity: 0.5; }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 5s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Day logging sheet */}
      <PeriodDaySheet
        open={showDaySheet}
        onOpenChange={setShowDaySheet}
        date={selectedDate}
        existingLog={selectedDateLog}
        onSave={handleSaveLog}
        isLoading={logPeriodDay.isPending || deletePeriodLog.isPending}
      />

      {/* Settings sheet */}
      <PeriodSettingsSheet
        open={showSettingsSheet}
        onOpenChange={setShowSettingsSheet}
      />

      {/* Routine preview sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_PERIOD_TASK]}
        routineTitle="Period Tracking"
        onSave={handleSaveRoutine}
        isSaving={isSavingRoutine}
      />
    </>
  );
};

export default AppPeriod;
