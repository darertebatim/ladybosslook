import { Check, X, Pencil, Plus, Play, Droplets, Trash2, FastForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  UserTask, 
  TASK_COLOR_CLASSES,
  useSubtasks,
  useCompleteSubtask,
  useUncompleteSubtask,
  useCompleteTask,
  useUncompleteTask,
} from '@/hooks/useTaskPlanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { TaskIcon } from './IconPicker';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, ProLinkType } from '@/lib/proTaskTypes';
import { isWaterTask } from '@/lib/waterTracking';

interface TaskDetailModalProps {
  task: UserTask | null;
  open: boolean;
  onClose: () => void;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  goalProgress?: number;
  onEdit: (task: UserTask) => void;
  onDelete?: (task: UserTask) => void;
  onStreakIncrease?: () => void;
  onOpenGoalInput?: (task: UserTask) => void;
  onOpenTimer?: (task: UserTask) => void;
  onOpenWaterTracking?: (task: UserTask) => void;
  onSkip?: (task: UserTask) => void;
}

export const TaskDetailModal = ({
  task,
  open,
  onClose,
  date,
  isCompleted,
  completedSubtaskIds,
  goalProgress = 0,
  onEdit,
  onDelete,
  onStreakIncrease,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
  onSkip,
}: TaskDetailModalProps) => {
  const navigate = useNavigate();
  const { data: subtasks = [] } = useSubtasks(task?.id);
  const completeSubtask = useCompleteSubtask();
  const uncompleteSubtask = useUncompleteSubtask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  if (!task) return null;

  // Detect if this is a Pro Task
  const isProTask = !!task.pro_link_type || !!task.linked_playlist_id;
  const proLinkType: ProLinkType | null = task.pro_link_type as ProLinkType || (task.linked_playlist_id ? 'playlist' : null);
  const proLinkValue = task.pro_link_value || task.linked_playlist_id;
  const proConfig = proLinkType ? PRO_LINK_CONFIGS[proLinkType] : null;

  // Goal tracking
  const hasGoal = task.goal_enabled && task.goal_target && task.goal_target > 0;
  const isTimerGoal = hasGoal && task.goal_type === 'timer';
  const isCountGoal = hasGoal && task.goal_type === 'count';
  const isWater = isWaterTask(task);
  const goalReached = hasGoal && goalProgress >= (task.goal_target || 0);

  // Format time display
  const formatTime = (time: string | null) => {
    if (!time) return 'Anytime';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get repeat description
  const getRepeatText = () => {
    const patterns: Record<string, string> = {
      none: '',
      daily: 'Repeats every day',
      weekly: 'Repeats every week',
      monthly: 'Repeats every month',
      weekend: 'Repeats on weekends',
    };
    return patterns[task.repeat_pattern] || '';
  };

  // Get reminder description
  const getReminderText = () => {
    if (!task.reminder_enabled) return 'No Reminder';
    const time = task.scheduled_time;
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `Remind me at ${displayHour}:${minutes} ${ampm}`;
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const isCompleted = completedSubtaskIds.includes(subtaskId);
    
    haptic.light();

    if (isCompleted) {
      uncompleteSubtask.mutate({ subtaskId, date });
    } else {
      completeSubtask.mutate({ subtaskId, date });
    }
  };

  const handleToggleComplete = async () => {
    haptic.light();

    if (isCompleted) {
      uncompleteTask.mutate({ taskId: task.id, date });
    } else {
      const result = await completeTask.mutateAsync({ taskId: task.id, date });
      if (result.streakIncreased && onStreakIncrease) {
        haptic.medium();
        onStreakIncrease();
      }
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;
  const repeatText = getRepeatText();
  const reminderText = getReminderText();
  const combinedText = [repeatText, reminderText].filter(Boolean).join('. ');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent 
        hideCloseButton 
        className={cn(
          'sm:max-w-md p-0 gap-0 rounded-3xl overflow-hidden border-0',
          colorClass
        )}
      >

        {/* Task header - Me+ style with emoji, time, title */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            {/* Large emoji */}
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <TaskIcon iconName={task.emoji} size={40} className="text-foreground/80" />
            </div>
            
            {/* Time/Goal and title */}
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-sm text-foreground/60 mb-0.5">
                {hasGoal 
                  ? isTimerGoal
                    ? `Goal: ${Math.floor(goalProgress / 60)}/${Math.floor((task.goal_target || 0) / 60)} min`
                    : `Goal: ${goalProgress}/${task.goal_target} ${task.goal_unit || 'times'}`
                  : `Time: ${formatTime(task.scheduled_time)}`
                }
              </p>
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-foreground/70 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            {/* Timer goal: Play button, Count goal: + button, Regular: Checkbox */}
            {isTimerGoal ? (
              <button
                onClick={() => {
                  haptic.light();
                  onOpenTimer?.(task);
                  onClose();
                }}
                className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  goalReached
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-foreground/30 bg-white/40 hover:bg-white/60'
                )}
              >
                {goalReached ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </button>
            ) : isCountGoal ? (
              <button
                onClick={() => {
                  haptic.light();
                  if (isWater && onOpenWaterTracking) {
                    onOpenWaterTracking(task);
                  } else {
                    onOpenGoalInput?.(task);
                  }
                  onClose();
                }}
                className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  goalReached
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isWater
                      ? 'border-sky-400 bg-sky-100'
                      : 'border-foreground/30 bg-white/40 hover:bg-white/60'
                )}
              >
                {goalReached ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : isWater ? (
                  <Droplets className="h-5 w-5 text-sky-500" />
                ) : (
                  <Plus className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
            ) : (
              <button
                onClick={handleToggleComplete}
                className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-foreground/30 bg-white/40 hover:bg-white/60'
                )}
              >
                {isCompleted && <Check className="h-5 w-5" strokeWidth={3} />}
              </button>
            )}
          </div>
        </div>

        {/* Subtasks section - white background card */}
        {subtasks.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-white/80 rounded-2xl p-4 space-y-0 divide-y divide-foreground/10">
              {subtasks.map((subtask) => {
                const isCompleted = completedSubtaskIds.includes(subtask.id);
                return (
                  <button
                    key={subtask.id}
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="flex items-center gap-3 w-full text-left py-3 first:pt-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-foreground/30 bg-white/50'
                      )}
                    >
                      {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      'flex-1 text-foreground',
                      isCompleted && 'line-through text-foreground/50'
                    )}>
                      {subtask.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Repeat/Reminder info - centered text */}
        {combinedText && (
          <div className="px-6 pb-4">
            <p className="text-sm text-foreground/70 text-center">
              {combinedText}.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6 pb-6 pt-2 space-y-3">
          {/* Pro Task: Navigation button */}
          {isProTask && proConfig && (
            <Button
              onClick={() => {
                onClose();
                navigate(getProTaskNavigationPath(proLinkType!, proLinkValue), { state: { from: 'planner' } });
              }}
              className={cn('w-full gap-2 h-12 rounded-2xl', proConfig.buttonClass)}
            >
              {(() => {
                const ProIcon = proConfig.icon;
                return <ProIcon className="h-5 w-5" />;
              })()}
              {proConfig.badgeText}
            </Button>
          )}
          
          {/* Skip button - show if not completed */}
          {!isCompleted && !goalReached && onSkip && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onSkip(task);
              }}
              className="w-full gap-2 h-12 rounded-2xl border-foreground/20 bg-white/50 hover:bg-white/70 text-foreground/70"
            >
              <FastForward className="h-4 w-4" />
              Skip for Today
            </Button>
          )}
          
          {/* Edit and Delete buttons row */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex-1 gap-2 h-12 rounded-full border-2 border-foreground/30 bg-transparent hover:bg-white/30 text-foreground"
            >
              <Pencil className="h-4 w-4" />
              Edit Task
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onDelete(task);
                }}
                className="w-12 h-12 p-0 rounded-xl border-2 border-red-300 bg-transparent hover:bg-red-50 text-red-500"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
