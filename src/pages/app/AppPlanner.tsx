import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Menu, Plus, Flame, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useTasksForDate, 
  useCompletionsForDate,
  useUserStreak,
  UserTask,
  TaskTemplate,
} from '@/hooks/useTaskPlanner';
import { useProgramEventsForDate } from '@/hooks/usePlannerProgramEvents';
import { TaskCard } from '@/components/app/TaskCard';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { MonthCalendar } from '@/components/app/MonthCalendar';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { TaskQuickStartSheet } from '@/components/app/TaskQuickStartSheet';
import { ProgramEventCard } from '@/components/app/ProgramEventCard';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const AppPlanner = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Handle quick start continue - navigate to task create with name
  const handleQuickStartContinue = useCallback((taskName: string, template?: TaskTemplate) => {
    if (template) {
      // Navigate with template data
      navigate(`/app/planner/new?name=${encodeURIComponent(template.title)}&emoji=${encodeURIComponent(template.emoji)}&color=${template.color}`);
    } else {
      // Navigate with just the name
      navigate(`/app/planner/new?name=${encodeURIComponent(taskName)}`);
    }
  }, [navigate]);

  // Data queries
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useTasksForDate(selectedDate);
  const { data: completions, isLoading: completionsLoading } = useCompletionsForDate(selectedDate);
  const { data: streak } = useUserStreak();
  const { data: programEvents = [], isLoading: programEventsLoading } = useProgramEventsForDate(selectedDate);

  // Generate week days centered on current week
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, []);

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
    navigate(`/app/planner/edit/${task.id}`);
  }, [navigate]);

  const handleTaskTap = useCallback((task: UserTask) => {
    setSelectedTask(task);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  }, []);

  const isLoading = tasksLoading || completionsLoading || programEventsLoading;

  // Emoji for current day (decorative)
  const todayEmoji = isToday(selectedDate) ? '💎' : '';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed header with integrated week strip */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-violet-100 to-background"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 h-12">
          {/* Menu button */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-foreground/70 hover:text-foreground">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
                <h2 className="text-lg font-semibold mb-4">LadyBoss Planner</h2>
                <nav className="space-y-2">
                  <button 
                    onClick={() => {
                      navigate('/app/planner/templates');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted"
                  >
                    📋 Browse Templates
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/app/planner/stats');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted"
                  >
                    📊 My Stats
                  </button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Title */}
          <h1 className="text-lg font-bold text-foreground">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
          </h1>

          {/* Streak badge */}
          <button 
            onClick={() => setShowStreakModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-sm"
          >
            <Flame className="h-4 w-4 fill-current" />
            <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
          </button>
        </div>

        {/* Week strip - part of fixed header, only show when calendar is collapsed */}
        {!showCalendar && (
          <div className="px-4 py-3 border-b">
            <div className="flex justify-between">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <span className="text-xs text-muted-foreground uppercase font-medium">
                      {format(day, 'EEE')}
                    </span>
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative',
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md'
                          : isTodayDate
                            ? 'bg-violet-100 text-violet-700'
                            : 'hover:bg-muted/50'
                      )}
                    >
                      {isTodayDate && isSelected ? (
                        <span className="text-base">{todayEmoji || format(day, 'd')}</span>
                      ) : (
                        format(day, 'd')
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar expand handle */}
            <button 
              onClick={() => setShowCalendar(true)}
              className="w-full flex justify-center pt-2 mt-1"
            >
              <div className="flex gap-0.5">
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            </button>
          </div>
        )}

        {/* Expanded Month Calendar - replaces week strip */}
        {showCalendar && (
          <div className="border-b shadow-lg">
            <MonthCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        )}
      </header>

      {/* Spacer for fixed header (title bar + week strip) */}
      <div style={{ height: showCalendar ? 'calc(48px + max(12px, env(safe-area-inset-top)))' : 'calc(48px + 100px + max(12px, env(safe-area-inset-top)))' }} />

      {/* Backdrop when calendar is expanded */}
      {showCalendar && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          style={{ top: 0 }}
          onClick={() => setShowCalendar(false)}
        />
      )}

      {/* Tag filter chips */}
      {taskTags.length > 0 && (
        <div className="px-4 py-3 bg-background border-b overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-medium',
                selectedTag === null
                  ? 'bg-violet-600 text-white'
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
                  'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all capitalize font-medium',
                  selectedTag === tag
                    ? 'bg-violet-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-safe">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Program Events Section */}
            {programEvents.length > 0 && (
              <div className="mb-6">
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
            {filteredTasks.length === 0 && programEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-muted-foreground mb-4">
                  {selectedTag 
                    ? `No ${selectedTag} tasks for this day` 
                    : 'No tasks for this day'}
                </p>
                <button
                  onClick={() => navigate('/app/planner/new')}
                  className="text-violet-600 font-medium"
                >
                  Add your first task
                </button>
              </div>
            ) : filteredTasks.length > 0 && (
              <div>
                {programEvents.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">📝</span>
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                      Your Tasks
                    </h2>
                  </div>
                )}
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      date={selectedDate}
                      isCompleted={completedTaskIds.has(task.id)}
                      completedSubtaskIds={completedSubtaskIds}
                      onTap={handleTaskTap}
                      onStreakIncrease={handleStreakIncrease}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Extra bottom padding for FAB */}
        <div className="h-20" />
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowQuickStart(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:bg-violet-700 active:scale-95 transition-all z-40"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
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
    </div>
  );
};

export default AppPlanner;
