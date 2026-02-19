import { Check, Plus, Play, Droplets, FastForward, Pencil, Trash2 } from 'lucide-react';
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
import { formatTimeLabel } from '@/lib/taskScheduling';

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

        {/* Task header - matches TaskCard styling exactly */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Icon - same size as TaskCard (32px) */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <TaskIcon iconName={task.emoji} size={32} className="text-black/80" />
            </div>
            
            {/* Time/Goal and title - matching TaskCard exactly */}
            <div className="flex-1 min-w-0">
              {/* Top line: time + goal (like TaskCard shows both) */}
              <div className="flex items-center gap-1.5">
                {/* Always show time period/time first */}
                <span className="text-[13px] text-black/80">{formatTimeLabel(task)}</span>
                
                {/* Show goal after time if task has a goal */}
                {hasGoal && (
                  <>
                    <span className="text-[13px] text-black/80">•</span>
                    <span className="text-[13px] text-black/80 font-medium">
                      {isTimerGoal
                        ? `${Math.floor(goalProgress / 60)}/${Math.floor((task.goal_target || 0) / 60)} min`
                        : `${goalProgress}/${task.goal_target} ${task.goal_unit || 'times'}`
                      }
                    </span>
                  </>
                )}
              </div>
              
              {/* Title - 15px font-semibold like TaskCard */}
              <p className={cn(
                'text-black text-[15px] font-semibold transition-all',
                (hasGoal ? goalReached : isCompleted) && 'line-through'
              )}>
                {task.title}
              </p>
              
              {/* Description - shown below title */}
              {task.description && (
                <p className="text-[13px] text-black/60 mt-0.5">
                  {task.description}
                </p>
              )}
            </div>

            {/* Timer goal: Play button, Count goal: + button, Regular: Checkbox - same size as TaskCard (w-9 h-9) */}
            {isTimerGoal ? (
              <button
                onClick={() => {
                  haptic.light();
                  onOpenTimer?.(task);
                  onClose();
                }}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                  goalReached
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'border-2 border-foreground/30 bg-white/60'
                )}
              >
                {goalReached ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Play className="h-5 w-5 text-foreground/70 ml-0.5" fill="currentColor" />
                )}
              </button>
            ) : isCountGoal ? (
              <button
                onClick={() => {
                  haptic.light();
                  if (isWater) {
                    navigate('/app/water', { state: { from: 'planner' } });
                  } else {
                    onOpenGoalInput?.(task);
                  }
                  onClose();
                }}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                  goalReached
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isWater
                      ? 'border-2 border-sky-400 bg-sky-100'
                      : 'border-2 border-foreground/30 bg-white/60'
                )}
              >
                {goalReached ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : isWater ? (
                  <Droplets className="h-5 w-5 text-sky-500" />
                ) : (
                  <Plus className="h-5 w-5 text-foreground/70" strokeWidth={2} />
                )}
              </button>
            ) : (
              <button
                onClick={handleToggleComplete}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'border-2 border-foreground/30 bg-white/60'
                )}
              >
                {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
            )}
          </div>
        </div>

        {/* Repeat/Reminder info - centered text matching Me+ */}
        {combinedText && (
          <div className="px-4 pb-3">
            <p className="text-[13px] text-black/70 text-center">
              {combinedText}.
            </p>
          </div>
        )}

        {/* Subtasks section */}
        {subtasks.length > 0 && (
          <div className="px-4 pb-3">
            <div className="bg-white/80 rounded-2xl p-3 space-y-0 divide-y divide-black/10">
              {subtasks.map((subtask) => {
                const isSubtaskCompleted = completedSubtaskIds.includes(subtask.id);
                return (
                  <button
                    key={subtask.id}
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="flex items-center gap-3 w-full text-left py-2.5 first:pt-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                        isSubtaskCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-black/30 bg-white/50'
                      )}
                    >
                      {isSubtaskCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      'flex-1 text-black text-[14px]',
                      isSubtaskCompleted && 'line-through text-black/50'
                    )}>
                      {subtask.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pro Task: Navigation button */}
        {isProTask && proConfig && (
          <div className="px-4 pb-2">
            <Button
              onClick={() => {
                onClose();
                navigate(getProTaskNavigationPath(proLinkType!, proLinkValue), { state: { from: 'planner' } });
              }}
              className={cn('w-full gap-2 h-10 rounded-xl text-sm', proConfig.buttonClass)}
            >
              {(() => {
                const ProIcon = proConfig.icon;
                return <ProIcon className="h-4 w-4" />;
              })()}
              {proConfig.badgeText}
            </Button>
          </div>
        )}

        {/* Action buttons — Me+ card style, outside the colored box */}
        <div className="bg-background rounded-b-3xl px-4 pt-3 pb-4">
          <div className="flex gap-3 justify-center">
            {/* Edit */}
            <button
              onClick={() => { onClose(); onEdit(task); }}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-secondary rounded-2xl py-4 active:scale-95 transition-transform"
            >
              <Pencil className="h-6 w-6 text-foreground/80" strokeWidth={1.8} />
              <span className="text-xs font-medium text-foreground/80">Edit</span>
            </button>

            {/* Skip */}
            {!isCompleted && !goalReached && onSkip && (
              <button
                onClick={() => { onClose(); onSkip(task); }}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-secondary rounded-2xl py-4 active:scale-95 transition-transform"
              >
                <FastForward className="h-6 w-6 text-foreground/80" strokeWidth={1.8} />
                <span className="text-xs font-medium text-foreground/80">Skip</span>
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => { onClose(); onDelete(task); }}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-destructive/90 rounded-2xl py-4 active:scale-95 transition-transform"
              >
                <Trash2 className="h-6 w-6 text-destructive-foreground" strokeWidth={1.8} />
                <span className="text-xs font-medium text-destructive-foreground">Delete</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
