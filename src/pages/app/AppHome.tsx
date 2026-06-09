// AppHome - Main home page component
import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, startOfDay, subDays } from 'date-fns';
import { Plus, Flame, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Star, Sparkles, Headset, ArrowLeft, Heart, Zap, Settings2, Search, Play, Wand2, Compass } from 'lucide-react';

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
import { useAuth } from '@/hooks/useAuth';

import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/SEOHead';
import { useFeaturedRoutinesBank, useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { FeaturedRoutineCard } from '@/components/app/FeaturedRoutineCard';
import { haptic } from '@/lib/haptics';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { isWaterTask } from '@/lib/waterTracking';
import { getAvailableShields } from '@/lib/recoveryShields';
import { PeriodStatusCard } from '@/components/app/PeriodStatusCard';
import { FastingStatusCard } from '@/components/app/FastingStatusCard';

import { toast } from 'sonner';
import { useWeeklyTaskCompletion, useDateRangeTaskCompletion, BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { useBadgeCelebration } from '@/hooks/useBadgeCelebration';
import { useChallengeDayCelebration } from '@/hooks/useChallengeDayCelebration';
import { useRoutineEndedCelebration } from '@/hooks/useRoutineEndedCelebration';
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
import { WelcomeSpotlightBanner } from '@/components/app/home/WelcomeSpotlightBanner';
import { TaskCoachOverlay } from '@/components/app/home/TaskCoachOverlay';
import { AddButtonCoachOverlay } from '@/components/app/home/AddButtonCoachOverlay';
import { SpotlightCutout } from '@/components/app/home/SpotlightCutout';
import { PlannerIntroSheet } from '@/components/app/home/PlannerIntroSheet';


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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { scrollRef: homeScrollRef } = useScrollRestore('home_scroll', { autoSave: true });
  const {
    user
  } = useAuth();
  // First-time Planner visitors get the "What is Rilo?" teach flow.
  // Rilo Doors (post-auth) is the primary onboarding; this teaches the Planner
  // surface specifically and only fires once per device. We show a 75%-height
  // bottom sheet first (planner visible behind) instead of jumping straight
  // into a full-screen onboarding, so users understand the context.
  const [showPlannerIntroSheet, setShowPlannerIntroSheet] = useState(false);
  useEffect(() => {
    const seen = localStorage.getItem('simora_onboarding_completed_what-is-rilo') === 'true';
    const dismissed = localStorage.getItem('simora_onboarding_planner_intro_dismissed') === 'true';
    if (!seen && !dismissed) {
      setShowPlannerIntroSheet(true);
    }
  }, []);
  const handlePlannerIntroStart = useCallback(() => {
    localStorage.setItem('simora_onboarding_planner_intro_dismissed', 'true');
    setShowPlannerIntroSheet(false);
    navigate('/app/onboarding/what-is-rilo');
  }, [navigate]);
  const handlePlannerIntroSkip = useCallback(() => {
    localStorage.setItem('simora_onboarding_planner_intro_dismissed', 'true');
    setShowPlannerIntroSheet(false);
  }, []);
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
  // Open the onboarding paywall when arriving with ?paywall=1 (e.g. from
  // the Self-Care Quiz "Plus intro" step). Strip the param afterwards.
  useEffect(() => {
    if (searchParams.get('paywall') === '1') {
      setShowPaywall(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('paywall');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [showActionLimit, setShowActionLimit] = useState(false);
  const [hasSelfCareQuizBanner, setHasSelfCareQuizBanner] = useState(false);
  const [hasPromoBanner, setHasPromoBanner] = useState(false);
  const [hasHomeBanner, setHasHomeBanner] = useState(false);
  const [hasMoodBanner, setHasMoodBanner] = useState(false);
  const [hasWeeklyBanner, setHasWeeklyBanner] = useState(false);
  const [hasNotificationBanner, setHasNotificationBanner] = useState(false);
  const [hasWelcomeBannerVisible, setHasWelcomeBannerVisible] = useState(false);

  // Welcome spotlight tour: 'tap' → 'add' → 'complete' → null (done)
  const [spotlightStep, setSpotlightStep] = useState<
    null | 'tap' | 'add' | 'complete'
  >(null);
  // When user taps a task during the 'tap' step, defer advancement until
  // the TaskDetailModal closes so step 2 doesn't appear behind the modal.
  const [spotlightAdvancePending, setSpotlightAdvancePending] = useState(false);
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
  
  // First action celebration - tracks if this is user's first ever completion (uses unified StreakCelebration)
  const [isFirstActionCelebration, setIsFirstActionCelebration] = useState(false);
  
  // Streak goal selection state
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [isStreakUpgrade, setIsStreakUpgrade] = useState(false);
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false);
  const [confirmedGoal, setConfirmedGoal] = useState(7);
  const setStreakGoal = useSetStreakGoal();
  const recoverStreak = useRecoverStreak();
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [showRecoverySuccess, setShowRecoverySuccess] = useState<'streak' | null>(null);


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
  const [showRoutinesTab] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem('simora_show_routines_tab') === 'true'
  );
  const spotlightCompleteBaselineRef = useRef<number | null>(null);

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
    // Only show if user has actually EARNED a shield they haven't used yet.
    // New users with longest_streak 0 get no shield → silent reset.
    if (getAvailableShields(streak.longest_streak || 0, recoveryCount) <= 0) return;

    // Don't pester brand-new users. Require at least a 2-day streak history
    // and an actual prior completion before offering recovery.
    if ((streak.longest_streak || 0) < 2) return;
    if (!streak.last_completion_date) return;

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
    return new Set(completions?.tasks?.map(c => c.task_id) ?? []);
  }, [completions]);

  useEffect(() => {
    if (spotlightStep !== 'complete') {
      spotlightCompleteBaselineRef.current = null;
      return;
    }

    if (spotlightCompleteBaselineRef.current === null) {
      spotlightCompleteBaselineRef.current = completedTaskIds.size;
      return;
    }

    if (completedTaskIds.size > spotlightCompleteBaselineRef.current) {
      spotlightCompleteBaselineRef.current = null;
      setSpotlightStep(null);
    }
  }, [spotlightStep, completedTaskIds]);

  // Advance spotlight from 'tap' → 'add' once the TaskDetailModal closes.
  useEffect(() => {
    if (!spotlightAdvancePending) return;
    if (spotlightStep !== 'tap') return;
    if (selectedTask) return; // wait for modal close
    setSpotlightAdvancePending(false);
    setSpotlightStep('add');
  }, [spotlightAdvancePending, spotlightStep, selectedTask]);

  // Advance spotlight from 'add' → 'complete' once the quick-add sheet closes.
  useEffect(() => {
    const onQuickAddOpened = () => {
      // Hide spotlight overlays while the quick-add sheet is open.
      setSpotlightAdvancePending((prev) => prev || true);
    };
    const onQuickAddClose = () => {
      setSpotlightStep((prev) => {
        if (prev !== 'add') return prev;
        setSpotlightAdvancePending(false);
        return 'complete';
      });
      // Always clear pending on close (covers tap step / safety).
      setSpotlightAdvancePending(false);
    };
    window.addEventListener('quick-add-opened', onQuickAddOpened);
    window.addEventListener('quick-add-close', onQuickAddClose);
    return () => {
      window.removeEventListener('quick-add-opened', onQuickAddOpened);
      window.removeEventListener('quick-add-close', onQuickAddClose);
    };
  }, []);

  // Welcome spotlight: which task to highlight per step
  const spotlightHighlightTaskId = useMemo<string | null>(() => {
    if (!spotlightStep) return null;
    if (spotlightStep === 'tap') {
      return filteredTasks[0]?.id ?? null;
    }
    if (spotlightStep === 'complete') {
      // Skip pro-linked tasks: their circle navigates to a tool instead of completing.
      const firstIncomplete = filteredTasks.find(
        t => !completedTaskIds.has(t.id) && !t.pro_link_type
      );
      return firstIncomplete?.id ?? null;
    }
    return null;
  }, [spotlightStep, filteredTasks, completedTaskIds]);

  // Completed subtask IDs for this date
  const completedSubtaskIds = useMemo(() => {
    return completions?.subtasks?.map(c => c.subtask_id) ?? [];
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

  // Routine ended celebration (asks user to re-add the routine)
  const {
    endedData: routineEndedData,
    showCelebration: showRoutineEnded,
    closeCelebration: closeRoutineEnded,
    addAgain: addRoutineAgain,
    isAddingAgain: isAddingRoutineAgain,
  } = useRoutineEndedCelebration(todayDateStr);

  const handleStreakIncrease = useCallback(() => {
    // Spotlight: finish the tour as soon as user completes a task
    setSpotlightStep((prev) => (prev === 'complete' ? null : prev));
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
      // High-satisfaction moment → ask for a 5-star review (cooldown-protected)
      import('@/lib/appReview').then(({ triggerSoftReview }) =>
        setTimeout(() => triggerSoftReview('project_completed'), 2500)
      );
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
    // Spotlight: defer 'tap' → 'add' advancement until the detail modal
    // closes, so step 2 isn't hidden behind the open sheet.
    setSpotlightAdvancePending((pending) => pending || true);
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
    nextSessionMap = {}
  } = homeData || {};
  return (
    <>
      <SEOHead title="Home - LadyBoss" description="Your personal dashboard and planner" />
      
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Fixed header with integrated week strip - Me+ style */}
        <header className="tour-header fixed top-0 left-0 right-0 z-50 bg-white/35 dark:bg-black/20 backdrop-blur-xl rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]" style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))'
      }}>
          {/* Title bar - three column layout for balanced centering */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 h-10">
            {/* Left: Menu + Support */}
            <div className="justify-self-start flex items-center gap-1 tour-menu-button">
              <HomeMenu />
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
                  {isToday(selectedDate) ? t('home.today') : format(selectedDate, 'MMM d')}
                  <Star className="h-2.5 w-2.5 text-[#EF4444] fill-[#EF4444]" />
                </h1>
              )}
            </div>

            {/* Right: Streak badge */}
            <div className="flex items-center gap-2 justify-end justify-self-end">
              {/* Mood check-in button – hidden for now, re-enable from admin/app */}
              
              {/* Streak badge - navigates to presence page */}
              <button
                onClick={() => navigate('/app/presence')}
                className={cn(
                  "tour-streak flex items-center gap-1 px-2.5 py-1 rounded-full shadow-ios active:scale-95 transition-all",
                  hasAnyCompletionToday
                    ? "bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-[hsl(var(--brand-primary))] text-white"
                    : "bg-[hsl(var(--tint-peach))] text-[hsl(var(--fg-warm-muted))]"
                )}
              >
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span className="text-[13px] font-bold">{streak?.current_streak || 0}</span>
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
                        <div className="flex flex-col items-center gap-1">
                          {/* Day-of-week letter on top */}
                          <span className={cn(
                            'text-[11px] font-semibold leading-none uppercase tracking-wide',
                            isSelected || isTodayDate ? 'text-fg-warm' : 'text-fg-warm-muted'
                          )}>
                            {format(day, 'EEE')}
                          </span>
                          {/* Circle wraps just the number */}
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center transition-all relative',
                            isSelected
                              ? 'bg-[hsl(var(--brand-primary))] text-white'
                              : isTodayDate
                                ? 'border border-foreground/20'
                                : 'border border-foreground/10'
                          )}>
                            {hasProgramEvents && (
                              <Star className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5 z-20", isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500")} />
                            )}
                            {hasBadge && !isTodayDate && (
                              <img
                                src={BADGE_IMAGES[badgeLevel]}
                                alt={`${badgeLevel} badge`}
                                className={cn(
                                  "absolute inset-0 w-full h-full object-contain pointer-events-none rounded-full",
                                  isSelected ? "opacity-100" : "opacity-60"
                                )}
                              />
                            )}
                            <span className={cn(
                              'relative z-10 text-sm font-bold leading-none translate-y-[0.5px]',
                              isSelected ? 'text-white' : 'text-fg-warm',
                              hasBadge && !isTodayDate && 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]'
                            )}>
                              {format(day, 'd')}
                            </span>
                            {hasBadge && isTodayDate && (
                              <img
                                src={BADGE_IMAGES[badgeLevel]}
                                alt={`${badgeLevel} badge`}
                                className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none drop-shadow-sm rounded-full"
                              />
                            )}
                          </div>
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
            }} className={cn("absolute flex items-center gap-0.5 px-3 py-0.5 text-sm font-semibold text-white bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-[hsl(var(--brand-primary))] rounded-full shadow-ios active:scale-95 transition-transform", isFutureDate ? "right-2" : "left-2")}>
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
            {/*
              Unified banner stack — ONLY ONE banner shows at a time.
              Priority (top → bottom):
              1. NotificationBanner   (enable push permission)
              2. WelcomeSpotlight     (new-user tour invite)
              3. SelfCareQuiz         (60-second self-care assessment)
              4. PromoBanner          (admin-scheduled promos)
              5. HomeBanner           (admin-curated content / box banners)
              6. MoodCheckIn          (daily mood prompt)
              7. WeeklyReview         (weekend review prompt)
              Each banner reports its own visibility; lower-priority banners
              are gated on every higher-priority banner being hidden.
            */}
            <NotificationBanner
              onEnableClick={() => setShowNotificationFlow(true)}
              onVisibilityChange={setHasNotificationBanner}
            />

            {!hasNotificationBanner && (
              <WelcomeSpotlightBanner
                onStart={() => setSpotlightStep('tap')}
                onVisibilityChange={setHasWelcomeBannerVisible}
              />
            )}

            {!hasNotificationBanner && !hasWelcomeBannerVisible && (
              <SelfCareQuizBanner className="mb-2" onVisibilityChange={setHasSelfCareQuizBanner} />
            )}

            {!hasNotificationBanner && !hasWelcomeBannerVisible && !hasSelfCareQuizBanner && (
              <PromoBanner location="home_top" className="py-2" onVisibilityChange={setHasPromoBanner} />
            )}

            {!hasNotificationBanner && !hasWelcomeBannerVisible && !hasSelfCareQuizBanner && !hasPromoBanner && (
              <div className="tour-banner">
                <HomeBanner location="home_top" onVisibilityChange={setHasHomeBanner} className="py-2" />
              </div>
            )}

            {!hasNotificationBanner && !hasWelcomeBannerVisible && !hasSelfCareQuizBanner && !hasPromoBanner && !hasHomeBanner && (
              <MoodCheckInBanner onVisibilityChange={setHasMoodBanner} />
            )}

            {!hasNotificationBanner && !hasWelcomeBannerVisible && !hasSelfCareQuizBanner && !hasPromoBanner && !hasHomeBanner && !hasMoodBanner && (
              <WeeklyReviewBanner onVisibilityChange={setHasWeeklyBanner} />
            )}

            {/* My Shortcuts — temporarily hidden, will be restored later */}
            {false && !hasSelfCareQuizBanner && !hasPromoBanner && !hasHomeBanner && !hasMoodBanner && !hasWeeklyBanner && (
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


              {/* Personal Actions Section */}
              <div>
                  {/* Shared animated 2-pill switcher */}
                  <div className="flex items-center justify-between mb-3">
                     <div className="relative inline-flex bg-black/[0.05] dark:bg-white/[0.08] rounded-full p-0.5">
                       <motion.div
                         className="absolute top-0.5 bottom-0.5 rounded-full bg-card shadow-ios"
                        animate={{ 
                          width: homeView === 'routines' ? btnRoutinesRef.current?.offsetWidth 
                            : homeView === 'tasks' ? btnTasksRef.current?.offsetWidth
                            : btnOneTimeRef.current?.offsetWidth,
                          x: homeView === 'tasks' ? 0
                            : homeView === 'one-time' ? (btnTasksRef.current?.offsetWidth ?? 0)
                            : 0
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                       {/* My Routines pill — temporarily hidden. Admin can re-enable from /admin/system. */}
                       {showRoutinesTab && (
                        <button
                          ref={btnRoutinesRef}
                          onClick={() => { haptic.selection(); setHomeView('routines'); setTaskFilter('all'); }}
                          className={cn(
                            "relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap",
                            homeView === 'routines' ? 'text-foreground' : 'text-fg-warm-muted dark:text-white/40'
                          )}
                        >
                          {t('home.myRoutines')}
                        </button>
                      )}
                       <button
                         ref={btnTasksRef}
                         onClick={() => { haptic.selection(); setHomeView('tasks'); setTaskFilter('all'); }}
                         className={cn(
                          "relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1 whitespace-nowrap",
                           homeView === 'tasks' ? 'text-foreground' : 'text-fg-warm-muted dark:text-white/40'
                         )}
                       >
                        <Zap className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" /> {t('home.myTasks')}
                       </button>
                       <button
                         ref={btnOneTimeRef}
                         onClick={() => { haptic.selection(); setHomeView('one-time'); setTaskFilter('one-time'); }}
                         className={cn(
                           "relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap",
                           homeView === 'one-time' ? 'text-foreground' : 'text-fg-warm-muted dark:text-white/40'
                         )}
                       >
                         {t('filter.todos')}
                       </button>
                     </div>
                      <div className="flex items-center gap-2 mr-2">
                        <button
                          onClick={handleFabClick}
                          aria-label={t('home.addTask')}
                          className={cn(
                            "coach-add-btn w-6 h-6 rounded-full bg-brand text-white shadow-[0_4px_12px_hsl(var(--brand-primary)/0.4)] flex items-center justify-center active:scale-90 transition-transform",
                            spotlightStep === 'add' && 'relative z-[101] [animation:taskCoachGlowGold_1.6s_ease-in-out_infinite]'
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                     </div>
                   </div>

                  {homeView === 'routines' ? (
                    <>
                      {routineProTasks.length > 0 ? (
                        <>
                          <SortableTaskList tasks={routineProTasks} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} hideQuickAdd />
                          <button
                            onClick={() => navigate('/app/routineplayer', { state: { openBuilder: true } })}
                            className="mt-3 w-full rounded-3xl pl-3 pr-4 py-2.5 bg-card-warm shadow-card-warm flex items-center gap-2 active:scale-[0.98] transition-all"
                          >
                            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                              <Wand2 className="h-5 w-5 text-[hsl(var(--brand-primary))]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[15px] font-semibold text-foreground">Build Your Routine</span>
                          </button>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => navigate('/app/routineplayer')}
                              className="flex-1 rounded-3xl py-2.5 px-3 bg-card-warm shadow-card-warm text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Settings2 className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />
                              Manage Routines
                            </button>
                            <button
                              onClick={() => navigate('/app/routines')}
                              className="flex-1 rounded-3xl py-2.5 px-3 bg-card-warm shadow-card-warm text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Search className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />
                              Browse Templates
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <FluentEmoji emoji="🎬" size={40} />
                          <p className="text-sm text-muted-foreground text-center">{t('home.noRoutineLaunchers')}</p>
                          <button
                            onClick={() => navigate('/app/routineplayer')}
                            className="text-sm font-medium text-primary"
                          >
                            {t('home.setUpFirstRoutine')}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                  <>

                  {/* Program Events Section - rendered inside My Tasks view */}
                  {programEvents.length > 0 && (
                    <>
                      <div className="space-y-3">
                        {programEvents.map(event => (
                          <ProgramEventCard key={`${event.type}-${event.id}`} event={event} date={selectedDate} />
                        ))}
                      </div>
                      <div className="my-3 flex items-center gap-3 px-2">
                        <div className="flex-1 h-[1px] bg-border/60" />
                      </div>
                    </>
                  )}

                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      {homeView === 'one-time' && (
                        <img src={checklistEmpty} alt="Checklist" loading="lazy" width={120} height={120} className="opacity-90" />
                      )}
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-foreground">
                          {homeView === 'one-time' ? t('home.dailyChecklist') : t('home.emptyTasks')}
                        </p>
                        {homeView === 'one-time' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('home.addTodayHint')}
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
                       <>
                         <SortableTaskList tasks={filteredTasks} date={selectedDate} completedTaskIds={completedTaskIds} completedSubtaskIds={completedSubtaskIds} goalProgressMap={goalProgressMap} onTaskTap={handleTaskTap} onStreakIncrease={handleStreakIncrease} onStepUnlocked={handleStepUnlocked} onOpenGoalInput={handleOpenGoalInput} onOpenTimer={handleOpenTimer} onOpenTaskSheet={handleOpenTaskSheet} hideQuickAdd={taskFilter === 'all-routines' || taskFilter.startsWith('routine:')} defaultRepeatOverride={homeView === 'one-time' ? 'No' : undefined} coachHighlightTaskId={spotlightHighlightTaskId} coachHighlightVariant={spotlightStep === 'complete' ? 'gold' : 'white'} />
                         <div className="flex gap-2 mt-3">
                           <button
                             onClick={() => navigate('/app/tools')}
                             className="flex-1 rounded-3xl py-2.5 px-3 bg-card-warm shadow-card-warm text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                           >
                             <Compass className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />
                             Explore Tools
                           </button>
                           <button
                             onClick={() => navigate('/app/routines')}
                             className="flex-1 rounded-3xl py-2.5 px-3 bg-card-warm shadow-card-warm text-[12px] font-semibold text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                           >
                             <Search className="w-3.5 h-3.5 text-[hsl(var(--brand-primary))]" />
                             Browse Templates
                           </button>
                         </div>
                       </>
                    </>
                  )}
                  </>
                  )}
                  {/* Onboarding banner moved below routine section */}
                </div>

              {/* Popular Routine Suggestions - only show routines user hasn't added */}
              {suggestedRoutines.length > 0 && taskFilter === 'all' && <div className="tour-suggested-routine mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="h-4 w-4 text-violet-500" />
                      <h2 className="text-sm font-semibold text-foreground/70 tracking-wide">
                        {t('home.tryRoutine')}
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate('/app/routines')}
                      className="text-xs text-primary font-medium flex items-center gap-0.5"
                    >
                      {t('home.all')} <ChevronRight className="h-3.5 w-3.5" />
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

        {/* FAB removed — AI Planner is now in the bottom nav */}

        {/* First-visit planner intro — 75% bottom sheet so users see the
            planner behind it instead of a full-screen takeover. */}
        <PlannerIntroSheet
          isOpen={showPlannerIntroSheet}
          onStart={handlePlannerIntroStart}
          onSkip={handlePlannerIntroSkip}
        />

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
          showRecoverySuccess={showRecoverySuccess}
          setShowRecoverySuccess={setShowRecoverySuccess}
          userId={user?.id}
          showNotificationFlow={showNotificationFlow}
          setShowNotificationFlow={setShowNotificationFlow}
          challengeDayCelebration={challengeDayCelebration}
          closeChallengeDayCelebration={closeChallengeDayCelebration}
          showChallengeDayCelebration={showChallengeDayCelebration}
          routineEndedData={routineEndedData}
          showRoutineEnded={showRoutineEnded}
          closeRoutineEnded={closeRoutineEnded}
          onAddRoutineAgain={addRoutineAgain}
          isAddingRoutineAgain={isAddingRoutineAgain}
          stepCelebration={stepCelebration}
          onCloseStepCelebration={handleCloseStepCelebration}
          projectCompletion={projectCompletion}
          onCloseProjectCompletion={handleCloseProjectCompletion}
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

        {/* Welcome Spotlight overlay — anchored to highlighted task during the tour.
            Hidden while the TaskDetailModal is open (pending advance) so the
            scrim/pill don't sit on top of the sheet. */}
        {spotlightStep && !spotlightAdvancePending && (
          <SpotlightCutout
            targetSelector={
              spotlightStep === 'add'
                ? '.coach-add-btn'
                : spotlightHighlightTaskId
                ? `[data-task-id="${spotlightHighlightTaskId}"]`
                : null
            }
            padding={spotlightStep === 'add' ? 6 : 8}
            radius={spotlightStep === 'add' ? 999 : 18}
          />
        )}
        {spotlightStep === 'tap' && !spotlightAdvancePending && spotlightHighlightTaskId && (
          <TaskCoachOverlay taskId={spotlightHighlightTaskId} variant="tap" />
        )}
        {spotlightStep === 'complete' && !spotlightAdvancePending && spotlightHighlightTaskId && (
          <TaskCoachOverlay taskId={spotlightHighlightTaskId} variant="check" />
        )}
        {spotlightStep === 'add' && !spotlightAdvancePending && (
          <AddButtonCoachOverlay />
        )}
        {/* Instructional pill — vertically centered during tour */}
        {spotlightStep && !spotlightAdvancePending && (
          <div
            className="fixed left-0 right-0 top-1/2 -translate-y-1/2 z-[10062] flex justify-center pointer-events-none px-4"
          >
            <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1a1a2e] text-white text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.3)] max-w-[88vw]">
              <span>
                {spotlightStep === 'tap' && '👆 Tap a task to see details'}
                {spotlightStep === 'add' && '➕ Tap the + to add your own task'}
                {spotlightStep === 'complete' && '✅ Tap the circle to complete it'}
              </span>
              <button
                onClick={() => setSpotlightStep(null)}
                className="ml-1 text-white/60 active:text-white text-[11px] font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AppHome;