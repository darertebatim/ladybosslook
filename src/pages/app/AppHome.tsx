// AppHome - Main home page component
import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, startOfDay, subDays } from 'date-fns';
import { Plus, Flame, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Star, Sparkles, Headset, ArrowLeft, Heart, Zap, Settings2, Search, Play } from 'lucide-react';

import AppTaskCreate from '@/pages/app/AppTaskCreate';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { HomeMenu } from '@/components/app/HomeMenu';
import { cn } from '@/lib/utils';
import { useTasksForDate, useCompletionsForDate, useCompletedDates, UserTask, TaskTemplate, useAddGoalProgress, useDeleteTask, useSkipsForDate, useSetStreakGoal, useRecoverStreak, useCarryForwardTasks } from '@/hooks/useTaskPlanner';
import { useProgramEventsForDate, useProgramEventDates } from '@/hooks/usePlannerProgramEvents';
import { useNewHomeData } from '@/hooks/useNewHomeData';
import { SortableTaskList } from '@/components/app/SortableTaskList';
import { MonthCalendar } from '@/components/app/MonthCalendar';
import { ProgramEventCard } from '@/components/app/ProgramEventCard';
import { PromoBanner } from '@/components/app/PromoBanner';
import { HomeBanner } from '@/components/app/HomeBanner';
import { NotificationBanner } from '@/components/app/NotificationBanner';
import { HomeCelebrations } from '@/components/app/HomeCelebrations';
import { HomeTour } from '@/components/app/tour';
import { useAuth } from '@/hooks/useAuth';

import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/SEOHead';
import { useFeaturedRoutinesBank, useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { FeaturedRoutineCard } from '@/components/app/FeaturedRoutineCard';
import { haptic } from '@/lib/haptics';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { isWaterTask } from '@/lib/waterTracking';
import { PeriodStatusCard } from '@/components/app/PeriodStatusCard';
import { FastingStatusCard } from '@/components/app/FastingStatusCard';

import { toast } from 'sonner';
import { useWeeklyTaskCompletion, useDateRangeTaskCompletion, BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { useBadgeCelebration } from '@/hooks/useBadgeCelebration';
import { useChallengeDayCelebration } from '@/hooks/useChallengeDayCelebration';
import { useGoldStreak, useGoldDatesThisWeek, useUpdateGoldStreak } from '@/hooks/useGoldStreak';
import { useTodayMood } from '@/hooks/useMoodLogs';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppReview } from '@/hooks/useAppReview';
import { hasSeenActionLimitSoft, markActionLimitSoftSeen } from '@/components/app/ActionLimitSheet';
import { MoodCheckInBanner } from '@/components/mood/MoodCheckInBanner';
import { OnboardingBanner } from '@/components/app/OnboardingBanner';
import { WeeklyReviewBanner } from '@/components/app/WeeklyReviewBanner';
import { SelfCareQuizBanner } from '@/components/app/SelfCareQuizBanner';
import { ToolShortcuts } from '@/components/app/ToolShortcuts';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useAutoAssignDefaultRoutine } from '@/hooks/useAutoAssignDefaultRoutine';


import coinBronze from '@/assets/coin-bronze.png';
import coinSilver from '@/assets/coin-silver.png';
import coinGold from '@/assets/coin-gold.png';
import checklistEmpty from '@/assets/checklist-empty.png';
import emptyPlannerImg from '@/assets/empty-planner.png';

const BADGE_IMAGES: Record<Exclude<BadgeLevel, 'none'>, string> = {
  bronze: coinBronze,
  silver: coinSilver,
  gold: coinGold,
};

const AppHome = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useAutoAssignDefaultRoutine();
  const { scrollRef: homeScrollRef } = useScrollRestore('home_scroll', { autoSave: true });
  const {
    user
  } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const taskFilter = searchParams.get('filter') || 'all';
  const [homeView, setHomeView] = useState<'tasks' | 'routines' | 'one-time'>('tasks');
  useEffect(() => {
    const handler = () => setHomeView(prev => prev === 'tasks' ? 'routines' : 'tasks');
    window.addEventListener('home-tab-retap', handler);
    return () => window.removeEventListener('home-tab-retap', handler);
  }, []);
  const setTaskFilter = useCallback((val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val === 'all') {
        next.delete('filter');
      } else {
        next.set('filter', val);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [taskSheetEditId, setTaskSheetEditId] = useState<string | undefined>(undefined);
  const [taskSheetCreateParams, setTaskSheetCreateParams] = useState<Record<string, string> | undefined>(undefined);
  const [stepCelebration, setStepCelebration] = useState<{ completedStep: number; newTaskCount: number } | null>(null);
  const [projectCompletion, setProjectCompletion] = useState<{
    routineId: string; routineTitle: string; routineEmoji: string;
    totalSteps: number; totalTasks: number; badgeImageUrl: string | null;
  } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [showNotificationFlow, setShowNotificationFlow] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showActionLimit, setShowActionLimit] = useState(false);
  const [hasSelfCareQuizBanner, setHasSelfCareQuizBanner] = useState(false);
  const [hasPromoBanner, setHasPromoBanner] = useState(false);
  const [hasHomeBanner, setHasHomeBanner] = useState(false);
  const [hasMoodBanner, setHasMoodBanner] = useState(false);
  const [hasWeeklyBanner, setHasWeeklyBanner] = useState(false);
  const { isKeyboardOpen } = useKeyboard();
  const { currentTrack } = useAudioPlayer();
  const hasMiniPlayer = !!currentTrack;
  let hasRoutineMini = false;
  try { const rp = useRoutinePlayerContext(); hasRoutineMini = rp.isActive && rp.isMinimized; } catch { /* */ }
  const activeMiniPlayerCount = (hasMiniPlayer ? 1 : 0) + (hasRoutineMini ? 1 : 0);
  
  const [goalInputTask, setGoalInputTask] = useState<UserTask | null>(null);
  const addGoalProgress = useAddGoalProgress();
  
  // Timer screen state
  const [timerTask, setTimerTask] = useState<UserTask | null>(null);
  
  
  
  // Skip task state
  const [skipTask, setSkipTask] = useState<UserTask | null>(null);
  
  // Home tour trigger for menu
  const [startHomeTour, setStartHomeTour] = useState<(() => void) | null>(null);
  const handleHomeTourReady = useCallback((tourStart: () => void) => {
    setStartHomeTour(() => tourStart);
  }, []);
  
  // First action celebration - tracks if this is user's first ever completion (uses unified StreakCelebration)
  const [isFirstActionCelebration, setIsFirstActionCelebration] = useState(false);
  
  // First coach mark: "Mark off your first task" - delayed 3s for new users
  const [showFirstCoachMark, setShowFirstCoachMark] = useState(false);
  
  // Second coach mark: "Tap to manage" - shown 5s after first coach mark OR after first-action celebration
  const [showTapCoachMark, setShowTapCoachMark] = useState(false);
  // Track that tap coach mark was triggered (to chain the + button spotlight)
  const tapCoachMarkTriggeredRef = useRef(false);
  
  // Third coach mark: "Tap + to add" - shown after user closes task detail from tap coach mark
  const [showAddCoachMark, setShowAddCoachMark] = useState(false);
  
  // Streak goal selection state
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [isStreakUpgrade, setIsStreakUpgrade] = useState(false);
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false);
  const [confirmedGoal, setConfirmedGoal] = useState(7);
  const setStreakGoal = useSetStreakGoal();
  const recoverStreak = useRecoverStreak();
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [showGoldRecoveryPrompt, setShowGoldRecoveryPrompt] = useState(false);
  const [showRecoverySuccess, setShowRecoverySuccess] = useState<'streak' | 'gold' | null>(null);


  // Gold streak celebration state - use localStorage to prevent re-showing on navigation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const goldCelebrationShownKey = `simora_gold_celebration_shown_${todayStr}`;
  const streakGoalCelebrationShownKey = `simora_streak_goal_celebration_shown`;
  const [showGoldStreakCelebration, setShowGoldStreakCelebration] = useState(false);
  const [showStreakGoalCompletion, setShowStreakGoalCompletion] = useState(false);
  const { data: goldStreakData } = useGoldStreak();
  const { data: goldDatesThisWeek = [] } = useGoldDatesThisWeek();
  const updateGoldStreak = useUpdateGoldStreak();
  const { data: todayMood } = useTodayMood();
  
  // Dismissed individual routine card IDs
  const [dismissedRoutineIds, setDismissedRoutineIds] = useState<Set<string>>(() => {
    try {
      const oldKey = localStorage.getItem('simora_dismissed_ritual_ids');
      const newKey = localStorage.getItem('simora_dismissed_routine_ids');
      return new Set(JSON.parse(newKey || oldKey || '[]'));
    } catch { return new Set(); }
  });

  // Handle quick start continue
  const handleQuickStartContinue = useCallback((taskName: string, template?: TaskTemplate) => {
    if (template) {
      const params: Record<string, string> = {
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
      };
      setTaskSheetEditId(undefined);
      setTaskSheetCreateParams(params);
      setTaskSheetOpen(true);
    } else {
      setTaskSheetEditId(undefined);
      setTaskSheetCreateParams({ name: taskName });
      setTaskSheetOpen(true);
    }
  }, []);

  // Subscription & task limit (per-day, not total)
  const { hasAccessToProgram } = useSubscription();
  const MAX_FREE_ACTIONS_PER_DAY = 6;

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
  const { data: carryForwardTasks = [] } = useCarryForwardTasks();

  const handleFabClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('quick-add-open', { detail: { defaultRepeat: taskFilter === 'one-time' ? 'No' : 'Daily' } }));
  }, [taskFilter]);

  // Streak data now comes from useNewHomeData (consolidated RPC)
  const {
    data: programEvents = [],
    isLoading: programEventsLoading
  } = useProgramEventsForDate(selectedDate);
  const {
    data: weeklyCompletion
  } = useWeeklyTaskCompletion();

  // Home data for stats and rounds (consolidated RPC - includes streak)
  const homeDataQuery = useNewHomeData();
  const {
    isNewUser: dataIsNewUser = false,
    totalCompletions = 0,
    isLoading: homeDataLoading,
    streak = null,
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
  
  
  // Track first action celebration
  const hasAnyCompletionToday = (completions?.tasks?.length ?? 0) > 0;

  const triggerFirstCelebration = useCallback(() => {
    const alreadyCelebrated = localStorage.getItem('simora_first_action_celebrated') === 'true';
    if (alreadyCelebrated) return;

    setIsFirstActionCelebration(true);
    setShowStreakModal(true);
    localStorage.setItem('simora_first_action_celebrated', 'true');
  }, []);

  // Switcher button refs for pixel-perfect pill animation
  const btnRoutinesRef = useRef<HTMLButtonElement>(null);
  const btnTasksRef = useRef<HTMLButtonElement>(null);
  const btnOneTimeRef = useRef<HTMLButtonElement>(null);

  const prevTotalCompletions = useRef(totalCompletions);
  const prevHasCompletionToday = useRef(hasAnyCompletionToday);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (homeDataLoading) return;
    
    // Skip the very first data load — only react to changes after mount
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      prevTotalCompletions.current = totalCompletions;
      prevHasCompletionToday.current = hasAnyCompletionToday;
      
      // Auto-set flag for existing users who already have completions
      // (prevents the first-action spotlight from showing every day for legacy users)
      if (totalCompletions > 0 && localStorage.getItem('simora_first_action_celebrated') !== 'true') {
        localStorage.setItem('simora_first_action_celebrated', 'true');
      }
      return;
    }

    // Fast path: hasAnyCompletionToday flipped from false → true
    if (!prevHasCompletionToday.current && hasAnyCompletionToday && totalCompletions === 0) {
      const timer = setTimeout(() => triggerFirstCelebration(), 2800);
      prevHasCompletionToday.current = hasAnyCompletionToday;
      return () => clearTimeout(timer);
    }
    prevHasCompletionToday.current = hasAnyCompletionToday;

    // Fallback: when total completions count updates from 0 → 1
    if (prevTotalCompletions.current === 0 && totalCompletions === 1) {
      const timer = setTimeout(() => triggerFirstCelebration(), 2800);
      prevTotalCompletions.current = totalCompletions;
      return () => clearTimeout(timer);
    }
    prevTotalCompletions.current = totalCompletions;
  }, [homeDataLoading, totalCompletions, hasAnyCompletionToday, triggerFirstCelebration]);

  // Detect streak goal completion — show celebration once
  useEffect(() => {
    if (!streak || !streak.streak_goal || streak.streak_goal <= 0) return;
    if (streak.current_streak < streak.streak_goal) return;
    // Already celebrated this goal (check localStorage keyed by goal value)
    const celebratedKey = `simora_streak_goal_celebrated_${streak.streak_goal}`;
    if (localStorage.getItem(celebratedKey) === 'true') return;
    // Also check if streak_goal_completed_at is set (server-side flag)
    if ((streak as any).streak_goal_completed_at) return;
    
    // Mark as celebrated
    localStorage.setItem(celebratedKey, 'true');
    // Also mark on server
    supabase.from('user_streaks').update({ streak_goal_completed_at: new Date().toISOString() } as any).eq('user_id', streak.user_id).then(() => {});
    
    setShowStreakGoalCompletion(true);
  }, [streak]);

  // Auto-show recovery prompt when streak is broken and recovery hasn't been used
  useEffect(() => {
    if (!streak) return;
    const recoveryCount = (streak as any).streak_recovery_count || 0;
    if (recoveryCount >= 3) return;
    if (streak.longest_streak <= 1) return;
    
    // Check if streak is actually broken by comparing last_completion_date
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const lastCompletion = streak.last_completion_date;
    
    // If last completion was today or yesterday, streak is alive
    if (lastCompletion === today || lastCompletion === yesterday) return;
    
    const shownKey = 'simora_recovery_prompt_shown';
    if (sessionStorage.getItem(shownKey) === 'true') return;
    sessionStorage.setItem(shownKey, 'true');
    setTimeout(() => setShowRecoveryPrompt(true), 1200);
  }, [streak]);

  // Auto-show gold streak recovery prompt when gold streak is broken
  useEffect(() => {
    if (!goldStreakData) return;
    if (!streak) return;
    if (!goldStreakData.lastGoldDate) return;
    // Gold streak must have been > 0
    const goldStreak = goldStreakData.currentGoldStreak;
    if (goldStreak <= 0 && goldStreakData.longestGoldStreak <= 0) return;
    
    // Check if last gold date is before yesterday (streak is broken)
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const lastGold = goldStreakData.lastGoldDate;
    
    // If last gold was today or yesterday, streak is still alive
    if (lastGold === today || lastGold === yesterday) return;
    
    // Streak is broken — the DB still has old current_gold_streak value
    const previousGold = goldStreak > 0 ? goldStreak : goldStreakData.longestGoldStreak;
    if (previousGold <= 0) return;
    
    const recoveryCount = (streak as any).streak_recovery_count || 0;
    if (recoveryCount >= 3) return;
    const shownKey = 'simora_gold_recovery_prompt_shown';
    if (sessionStorage.getItem(shownKey) === 'true') return;
    sessionStorage.setItem(shownKey, 'true');
    setTimeout(() => setShowGoldRecoveryPrompt(true), 1500);
  }, [goldStreakData, streak]);

  // Featured routines for promo banners (only dismiss on tap/close, not on adoption)
  const {
    data: featuredRoutines = []
  } = useFeaturedRoutinesBank();
  const { data: routineCategories = [] } = useRoutineBankCategories();
  
  // Map slug → category name for display
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    routineCategories.forEach(cat => map.set(cat.slug, `${cat.emoji || '📂'} ${cat.name}`));
    return map;
  }, [routineCategories]);
  
  const suggestedRoutines = useMemo(() => 
    featuredRoutines.filter(r => !dismissedRoutineIds.has(r.id)),
    [featuredRoutines, dismissedRoutineIds]
  );

  // Generate 3 weeks of days (prev, current, next) for scrollable strip
  const weekDays = useMemo(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const prevWeekStart = subDays(currentWeekStart, 7);
    return Array.from({ length: 21 }, (_, i) => addDays(prevWeekStart, i));
  }, [selectedDate]);

  // Ref for scrollable week strip to auto-scroll to current week
  const weekStripRef = useRef<HTMLDivElement>(null);

  // Track which week index is currently scrolled to
  const lastScrollWeekRef = useRef(1); // 0=prev, 1=current, 2=next
  const isAutoScrollingRef = useRef(false);

  // Auto-scroll to current week (middle section) when strip is visible
  useEffect(() => {
    if (!showCalendar && weekStripRef.current) {
      isAutoScrollingRef.current = true;
      lastScrollWeekRef.current = 1;
      requestAnimationFrame(() => {
        if (weekStripRef.current) {
          const container = weekStripRef.current;
          const dayWidth = container.scrollWidth / 21;
          container.scrollLeft = dayWidth * 7;
          // Reset auto-scroll flag after scroll settles
          setTimeout(() => { isAutoScrollingRef.current = false; }, 150);
        }
      });
    }
  }, [showCalendar, selectedDate]);

  // Detect scroll snap to different week and update selected date
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleWeekStripScroll = useCallback(() => {
    if (isAutoScrollingRef.current || !weekStripRef.current) return;
    // Debounce: wait for scroll to settle
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      if (!weekStripRef.current) return;
      const container = weekStripRef.current;
      const dayWidth = container.scrollWidth / 21;
      const weekWidth = dayWidth * 7;
      const currentWeekIdx = Math.round(container.scrollLeft / weekWidth);
      
      if (currentWeekIdx !== 1) { // scrolled away from center week
        const diff = (currentWeekIdx - 1) * 7;
        const newDate = addDays(selectedDate, diff);
        isAutoScrollingRef.current = true;
        setSelectedDate(newDate);
        setCurrentMonth(startOfMonth(newDate));
        haptic.light();
      }
    }, 100);
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

  // Collect unique routine IDs from tasks
  const uniqueRoutineIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(task => {
      if (task.source_routine_id) ids.add(task.source_routine_id);
    });
    return Array.from(ids);
  }, [tasks]);

  // Fetch routine names for dropdown labels
  const { data: routineNameData = [] } = useQuery({
    queryKey: ['routine-names-for-filter', uniqueRoutineIds],
    queryFn: async () => {
      if (uniqueRoutineIds.length === 0) return [];
      const { data } = await supabase
        .from('routines_bank')
        .select('id, title, emoji')
        .in('id', uniqueRoutineIds);
      return data || [];
    },
    enabled: uniqueRoutineIds.length > 0,
  });

  const routineNamesInTasks = useMemo(() => {
    const map = new Map<string, string>();
    routineNameData.forEach((r: any) => {
      map.set(r.id, `${r.emoji || '📋'} ${r.title}`);
    });
    return map;
  }, [routineNameData]);

  // Filter tasks by the selected filter and exclude skipped tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => !skippedTaskIds.has(task.id));
    
    // Merge carry-forward (uncompleted past one-time) tasks when viewing today
    if (isToday(selectedDate) && carryForwardTasks.length > 0) {
      const existingIds = new Set(result.map(t => t.id));
      const newCarryForward = carryForwardTasks.filter(t => !existingIds.has(t.id) && !skippedTaskIds.has(t.id));
      result = [...result, ...newCarryForward];
    }

    // Hide Routine Player pro-tasks from "My Tasks" — they appear as their own
    // Routine Player cards above the list, so showing them again is redundant.
    result = result.filter(t => t.pro_link_type !== 'routine');

    if (taskFilter === 'all') return result;
    if (taskFilter === 'one-time') return result.filter(t => t.repeat_pattern === 'none');
    if (taskFilter === 'unlinked') return result.filter(t => !t.source_routine_id);
    if (taskFilter === 'all-routines') return result.filter(t => t.pro_link_type === 'routine');
    if (taskFilter.startsWith('routine:')) {
      const routineId = taskFilter.replace('routine:', '');
      return result.filter(t => t.source_routine_id === routineId);
    }
    if (taskFilter.startsWith('cat:')) {
      const tag = taskFilter.replace('cat:', '');
      return result.filter(t => t.tag === tag);
    }
    return result;
  }, [tasks, taskFilter, skippedTaskIds, selectedDate, carryForwardTasks]);

  // Routine launcher pro-tasks for the "Routines" view
  const routineProTasks = useMemo(() => {
    return tasks.filter(t => t.pro_link_type === 'routine' && !skippedTaskIds.has(t.id));
  }, [tasks, skippedTaskIds]);

  // Get unique tags from tasks
  const taskTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => {
      if (task.tag) tags.add(task.tag);
    });
    return Array.from(tags);
  }, [tasks]);

  // Auto-reset filter when the filter target no longer exists
  useEffect(() => {
    if (taskFilter === 'all' || taskFilter === 'one-time' || taskFilter === 'unlinked' || taskFilter === 'all-routines') return;
    if (taskFilter.startsWith('routine:')) {
      const rid = taskFilter.replace('routine:', '');
      if (!routineNamesInTasks.has(rid)) setTaskFilter('all');
    } else if (taskFilter.startsWith('cat:')) {
      const tag = taskFilter.replace('cat:', '');
      if (!taskTags.includes(tag)) setTaskFilter('all');
    }
  }, [taskFilter, taskTags, routineNamesInTasks]);

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

  // Challenge day celebration
  const {
    celebrationData: challengeDayCelebration,
    closeCelebration: closeChallengeDayCelebration,
    showCelebration: showChallengeDayCelebration,
  } = useChallengeDayCelebration(
    tasks.map(t => ({ id: t.id, title: t.title })),
    completedTaskIds,
    todayDateStr,
  );

  const handleStreakIncrease = useCallback(() => {
    // If user has never celebrated first action, don't open streak modal immediately —
    // let triggerFirstCelebration handle it with proper delay after seal animation
    const alreadyCelebrated = localStorage.getItem('simora_first_action_celebrated') === 'true';
    if (!alreadyCelebrated) return;
    setShowStreakModal(true);
  }, []);

  const handleOpenGoalInput = useCallback((task: UserTask) => {
    // Small count goals (< 10): directly increment by 1 without opening keyboard
    const isSmallCountGoal = task.goal_enabled && task.goal_type === 'count' && (task.goal_target || 0) < 10 && !isWaterTask(task);
    if (isSmallCountGoal) {
      addGoalProgress.mutate(
        { taskId: task.id, date: selectedDate, amount: 1 },
        {
          onSuccess: (result) => {
            haptic.successBurst();
            const unit = task.goal_unit || 'times';
            toast(`+1 ${unit}`, {
              description: `Progress: ${result.newProgress}/${task.goal_target}`,
              duration: 2000,
            });
            if (result.streakIncreased) {
              setShowStreakModal(true);
            }
          },
        }
      );
      return;
    }
    setGoalInputTask(task);
  }, [selectedDate, addGoalProgress]);

  const handleOpenTimer = useCallback((task: UserTask) => {
    setTimerTask(task);
  }, []);

  const { maybeRequestReview } = useAppReview();

  const handleStepUnlocked = useCallback((result: import('@/hooks/useProjectStepUnlock').StepUnlockResult) => {
    if (result.type === 'step_unlocked') {
      setStepCelebration({ completedStep: result.unlockedStep - 1, newTaskCount: result.taskCount });
    } else if (result.type === 'project_completed') {
      setProjectCompletion({
        routineId: result.routineId,
        routineTitle: result.routineTitle,
        routineEmoji: result.routineEmoji,
        totalSteps: result.totalSteps,
        totalTasks: result.totalTasks,
        badgeImageUrl: result.badgeImageUrl,
      });
    }
  }, []);

  const handleCloseStepCelebration = useCallback(() => {
    setStepCelebration(null);
    queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
  }, [queryClient]);

  const handleCloseProjectCompletion = useCallback(() => {
    setProjectCompletion(null);
    queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['user-routines-bank'] });
  }, [queryClient]);


  const handleGoalInputConfirm = useCallback((amount: number) => {
    if (!goalInputTask) return;
    
    addGoalProgress.mutate(
      { taskId: goalInputTask.id, date: selectedDate, amount },
      {
        onSuccess: (result) => {
          haptic.successBurst();
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
          haptic.successBurst();
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
          haptic.celebrate();
          toast(`Goal completed! 🎉`, { duration: 2000 });
        },
      }
    );
  }, [timerTask, selectedDate, addGoalProgress, goalProgressMap]);

  const handleEditTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    setTaskSheetCreateParams(undefined);
    setTaskSheetEditId(task.id);
    setTaskSheetOpen(true);
  }, []);

  const handleOpenTaskSheet = useCallback((params: { editTaskId?: string; createParams?: Record<string, string> }) => {
    setTaskSheetEditId(params.editTaskId);
    setTaskSheetCreateParams(params.createParams);
    setTaskSheetOpen(true);
  }, []);

  const deleteTask = useDeleteTask();
  const handleDeleteTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    haptic.deleteSweep();
    deleteTask.mutate(task.id);
  }, [deleteTask]);
  
  const handleSkipTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    setSkipTask(task);
  }, []);
  
  const handleTaskTap = useCallback((task: UserTask) => {
    setSelectedTask(task);
  }, []);
  
  // Auto-show first coach mark ("mark off your first task") after 3s for brand new users
  useEffect(() => {
    if (
      localStorage.getItem('simora_first_action_celebrated') !== 'true' &&
      !tasksLoading &&
      tasks.length > 0 &&
      completedTaskIds.size === 0 &&
      totalCompletions === 0 &&
      !showFirstCoachMark &&
      !showStreakModal
    ) {
      const t = setTimeout(() => {
        setShowFirstCoachMark(true);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [tasksLoading, tasks.length, completedTaskIds.size, totalCompletions, showFirstCoachMark, showStreakModal]);

  // Dismiss first coach mark when user completes a task
  useEffect(() => {
    if (showFirstCoachMark && completedTaskIds.size > 0) {
      setShowFirstCoachMark(false);
    }
  }, [showFirstCoachMark, completedTaskIds.size]);

  // Auto-show tap coach mark for new users after 5 seconds (only after first coach mark is done)
  useEffect(() => {
    if (
      localStorage.getItem('simora_tap_coach_shown') !== 'true' &&
      localStorage.getItem('simora_first_action_celebrated') === 'true' &&
      !tasksLoading &&
      tasks.length > 0 &&
      !showTapCoachMark &&
      !showFirstCoachMark &&
      !showStreakModal
    ) {
      const t = setTimeout(() => {
        setShowTapCoachMark(true);
        localStorage.setItem('simora_tap_coach_shown', 'true');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [tasksLoading, tasks.length, showTapCoachMark, showFirstCoachMark, showStreakModal]);

  // When task detail sheet closes after the tap coach mark, show + button spotlight after 2s
  useEffect(() => {
    if (!selectedTask && tapCoachMarkTriggeredRef.current && localStorage.getItem('simora_add_coach_shown') !== 'true') {
      tapCoachMarkTriggeredRef.current = false;
      const t = setTimeout(() => {
        setShowAddCoachMark(true);
        localStorage.setItem('simora_add_coach_shown', 'true');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [selectedTask]);
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
    nextSessionMap = {}
  } = homeData || {};
  return (
    <>
      <SEOHead title="Home - LadyBoss" description="Your personal dashboard and planner" />
      
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Fixed header with integrated week strip - Me+ style */}
        <header className="tour-header fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-black/15 backdrop-blur-xl rounded-b-xl shadow-[0_2px_10px_rgba(0,0,0,0.08)]" style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))'
      }}>
          {/* Title bar - three column layout for balanced centering */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 h-10">
            {/* Left: Menu + Support */}
            <div className="justify-self-start flex items-center gap-1 tour-menu-button">
              <HomeMenu onStartTour={startHomeTour || undefined} />
              <button
                onClick={() => navigate('/app/chat')}
                className="p-2 -ml-1 text-foreground transition-colors"
              >
                <Headset className="h-5 w-5" />
              </button>
            </div>

            {/* Center: Title - changes to month/year when expanded */}
            <div className="flex justify-center justify-self-center relative z-10">
              {showCalendar ? (
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2.5 -m-1 rounded-full active:bg-white/70 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-lg font-bold text-foreground min-w-[140px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h1>
                  <button onClick={handleNextMonth} className="p-2.5 -m-1 rounded-full active:bg-white/70 transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h1 className="text-lg font-bold text-foreground flex items-center gap-1">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
                  <Star className="h-3 w-3 text-red-500 fill-red-500" />
                </h1>
              )}
            </div>

            {/* Right: Streak badge */}
            <div className="flex items-center gap-2 justify-end justify-self-end">
              {/* Mood check-in button – hidden for now, re-enable from admin/app */}
              
              {/* Streak badge - navigates to presence page */}
              <button onClick={() => navigate('/app/presence')} className={cn("tour-streak flex items-center gap-1 px-2.5 py-1 rounded-full shadow-sm active:scale-95 transition-all", hasAnyCompletionToday ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white" : "bg-muted text-muted-foreground")}>
                <Flame className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
              </button>
            </div>
          </div>

          {/* Calendar area - compact spacing */}
          <div className="tour-calendar px-4 pt-0 pb-0">
            {/* Calendar grid container - with weekday headers */}
            <div className="grid overflow-hidden" style={{
            gridTemplateRows: showCalendar ? '1fr' : '0fr'
          }}>
              <div className="min-h-0">
                <div className={cn("transition-opacity duration-200", showCalendar ? "opacity-100" : "opacity-0")}>
                  <MonthCalendar selectedDate={selectedDate} currentMonth={currentMonth} onDateSelect={handleDateSelect} completedDates={completedDates} programEventDates={programEventDates} badgeData={monthBadgeData} />
                </div>
              </div>
            </div>

            {/* Week strip - horizontally scrollable 3-week strip */}
            <div 
              className={cn("grid")} 
              style={{ gridTemplateRows: showCalendar ? '0fr' : '1fr', overflow: showCalendar ? 'hidden' : 'visible' }}
            >
              <div className="min-h-0 overflow-hidden">
                <div 
                  ref={weekStripRef}
                  onScroll={handleWeekStripScroll}
                  className={cn("flex mt-0 py-1 overflow-x-auto overflow-y-visible transition-opacity duration-200 snap-x snap-mandatory", showCalendar ? "opacity-0" : "opacity-100")}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                >
                  {weekDays.map((day, idx) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasProgramEvents = programEventDates?.has(dateStr);
                  
                  // Get badge level for this day
                  const dayStats = weeklyCompletion?.[dateStr];
                  const badgeLevel = dayStats?.badgeLevel || 'none';
                  const hasBadge = badgeLevel !== 'none';

                  // Snap point at the start of each week (every 7 days)
                  const isWeekStart = idx % 7 === 0;
                  
                  return <button 
                    key={day.toISOString()} 
                    onClick={() => {
                      setSelectedDate(day);
                      setCurrentMonth(startOfMonth(day));
                    }} 
                    className={cn("flex justify-center", isWeekStart && "snap-start")}
                    style={{ minWidth: 'calc(100% / 7)' }}
                  >
                        <div className={cn(
                          'w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative',
                          isSelected 
                            ? 'bg-chip-lavender text-foreground scale-105' 
                            : isTodayDate 
                              ? 'border border-background text-muted-foreground' 
                              : 'text-muted-foreground/60',
                          hasBadge && isSelected && 'ring-2 ring-chip-lavender ring-offset-0'
                        )}>
                          {hasProgramEvents && (
                            <Star className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5 z-20", isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500")} />
                          )}
                          {hasBadge ? (
                            <img 
                              src={BADGE_IMAGES[badgeLevel]} 
                              alt={`${badgeLevel} badge`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <span className={cn('text-[10px] font-medium leading-none', isSelected && 'text-foreground')}>
                                {format(day, 'EEE')}
                              </span>
                              <span className={cn('text-sm font-bold leading-none', isSelected && 'text-foreground')}>
                                {format(day, 'd')}
                              </span>
                            </>
                          )}
                        </div>
                      </button>;
                })}
                </div>
              </div>
            </div>

            {/* Calendar expand/collapse handle + Today button */}
            <div className="flex items-center justify-center pt-1 pb-1">
              {/* Center: Drag handle - larger tap area */}
              <button onClick={handleToggleCalendar} className="flex-1 flex justify-center py-2 -my-2">
                <div className="w-12 h-1.5 rounded-full bg-foreground/25" />
              </button>
              
              {/* Right: Today button - more prominent */}
              {!isToday(selectedDate) && <button onClick={() => {
              setSelectedDate(new Date());
              setCurrentMonth(startOfMonth(new Date()));
              haptic.light();
            }} className={cn("absolute flex items-center gap-0.5 px-3 py-0.5 text-sm font-semibold text-violet-700 bg-violet-200 dark:bg-violet-700 dark:text-violet-100 rounded-full shadow-sm active:scale-95 transition-transform", isFutureDate ? "right-2" : "left-2")}>
                  {isFutureDate && <ChevronLeft className="h-3.5 w-3.5" />}
                  Today
                  {!isFutureDate && <ChevronRight className="h-3.5 w-3.5" />}
                </button>}
            </div>
          </div>
        </header>

        {/* Fixed spacer for header */}
        <div className="shrink-0" style={{
        height: showCalendar ? 'calc(36px + 270px + max(12px, env(safe-area-inset-top)))' : 'calc(36px + 56px + max(12px, env(safe-area-inset-top)))'
      }} />

        {/* Scroll container */}
        <div ref={homeScrollRef} className="flex-1 overflow-y-auto overscroll-contain" data-home-scroll-container="true">
          <div className="px-4 pt-6 pb-4 pb-safe">
            {/* Notification Banner - prompts users to enable notifications */}
            <NotificationBanner onEnableClick={() => setShowNotificationFlow(true)} />

            {/* Self-Care Quiz Banner — highest priority, shown before everything */}
            <SelfCareQuizBanner className="mb-2" onVisibilityChange={setHasSelfCareQuizBanner} />

            {/* Promo & Home Banners — shown after self-care quiz is dismissed/completed */}
            {!hasSelfCareQuizBanner && (
              <>
                <PromoBanner location="home_top" className="py-2" onVisibilityChange={setHasPromoBanner} />
                <div className="tour-banner">
                  <HomeBanner location="home_top" onVisibilityChange={setHasHomeBanner} className="py-2" />
                </div>
              </>
            )}

            {/* Mood Check-in Banner — only after all promo/home banners are dismissed */}
            {!hasSelfCareQuizBanner && !hasPromoBanner && !hasHomeBanner && <MoodCheckInBanner onVisibilityChange={setHasMoodBanner} />}

            {/* Weekly Review Banner — shows when mood banner is dismissed, on weekends */}
            {!hasSelfCareQuizBanner && !hasPromoBanner && !hasHomeBanner && !hasMoodBanner && <WeeklyReviewBanner onVisibilityChange={setHasWeeklyBanner} />}

            {/* My Shortcuts — only when no banners are visible */}
            {!hasSelfCareQuizBanner && !hasPromoBanner && !hasHomeBanner && !hasMoodBanner && !hasWeeklyBanner && (
              <div className="mb-3">
                <ToolShortcuts hideWhenEmpty hideLabels />
              </div>
            )}

            {/* Tag filter chips - temporarily hidden */}
            {/* {taskTags.length > 0 && <div className="py-2 -mx-4 px-4 bg-background overflow-x-auto">
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTag(null)} className={cn('px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all font-medium', selectedTag === null ? 'bg-chip-lavender text-foreground' : 'bg-transparent border border-foreground/20 text-foreground/60')}>
                    All
                  </button>
                  {taskTags.map(tag => <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={cn('px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all capitalize font-medium', selectedTag === tag ? 'bg-chip-lavender text-foreground' : 'bg-transparent border border-foreground/20 text-foreground/60')}>
                      {categoryNameMap.get(tag) || tag}
                    </button>)}
                </div>
              </div>} */}

          {isLoading ? <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div> : <>
              {/* Program Events Section - only show when "All" tag is selected */}
              {programEvents.length > 0 && <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Program Events
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {programEvents.map(event => <ProgramEventCard key={`${event.type}-${event.id}`} event={event} date={selectedDate} />)}
                  </div>
                </div>}

              {/* Period Status Card - shows cycle info when onboarding is complete */}
              {homeData?.periodSettings?.onboarding_done && homeData?.periodSettings?.show_on_home && (
                <div className="mb-4">
                  <PeriodStatusCard />
                </div>
              )}

              {/* Fasting Status Card */}
              {(
                <div className="mb-4">
                  <FastingStatusCard />
                </div>
              )}


              {/* Personal Actions Section - hide empty state when welcome card is shown */}
              {!isNewUser && filteredTasks.length === 0 && taskFilter === 'all' && programEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-muted-foreground mb-2">
                    Your day is open
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-4">
                    One small task is enough
                  </p>
                  <button onClick={() => setShowQuickStart(true)} className="text-violet-600 font-medium">
                    Add your first task
                  </button>
                </div>
              ) : filteredTasks.length > 0 || (!isNewUser && taskFilter !== 'all') ? (
                <div>
                  {/* Shared animated 2-pill switcher */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative inline-flex bg-muted rounded-full p-0.5">
                      <motion.div
                        className="absolute top-0.5 bottom-0.5 rounded-full bg-background shadow-sm"
                        animate={{ 
                          width: homeView === 'routines' ? btnRoutinesRef.current?.offsetWidth 
                            : btnTasksRef.current?.offsetWidth,
                          x: homeView === 'routines' ? 0 
                            : (btnRoutinesRef.current?.offsetWidth ?? 0)
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                      <button
                        ref={btnRoutinesRef}
                        onClick={() => { haptic.selection(); setHomeView('routines'); setTaskFilter('all'); }}
                        className={cn(
                          "relative z-10 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                          homeView === 'routines' ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        My Routines
                      </button>
                      <button
                        ref={btnTasksRef}
                        onClick={() => { haptic.selection(); setHomeView('tasks'); setTaskFilter('all'); }}
                        className={cn(
                          "relative z-10 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap",
                          homeView === 'tasks' ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Zap className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" /> My Tasks
                      </button>
                    </div>
                    <button
                      onClick={handleFabClick}
                      className="coach-add-btn w-8 h-8 rounded-full bg-urgency text-urgency-foreground shadow-sm flex items-center justify-center active:scale-90 transition-transform mr-2"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {homeView === 'routines' ? (
                    <>
                      {routineProTasks.length > 0 ? (
                        <>
                          <SortableTaskList tasks={routineProTasks} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} hideQuickAdd />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => navigate('/app/routineplayer')}
                              className="flex-1 rounded-3xl py-2.5 px-3 bg-card border-2 border-urgency/30 text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Settings2 className="w-3.5 h-3.5 text-urgency" />
                              Manage Routines
                            </button>
                            <button
                              onClick={() => navigate('/app/routines')}
                              className="flex-1 rounded-3xl py-2.5 px-3 bg-card border-2 border-urgency/30 text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Search className="w-3.5 h-3.5 text-urgency" />
                              Browse Library
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <FluentEmoji emoji="🎬" size={40} />
                          <p className="text-sm text-muted-foreground text-center">No routine launchers yet</p>
                          <button
                            onClick={() => navigate('/app/routineplayer')}
                            className="text-sm font-medium text-primary"
                          >
                            Set up your first routine →
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                  <>

                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      {homeView === 'one-time' && (
                        <img src={checklistEmpty} alt="Checklist" loading="lazy" width={120} height={120} className="opacity-90" />
                      )}
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-foreground">
                          {homeView === 'one-time' ? "Your daily checklist" : 'Nothing here yet — add your first task!'}
                        </p>
                        {homeView === 'one-time' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Add things you need to get done today
                          </p>
                        )}
                      </div>
                      {homeView === 'one-time' ? (
                        <>
                          <SortableTaskList tasks={[]} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={() => {}} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} defaultRepeatOverride="No" />
                          <button
                            onClick={() => { setHomeView('tasks'); setTaskFilter('all'); }}
                            className="text-xs font-medium text-primary mt-1"
                          >
                            Show all tasks
                          </button>
                        </>
                      ) : (
                        <SortableTaskList tasks={[]} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={() => {}} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} />
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Coach mark spotlight for first-ever action — delayed via state */}
                      {(() => {
                        const hintTask = filteredTasks.find(t => !t.pro_link_type);
                        return showFirstCoachMark && hintTask ? (
                          <>
                            {/* Dark overlay behind everything */}
                            <div className="fixed inset-0 bg-black/60 z-[100] animate-fade-in" onClick={() => setShowFirstCoachMark(false)} />
                            
                            {/* Spotlighted task card + hint — disable body tap so only checkbox works */}
                            <div className="relative z-[101]">
                              <div className="relative">
                                <SortableTaskList tasks={[hintTask!]} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={() => {}} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} hideQuickAdd />
                              
                                {/* Glowing ring around the checkbox */}
                                <div
                                  className="absolute pointer-events-none"
                                  style={{
                                    top: '50%',
                                    right: '10px',
                                    width: '48px',
                                    height: '48px',
                                    transform: 'translateY(-50%)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35)',
                                    animation: 'checkboxGlow 1.6s ease-in-out infinite',
                                  }}
                                />

                                {/* Bouncing hand hint pointing at the checkbox — positioned relative to the card */}
                                <div
                                  className="absolute pointer-events-none"
                                  style={{
                                    top: '50%',
                                    right: '52px',
                                    transform: 'translateY(-100%) rotate(-45deg)',
                                    filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
                                    animation: 'coachHandBounce 1.4s ease-in-out infinite',
                                  }}
                                >
                                  <FluentEmoji emoji="👇" size={64} />
                                </div>
                              </div>
                              <style>{`
                                @keyframes coachHandBounce {
                                  0%   { transform: translateY(-100%) rotate(-45deg) translateY(0px); }
                                  40%  { transform: translateY(-100%) rotate(-45deg) translateY(10px); }
                                  55%  { transform: translateY(-100%) rotate(-45deg) translateY(5px); }
                                  70%  { transform: translateY(-100%) rotate(-45deg) translateY(10px); }
                                  100% { transform: translateY(-100%) rotate(-45deg) translateY(0px); }
                                }
                                @keyframes checkboxGlow {
                                  0%, 100% { box-shadow: 0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35); }
                                  50%      { box-shadow: 0 0 22px 10px rgba(255,255,255,0.9), 0 0 40px 18px rgba(255,255,255,0.45); }
                                }
                              `}</style>
                              
                              <p className="text-center text-sm text-white/90 mt-5 mb-2 animate-fade-in font-medium">
                                Mark off your first task to start your journey! 💪
                              </p>
                            </div>
                          </>
                        ) : showTapCoachMark ? (
                          <>
                            {/* Dark overlay for "tap to manage" coach mark */}
                            <div className="fixed inset-0 bg-black/60 z-[100] animate-fade-in" onClick={() => setShowTapCoachMark(false)} />
                            
                            {/* Spotlight the first UNCOMPLETED action, fallback to first task */}
                            {filteredTasks.length > 0 && (() => {
                              const spotlightTask = filteredTasks.find(t => !completedTaskIds.has(t.id)) || filteredTasks[0];
                              return (
                              <div className="relative z-[101]">
                                <div className="relative">
                                  <SortableTaskList tasks={[spotlightTask]} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={(task) => { setShowTapCoachMark(false); tapCoachMarkTriggeredRef.current = true; handleTaskTap(task); }} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} hideQuickAdd />
                                  
                                  {/* Glowing highlight around the action name area */}
                                  <div
                                    className="absolute pointer-events-none"
                                    style={{
                                      top: '50%',
                                      left: '50px',
                                      width: '160px',
                                      height: '36px',
                                      transform: 'translateY(-50%)',
                                      borderRadius: '12px',
                                      boxShadow: '0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35)',
                                      animation: 'checkboxGlow 1.6s ease-in-out infinite',
                                    }}
                                  />

                                  {/* Bouncing hand hint pointing at the action name — same style as first spotlight */}
                                  <div
                                    className="absolute pointer-events-none"
                                    style={{
                                      top: '50%',
                                      left: '70px',
                                      transform: 'translateY(-100%) rotate(-45deg)',
                                      filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
                                      animation: 'tapCoachBounce 1.4s ease-in-out infinite',
                                    }}
                                  >
                                    <FluentEmoji emoji="👇" size={64} />
                                  </div>
                                </div>
                                <style>{`
                                  @keyframes tapCoachBounce {
                                    0%   { transform: translateY(-100%) rotate(-45deg) translateY(0px); }
                                    40%  { transform: translateY(-100%) rotate(-45deg) translateY(10px); }
                                    55%  { transform: translateY(-100%) rotate(-45deg) translateY(5px); }
                                    70%  { transform: translateY(-100%) rotate(-45deg) translateY(10px); }
                                    100% { transform: translateY(-100%) rotate(-45deg) translateY(0px); }
                                  }
                                  @keyframes checkboxGlow {
                                    0%, 100% { box-shadow: 0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35); }
                                    50%      { box-shadow: 0 0 22px 10px rgba(255,255,255,0.9), 0 0 40px 18px rgba(255,255,255,0.45); }
                                  }
                                `}</style>
                                <p className="text-center text-sm text-white/90 mt-3 mb-2 animate-fade-in font-medium">
                                  Tap on an action to edit, skip, or delete it
                                </p>
                              </div>
                              );
                            })()}
                            {/* Remaining tasks behind the overlay */}
                            {filteredTasks.length > 1 && (
                              <div className="relative z-[1]">
                                <SortableTaskList tasks={filteredTasks.slice(1)} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} hideQuickAdd />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <SortableTaskList tasks={filteredTasks} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} onOpenTaskSheet={handleOpenTaskSheet} hideQuickAdd={taskFilter === 'all-routines' || taskFilter.startsWith('routine:')} defaultRepeatOverride={homeView === 'one-time' ? 'No' : undefined} />
                            {(taskFilter === 'all-routines' || taskFilter.startsWith('routine:')) && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => navigate('/app/routineplayer')}
                                  className="flex-1 rounded-3xl py-2.5 px-3 bg-card border-2 border-urgency/30 text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Settings2 className="w-3.5 h-3.5 text-urgency" />
                                  Manage Routines
                                </button>
                                <button
                                  onClick={() => navigate('/app/routines')}
                                  className="flex-1 rounded-3xl py-2.5 px-3 bg-card border-2 border-urgency/30 text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Search className="w-3.5 h-3.5 text-urgency" />
                                  Browse Library
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                  </>
                  )}
                  {/* Onboarding banner moved below routine section */}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 animate-fade-in">
                  <img 
                    src={emptyPlannerImg} 
                    alt="Peaceful day" 
                    className="w-32 h-32 mb-5 opacity-90"
                  />
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Your day is clear ✨
                  </p>
                  <p className="text-sm text-muted-foreground text-center max-w-[240px]">
                    One small action is enough. Tap + to add something meaningful.
                  </p>
                </div>
              )}

              {/* Popular Routine Suggestions - only show routines user hasn't added */}
              {suggestedRoutines.length > 0 && taskFilter === 'all' && <div className="tour-suggested-routine mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="h-4 w-4 text-violet-500" />
                      <h2 className="text-sm font-semibold text-foreground/70 tracking-wide">
                        Try a routine
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate('/app/routines')}
                      className="text-xs text-primary font-medium flex items-center gap-0.5"
                    >
                      All <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory scroll-pl-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {suggestedRoutines.map((routine) => (
                      <div key={routine.id} className="shrink-0 w-[85%] snap-start">
                        <FeaturedRoutineCard
                          routine={routine}
                          categoryName={categoryNameMap.get(routine.category)}
                          onDismiss={() => {
                            const updated = new Set(dismissedRoutineIds);
                            updated.add(routine.id);
                            setDismissedRoutineIds(updated);
                            localStorage.setItem('simora_dismissed_routine_ids', JSON.stringify([...updated]));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>}

              {/* Tour Banner & Promo - always visible regardless of routine cards */}
              {taskFilter === 'all' && <>
                <SelfCareQuizBanner className="mt-4" />
                <OnboardingBanner />
                <div id="tour-banner-slot" className="mt-4" />
                <PromoBanner location="home_rituals" className="mt-4" />
                <HomeBanner location="home_rituals" className="mt-4" />
              </>}

            </>}
          </div>

          {/* Extra padding for bottom nav */}
          <div style={{ height: isKeyboardOpen ? '24px' : '120px' }} />
        </div>

        {/* + Button Coach Mark Spotlight */}
        {showAddCoachMark && (() => {
          const el = document.querySelector('.coach-add-btn');
          const rect = el?.getBoundingClientRect();
          if (!rect) return null;
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const r = Math.max(rect.width, rect.height) / 2 + 8;
          return (
            <>
              <svg className="fixed inset-0 w-full h-full z-[100] animate-fade-in" onClick={() => setShowAddCoachMark(false)}>
                <defs>
                  <mask id="add-coach-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <circle cx={cx} cy={cy} r={r} fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#add-coach-mask)" />
              </svg>
              {/* Make the real button clickable above overlay */}
              <div
                className="fixed z-[101]"
                style={{
                  left: rect.left - 4,
                  top: rect.top - 4,
                  width: rect.width + 8,
                  height: rect.height + 8,
                  borderRadius: '50%',
                  animation: 'addBtnGlow 1.6s ease-in-out infinite',
                }}
                onClick={() => { setShowAddCoachMark(false); handleFabClick(); }}
              />
              {/* Bouncing hand */}
              <div
                className="fixed z-[102] pointer-events-none"
                style={{
                  left: cx - 42,
                  top: cy - 70,
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
                  animation: 'addCoachBounce 1.4s ease-in-out infinite',
                }}
              >
                <FluentEmoji emoji="👇" size={56} />
              </div>
              {/* Label */}
              <p
                className="fixed z-[102] text-sm text-white/90 font-medium whitespace-nowrap pointer-events-none"
                style={{ left: cx - 80, top: rect.bottom + 18 }}
              >
                Tap + to add a new task
              </p>
              <style>{`
                @keyframes addCoachBounce {
                  0%   { transform: translateY(0px); }
                  40%  { transform: translateY(10px); }
                  55%  { transform: translateY(5px); }
                  70%  { transform: translateY(10px); }
                  100% { transform: translateY(0px); }
                }
                @keyframes addBtnGlow {
                  0%, 100% { box-shadow: 0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35); }
                  50%      { box-shadow: 0 0 22px 10px rgba(255,255,255,0.9), 0 0 40px 18px rgba(255,255,255,0.45); }
                }
              `}</style>
            </>
          );
        })()}

        {/* FAB */}
        {!isKeyboardOpen && (
          <button onClick={handleFabClick} className="tour-add-task fixed right-4 w-14 h-14 rounded-full bg-urgency text-urgency-foreground shadow-cta flex items-center justify-center hover:bg-urgency-dark active:scale-95 transition-all z-50" style={{
          bottom: activeMiniPlayerCount >= 2
            ? 'calc(196px + env(safe-area-inset-bottom))'
            : activeMiniPlayerCount === 1
              ? 'calc(136px + env(safe-area-inset-bottom))'
              : 'calc(72px + env(safe-area-inset-bottom))'
        }}>
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* All celebrations, modals, and sheets */}
        <HomeCelebrations
          showPaywall={showPaywall}
          setShowPaywall={setShowPaywall}
          showActionLimit={showActionLimit}
          setShowActionLimit={setShowActionLimit}
          showQuickStart={showQuickStart}
          setShowQuickStart={setShowQuickStart}
          onQuickStartContinue={handleQuickStartContinue}
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
          selectedDate={selectedDate}
          completedTaskIds={completedTaskIds}
          completedSubtaskIds={completedSubtaskIds}
          goalProgressMap={goalProgressMap}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onSkipTask={handleSkipTask}
          onOpenGoalInput={handleOpenGoalInput}
          onOpenTimer={handleOpenTimer}
          onStepUnlocked={handleStepUnlocked}
          showStreakModal={showStreakModal}
          setShowStreakModal={setShowStreakModal}
          isFirstActionCelebration={isFirstActionCelebration}
          setIsFirstActionCelebration={setIsFirstActionCelebration}
          setShowTapCoachMark={setShowTapCoachMark}
          streak={streak}
          shouldShowGoalSelection={
            !!streak &&
            streak.current_streak === 1 &&
            !streak.streak_goal &&
            streak.last_completion_date === format(new Date(), 'yyyy-MM-dd')
          }
          showGoalSelection={showGoalSelection}
          setShowGoalSelection={setShowGoalSelection}
          isStreakUpgrade={isStreakUpgrade}
          setIsStreakUpgrade={setIsStreakUpgrade}
          showGoalConfirmation={showGoalConfirmation}
          setShowGoalConfirmation={setShowGoalConfirmation}
          confirmedGoal={confirmedGoal}
          setConfirmedGoal={setConfirmedGoal}
          setStreakGoal={setStreakGoal}
          badgeCelebrationType={badgeCelebrationType}
          closeBadgeCelebration={closeBadgeCelebration}
          badgeCompletedCount={badgeCompletedCount}
          badgeTotalCount={badgeTotalCount}
          maybeRequestReview={maybeRequestReview}
          showGoldStreakCelebration={showGoldStreakCelebration}
          setShowGoldStreakCelebration={setShowGoldStreakCelebration}
          goldStreakData={goldStreakData}
          goldDatesThisWeek={goldDatesThisWeek}
          updateGoldStreak={updateGoldStreak}
          showStreakGoalCompletion={showStreakGoalCompletion}
          setShowStreakGoalCompletion={setShowStreakGoalCompletion}
          skipTask={skipTask}
          setSkipTask={setSkipTask}
          goalInputTask={goalInputTask}
          setGoalInputTask={setGoalInputTask}
          onGoalInputConfirm={handleGoalInputConfirm}
          timerTask={timerTask}
          setTimerTask={setTimerTask}
          onTimerSaveProgress={handleTimerSaveProgress}
          onTimerMarkComplete={handleTimerMarkComplete}
          showRecoveryPrompt={showRecoveryPrompt}
          setShowRecoveryPrompt={setShowRecoveryPrompt}
          recoverStreak={recoverStreak}
          showGoldRecoveryPrompt={showGoldRecoveryPrompt}
          setShowGoldRecoveryPrompt={setShowGoldRecoveryPrompt}
          showRecoverySuccess={showRecoverySuccess}
          setShowRecoverySuccess={setShowRecoverySuccess}
          previousGoldStreak={goldStreakData?.longestGoldStreak || goldStreakData?.currentGoldStreak || 0}
          userId={user?.id}
          showNotificationFlow={showNotificationFlow}
          setShowNotificationFlow={setShowNotificationFlow}
          challengeDayCelebration={challengeDayCelebration}
          closeChallengeDayCelebration={closeChallengeDayCelebration}
          showChallengeDayCelebration={showChallengeDayCelebration}
          stepCelebration={stepCelebration}
          onCloseStepCelebration={handleCloseStepCelebration}
          projectCompletion={projectCompletion}
          onCloseProjectCompletion={handleCloseProjectCompletion}
        />

        {/* New Interactive Home Tour */}
        <HomeTour 
          isFirstOpen={isFirstOpen}
          forceShow={serverIndicatesNewUser}
          hasEnrolledPrograms={false}
          hasSuggestedRoutines={suggestedRoutines.length > 0}
          onTourReady={handleHomeTourReady}
        />

        {/* Task Create/Edit Sheet */}
        <AppTaskCreate
          isSheet
          sheetOpen={taskSheetOpen}
          onSheetOpenChange={(open) => {
            setTaskSheetOpen(open);
            if (!open) {
              setTaskSheetEditId(undefined);
              setTaskSheetCreateParams(undefined);
            }
          }}
          editTaskId={taskSheetEditId}
          createParams={taskSheetCreateParams}
        />
      </div>
    </>
  );
};

export default AppHome;