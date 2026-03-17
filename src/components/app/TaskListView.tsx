import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Flag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserTask, useCompleteTask, useUncompleteTask, useCompletionsForDate, TASK_COLOR_CLASSES } from '@/hooks/useTaskPlanner';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { TaskIcon } from '@/components/app/IconPicker';
import { haptic } from '@/lib/haptics';
import { playCompletionSound } from '@/lib/completionSound';
import { format, parseISO } from 'date-fns';

interface TaskListViewProps {
  title: string;
  emoji?: string;
  tasks: UserTask[];
  onBack: () => void;
}

export const TaskListView = ({ title, emoji, tasks, onBack }: TaskListViewProps) => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const today = new Date();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const { data: completions } = useCompletionsForDate(today);

  const completedTaskIds = new Set(
    (completions?.tasks || []).map(c => c.task_id)
  );

  const handleToggleComplete = async (task: UserTask, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    const isCompleted = completedTaskIds.has(task.id);
    if (isCompleted) {
      uncompleteTask.mutate({ taskId: task.id, date: today });
    } else {
      playCompletionSound();
      completeTask.mutateAsync({ taskId: task.id, date: today });
    }
  };

  // Group by project step if tasks have project_step
  const hasProjectSteps = tasks.some(t => t.project_step !== null && t.project_step !== undefined);
  
  const groupedTasks = hasProjectSteps
    ? tasks.reduce<Record<number, UserTask[]>>((acc, t) => {
        const step = t.project_step ?? 0;
        if (!acc[step]) acc[step] = [];
        acc[step].push(t);
        return acc;
      }, {})
    : null;

  const sortedSteps = groupedTasks ? Object.keys(groupedTasks).map(Number).sort((a, b) => a - b) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 safe-area-top">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </h1>
        </div>
      </div>

      {/* Task list */}
      <div className="px-4 py-3">
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No tasks here</p>
            <p className="text-sm mt-1">Tap + to add one</p>
          </div>
        ) : sortedSteps && groupedTasks ? (
          // Project step grouping
          sortedSteps.map(step => (
            <div key={step} className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Step {step}
              </h3>
              <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
                {groupedTasks[step].map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isCompleted={completedTaskIds.has(task.id)}
                    onToggle={handleToggleComplete}
                    onTap={setSelectedTask}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                isCompleted={completedTaskIds.has(task.id)}
                onToggle={handleToggleComplete}
                onTap={setSelectedTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => navigate('/app/home/new')}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        date={today}
        isCompleted={selectedTask ? completedTaskIds.has(selectedTask.id) : false}
        completedSubtaskIds={[]}
        onEdit={(task) => {
          setSelectedTask(null);
          navigate(`/app/home/edit/${task.id}`);
        }}
      />
    </div>
  );
};

// Individual task row
const TaskRow = ({
  task,
  isCompleted,
  onToggle,
  onTap,
}: {
  task: UserTask;
  isCompleted: boolean;
  onToggle: (task: UserTask, e: React.MouseEvent) => void;
  onTap: (task: UserTask) => void;
}) => {
  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;

  return (
    <button
      onClick={() => onTap(task)}
      className="flex items-center gap-3 w-full text-left px-3.5 py-3 active:bg-muted/50 transition-colors"
    >
      {/* Completion circle */}
      <div
        onClick={(e) => onToggle(task, e)}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-muted-foreground/40'
        )}
      >
        {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>

      {/* Emoji */}
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
        <TaskIcon iconName={task.emoji} size={18} className="text-foreground/80" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[15px] font-medium text-foreground truncate',
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        {task.scheduled_date && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(task.scheduled_date), 'MMM d')}
          </p>
        )}
      </div>

      {/* Flag indicator */}
      {task.is_urgent && (
        <Flag className="h-4 w-4 text-orange-500 shrink-0" fill="currentColor" />
      )}
    </button>
  );
};
