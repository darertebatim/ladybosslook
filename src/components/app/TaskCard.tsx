import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Play, Droplets, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UserTask, 
  TASK_COLOR_CLASSES,
  useSubtasks,
  useCompleteTask,
  useUncompleteTask,
} from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { TaskIcon } from './IconPicker';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, ProLinkType } from '@/lib/proTaskTypes';
import { isToday, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { isWaterTask } from '@/lib/waterTracking';
import { formatTimeLabelWithEmoji } from '@/lib/taskScheduling';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TaskCardProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  goalProgress?: number;
  onTap?: (task: UserTask) => void;
  onStreakIncrease?: () => void;
  onOpenGoalInput?: (task: UserTask) => void;
  onOpenTimer?: (task: UserTask) => void;
  onOpenWaterTracking?: (task: UserTask) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  date,
  isCompleted,
  completedSubtaskIds,
  goalProgress = 0,
  onTap,
  onStreakIncrease,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
}: TaskCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit] = useState<'lb' | 'kg'>('lb');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  
  const { data: subtasks = [] } = useSubtasks(task.id);
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  const completedCount = subtasks.filter(s => completedSubtaskIds.includes(s.id)).length;
  const totalSubtasks = subtasks.length;
  const hasSubtasks = totalSubtasks > 0;
  
  // Check if this is a Pro Task (has pro_link_type or legacy linked_playlist_id)
  const isProTask = !!task.pro_link_type || !!task.linked_playlist_id;
  const proLinkType: ProLinkType | null = task.pro_link_type || (task.linked_playlist_id ? 'playlist' : null);
  const proLinkValue = task.pro_link_value || task.linked_playlist_id;
  const proConfig = proLinkType ? PRO_LINK_CONFIGS[proLinkType] : null;

  // Check if this is a future date (after today)
  const isFutureDate = !isToday(date) && !isBefore(startOfDay(date), startOfDay(new Date()));
  
  // Check if this task has a goal
  const hasGoal = task.goal_enabled && task.goal_target && task.goal_target > 0;
  const isTimerGoal = hasGoal && task.goal_type === 'timer';
  const isCountGoal = hasGoal && task.goal_type === 'count';
  const isWater = isWaterTask(task);
  const goalReached = hasGoal && goalProgress >= (task.goal_target || 0);
  
  // Format time display using task scheduling helper
  const formatTime = (task: UserTask) => {
    return formatTimeLabelWithEmoji(task);
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent completing tasks for future dates - show toast message
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's rituals.", {
        description: "You can honor this action when the day comes.",
        duration: 3000,
      });
      return;
    }
    
    // Haptic feedback
    haptic.light();

    // Animate
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isCompleted) {
      uncompleteTask.mutate({ taskId: task.id, date });
    } else {
      const result = await completeTask.mutateAsync({ taskId: task.id, date });
      if (result.streakIncreased && onStreakIncrease) {
        // Stronger haptic for streak
        haptic.medium();
        onStreakIncrease();
      }
    }
  };

  const handleOpenGoalInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's rituals.", {
        description: "You can track this goal when the day comes.",
        duration: 3000,
      });
      return;
    }
    
    haptic.light();
    
    // Water tasks: navigate to the dedicated water tracking page
    if (isWater) {
      navigate('/app/water', { state: { from: 'planner' } });
      return;
    }
    
    if (onOpenGoalInput) {
      onOpenGoalInput(task);
    }
  };

  const handleOpenTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's rituals.", {
        description: "You can start this timer when the day comes.",
        duration: 3000,
      });
      return;
    }
    
    haptic.light();
    
    if (onOpenTimer) {
      onOpenTimer(task);
    }
  };

  const handleCardClick = () => {
    // Always open task detail modal (for both regular and Pro tasks)
    if (onTap) {
      onTap(task);
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;
  
  // Format goal display
  const formatGoalLabel = () => {
    if (!hasGoal) return null;
    
    if (isTimerGoal) {
      // Timer goals: show in minutes
      const progressMins = Math.floor(goalProgress / 60);
      const goalMins = Math.floor((task.goal_target || 0) / 60);
      return `Goal: ${progressMins}/${goalMins} min`;
    }
    
    const unit = task.goal_unit || 'times';
    return `Goal: ${goalProgress}/${task.goal_target} ${unit}`;
  };

  // Format goal display for Pro Tasks too
  const formatProGoalLabel = () => {
    if (!hasGoal) return null;
    
    if (isTimerGoal) {
      const progressMins = Math.floor(goalProgress / 60);
      const goalMins = Math.floor((task.goal_target || 0) / 60);
      return `${progressMins}/${goalMins} min`;
    }
    
    const unit = task.goal_unit || 'times';
    return `${goalProgress}/${task.goal_target} ${unit}`;
  };

  // Pro Task - uses user's chosen color but shows Pro icon and badge
  if (isProTask && proConfig) {
    const ProIcon = proConfig.icon;
    // Use task's emoji if available for 3D display, otherwise fall back to ProIcon
    const hasTaskEmoji = task.emoji && task.emoji.length > 0;
    
    const handleWeightKey = (key: string) => {
      haptic.light();
      if (key === 'backspace') {
        setWeightValue(prev => prev.slice(0, -1));
      } else if (key === '.') {
        if (!weightValue.includes('.') && weightValue.length < 6) {
          setWeightValue(prev => prev + '.');
        }
      } else if (key === 'confirm') {
        handleLogWeight();
      } else if (weightValue.length < 6) {
        setWeightValue(prev => prev + key);
      }
    };

    const handleLogWeight = async () => {
      if (!user || !weightValue || isLoggingWeight) return;
      setIsLoggingWeight(true);
      const { error } = await supabase.from('weight_logs' as any).insert({
        user_id: user.id,
        weight_value: parseFloat(weightValue),
        weight_unit: weightUnit,
        logged_at: new Date().toISOString(),
      } as any);
      if (!error) {
        toast.success('Weight logged!');
        setWeightValue('');
        setWeightOpen(false);
      } else {
        toast.error('Failed to log weight');
      }
      setIsLoggingWeight(false);
    };

    const weightKeys = [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
      ['.', '0', 'confirm'],
    ];

    return (
      <>
        <div
          onClick={handleCardClick}
          className={cn(
            'rounded-3xl pl-3 pr-4 py-3 transition-all duration-200 cursor-pointer active:scale-[0.98]',
            colorClass
          )}
        >
          {/* Main row */}
          <div className="flex items-center gap-2">
            {/* Icon - use 3D emoji if available, else Lucide icon */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              {hasTaskEmoji ? (
                <FluentEmoji emoji={task.emoji} size={32} />
              ) : (
                <ProIcon className={cn('h-6 w-6', proConfig.iconColorClass)} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top line: Time + Goal (if applicable) */}
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-black/80">{formatTime(task)}</span>
                {hasGoal && (
                  <span className="text-[13px] text-black/80 font-medium">• {formatProGoalLabel()}</span>
                )}
              </div>
              
              {/* Title - strike through when goal reached or completed */}
              <p className={cn(
                'text-black text-[15px] font-semibold truncate transition-all',
                (hasGoal ? goalReached : isCompleted) && 'line-through'
              )}>
                {task.title}
              </p>
            </div>

            {/* Quick navigation button - prominent action button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (proLinkType === 'weight') {
                  setWeightOpen(true);
                } else {
                  navigate(getProTaskNavigationPath(proLinkType!, proLinkValue), { state: { from: 'planner' } });
                }
              }}
              className={cn(
                'flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95',
                proConfig.buttonClass
              )}
            >
              <ProIcon className="h-3.5 w-3.5" />
              {proConfig.badgeText}
            </button>

            {/* Timer goal: Play button, Count goal: + button, Regular: Checkbox */}
            {isTimerGoal ? (
              <button
                onClick={handleOpenTimer}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
                  goalReached
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'border-2 border-foreground/30 bg-white/60',
                  isAnimating && 'scale-110'
                )}
              >
                {goalReached ? <Check className="h-4 w-4" strokeWidth={3} /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
            ) : (isCountGoal || isWater) ? (
              <button
                onClick={handleOpenGoalInput}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
                  goalReached
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'border-2 border-foreground/30 bg-white/60',
                  isAnimating && 'scale-110'
                )}
              >
                {goalReached ? <Check className="h-4 w-4" strokeWidth={3} /> : (
                  isWater ? <Droplets className="h-4 w-4 text-sky-500" /> : <Plus className="h-4 w-4" />
                )}
              </button>
            ) : (
              <button
                onClick={handleToggleComplete}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'border-2 border-foreground/30 bg-white/60',
                  isAnimating && 'scale-110'
                )}
              >
                {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
            )}
          </div>
        </div>

        {/* Weight log sheet */}
        {proLinkType === 'weight' && (
          <Sheet open={weightOpen} onOpenChange={(o) => { if (!o) setWeightValue(''); setWeightOpen(o); }}>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl px-4 pt-6 pb-8"
              style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-center mb-6 relative">
                <button onClick={() => { setWeightValue(''); setWeightOpen(false); }} className="absolute left-0 p-2 -ml-2">
                  <X className="h-5 w-5" />
                </button>
                <span className="text-lg font-semibold">Weight ({weightUnit})</span>
              </div>

              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-5xl font-bold tracking-tight">{weightValue || '0'}</span>
                <span className="text-4xl font-bold text-foreground/60">{weightUnit}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-3xl p-4">
                {weightKeys.flat().map((key) => (
                  <button
                    key={key}
                    onClick={() => handleWeightKey(key)}
                    className={cn(
                      'h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95',
                      key === 'confirm' && 'bg-amber-500 text-white',
                      key === '.' && 'bg-amber-100 dark:bg-amber-800/40 text-foreground',
                      key !== 'confirm' && key !== '.' && 'bg-white dark:bg-background shadow-sm'
                    )}
                  >
                    {key === 'confirm' ? (
                      <Check className="h-6 w-6 mx-auto" />
                    ) : key === 'backspace' ? (
                      <Delete className="h-6 w-6 mx-auto" />
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </>
    );
  }

  // Regular task styling - Me+ inspired
  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'rounded-3xl pl-3 pr-4 py-3 transition-all duration-200 cursor-pointer active:scale-[0.98]',
        colorClass
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2">
        {/* Icon - emoji display like Me+ */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <TaskIcon iconName={task.emoji} size={32} className="text-black/80" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top line: subtask count + time/goal */}
          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <span className="font-semibold bg-white/50 px-1.5 py-0.5 rounded text-xs text-black">
                {completedCount}/{totalSubtasks}
              </span>
            )}
            {hasGoal ? (
              <span className="text-[13px] text-black/80 font-medium">{formatGoalLabel()}</span>
            ) : (
              <span className="text-[13px] text-black/80">{formatTime(task)}</span>
            )}
          </div>
          
          {/* Title - for goal tasks, only strike when goal reached; for regular tasks, when completed */}
          <p className={cn(
            'text-black text-[15px] font-semibold truncate transition-all',
            (hasGoal ? goalReached : isCompleted) && 'line-through'
          )}>
            {task.title}
          </p>
        </div>

        {/* Timer goal: Play button, Count goal: + button, Regular: Checkbox */}
        {isTimerGoal ? (
          <button
            onClick={handleOpenTimer}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              goalReached
                ? 'bg-emerald-500 text-white shadow-md'
                : 'border-2 border-foreground/30 bg-white/60',
              isAnimating && 'scale-110'
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
            onClick={handleOpenGoalInput}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              goalReached
                ? 'bg-emerald-500 text-white shadow-md'
                : isWater 
                  ? 'border-2 border-sky-400 bg-sky-100'
                  : 'border-2 border-foreground/30 bg-white/60',
              isAnimating && 'scale-110'
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
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              isCompleted
                ? 'bg-emerald-500 text-white shadow-md'
                : 'border-2 border-foreground/30 bg-white/60',
              isAnimating && 'scale-110'
            )}
          >
            {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
        )}
      </div>
    </div>
  );
});
