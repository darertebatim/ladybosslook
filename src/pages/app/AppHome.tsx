import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { User, NotebookPen, Plus, Flame, CalendarDays, ChevronLeft, ChevronRight, Star, Sparkles, MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useTasksForDate, 
  useCompletionsForDate,
  useCompletedDates,
  useUserStreak,
  UserTask,
  TaskTemplate,
} from '@/hooks/useTaskPlanner';
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
import { usePopularPlans, useUserRoutinePlans } from '@/hooks/useRoutinePlans';
import { RoutinePlanCard } from '@/components/app/RoutinePlanCard';
import { haptic } from '@/lib/haptics';

const SWIPE_THRESHOLD = 50; // Pixels needed to trigger expand/collapse

const AppHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [showNotificationFlow, setShowNotificationFlow] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Refs for swipe gesture tracking
  const touchStartY = useRef(0);
  const isSwipingCalendar = useRef(false);
  
  // App tour hook
  const { run: runTour, stepIndex, setStepIndex, completeTour, skipTour } = useAppTour();

  // Handle quick start continue
  const handleQuickStartContinue = useCallback((taskName: string, template?: TaskTemplate) => {
    if (template) {
      navigate(`/app/home/new?name=${encodeURIComponent(template.title)}&emoji=${encodeURIComponent(template.emoji)}&color=${template.color}`);
    } else {
      navigate(`/app/home/new?name=${encodeURIComponent(taskName)}`);
    }
  }, [navigate]);

  // Data queries - Planner data
  const { data: tasks = [], isLoading: tasksLoading } = useTasksForDate(selectedDate);
  const { data: completions, isLoading: completionsLoading } = useCompletionsForDate(selectedDate);
  const { data: streak } = useUserStreak();
  const { data: programEvents = [], isLoading: programEventsLoading } = useProgramEventsForDate(selectedDate);

  // Home data for stats and rounds
  const { data: homeData, isLoading: homeLoading } = useNewHomeData();
  
  // Popular routines for suggestions (excluding already added ones)
  const { data: popularRoutines = [] } = usePopularPlans();
  const { data: userRoutines = [] } = useUserRoutinePlans();
  
  const userRoutineIds = useMemo(() => 
    new Set(userRoutines.map(r => r.plan_id)), 
    [userRoutines]
  );
  
  const suggestedRoutines = useMemo(() => 
    popularRoutines.filter(plan => !userRoutineIds.has(plan.id)),
    [popularRoutines, userRoutineIds]
  );

  // Generate week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  // Calculate date range for completed dates query
  const dateRange = useMemo(() => {
    if (showCalendar) {
      return {
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
      };
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      return {
        start: weekStart,
        end: addDays(weekStart, 6),
      };
    }
  }, [showCalendar, currentMonth, selectedDate]);

  // Fetch completed dates and program event dates
  const { data: completedDates } = useCompletedDates(dateRange.start, dateRange.end);
  const { data: programEventDates } = useProgramEventDates(dateRange.start, dateRange.end);

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

  const handleStreakIncrease = useCallback(() => {
    setShowStreakModal(true);
  }, []);

  const handleEditTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    navigate(`/app/home/edit/${task.id}`);
  }, [navigate]);

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

  // Swipe gesture handlers for calendar expand/collapse
  const handleCalendarTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isSwipingCalendar.current = true;
  }, []);

  const handleCalendarTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwipingCalendar.current) return;
    
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Limit the swipe offset for visual feedback with resistance
    if (!showCalendar) {
      // Collapsed: only allow downward swipe (positive delta)
      setSwipeOffset(Math.max(0, Math.min(80, deltaY * 0.5)));
    } else {
      // Expanded: only allow upward swipe (negative delta)
      setSwipeOffset(Math.min(0, Math.max(-80, deltaY * 0.5)));
    }
  }, [showCalendar]);

  const handleCalendarTouchEnd = useCallback(() => {
    if (!isSwipingCalendar.current) return;
    
    // Determine if we should toggle based on swipe distance
    if (!showCalendar && swipeOffset > SWIPE_THRESHOLD) {
      // Swipe down while collapsed → expand
      setCurrentMonth(startOfMonth(selectedDate));
      setShowCalendar(true);
      haptic.light();
    } else if (showCalendar && swipeOffset < -SWIPE_THRESHOLD) {
      // Swipe up while expanded → collapse
      setShowCalendar(false);
      haptic.light();
    }
    
    // Reset state
    setSwipeOffset(0);
    isSwipingCalendar.current = false;
  }, [showCalendar, swipeOffset, selectedDate]);

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
    nextSessionMap = new Map(),
  } = homeData || {};

  return (
    <>
      <SEOHead 
        title="Home - LadyBoss" 
        description="Your personal dashboard and planner"
      />
      
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Fixed header with integrated week strip - Me+ style */}
        <header 
          className="tour-header fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 h-12">
            {/* Left: Journal + Profile buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => navigate('/app/journal')}
                className="p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors"
              >
                <NotebookPen className="h-5 w-5" />
              </button>
              <button 
                onClick={() => navigate('/app/profile')}
                className="p-2 text-foreground/70 hover:text-foreground transition-colors"
              >
                <User className="h-5 w-5" />
              </button>
            </div>

            {/* Title - changes to month/year when expanded */}
            {showCalendar ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full hover:bg-white/50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </h1>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full hover:bg-white/50 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-foreground flex items-center gap-1">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
                <Star className="h-3 w-3 text-red-500 fill-red-500" />
              </h1>
            )}

            {/* Streak badge */}
            <button 
              onClick={() => setShowStreakModal(true)}
              className="tour-streak flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-sm"
            >
              <Flame className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
            </button>
          </div>

          {/* Calendar area - compact spacing with swipe gesture */}
          <div 
            className="tour-calendar px-4 pt-1 pb-1"
            onTouchStart={handleCalendarTouchStart}
            onTouchMove={handleCalendarTouchMove}
            onTouchEnd={handleCalendarTouchEnd}
            style={{
              transform: `translateY(${swipeOffset * 0.3}px)`,
              transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
            }}
          >
            {/* Animated calendar grid container - with weekday headers */}
            <div 
              className="grid transition-all duration-300 ease-out overflow-hidden"
              style={{ 
                gridTemplateRows: showCalendar ? '1fr' : '0fr',
              }}
            >
              <div className="min-h-0">
                <div className={cn(
                  "transition-opacity duration-200",
                  showCalendar ? "opacity-100" : "opacity-0"
                )}>
                  {/* Weekday headers for expanded view */}
                  <div className="flex mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="flex-1 text-center text-[11px] text-foreground/50 font-medium leading-tight">
                        {day}
                      </div>
                    ))}
                  </div>
                  <MonthCalendar
                    selectedDate={selectedDate}
                    currentMonth={currentMonth}
                    onDateSelect={handleDateSelect}
                    completedDates={completedDates}
                    programEventDates={programEventDates}
                  />
                </div>
              </div>
            </div>

            {/* Week strip - Me+ style with pill around day name + number */}
            <div 
              className={cn(
                "grid transition-all duration-300 ease-out overflow-hidden",
              )}
              style={{ 
                gridTemplateRows: showCalendar ? '0fr' : '1fr',
              }}
            >
              <div className="min-h-0">
                <div className={cn(
                  "flex mt-1 transition-opacity duration-200",
                  showCalendar ? "opacity-0" : "opacity-100"
                )}>
                  {weekDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const hasCompletions = completedDates?.has(dateStr);
                    const hasProgramEvents = programEventDates?.has(dateStr);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className="flex-1 flex justify-center"
                      >
                        {/* Pill wraps around both day name and number for selected */}
                        <div
                          className={cn(
                            'flex flex-col items-center px-2 py-1 rounded-full transition-all',
                            isSelected && 'bg-[#E5D4F1] dark:bg-violet-800'
                          )}
                        >
                          {/* Day name */}
                          <span className={cn(
                            'text-[11px] font-medium leading-tight',
                            isSelected ? 'text-foreground/70' : 'text-foreground/50'
                          )}>
                            {format(day, 'EEE')}
                          </span>
                          
                          {/* Number with outline circle for selected */}
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all relative mt-0.5',
                              isSelected
                                ? 'bg-[#F4ECFE] text-foreground' // Same as header background, no border
                                : isTodayDate
                                  ? 'bg-white/60 text-foreground/80 dark:bg-violet-900/50 dark:text-violet-300'
                                  : 'text-foreground/70'
                            )}
                          >
                            {hasCompletions && !isSelected && (
                              <Flame className="absolute h-5 w-5 text-orange-400 opacity-50" />
                            )}
                            {hasProgramEvents && (
                              <Star className={cn(
                                "absolute -top-0.5 -right-0.5 h-2.5 w-2.5",
                                isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500"
                              )} />
                            )}
                            <span className="relative z-10">{format(day, 'd')}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Calendar expand/collapse handle + Today button */}
            <div className="flex items-center justify-center pt-1.5 pb-1">
              {/* Center: Drag handle */}
              <button 
                onClick={handleToggleCalendar}
                className="flex-1 flex justify-center"
              >
                <div 
                  className={cn(
                    "w-10 h-1 rounded-full bg-foreground/20 transition-all",
                    swipeOffset !== 0 && "bg-foreground/40 w-12"
                  )} 
                />
              </button>
              
              {/* Right: Today button - more prominent */}
              {!isToday(selectedDate) && (
                <button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setCurrentMonth(startOfMonth(new Date()));
                    haptic.light();
                  }}
                  className="absolute right-2 flex items-center gap-0.5 px-3 py-1.5 text-sm font-semibold text-violet-700 bg-violet-200 dark:bg-violet-700 dark:text-violet-100 rounded-full shadow-sm active:scale-95 transition-transform"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Today
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Spacer for fixed header - animated height */}
        <div 
          className="transition-all duration-300 ease-out"
          style={{ 
            height: showCalendar 
              ? 'calc(48px + 290px + max(12px, env(safe-area-inset-top)))' 
              : 'calc(48px + 72px + max(12px, env(safe-area-inset-top)))' 
          }}
        />

        {/* Notification Banner - prompts users to enable notifications */}
        <NotificationBanner onEnableClick={() => setShowNotificationFlow(true)} />

        {/* Promo Banner */}
        <PromoBanner />

        {/* Home Banners (announcements with videos/CTAs) */}
        <HomeBanner />

        {/* Tag filter chips */}
        {taskTags.length > 0 && (
          <div className="px-4 py-2 bg-background overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all font-medium',
                  selectedTag === null
                    ? 'bg-[#D8C0F3] text-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                All
              </button>
              {taskTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all capitalize font-medium',
                    selectedTag === tag
                      ? 'bg-[#D8C0F3] text-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content area - scrollable with extra padding for fixed bottom dashboard */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[280px]">

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Program Events Section - only show when "All" tag is selected */}
              {programEvents.length > 0 && selectedTag === null && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                      Program Events
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {programEvents.map((event) => (
                      <ProgramEventCard
                        key={`${event.type}-${event.id}`}
                        event={event}
                        date={selectedDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Tasks Section */}
              {filteredTasks.length === 0 && (selectedTag !== null || programEvents.length === 0) ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-muted-foreground mb-4">
                    {selectedTag 
                      ? `No ${selectedTag} tasks for this day` 
                      : 'No tasks for this day'}
                  </p>
                  <button
                    onClick={() => setShowQuickStart(true)}
                    className="text-violet-600 font-medium"
                  >
                    Add your first task
                  </button>
                </div>
              ) : filteredTasks.length > 0 && (
                <div>
                  {/* My Tasks header - always show */}
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                      My Tasks
                    </h2>
                    <span className="text-xs text-foreground/40 ml-auto">Hold to reorder</span>
                  </div>
                  <SortableTaskList
                    tasks={filteredTasks}
                    date={selectedDate}
                    completedTaskIds={completedTaskIds}
                    completedSubtaskIds={completedSubtaskIds}
                    onTaskTap={handleTaskTap}
                    onStreakIncrease={handleStreakIncrease}
                  />
                </div>
              )}

              {/* Popular Routines Suggestions - only show routines user hasn't added */}
              {suggestedRoutines.length > 0 && selectedTag === null && (
                <div className="tour-suggestions mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                      Try a Routine
                    </h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {suggestedRoutines.slice(0, 4).map((plan) => (
                      <div key={plan.id} className="w-32 shrink-0">
                        <RoutinePlanCard
                          plan={plan}
                          onClick={() => navigate(`/app/routines/${plan.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Fixed Bottom Dashboard */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-t-3xl shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]"
          style={{ paddingBottom: 'max(64px, calc(52px + env(safe-area-inset-bottom)))' }}
        >
          <div className="px-4 py-2">
            <ActiveRoundsCarousel
              activeRounds={activeRounds}
              nextSessionMap={nextSessionMap}
            />
          </div>
        </div>

        {/* FAB - positioned above the fixed bottom dashboard */}
        <button
          onClick={() => setShowQuickStart(true)}
          className="tour-add-task fixed right-4 w-14 h-14 rounded-full bg-[#D8C0F3] text-foreground shadow-lg flex items-center justify-center hover:bg-[#CDB0E8] active:scale-95 transition-all z-50"
          style={{ bottom: 'calc(200px + env(safe-area-inset-bottom))' }}
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Quick Start Sheet */}
        <TaskQuickStartSheet
          open={showQuickStart}
          onOpenChange={setShowQuickStart}
          onContinue={handleQuickStartContinue}
        />

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          date={selectedDate}
          completedSubtaskIds={completedSubtaskIds}
          onEdit={handleEditTask}
        />

        {/* Streak celebration modal */}
        <StreakCelebration
          open={showStreakModal}
          onClose={() => setShowStreakModal(false)}
        />

        {/* Push notification onboarding (triggered from banner) */}
        {user && showNotificationFlow && (
          <PushNotificationOnboarding
            userId={user.id}
            onComplete={() => setShowNotificationFlow(false)}
            onSkip={() => setShowNotificationFlow(false)}
          />
        )}

        {/* App Tour - Joyride guided walkthrough */}
        <AppTour
          run={runTour}
          stepIndex={stepIndex}
          onStepChange={setStepIndex}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      </div>
    </>
  );
};

export default AppHome;
