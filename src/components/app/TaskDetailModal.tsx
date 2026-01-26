import { Check, X, Pencil } from 'lucide-react';
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

interface TaskDetailModalProps {
  task: UserTask | null;
  open: boolean;
  onClose: () => void;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  onEdit: (task: UserTask) => void;
  onStreakIncrease?: () => void;
}

export const TaskDetailModal = ({
  task,
  open,
  onClose,
  date,
  isCompleted,
  completedSubtaskIds,
  onEdit,
  onStreakIncrease,
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
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-foreground/30 flex items-center justify-center hover:bg-white/30 transition-colors z-10"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Task header - Me+ style with emoji, time, title */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            {/* Large emoji */}
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <TaskIcon iconName={task.emoji} size={40} className="text-foreground/80" />
            </div>
            
            {/* Time and title */}
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-sm text-foreground/60 mb-0.5">
                Time: {formatTime(task.scheduled_time)}
              </p>
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {task.title}
              </h3>
            </div>

            {/* Checkbox circle on right - clickable */}
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
          {isProTask && proConfig ? (
            <>
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
              {/* Edit button */}
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="w-full gap-2 h-12 rounded-full border-2 border-foreground/30 bg-transparent hover:bg-white/30 text-foreground"
              >
                <Pencil className="h-4 w-4" />
                Edit Task
              </Button>
            </>
          ) : (
            /* Regular Task: Edit button - Me+ style rounded pill */
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="w-full gap-2 h-12 rounded-full border-2 border-foreground/30 bg-transparent hover:bg-white/30 text-foreground"
            >
              <Pencil className="h-4 w-4" />
              Edit Task
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
