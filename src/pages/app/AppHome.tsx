import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { User, NotebookPen, Plus, Flame, CalendarDays, ChevronLeft, ChevronRight, Star, Sparkles, MessageCircle, ArrowLeft, Wind, Droplets, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasksForDate, useCompletionsForDate, useCompletedDates, useUserStreak, UserTask, TaskTemplate, useAddGoalProgress, useDeleteTask } from '@/hooks/useTaskPlanner';
import { useProgramEventsForDate, useProgramEventDates } from '@/hooks/usePlannerProgramEvents';
import { useNewHomeData } from '@/hooks/useNewHomeData';
import { TaskCard } from '@/components/app/TaskCard';
import { SortableTaskList } from '@/components/app/SortableTaskList';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { MonthCalendar } from '@/components/app/MonthCalendar';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { TaskQuickStartSheet } from '@/components/app/TaskQuickStartSheet';
import { ProgramEventCard } from '@/components/app/ProgramEventCard';
import { PromoBanner } from '@/components/app/PromoBanner';
import { HomeBanner } from '@/components/app/HomeBanner';
import { NotificationBanner } from '@/components/app/NotificationBanner';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { AppTour } from '@/components/app/AppTour';
import { useAppTour } from '@/hooks/useAppTour';
import { useAuth } from '@/hooks/useAuth';
import { ActiveRoundsCarousel } from '@/components/dashboard/ActiveRoundsCarousel';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/SEOHead';
import { usePopularRoutinesBank, useUserAddedBankRoutines } from '@/hooks/useRoutinesBank';
import { RoutineBankCard } from '@/components/app/RoutineBankCard';
import { haptic } from '@/lib/haptics';
import { GoalInputSheet } from '@/components/app/GoalInputSheet';
import { TaskTimerScreen } from '@/components/app/TaskTimerScreen';
import { WaterTrackingScreen } from '@/components/app/WaterTrackingScreen';
import { isWaterTask } from '@/lib/waterTracking';
import { PeriodStatusCard } from '@/components/app/PeriodStatusCard';
import { toast } from 'sonner';
const AppHome = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [showNotificationFlow, setShowNotificationFlow] = useState(false);
  
  // Goal input state
  const [goalInputTask, setGoalInputTask] = useState<UserTask | null>(null);
  const addGoalProgress = useAddGoalProgress();
  
  // Timer screen state
  const [timerTask, setTimerTask] = useState<UserTask | null>(null);
  
  // Water tracking screen state
  const [waterTask, setWaterTask] = useState<UserTask | null>(null);

  const {
    run: runTour,
    stepIndex,
    setStepIndex,
    completeTour,
    skipTour
  } = useAppTour();

  // Handle quick start continue
  const handleQuickStartContinue = useCallback((taskName: string, template?: TaskTemplate) => {
    if (template) {
      const params = new URLSearchParams({
        name: template.title,
        emoji: template.emoji,
        color: template.color,
        repeat_pattern: template.repeat_pattern,
        ...(template.repeat_days ? { repeat_days: JSON.stringify(template.repeat_days) } : {}),
        ...(template.tag ? { tag: template.tag } : {}),
        ...(template.goal_enabled ? { 
          goal_enabled: 'true',
          goal_type: template.goal_type || '',
          goal_target: String(template.goal_target || ''),
          goal_unit: template.goal_unit || ''
        } : {}),
        ...(template.pro_link_type ? {
          pro_link_type: template.pro_link_type,
          pro_link_value: template.pro_link_value || ''
        } : {}),
        ...(template.linked_playlist_id ? { linked_playlist_id: template.linked_playlist_id } : {}),
      });
      navigate(`/app/home/new?${params.toString()}`);
    } else {
      navigate(`/app/home/new?name=${encodeURIComponent(taskName)}`);
    }
  }, [navigate]);

  // Data queries - Planner data
  const {
    data: tasks = [],
    isLoading: tasksLoading
  } = useTasksForDate(selectedDate);
  const {
    data: completions,
    isLoading: completionsLoading
  } = useCompletionsForDate(selectedDate);
  const {
    data: streak
  } = useUserStreak();
  const {
    data: programEvents = [],
    isLoading: programEventsLoading
  } = useProgramEventsForDate(selectedDate);

  // Home data for stats and rounds
  const {
    data: homeData,
    isLoading: homeLoading
  } = useNewHomeData();

  // Popular routines for suggestions (filter out already-added ones)
  const {
    data: popularRoutines = []
  } = usePopularRoutinesBank();
  const {
    data: addedRoutineIds = []
  } = useUserAddedBankRoutines();
  const addedRoutineIdsSet = useMemo(() => new Set(addedRoutineIds), [addedRoutineIds]);
  const suggestedRoutines = useMemo(() => 
    popularRoutines.filter(r => !addedRoutineIdsSet.has(r.id)).slice(0, 4), 
    [popularRoutines, addedRoutineIdsSet]
  );

  // Generate week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, {
      weekStartsOn: 0
    });
    return Array.from({
      length: 7
    }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  // Calculate date range for completed dates query
  const dateRange = useMemo(() => {
    if (showCalendar) {
      return {
        start: startOfWeek(startOfMonth(currentMonth), {
          weekStartsOn: 0
        }),
        end: endOfWeek(endOfMonth(currentMonth), {
          weekStartsOn: 0
        })
      };
    } else {
      const weekStart = startOfWeek(selectedDate, {
        weekStartsOn: 0
      });
      return {
        start: weekStart,
        end: addDays(weekStart, 6)
      };
    }
  }, [showCalendar, currentMonth, selectedDate]);

  // Fetch completed dates and program event dates
  const {
    data: completedDates
  } = useCompletedDates(dateRange.start, dateRange.end);
  const {
    data: programEventDates
  } = useProgramEventDates(dateRange.start, dateRange.end);

  // Filter tasks by tag
  const filteredTasks = useMemo(() => {
    if (!selectedTag) return tasks;
    return tasks.filter(task => task.tag === selectedTag);
  }, [tasks, selectedTag]);

  // Get unique tags from tasks
  const taskTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => {
      if (task.tag) tags.add(task.tag);
    });
    return Array.from(tags);
  }, [tasks]);

  // Completed task IDs for this date
  const completedTaskIds = useMemo(() => {
    return new Set(completions?.tasks.map(c => c.task_id) || []);
  }, [completions]);

  // Completed subtask IDs for this date
  const completedSubtaskIds = useMemo(() => {
    return completions?.subtasks.map(c => c.subtask_id) || [];
  }, [completions]);

  // Goal progress map for this date
  const goalProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    completions?.tasks.forEach(c => {
      if ((c as any).goal_progress) {
        map.set(c.task_id, (c as any).goal_progress);
      }
    });
    return map;
  }, [completions]);

  const handleStreakIncrease = useCallback(() => {
    setShowStreakModal(true);
  }, []);

  const handleOpenGoalInput = useCallback((task: UserTask) => {
    setGoalInputTask(task);
  }, []);

  const handleOpenTimer = useCallback((task: UserTask) => {
    setTimerTask(task);
  }, []);

  const handleOpenWaterTracking = useCallback((task: UserTask) => {
    setWaterTask(task);
  }, []);

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

  const handleGoalInputConfirm = useCallback((amount: number) => {
    if (!goalInputTask) return;
    
    addGoalProgress.mutate(
      { taskId: goalInputTask.id, date: selectedDate, amount },
      {
        onSuccess: (result) => {
          haptic.success();
          const unit = goalInputTask.goal_unit || 'times';
          toast(`+${amount} ${unit}`, {
            description: `Progress: ${result.newProgress}/${goalInputTask.goal_target}`,
            duration: 2000,
          });
          if (result.streakIncreased) {
            setShowStreakModal(true);
          }
        },
      }
    );
  }, [goalInputTask, selectedDate, addGoalProgress]);

  const handleTimerSaveProgress = useCallback((secondsElapsed: number) => {
    if (!timerTask) return;
    
    addGoalProgress.mutate(
      { taskId: timerTask.id, date: selectedDate, amount: secondsElapsed },
      {
        onSuccess: (result) => {
          haptic.success();
          const mins = Math.floor(result.newProgress / 60);
          const goalMins = Math.floor((timerTask.goal_target || 0) / 60);
          toast(`Timer saved`, {
            description: `Progress: ${mins}/${goalMins} min`,
            duration: 2000,
          });
          if (result.streakIncreased) {
            setShowStreakModal(true);
          }
        },
      }
    );
  }, [timerTask, selectedDate, addGoalProgress]);

  const handleTimerMarkComplete = useCallback(() => {
    if (!timerTask) return;
    
    const remainingSeconds = (timerTask.goal_target || 0) - (goalProgressMap.get(timerTask.id) || 0);
    
    addGoalProgress.mutate(
      { taskId: timerTask.id, date: selectedDate, amount: remainingSeconds },
      {
        onSuccess: () => {
          haptic.success();
          toast(`Goal completed! 🎉`, { duration: 2000 });
        },
      }
    );
  }, [timerTask, selectedDate, addGoalProgress, goalProgressMap]);

  const handleEditTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    navigate(`/app/home/edit/${task.id}`);
  }, [navigate]);

  const deleteTask = useDeleteTask();
  const handleDeleteTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success('Task deleted');
        haptic.light();
      }
    });
  }, [deleteTask]);
  const handleTaskTap = useCallback((task: UserTask) => {
    setSelectedTask(task);
  }, []);
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  }, []);
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);
  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);
  const handleToggleCalendar = useCallback(() => {
    if (!showCalendar) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
    setShowCalendar(!showCalendar);
    haptic.light();
  }, [showCalendar, selectedDate]);

  const isLoading = tasksLoading || completionsLoading || programEventsLoading;

  // Check if viewing a future date
  const isFutureDate = !isToday(selectedDate) && !isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  // Home data defaults
  const {
    listeningMinutes = 0,
    unreadPosts = 0,
    completedTracks = 0,
    journalStreak = 0,
    activeRounds = [],
    nextSessionMap = new Map()
  } = homeData || {};
  return <>
      <SEOHead title="Home - LadyBoss" description="Your personal dashboard and planner" />
      
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Fixed header with integrated week strip - Me+ style */}
        <header className="tour-header fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-xl shadow-sm" style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))'
      }}>
          {/* Title bar - three column layout for balanced centering */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 h-12">
            {/* Left: Quick action buttons when collapsed, empty when expanded */}
            <div className={cn(
              "flex items-center gap-1 justify-start transition-opacity duration-200 min-w-0 justify-self-start",
              showCalendar ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <button onClick={() => navigate('/app/water')} className="p-2 -ml-2 text-sky-500 hover:text-sky-600 transition-colors">
                <Droplets className="h-5 w-5" />
              </button>
              <button onClick={() => navigate('/app/breathe')} className="p-2 text-foreground/70 hover:text-foreground transition-colors">
                <Wind className="h-5 w-5" />
              </button>
              <button onClick={() => navigate('/app/journal')} className="p-2 text-foreground/70 hover:text-foreground transition-colors">
                <NotebookPen className="h-5 w-5" />
              </button>
            </div>

            {/* Center: Title - changes to month/year when expanded */}
            <div className="flex justify-center justify-self-center relative z-10">
              {showCalendar ? (
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2.5 -m-1 rounded-full hover:bg-white/50 active:bg-white/70 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-lg font-bold text-foreground min-w-[140px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h1>
                  <button onClick={handleNextMonth} className="p-2.5 -m-1 rounded-full hover:bg-white/50 active:bg-white/70 transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h1 className="text-lg font-bold text-foreground flex items-center gap-1">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
                  <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                </h1>
              )}
            </div>

            {/* Right: Additional buttons when collapsed + streak badge */}
            <div className="flex items-center gap-1 justify-end justify-self-end min-w-0">
              {/* Extra buttons when collapsed */}
              <div className={cn("flex items-center transition-opacity duration-200", showCalendar ? "opacity-0 pointer-events-none" : "opacity-100")}>
                <button onClick={() => navigate('/app/routines')} className="p-2 text-foreground/70 hover:text-foreground transition-colors">
                  <Sparkles className="h-5 w-5" />
                </button>
                <button onClick={() => navigate('/app/profile')} className="p-2 text-foreground/70 hover:text-foreground transition-colors">
                  <User className="h-5 w-5" />
                </button>
              </div>
              {/* Streak badge - always visible */}
              <button onClick={() => setShowStreakModal(true)} className="tour-streak flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-sm">
                <Flame className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
              </button>
            </div>
          </div>

          {/* Calendar area - compact spacing */}
          <div className="tour-calendar px-4 pt-0.5 pb-0.5">
            {/* Calendar grid container - with weekday headers */}
            <div className="grid overflow-hidden" style={{
            gridTemplateRows: showCalendar ? '1fr' : '0fr'
          }}>
              <div className="min-h-0">
                <div className={cn("transition-opacity duration-200", showCalendar ? "opacity-100" : "opacity-0")}>
                  {/* Weekday headers for expanded view */}
                  <div className="flex mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="flex-1 text-center text-[11px] text-foreground/50 font-medium leading-tight">
                        {day}
                      </div>)}
                  </div>
                  <MonthCalendar selectedDate={selectedDate} currentMonth={currentMonth} onDateSelect={handleDateSelect} completedDates={completedDates} programEventDates={programEventDates} />
                </div>
              </div>
            </div>

            {/* Week strip - Me+ style */}
            <div 
              className={cn("grid overflow-hidden")} 
              style={{ gridTemplateRows: showCalendar ? '0fr' : '1fr' }}
            >
              <div className="min-h-0">
                <div className={cn("flex mt-1 transition-opacity duration-200", showCalendar ? "opacity-0" : "opacity-100")}>
                  {weekDays.map(day => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasCompletions = completedDates?.has(dateStr);
                  const hasProgramEvents = programEventDates?.has(dateStr);
                  return <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className="flex-1 flex justify-center">
                        {/* Pill wraps around both day name and number for selected */}
                        <div className={cn('flex flex-col items-center px-2 py-1 rounded-full transition-all', isSelected && 'bg-[#E5D4F1] dark:bg-violet-800')}>
                          {/* Day name */}
                          <span className={cn('text-[11px] font-medium leading-tight', isSelected ? 'text-foreground/70' : 'text-foreground/50')}>
                            {format(day, 'EEE')}
                          </span>
                          
                          {/* Number with outline circle for selected */}
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all relative mt-0.5', isSelected ? 'bg-[#F4ECFE] text-foreground' // Same as header background, no border
                      : isTodayDate ? 'bg-white/60 text-foreground/80 dark:bg-violet-900/50 dark:text-violet-300' : 'text-foreground/70')}>
                            {hasCompletions && !isSelected && <Flame className="absolute h-5 w-5 text-orange-400 opacity-50" />}
                            {hasProgramEvents && <Star className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5", isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500")} />}
                            <span className="relative z-10">{format(day, 'd')}</span>
                          </div>
                        </div>
                      </button>;
                })}
                </div>
              </div>
            </div>

            {/* Calendar expand/collapse handle + Today button */}
            <div className="flex items-center justify-center pt-2 pb-2">
              {/* Center: Drag handle - larger tap area */}
              <button onClick={handleToggleCalendar} className="flex-1 flex justify-center py-2 -my-2">
                <div className="w-12 h-1.5 rounded-full bg-foreground/25" />
              </button>
              
              {/* Right: Today button - more prominent */}
              {!isToday(selectedDate) && <button onClick={() => {
              setSelectedDate(new Date());
              setCurrentMonth(startOfMonth(new Date()));
              haptic.light();
            }} className="absolute right-2 flex items-center gap-0.5 px-3 py-1.5 text-sm font-semibold text-violet-700 bg-violet-200 dark:bg-violet-700 dark:text-violet-100 rounded-full shadow-sm active:scale-95 transition-transform">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Today
                </button>}
            </div>
          </div>
        </header>

        {/* Fixed spacer for header */}
        <div className="shrink-0" style={{
        height: showCalendar ? 'calc(48px + 290px + max(12px, env(safe-area-inset-top)))' : 'calc(48px + 72px + max(12px, env(safe-area-inset-top)))'
      }} />

        {/* Scroll container */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 pb-safe">
            {/* Notification Banner - prompts users to enable notifications */}
            <NotificationBanner onEnableClick={() => setShowNotificationFlow(true)} />

            {/* Promo Banner */}
            <PromoBanner />

            {/* Home Banners (announcements with videos/CTAs) */}
            <HomeBanner />

            {/* Tag filter chips */}
            {taskTags.length > 0 && <div className="py-2 -mx-4 px-4 bg-background overflow-x-auto">
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTag(null)} className={cn('px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all font-medium', selectedTag === null ? 'bg-[#D8C0F3] text-foreground' : 'bg-transparent border border-foreground/20 text-foreground/60')}>
                    All
                  </button>
                  {taskTags.map(tag => <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={cn('px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all capitalize font-medium', selectedTag === tag ? 'bg-[#D8C0F3] text-foreground' : 'bg-transparent border border-foreground/20 text-foreground/60')}>
                      {tag}
                    </button>)}
                </div>
              </div>}

          {isLoading ? <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div> : <>
              {/* Program Events Section - only show when "All" tag is selected */}
              {programEvents.length > 0 && selectedTag === null && <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                      Program Events
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {programEvents.map(event => <ProgramEventCard key={`${event.type}-${event.id}`} event={event} date={selectedDate} />)}
                  </div>
                </div>}

              {/* Period Status Card - shows cycle info when onboarding is complete */}
              {selectedTag === null && homeData?.periodSettings?.onboarding_done && homeData?.periodSettings?.show_on_home && (
                <div className="mb-4">
                  <PeriodStatusCard />
                </div>
              )}

              {/* Personal Tasks Section */}
              {filteredTasks.length === 0 && (selectedTag !== null || programEvents.length === 0) ? <div className="text-center py-12">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-muted-foreground mb-4">
                    {selectedTag ? `No ${selectedTag} tasks for this day` : 'No tasks for this day'}
                  </p>
                  <button onClick={() => setShowQuickStart(true)} className="text-violet-600 font-medium">
                    Add your first task
                  </button>
                </div> : filteredTasks.length > 0 && <div>
                  {/* My Tasks header - always show */}
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-black uppercase tracking-wide">
                      My Tasks
                    </h2>
                    <span className="text-xs text-foreground/40 ml-auto">Hold to reorder</span>
                  </div>
                  <SortableTaskList tasks={filteredTasks} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} onOpenWaterTracking={handleOpenWaterTracking} />
                </div>}

              {/* Popular Routines Suggestions - only show routines user hasn't added */}
              {suggestedRoutines.length > 0 && selectedTag === null && <div className="tour-suggestions mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                      Try a Routine
                    </h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {suggestedRoutines.map(routine => <div key={routine.id} className="w-32 shrink-0">
                        <RoutineBankCard routine={routine} onClick={() => navigate(`/app/routines/${routine.id}`)} />
                      </div>)}
                  </div>
                </div>}

            </>}
          </div>

          {/* Extra padding for fixed bottom dashboard */}
          <div className="h-[200px]" />
        </div>

        {/* Fixed Bottom Dashboard - only show if user has active programs */}
        {activeRounds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] bg-primary-foreground rounded-none" style={{
            paddingBottom: 'max(64px, calc(52px + env(safe-area-inset-bottom)))'
          }}>
            <div className="px-1 py-1 bg-primary-foreground">
              <ActiveRoundsCarousel activeRounds={activeRounds} nextSessionMap={nextSessionMap} />
            </div>
          </div>
        )}

        {/* FAB - positioned above the fixed bottom dashboard */}
        <button onClick={() => setShowQuickStart(true)} className="tour-add-task fixed right-4 w-14 h-14 rounded-full bg-violet-500 text-white shadow-lg flex items-center justify-center hover:bg-violet-600 active:scale-95 transition-all z-50" style={{
        bottom: 'calc(100px + env(safe-area-inset-bottom))'
      }}>
          <Plus className="h-6 w-6" />
        </button>

        {/* Quick Start Sheet */}
        <TaskQuickStartSheet open={showQuickStart} onOpenChange={setShowQuickStart} onContinue={handleQuickStartContinue} />

        {/* Task Detail Modal */}
        <TaskDetailModal 
          task={selectedTask} 
          open={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
          date={selectedDate} 
          isCompleted={selectedTask ? completedTaskIds.has(selectedTask.id) : false}
          completedSubtaskIds={completedSubtaskIds}
          goalProgress={selectedTask ? (goalProgressMap.get(selectedTask.id) || 0) : 0}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStreakIncrease={() => setShowStreakModal(true)}
          onOpenGoalInput={handleOpenGoalInput}
          onOpenTimer={handleOpenTimer}
          onOpenWaterTracking={handleOpenWaterTracking}
        />

        {/* Streak celebration modal */}
        <StreakCelebration open={showStreakModal} onClose={() => setShowStreakModal(false)} />

        {/* Goal Input Sheet */}
        <GoalInputSheet
          open={!!goalInputTask}
          onOpenChange={(open) => !open && setGoalInputTask(null)}
          unit={goalInputTask?.goal_unit || 'times'}
          onConfirm={handleGoalInputConfirm}
        />

        {/* Timer Screen - Full screen overlay */}
        {timerTask && (
          <TaskTimerScreen
            task={timerTask}
            currentProgress={goalProgressMap.get(timerTask.id) || 0}
            onSaveProgress={handleTimerSaveProgress}
            onMarkComplete={handleTimerMarkComplete}
            onClose={() => setTimerTask(null)}
          />
        )}

        {/* Water Tracking Screen - Full screen overlay */}
        {waterTask && (
          <WaterTrackingScreen
            task={waterTask}
            date={selectedDate}
            goalProgress={goalProgressMap.get(waterTask.id) || 0}
            onClose={() => setWaterTask(null)}
            onAddWater={handleAddWater}
            onOpenSettings={() => {
              setWaterTask(null);
              handleEditTask(waterTask);
            }}
          />
        )}

        {user && showNotificationFlow && <PushNotificationOnboarding userId={user.id} onComplete={() => setShowNotificationFlow(false)} onSkip={() => setShowNotificationFlow(false)} />}

        {/* App Tour - Joyride guided walkthrough */}
        <AppTour run={runTour} stepIndex={stepIndex} onStepChange={setStepIndex} onComplete={completeTour} onSkip={skipTour} />
      </div>
    </>;
};
export default AppHome;