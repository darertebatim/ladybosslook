import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UserTask, 
  UserSubtask, 
  TASK_COLOR_CLASSES,
  useSubtasks,
  useCompleteTask,
  useUncompleteTask,
  useCompleteSubtask,
  useUncompleteSubtask,
} from '@/hooks/useTaskPlanner';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface TaskCardProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  onEdit?: (task: UserTask) => void;
  onStreakIncrease?: () => void;
}

export const TaskCard = ({
  task,
  date,
  isCompleted,
  completedSubtaskIds,
  onEdit,
  onStreakIncrease,
}: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { data: subtasks = [] } = useSubtasks(task.id);
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const completeSubtask = useCompleteSubtask();
  const uncompleteSubtask = useUncompleteSubtask();

  const completedCount = completedSubtaskIds.length;
  const totalSubtasks = subtasks.length;
  const hasSubtasks = totalSubtasks > 0;

  // Format time display
  const formatTime = (time: string | null) => {
    if (!time) return 'Anytime';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

    // Animate
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isCompleted) {
      uncompleteTask.mutate({ taskId: task.id, date });
    } else {
      const result = await completeTask.mutateAsync({ taskId: task.id, date });
      if (result.streakIncreased && onStreakIncrease) {
        // Stronger haptic for streak
        if (Capacitor.isNativePlatform()) {
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
        onStreakIncrease();
      }
    }
  };

  const handleToggleSubtask = async (subtask: UserSubtask) => {
    const isSubtaskCompleted = completedSubtaskIds.includes(subtask.id);
    
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

    if (isSubtaskCompleted) {
      uncompleteSubtask.mutate({ subtaskId: subtask.id, date });
    } else {
      completeSubtask.mutate({ subtaskId: subtask.id, date });
    }
  };

  const handleCardClick = () => {
    if (hasSubtasks) {
      setIsExpanded(!isExpanded);
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'rounded-2xl p-4 transition-all duration-200 cursor-pointer',
        colorClass,
        isCompleted && 'opacity-60',
        isExpanded && 'shadow-md'
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Emoji circle */}
        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-lg shrink-0">
          {task.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top line: subtask count + time */}
          <div className="flex items-center gap-2 text-xs text-foreground/60 mb-0.5">
            {hasSubtasks && (
              <span className="font-medium">
                {completedCount}/{totalSubtasks}
              </span>
            )}
            <span>{formatTime(task.scheduled_time)}</span>
          </div>
          
          {/* Title */}
          <p className={cn(
            'font-medium text-foreground truncate transition-all',
            isCompleted && 'line-through text-foreground/50'
          )}>
            {task.title}
          </p>
        </div>

        {/* Expand indicator */}
        {hasSubtasks && (
          <div className="text-foreground/40 mr-2">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={cn(
            'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-foreground/30 hover:border-foreground/50',
            isAnimating && 'scale-110'
          )}
        >
          {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
      </div>

      {/* Expanded subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="mt-3 pt-3 border-t border-foreground/10 space-y-2">
          {subtasks.map((subtask) => {
            const isSubtaskCompleted = completedSubtaskIds.includes(subtask.id);
            return (
              <div
                key={subtask.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSubtask(subtask);
                }}
                className="flex items-center gap-3 py-1 cursor-pointer"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    isSubtaskCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-foreground/30'
                  )}
                >
                  {isSubtaskCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                <span className={cn(
                  'text-sm',
                  isSubtaskCompleted && 'line-through text-foreground/50'
                )}>
                  {subtask.title}
                </span>
              </div>
            );
          })}
          
          {/* Edit button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="text-xs text-foreground/50 hover:text-foreground/70 mt-2"
            >
              Edit task
            </button>
          )}
        </div>
      )}
    </div>
  );
};
