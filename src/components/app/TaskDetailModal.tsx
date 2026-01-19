import { Check, X, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  UserTask, 
  TASK_COLOR_CLASSES,
  useSubtasks,
  useCompleteSubtask,
  useUncompleteSubtask,
} from '@/hooks/useTaskPlanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TaskIcon } from './IconPicker';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, ProLinkType } from '@/lib/proTaskTypes';

interface TaskDetailModalProps {
  task: UserTask | null;
  open: boolean;
  onClose: () => void;
  date: Date;
  completedSubtaskIds: string[];
  onEdit: (task: UserTask) => void;
}

export const TaskDetailModal = ({
  task,
  open,
  onClose,
  date,
  completedSubtaskIds,
  onEdit,
}: TaskDetailModalProps) => {
  const navigate = useNavigate();
  const { data: subtasks = [] } = useSubtasks(task?.id);
  const completeSubtask = useCompleteSubtask();
  const uncompleteSubtask = useUncompleteSubtask();

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
    if (!task.reminder_enabled) return '';
    const offset = task.reminder_offset;
    if (offset === 0) return 'Remind me at time';
    if (offset === 10) return 'Remind me 10 minutes before';
    if (offset === 30) return 'Remind me 30 minutes before';
    if (offset === 60) return 'Remind me 1 hour before';
    return '';
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const isCompleted = completedSubtaskIds.includes(subtaskId);
    
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

    if (isCompleted) {
      uncompleteSubtask.mutate({ subtaskId, date });
    } else {
      completeSubtask.mutate({ subtaskId, date });
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;
  const repeatText = getRepeatText();
  const reminderText = getReminderText();
  const combinedText = [repeatText, reminderText].filter(Boolean).join('. ');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideCloseButton className="sm:max-w-md p-0 gap-0 rounded-3xl overflow-hidden">
        {/* Header with icon and time */}
        <div className={cn('p-6 pb-4 relative', colorClass)}>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 w-7 h-7 rounded-full border border-foreground/30 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center">
              <TaskIcon iconName={task.emoji} size={28} className="text-foreground/80" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">
                Time: {formatTime(task.scheduled_time)}
              </p>
              <h3 className="text-lg font-semibold">
                {task.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div className="p-4 bg-background">
            <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
              {subtasks.map((subtask) => {
                const isCompleted = completedSubtaskIds.includes(subtask.id);
                return (
                  <button
                    key={subtask.id}
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      'flex-1',
                      isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {subtask.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Repeat/Reminder info */}
        {combinedText && (
          <div className="px-4 pb-2 bg-background">
            <p className="text-sm text-muted-foreground">
              {combinedText}.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 pt-2 bg-background space-y-2">
          {/* Pro Task: Navigation button */}
          {isProTask && proConfig ? (
            <>
              <Button
                onClick={() => {
                  onClose();
                  navigate(getProTaskNavigationPath(proLinkType!, proLinkValue), { state: { from: 'planner' } });
                }}
                className={cn('w-full gap-2', proConfig.buttonClass)}
              >
                {(() => {
                  const ProIcon = proConfig.icon;
                  return <ProIcon className="h-4 w-4" />;
                })()}
                {proConfig.badgeText}
              </Button>
              {/* Small edit link for Pro Tasks */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="w-full text-muted-foreground"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit Task
              </Button>
            </>
          ) : (
            /* Regular Task: Edit button */
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="w-full gap-2"
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
