import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Menu, Plus, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useTasksForDate, 
  useCompletionsForDate,
  useUserStreak,
  useUserTags,
  UserTask,
} from '@/hooks/useTaskPlanner';
import { TaskCard } from '@/components/app/TaskCard';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const AppPlanner = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Data queries
  const { data: tasks = [], isLoading: tasksLoading } = useTasksForDate(selectedDate);
  const { data: completions, isLoading: completionsLoading } = useCompletionsForDate(selectedDate);
  const { data: streak } = useUserStreak();
  const { data: userTags = [] } = useUserTags();

  // Generate week days centered on today
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

  const handleStreakIncrease = () => {
    setShowStreakModal(true);
  };

  const handleEditTask = (task: UserTask) => {
    navigate(`/app/planner/edit/${task.id}`);
  };

  const isLoading = tasksLoading || completionsLoading;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b safe-area-inset-top">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Menu button */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-foreground/70 hover:text-foreground">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-6">
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
          <h1 className="text-lg font-semibold">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
          </h1>

          {/* Streak badge */}
          <button 
            onClick={() => setShowStreakModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-600"
          >
            <Flame className="h-4 w-4 fill-current" />
            <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
          </button>
        </div>
      </header>

      {/* Week strip */}
      <div className="bg-background border-b px-2 py-3">
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
                <span className="text-xs text-muted-foreground">
                  {format(day, 'EEE')}
                </span>
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isTodayDate
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tag filter chips */}
      {taskTags.length > 0 && (
        <div className="px-4 py-3 bg-background border-b overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all',
                selectedTag === null
                  ? 'bg-primary text-primary-foreground'
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
                  'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all capitalize',
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-muted-foreground mb-4">
              {selectedTag 
                ? `No ${selectedTag} tasks for this day` 
                : 'No tasks for this day'}
            </p>
            <button
              onClick={() => navigate('/app/planner/new')}
              className="text-primary font-medium"
            >
              Add your first task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                date={selectedDate}
                isCompleted={completedTaskIds.has(task.id)}
                completedSubtaskIds={completedSubtaskIds}
                onEdit={handleEditTask}
                onStreakIncrease={handleStreakIncrease}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/app/planner/new')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:bg-violet-700 active:scale-95 transition-all z-40"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Streak celebration modal */}
      <StreakCelebration
        open={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />
    </div>
  );
};

export default AppPlanner;
