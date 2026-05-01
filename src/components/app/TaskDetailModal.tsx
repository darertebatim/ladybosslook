import { toast } from 'sonner';
import { Check, Plus, Play, Droplets, FastForward, Pencil, Trash2 } from 'lucide-react';
import SealCheck from './SealCheck';
import { parseISO, isBefore, startOfDay, format as fnsFormat } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { playCompletionSound } from '@/lib/completionSound';
import { TaskIcon } from './IconPicker';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, ProLinkType } from '@/lib/proTaskTypes';
import { isWaterTask } from '@/lib/waterTracking';
import { formatTimeLabelWithEmoji } from '@/lib/taskScheduling';
import { CircleProgressButton } from './CircleProgressButton';
import { useRoutinePreviewData } from './RoutineTaskPreview';

// Secondary (darker) palette for card footer strips
const TASK_COLOR_DARK_CLASSES: Record<string, string> = {
  pink: 'bg-[#FFC2EA]',
  peach: 'bg-[#FFD2A1]',
  yellow: 'bg-[#FFEA4E]',
  lime: 'bg-[#C3F1E1]',
  sky: 'bg-[#B9D6FF]',
  mint: 'bg-[#C9F588]',
  lavender: 'bg-[#DEC1FF]',
  purple: 'bg-[#DEC1FF]',
  blue: 'bg-[#B9D6FF]',
  red: 'bg-[#FFC2EA]',
  orange: 'bg-[#FFD2A1]',
  green: 'bg-[#C3F1E1]',
};

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
  onTaskComplete?: () => void;
  onStreakIncrease?: () => void;
  onStepUnlocked?: (result: import('@/hooks/useProjectStepUnlock').StepUnlockResult) => void;
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
  onTaskComplete,
  onStreakIncrease,
  onStepUnlocked,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
  onSkip,
}: TaskDetailModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: subtasks = [] } = useSubtasks(task?.id);
  const completeSubtask = useCompleteSubtask();
  const uncompleteSubtask = useUncompleteSubtask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  const isProTask = !!task?.pro_link_type || !!task?.linked_playlist_id;
  const proLinkType: ProLinkType | null = (task?.pro_link_type as ProLinkType | null) || (task?.linked_playlist_id ? 'playlist' : null);
  const proLinkValue = task?.pro_link_value || task?.linked_playlist_id || null;
  const routineId = proLinkType === 'routine' ? (proLinkValue || task?.source_routine_id || '') : '';
  const { completion: routineCompletion } = useRoutinePreviewData(routineId);

  if (!task) return null;
  const proConfig = proLinkType ? PRO_LINK_CONFIGS[proLinkType] : null;

  const hasGoal = task.goal_enabled && task.goal_target && task.goal_target > 0;
  const isTimerGoal = hasGoal && task.goal_type === 'timer';
  const isCountGoal = hasGoal && task.goal_type === 'count';
  const isWater = isWaterTask(task);
  const goalReached = hasGoal && goalProgress >= (task.goal_target || 0);
  const isRoutineLauncher = proLinkType === 'routine' && !!(proLinkValue || task.source_routine_id);
  const isRoutineComplete = routineCompletion?.isComplete === true;
  const isCompletedState = isCompleted || (isRoutineLauncher && isRoutineComplete);

  const getRepeatLabel = (): string => {
    const p = task.repeat_pattern;
    if (!p || p === 'none') {
      if (task.scheduled_date) {
        const scheduledDate = parseISO(task.scheduled_date);
        if (isBefore(scheduledDate, startOfDay(date))) {
          return fnsFormat(scheduledDate, 'MMM d');
        }
      }
      return t('task.today');
    }
    if (p === 'daily') return t('task.daily');
    if (p === 'weekly') return t('task.weekly');
    if (p === 'monthly') return t('task.monthly');
    if (p === 'weekend') return t('task.weekends');
    if (p === 'custom' && task.repeat_days?.length) {
      const days = task.repeat_days.length;
      if (days === 7) return t('task.daily');
      if (days === 5) return t('task.weekdays');
      return t('task.perWeek', { count: days });
    }
    return t('task.today');
  };

  const getReminderText = () => {
    if (!task.reminder_enabled) return t('task.noReminder');
    const time = task.scheduled_time;
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return t('task.remindAt', { time: `${displayHour}:${minutes} ${ampm}` });
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const isSubCompleted = completedSubtaskIds.includes(subtaskId);
    haptic.selection();
    if (isSubCompleted) {
      uncompleteSubtask.mutate({ subtaskId, date });
    } else {
      completeSubtask.mutate({ subtaskId, date });
    }
  };

  const handleToggleComplete = async () => {
    // Routine launchers can be auto-complete via Routine Player sessions
    if (isRoutineLauncher && isRoutineComplete && !isCompleted) return;

    if (isCompleted) {
      haptic.light();
      uncompleteTask.mutate({ taskId: task.id, date });
    } else {
      haptic.successBurst();
      playCompletionSound();
      const result = await completeTask.mutateAsync({ taskId: task.id, date });
      onTaskComplete?.();
      if (result.streakIncreased && onStreakIncrease) {
        haptic.celebrate();
        onStreakIncrease();
      }
      if (result.unlockedStep && onStepUnlocked) {
        onStepUnlocked(result.unlockedStep);
      }
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;
  const darkColorClass = TASK_COLOR_DARK_CLASSES[task.color] || 'bg-black/10';
  const repeatLabel = getRepeatLabel();
  const reminderText = getReminderText();
  const footerText = [
    repeatLabel
      ? (repeatLabel === t('task.today')
          ? t('task.repeatsOnce')
          : t('task.repeats', { label: repeatLabel.toLowerCase() }))
      : '',
    reminderText
  ].filter(Boolean).join('. ');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent 
        hideCloseButton 
        className="app-theme w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none flex flex-col"
      >
        {/* Task card */}
        <div className={cn('rounded-3xl overflow-hidden', colorClass)}>

          {/* Task header - primary color */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <TaskIcon iconName={task.emoji} size={32} className="text-black/80" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-black/80">{formatTimeLabelWithEmoji(task)}</span>
                  <span className="text-[11px] text-black/80">• {repeatLabel}</span>
                  {hasGoal && (
                    <span className="text-[11px] text-black/80 font-medium">
                       • {isTimerGoal
                          ? `${Math.floor(goalProgress / 60)}/${Math.floor((task.goal_target || 0) / 60)} ${t('task.min')}`
                          : `${goalProgress}/${task.goal_target} ${task.goal_unit || t('task.times')}`
                        }
                    </span>
                  )}
                </div>
                
                <p className={cn(
                  'text-black text-[15px] font-semibold transition-all',
                  (hasGoal ? goalReached : isCompletedState) && 'line-through'
                )}>
                  {task.title}
                </p>
                
                {task.description && (
                  <p className="text-[13px] text-black/60 mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>

              {isTimerGoal ? (
                <button
                  onClick={handleToggleComplete}
                  className="w-9 h-9 flex items-center justify-center shrink-0"
                >
                  {(goalReached || isCompleted) ? (
                    <SealCheck className="w-9 h-9 text-teal-400" />
                  ) : (
                    <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center" />
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
                  className="w-9 h-9 flex items-center justify-center shrink-0"
                >
                  {goalReached ? (
                    <SealCheck className="w-9 h-9 text-teal-400" />
                  ) : (
                    <CircleProgressButton progress={goalProgress} target={task.goal_target || 1}>
                      {isWater ? <Droplets className="h-4 w-4 text-sky-500" /> : <Plus className="h-4 w-4" />}
                    </CircleProgressButton>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleToggleComplete}
                  className="w-9 h-9 flex items-center justify-center shrink-0"
                >
                  {isCompletedState ? (
                    <SealCheck className="w-9 h-9 text-teal-400" />
                  ) : (
                    <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Subtasks section - still in primary color */}
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

          {/* Timer goal: Start button */}
          {isTimerGoal && !goalReached && onOpenTimer && (
            <div className="px-4 pb-4 pt-1">
              <Button
                onClick={() => {
                  haptic.light();
                  onClose();
                  onOpenTimer(task);
                }}
                className="w-full gap-2 h-10 rounded-xl text-sm bg-black text-white hover:bg-black/90"
              >
                <Play className="h-4 w-4" />
                {t('task.startTimer')}
              </Button>
            </div>
          )}

          {/* Pro Task: Navigation button */}
          {isProTask && proConfig && (
            <div className="px-4 pb-4 pt-1">
              <Button
                onClick={() => {
                  onClose();
                  navigate(getProTaskNavigationPath(proLinkType!, proLinkValue), { state: { from: '/app/home' } });
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

          {/* Footer strip - secondary (darker) color */}
          {footerText && (
            <div className={cn('px-4 py-3.5', darkColorClass)}>
              <p className="text-[13px] font-medium text-black text-center">
                {footerText}.
              </p>
            </div>
          )}
        </div>

        {/* Action buttons — outside the card, floating below */}
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="flex-1 gap-2 h-11 rounded-2xl border-0 bg-white text-black text-sm shadow-sm active:scale-95 transition-transform"
          >
            <Pencil className="h-4 w-4" />
            {t('task.editTask')}
          </Button>
          
          {!isCompletedState && !goalReached && onSkip && (
            <Button
              onClick={() => {
                onClose();
                onSkip(task);
              }}
              className="gap-1.5 h-11 px-5 rounded-2xl border-0 bg-white text-black text-sm shadow-sm active:scale-95 transition-transform"
            >
              <FastForward className="h-4 w-4" />
              {t('task.skip')}
            </Button>
          )}
          
          {onDelete && (
            <Button
              onClick={() => {
                onClose();
                onDelete(task);
              }}
              className="gap-1.5 h-11 px-5 rounded-2xl border-0 bg-[#E07060] active:scale-95 transition-transform text-white text-sm shadow-sm"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              {t('task.delete')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
