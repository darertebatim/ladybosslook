import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { Plus, Flame, CalendarDays, ChevronLeft, ChevronRight, Star, Sparkles, MessageCircle, ArrowLeft, Heart } from 'lucide-react';
import { HomeMenu } from '@/components/app/HomeMenu';
import { cn } from '@/lib/utils';
import { useTasksForDate, useCompletionsForDate, useCompletedDates, useUserStreak, UserTask, TaskTemplate, useAddGoalProgress, useDeleteTask, useSkipsForDate, useSetStreakGoal } from '@/hooks/useTaskPlanner';
import { useProgramEventsForDate, useProgramEventDates } from '@/hooks/usePlannerProgramEvents';
import { useNewHomeData } from '@/hooks/useNewHomeData';
import { TaskCard } from '@/components/app/TaskCard';
import { SortableTaskList } from '@/components/app/SortableTaskList';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { MonthCalendar } from '@/components/app/MonthCalendar';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { StreakGoalSelection } from '@/components/app/StreakGoalSelection';
import { TaskQuickStartSheet } from '@/components/app/TaskQuickStartSheet';
import { ProgramEventCard } from '@/components/app/ProgramEventCard';
import { PromoBanner } from '@/components/app/PromoBanner';
import { HomeBanner } from '@/components/app/HomeBanner';
import { NotificationBanner } from '@/components/app/NotificationBanner';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { HomeTour } from '@/components/app/tour';
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
import { TaskSkipSheet } from '@/components/app/TaskSkipSheet';
import { WelcomeRitualCard } from '@/components/app/WelcomeRitualCard';
import { toast } from 'sonner';
import { useWeeklyTaskCompletion, useDateRangeTaskCompletion, BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { BadgeCelebration } from '@/components/app/BadgeCelebration';
import { GoldStreakCelebration } from '@/components/app/GoldStreakCelebration';
import { useBadgeCelebration } from '@/hooks/useBadgeCelebration';
import { useGoldStreak, useGoldDatesThisWeek, useUpdateGoldStreak } from '@/hooks/useGoldStreak';

import coinBronze from '@/assets/coin-bronze.png';
import coinSilver from '@/assets/coin-silver.png';
import coinGold from '@/assets/coin-gold.png';

const BADGE_IMAGES: Record<Exclude<BadgeLevel, 'none'>, string> = {
  bronze: coinBronze,
  silver: coinSilver,
  gold: coinGold,
};
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
  
  // Skip task state
  const [skipTask, setSkipTask] = useState<UserTask | null>(null);
  
  // Home tour trigger for menu
  const [startHomeTour, setStartHomeTour] = useState<(() => void) | null>(null);
  const handleHomeTourReady = useCallback((tourStart: () => void) => {
    setStartHomeTour(() => tourStart);
  }, []);
  
  // First action celebration - tracks if this is user's first ever completion (uses unified StreakCelebration)
  const [isFirstActionCelebration, setIsFirstActionCelebration] = useState(false);
  
  // Streak goal selection state
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const setStreakGoal = useSetStreakGoal();
  
  // Gold streak celebration state - use localStorage to prevent re-showing on navigation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const goldCelebrationShownKey = `simora_gold_celebration_shown_${todayStr}`;
  const [showGoldStreakCelebration, setShowGoldStreakCelebration] = useState(false);
  const { data: goldStreakData } = useGoldStreak();
  const { data: goldDatesThisWeek = [] } = useGoldDatesThisWeek();
  const updateGoldStreak = useUpdateGoldStreak();
  
  // Welcome card dismissed state - persisted in localStorage
  // Also hide if user has ever added an action from the welcome card
  const [welcomeCardDismissed, setWelcomeCardDismissed] = useState(() => 
    localStorage.getItem('simora_welcome_card_dismissed') === 'true' ||
    localStorage.getItem('simora_welcome_card_action_added') === 'true'
  );
  
  // Track if user started this session as a new user (so card stays visible after adding tasks)
  const [startedAsNewUser, setStartedAsNewUser] = useState<boolean | null>(null);

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
    data: skippedTaskIds = new Set<string>()
  } = useSkipsForDate(selectedDate);
  const {
    data: streak
  } = useUserStreak();
  const {
    data: programEvents = [],
    isLoading: programEventsLoading
  } = useProgramEventsForDate(selectedDate);
  const {
    data: weeklyCompletion
  } = useWeeklyTaskCompletion();

  // Home data for stats and rounds
  const homeDataQuery = useNewHomeData();
  const {
    isNewUser: dataIsNewUser = false,
    totalCompletions = 0,
    isLoading: homeDataLoading,
    ...homeData
  } = homeDataQuery;
  
  // Check for force new user flag (set by admin reset)
  const forceNewUser = localStorage.getItem('simora_force_new_user') === 'true';
  const isNewUser = dataIsNewUser || forceNewUser;
  
  // Track if this is truly a first-time user for tour (no prior completions ever)
  // If server shows 0 completions, treat as first open regardless of localStorage
  // (handles remote admin reset where localStorage wasn't cleared on this device)
  const serverIndicatesNewUser = totalCompletions === 0;
  const isFirstOpen = !homeDataLoading && serverIndicatesNewUser;
  
  // Track if user started this session as a new user (only set once when data loads)
  useEffect(() => {
    if (startedAsNewUser === null && !homeDataLoading) {
      // Only set this once when home data first loads
      setStartedAsNewUser(isNewUser);
    }
  }, [isNewUser, startedAsNewUser, homeDataLoading]);
  
  // Auto-reset welcome card dismissal if user truly has no tasks
  // This handles the case when admin resets user data - the welcome card should reappear
  useEffect(() => {
    if (dataIsNewUser && welcomeCardDismissed) {
      // User has 0 tasks but card was dismissed - likely an admin reset
      // Clear the dismissal so the card shows again
      setWelcomeCardDismissed(false);
      localStorage.removeItem('simora_welcome_card_dismissed');
      localStorage.removeItem('simora_welcome_card_action_added');
    }
  }, [dataIsNewUser, welcomeCardDismissed]);
  
  // Show welcome card if user started as new user this session (even after adding tasks)
  const showWelcomeCard = (startedAsNewUser ?? isNewUser) && !welcomeCardDismissed;
  
  // Track first action celebration
  const hasAnyCompletionToday = (completions?.tasks?.length ?? 0) > 0;

  const triggerFirstCelebration = useCallback(() => {
    const alreadyCelebrated = localStorage.getItem('simora_first_action_celebrated') === 'true';
    if (alreadyCelebrated) return;

    setIsFirstActionCelebration(true);
    setShowStreakModal(true);
    localStorage.setItem('simora_first_action_celebrated', 'true');
  }, []);

  // Fast path: show immediately after the first completion is recorded (before home stats refetch)
  const prevTotalCompletions = useRef(totalCompletions);

  useEffect(() => {
    if (!homeDataLoading && totalCompletions === 0 && hasAnyCompletionToday) {
      triggerFirstCelebration();
    }
  }, [homeDataLoading, totalCompletions, hasAnyCompletionToday, triggerFirstCelebration]);

  // Fallback: when total completions count updates from 0 → 1
  useEffect(() => {
    if (prevTotalCompletions.current === 0 && totalCompletions === 1) {
      triggerFirstCelebration();
    }
    prevTotalCompletions.current = totalCompletions;
  }, [totalCompletions, triggerFirstCelebration]);

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
  
  // Fetch badge data for expanded month calendar
  const { data: monthBadgeData } = useDateRangeTaskCompletion(dateRange.start, dateRange.end);

  // Filter tasks by tag and exclude skipped tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => !skippedTaskIds.has(task.id));
    if (selectedTag) {
      result = result.filter(task => task.tag === selectedTag);
    }
    return result;
  }, [tasks, selectedTag, skippedTaskIds]);

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

  // Badge celebration tracking
  const todayDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayStats = weeklyCompletion?.[todayDateStr];
  const {
    celebrationType: badgeCelebrationType,
    closeCelebration: closeBadgeCelebration,
    completedCount: badgeCompletedCount,
    totalCount: badgeTotalCount,
  } = useBadgeCelebration({
    currentBadgeLevel: todayStats?.badgeLevel || 'none',
    completedCount: todayStats?.completedTasks || 0,
    totalCount: todayStats?.totalTasks || 0,
    dateKey: todayDateStr,
  });

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
        haptic.light();
      }
    });
  }, [deleteTask]);
  
  const handleSkipTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    setSkipTask(task);
  }, []);
  
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
  // Home data defaults - strength-first: daysThisMonth replaces journalStreak
  const {
    listeningMinutes = 0,
    unreadPosts = 0,
    completedTracks = 0,
    daysThisMonth = 0,
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
          <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 h-12">
            {/* Left: Menu button */}
            <div className="justify-self-start tour-menu-button">
              <HomeMenu onStartTour={startHomeTour || undefined} />
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

            {/* Right: Streak badge - navigates to presence page */}
            <div className="flex items-center justify-end justify-self-end">
              <button onClick={() => navigate('/app/presence')} className="tour-streak flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-sm active:scale-95 transition-transform">
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
                  <MonthCalendar selectedDate={selectedDate} currentMonth={currentMonth} onDateSelect={handleDateSelect} completedDates={completedDates} programEventDates={programEventDates} badgeData={monthBadgeData} />
                </div>
              </div>
            </div>

            {/* Week strip - Me+ style with badges */}
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
                  const hasProgramEvents = programEventDates?.has(dateStr);
                  
                  // Get badge level for this day
                  const dayStats = weeklyCompletion?.[dateStr];
                  const badgeLevel = dayStats?.badgeLevel || 'none';
                  const hasBadge = badgeLevel !== 'none';
                  
                  return <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className="flex-1 flex justify-center">
                        {/* Pill wraps around both day name and number for selected */}
                        <div className={cn('flex flex-col items-center px-1 py-0.5 rounded-full transition-all', isSelected && 'bg-chip-lavender')}>
                          {/* Day name */}
                          <span className={cn('text-[11px] font-medium leading-tight', isSelected ? 'text-foreground/70' : 'text-foreground/50')}>
                            {format(day, 'EEE')}
                          </span>
                          
                          {/* Badge or Number */}
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all relative mt-0.5 overflow-hidden',
                            !hasBadge && (isSelected 
                              ? 'bg-white text-foreground dark:bg-white dark:text-foreground'
                              : isTodayDate 
                                ? 'bg-violet-200/70 text-foreground/80 dark:bg-violet-800/50 dark:text-violet-300' 
                                : 'text-foreground/70'),
                            hasBadge && isSelected && "ring-2 ring-white ring-offset-1 ring-offset-chip-lavender"
                          )}>
                            {hasBadge ? (
                              <img 
                                src={BADGE_IMAGES[badgeLevel]} 
                                alt={`${badgeLevel} badge`}
                                className="w-[140%] h-[140%] object-cover"
                              />
                            ) : (
                              <>
                                {hasProgramEvents && <Star className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5", isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500")} />}
                                <span className="relative z-10">{format(day, 'd')}</span>
                              </>
                            )}
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
          <div className="px-4 pt-6 pb-4 pb-safe">
            {/* Notification Banner - prompts users to enable notifications */}
            <NotificationBanner onEnableClick={() => setShowNotificationFlow(true)} />

            {/* Promo Banner */}
            <PromoBanner location="home_top" className="py-2" />

            {/* Home Banners (announcements with videos/CTAs) */}
            <div className="tour-banner">
              <HomeBanner />
            </div>

            {/* Tag filter chips - temporarily hidden */}
            {/* {taskTags.length > 0 && <div className="py-2 -mx-4 px-4 bg-background overflow-x-auto">
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTag(null)} className={cn('px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all font-medium', selectedTag === null ? 'bg-chip-lavender text-foreground' : 'bg-transparent border border-foreground/20 text-foreground/60')}>
                    All
                  </button>
                  {taskTags.map(tag => <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={cn('px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all capitalize font-medium', selectedTag === tag ? 'bg-chip-lavender text-foreground' : 'bg-transparent border border-foreground/20 text-foreground/60')}>
                      {tag}
                    </button>)}
                </div>
              </div>} */}

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

              {/* Welcome Ritual Card for New Users - stays until dismissed */}
              {showWelcomeCard && (
                <div className="py-4 tour-welcome-card">
                  <WelcomeRitualCard onDismiss={() => {
                    setWelcomeCardDismissed(true);
                    setStartedAsNewUser(false);
                    localStorage.setItem('simora_welcome_card_dismissed', 'true');
                  }} />
                </div>
              )}

              {/* Personal Actions Section - hide empty state when welcome card is shown */}
              {!isNewUser && filteredTasks.length === 0 && (selectedTag !== null || programEvents.length === 0) ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-muted-foreground mb-2">
                    {selectedTag ? `No ${selectedTag} actions for this day` : 'Your day is open'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-4">
                    One small action is enough
                  </p>
                  <button onClick={() => setShowQuickStart(true)} className="text-violet-600 font-medium">
                    Add your first action
                  </button>
                </div>
              ) : filteredTasks.length > 0 ? (
                <div>
                  {/* My Actions header - always show */}
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-foreground tracking-wide">
                      My actions
                    </h2>
                    <span className="text-xs text-foreground/40 ml-auto">Hold to reorder</span>
                  </div>
                  <SortableTaskList tasks={filteredTasks} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} onOpenWaterTracking={handleOpenWaterTracking} />
                </div>
              ) : null}

              {/* Popular Rituals Suggestions - only show rituals user hasn't added */}
              {suggestedRoutines.length > 0 && selectedTag === null && <div className="tour-suggested-ritual mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 tracking-wide">
                      Try a ritual
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedRoutines.slice(0, 4).map(routine => (
                      <RoutineBankCard 
                        key={routine.id} 
                        routine={routine} 
                        onClick={() => navigate(`/app/routines/${routine.id}`)} 
                      />
                    ))}
                  </div>
                  
                  {/* Tour Banner - placed below rituals */}
                  <div id="tour-banner-slot" className="mt-4" />
                  
                  {/* Promo Banner - Home Page */}
                  <PromoBanner location="home_rituals" className="mt-4" />
                </div>}

            </>}
          </div>

          {/* Extra padding for fixed bottom dashboard */}
          <div className="h-[200px]" />
        </div>

        {/* Fixed Bottom Dashboard - only show if user has active programs */}
        {activeRounds.length > 0 && (
          <div className="tour-programs-carousel fixed bottom-0 left-0 right-0 z-40 rounded-t shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] bg-primary-foreground rounded-none" style={{
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
          onSkip={handleSkipTask}
        />

        {/* Streak celebration modal (also handles first action celebration) */}
        <StreakCelebration 
          open={showStreakModal} 
          onClose={() => {
            setShowStreakModal(false);
            setIsFirstActionCelebration(false);
          }}
          isFirstAction={isFirstActionCelebration}
          shouldShowGoalSelection={
            // Show goal selection if: first streak day (current_streak === 1) and no goal set
            !!streak && 
            streak.current_streak === 1 && 
            !streak.streak_goal &&
            streak.last_completion_date === format(new Date(), 'yyyy-MM-dd')
          }
          onShowGoalSelection={() => setShowGoalSelection(true)}
        />

        {/* Streak Goal Selection - Full screen modal */}
        <StreakGoalSelection
          open={showGoalSelection}
          onClose={() => setShowGoalSelection(false)}
          onSelectGoal={(goal) => {
            setStreakGoal.mutate(goal, {
              onSuccess: () => {
                setShowGoalSelection(false);
                toast.success('Challenge accepted! Let\'s do this! 🔥');
              },
            });
          }}
          isLoading={setStreakGoal.isPending}
        />

        {/* Badge celebration (silver/almost-there toasts + gold modal) */}
        <BadgeCelebration
          type={badgeCelebrationType}
          onClose={closeBadgeCelebration}
          onCollectGold={closeBadgeCelebration}
          onGoldCollected={() => {
            // Check if already shown today to prevent re-showing on navigation
            if (localStorage.getItem(goldCelebrationShownKey) === 'true') {
              return;
            }
            // Mark as shown for today
            localStorage.setItem(goldCelebrationShownKey, 'true');
            // Update gold streak and show celebration
            updateGoldStreak.mutate(undefined, {
              onSuccess: () => {
                setShowGoldStreakCelebration(true);
              },
            });
          }}
          completedCount={badgeCompletedCount}
          totalCount={badgeTotalCount}
        />

        {/* Gold Streak Celebration - shows after gold badge collected */}
        <GoldStreakCelebration
          open={showGoldStreakCelebration}
          onClose={() => setShowGoldStreakCelebration(false)}
          currentGoldStreak={goldStreakData?.currentGoldStreak || 1}
          goldDatesThisWeek={goldDatesThisWeek}
        />

        {/* Task Skip Sheet */}
        <TaskSkipSheet
          task={skipTask}
          open={!!skipTask}
          onClose={() => setSkipTask(null)}
          date={selectedDate}
        />

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

        {/* New Interactive Home Tour */}
        <HomeTour 
          isFirstOpen={isFirstOpen}
          forceShow={serverIndicatesNewUser}
          hasEnrolledPrograms={activeRounds.length > 0}
          hasSuggestedRituals={suggestedRoutines.length > 0}
          hasWelcomeCard={showWelcomeCard}
          onTourReady={handleHomeTourReady}
        />
      </div>
    </>;
};
export default AppHome;