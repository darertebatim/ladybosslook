import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Play, Droplets, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import SealCheck from './SealCheck';
import { CircleProgressButton } from './CircleProgressButton';
import { 
  UserTask, 
  TASK_COLOR_CLASSES,
  TASK_TINT_CLASSES,
  TASK_MID_CLASSES,
  useSubtasks,
  useCompleteTask,
  useUncompleteTask,
} from '@/hooks/useTaskPlanner';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { haptic } from '@/lib/haptics';
import { playCompletionSound } from '@/lib/completionSound';
import { TaskIcon } from './IconPicker';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, ProLinkType } from '@/lib/proTaskTypes';
import { isToday, isBefore, isSameDay, startOfDay, parseISO, format as fnsFormat } from 'date-fns';
import { toast } from 'sonner';
import { isWaterTask } from '@/lib/waterTracking';
import { formatTimeLabelWithEmoji } from '@/lib/taskScheduling';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RoutineTaskPreview, RoutinePlayBadge, useRoutinePreviewData } from './RoutineTaskPreview';

interface TaskCardProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  goalProgress?: number;
  onTap?: (task: UserTask) => void;
  onStreakIncrease?: () => void;
  onStepUnlocked?: (result: import('@/hooks/useProjectStepUnlock').StepUnlockResult) => void;
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
  onStepUnlocked,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
}: TaskCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingPlusKey, setFloatingPlusKey] = useState(0);
  const [showFloatingPlus, setShowFloatingPlus] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit] = useState<'lb' | 'kg'>('lb');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  
  const { data: subtasks = [] } = useSubtasks(task.id);
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const { autoCompleteWeight } = useAutoCompleteProTask();

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

  // For routine launcher tasks, check if all routine tasks are completed
  const routineId = (proLinkType === 'routine') ? (proLinkValue || task.source_routine_id || '') : '';
  const { completion: routineCompletion } = useRoutinePreviewData(routineId);
  const isRoutineComplete = routineCompletion?.isComplete === true;

  // Detect if this task was just auto-completed while user was away
  useEffect(() => {
    if (!isCompleted && !goalReached) return;
    const recentKey = 'pro_tasks_just_completed';
    const recent = JSON.parse(sessionStorage.getItem(recentKey) || '[]') as string[];
    if (recent.includes(task.id)) {
      // Remove this task from the list
      const updated = recent.filter(id => id !== task.id);
      if (updated.length > 0) {
        sessionStorage.setItem(recentKey, JSON.stringify(updated));
      } else {
        sessionStorage.removeItem(recentKey);
      }
      // Trigger celebration animation with a small delay for visual impact
      const timer = setTimeout(() => {
        playCompletionSound();
        haptic.medium();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2500);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, goalReached, task.id]);
  
  // Format time display using task scheduling helper
  const formatTime = (task: UserTask) => {
    return formatTimeLabelWithEmoji(task);
  };

  // Format repeat pattern label
  const getRepeatLabel = (task: UserTask): string => {
    const p = task.repeat_pattern;
    if (!p || p === 'none') {
      if (task.scheduled_date) {
        const scheduledDate = parseISO(task.scheduled_date);
        const today = startOfDay(new Date());
        if (isSameDay(scheduledDate, today)) {
          return 'Today';
        }
        return fnsFormat(scheduledDate, 'MMM d');
      }
      return 'Today';
    }
    if (p === 'daily') return 'Daily';
    if (p === 'weekly') return 'Weekly';
    if (p === 'monthly') return 'Monthly';
    if (p === 'weekend') return 'Weekends';
    if (p === 'custom' && task.repeat_days?.length === 5) return 'Weekdays';
    if (p === 'custom' && task.repeat_days?.length) {
      const days = task.repeat_days.length;
      if (days === 7) return 'Daily';
      if (days === 5) return 'Weekdays';
      return `${days}x/week`;
    }
    return 'Today';
  };
  const repeatLabel = getRepeatLabel(task);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent completing tasks for future dates - show toast message
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's routines.", {
        description: "You can honor this task when the day comes.",
        duration: 3000,
      });
      return;
    }
    
    // Animate
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2500);

    if (isCompleted) {
      haptic.light();
      uncompleteTask.mutate({ taskId: task.id, date });
    } else {
      haptic.successBurst();
      playCompletionSound();
      const result = await completeTask.mutateAsync({ taskId: task.id, date });
      if (result.streakIncreased && onStreakIncrease) {
        haptic.celebrate();
        onStreakIncrease();
      }
      if (result.unlockedStep && onStepUnlocked) {
        onStepUnlocked(result.unlockedStep);
      }
    }
  };

  // Check if this is a small count goal that should use tap-to-increment
  const isSmallCountGoal = isCountGoal && !isWater && (task.goal_target || 0) < 10;

  const handleOpenGoalInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's routines.", {
        description: "You can track this goal when the day comes.",
        duration: 3000,
      });
      return;
    }
    
    // Water tasks: navigate to the dedicated water tracking page
    if (isWater) {
      haptic.light();
      navigate('/app/water', { state: { from: 'planner' } });
      return;
    }
    
    // Small count goals: directly increment by 1 with animation
    if (isSmallCountGoal && onOpenGoalInput) {
      haptic.successBurst();
      
      // Trigger floating +1 animation
      setShowFloatingPlus(true);
      setFloatingPlusKey(prev => prev + 1);
      setTimeout(() => setShowFloatingPlus(false), 600);
      
      // Trigger full card animations (emoji bounce + ripple wave)
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      
      onOpenGoalInput(task);
      return;
    }
    
    haptic.light();
    if (onOpenGoalInput) {
      onOpenGoalInput(task);
    }
  };

  const handleOpenTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's routines.", {
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
    haptic.doubleTap();
    // Always open task detail modal (for both regular and Pro tasks)
    if (onTap) {
      onTap(task);
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;
  const isRoutineLauncher = proLinkType === 'routine' && !!(proLinkValue || task.source_routine_id);

  const routineBorderClass = '';
  
  // Animated goal progress number component - only animates when this card is actively animating
  const AnimatedProgress = ({ value }: { value: number }) => (
    isAnimating ? (
      <motion.span
        key={value}
        initial={{ scale: 1.5, color: '#14b8a6' }}
        animate={{ scale: 1, color: 'inherit' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="inline-block"
      >
        {value}
      </motion.span>
    ) : <span>{value}</span>
  );

  // Format goal display
  const formatGoalLabel = () => {
    if (!hasGoal) return null;
    
    if (isTimerGoal) {
      const progressMins = Math.floor(goalProgress / 60);
      const goalMins = Math.floor((task.goal_target || 0) / 60);
      return `${progressMins}/${goalMins} min`;
    }
    
    const unit = task.goal_unit || 'times';
    return { prefix: '', progress: goalProgress, suffix: `/${task.goal_target} ${unit}` };
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
    return { prefix: '', progress: goalProgress, suffix: `/${task.goal_target} ${unit}` };
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
        autoCompleteWeight();
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

    // Pro-task types that are simple navigation links — auto-complete on tap
    const isSimpleNavProTask = proLinkType && ['route', 'inspire', 'planner', 'channel', 'program', 'reading', 'reading_item'].includes(proLinkType);

    const handleProCircleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isFutureDate) {
        haptic.light();
        toast("Let's focus on today's routines.", {
          description: "You can do this when the day comes.",
          duration: 3000,
        });
        return;
      }
      
      // If already completed / goal reached, do nothing
      if (hasGoal ? goalReached : isCompleted) return;
      
      haptic.light();
      
      // Weight is special — opens inline sheet
      if (proLinkType === 'weight') {
        setWeightOpen(true);
        return;
      }

      // Simple navigation pro-tasks: mark complete and navigate
      if (isSimpleNavProTask && !hasGoal) {
        playCompletionSound();
        completeTask.mutate({ taskId: task.id, date }, {
          onSuccess: (result) => {
            if (result.streakIncreased && onStreakIncrease) {
              haptic.medium();
              onStreakIncrease();
            }
            if (result.unlockedStep && onStepUnlocked) {
              onStepUnlocked(result.unlockedStep);
            }
          }
        });
      }
      
      // Navigate to the tool
      navigate(getProTaskNavigationPath(proLinkType!, proLinkValue), { state: { from: '/app/home' } });
    };

    return (
      <>
        <div
          onClick={handleCardClick}
          className={cn(
            'rounded-3xl pl-3 pr-4 py-3 transition-all duration-200 cursor-pointer active:scale-[0.98]',
            colorClass,
            routineBorderClass
          )}
        >
          {/* Main row */}
          <div className="flex items-center gap-2">
            {/* Icon - use 3D emoji if available, else Lucide icon */}
            <div className={cn("w-10 h-10 flex items-center justify-center shrink-0", isAnimating && "animate-emoji-bounce [animation-delay:0.8s]")}>
              {hasTaskEmoji ? (
                <FluentEmoji emoji={task.emoji} size={32} />
              ) : (
                <ProIcon className={cn('h-6 w-6', proConfig.iconColorClass)} />
              )}
            </div>

            {/* Content */}
            <div className={cn("flex-1 min-w-0", isAnimating && "animate-ripple-wave [animation-delay:0.6s]")}>
              {/* Top line: Time + Goal (if applicable) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-black/80">{formatTime(task)}</span>
                <span className="text-[11px] text-black/80">• {repeatLabel}</span>
                {hasGoal && (
                  <span className="text-[11px] text-black/80 font-medium">• {(() => {
                    const label = formatProGoalLabel();
                    if (typeof label === 'string') return label;
                    if (label) return <>{label.prefix}<AnimatedProgress value={label.progress} />{label.suffix}</>;
                    return null;
                  })()}</span>
                )}
                {proLinkType === 'routine' && (proLinkValue || task.source_routine_id) && (
                  <span className="text-[10px] font-semibold text-secondary-foreground bg-secondary rounded px-1.5 py-0.5 leading-none whitespace-nowrap">
                    Routine Player
                  </span>
                )}
              </div>
              
              {/* Title - strike through when goal reached or completed (including derived routine completion) */}
              <p className={cn(
                'text-black text-[15px] font-semibold leading-tight transition-all',
                (hasGoal ? goalReached : (isCompleted || (isRoutineLauncher && isRoutineComplete))) && 'line-through'
              )}>
                {task.title}
              </p>
              {/* Routine preview row - shows emoji chain + completion % */}
              {proLinkType === 'routine' && (proLinkValue || task.source_routine_id) && (
                <RoutineTaskPreview routineId={(proLinkValue || task.source_routine_id)!} />
              )}
            </div>

            {/* Circle with tool icon inside — navigates to the tool */}
            {isTimerGoal ? (
              <button
                onClick={handleOpenTimer}
                className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
              >
                {goalReached ? <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} /> : (
                  <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center">
                    <Play className="h-4 w-4 ml-0.5" />
                  </span>
                )}
              </button>
            ) : (isCountGoal || isWater) ? (
              <div className="relative">
                <AnimatePresence>
                  {showFloatingPlus && isSmallCountGoal && (
                    <motion.span
                      key={floatingPlusKey}
                      initial={{ opacity: 1, y: 0, scale: 0.8 }}
                      animate={{ opacity: 0, y: -32, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-teal-500 pointer-events-none z-10"
                    >
                      +1
                    </motion.span>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleProCircleClick}
                  className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
                >
                  {goalReached ? <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} /> : (
                    <CircleProgressButton progress={goalProgress} target={task.goal_target || 1}>
                      {isWater ? <Droplets className="h-4 w-4 text-sky-500" /> : <ProIcon className={cn("h-4 w-4", proConfig.iconColorClass)} />}
                    </CircleProgressButton>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center shrink-0">
                <button
                  onClick={handleProCircleClick}
                  className="w-12 h-12 -m-1.5 flex items-center justify-center"
                >
                  {(isCompleted || (isRoutineLauncher && isRoutineComplete)) ? <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} /> : (
                    <span className="w-9 h-9 rounded-full border-[2.5px] border-black bg-white flex items-center justify-center">
                      {isRoutineLauncher ? <Play className="h-4 w-4 ml-0.5" /> : <ProIcon className={cn("h-4 w-4", proConfig.iconColorClass)} />}
                    </span>
                  )}
                </button>
                {proLinkType === 'routine' && (proLinkValue || task.source_routine_id) && (
                  <RoutinePlayBadge routineId={(proLinkValue || task.source_routine_id)!} />
                )}
              </div>
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
        colorClass,
        routineBorderClass
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2">
        {/* Icon - emoji display like Me+ */}
        <div className={cn("w-10 h-10 flex items-center justify-center shrink-0", isAnimating && "animate-emoji-bounce [animation-delay:0.8s]")}>
          <TaskIcon iconName={task.emoji} size={32} className="text-black/80" />
        </div>

        {/* Content */}
        <div className={cn("flex-1 min-w-0", isAnimating && "animate-ripple-wave [animation-delay:0.6s]")}>
          {/* Top line: subtask count + time/goal */}
          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <span className="font-semibold bg-white/50 px-1.5 py-0.5 rounded text-xs text-black">
                {completedCount}/{totalSubtasks}
              </span>
            )}
            <span className="text-[11px] text-black/80">{formatTime(task)}</span>
            <span className="text-[11px] text-black/80">• {repeatLabel}</span>
            {hasGoal && (
              <span className="text-[11px] text-black/80 font-medium">• {(() => {
                const label = formatGoalLabel();
                if (typeof label === 'string') return label;
                if (label) return <>{label.prefix}<AnimatedProgress value={label.progress} />{label.suffix}</>;
                return null;
              })()}</span>
            )}
          </div>
          
          {/* Title - for goal tasks, only strike when goal reached; for regular tasks, when completed */}
          <p className={cn(
            'text-black text-[15px] font-semibold leading-tight transition-all',
            (hasGoal ? goalReached : isCompleted) && 'line-through'
          )}>
            {task.title}
          </p>
        </div>

        {/* Timer goal: Play button, Count goal: + button, Regular: Checkbox */}
        {isTimerGoal ? (
          <button
            onClick={handleOpenTimer}
            className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
          >
            {goalReached ? <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} /> : (
              <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center">
                <Play className="h-5 w-5 text-foreground/70 ml-0.5" fill="currentColor" />
              </span>
            )}
          </button>
        ) : isCountGoal ? (
          <div className="relative">
            <AnimatePresence>
              {showFloatingPlus && isSmallCountGoal && (
                <motion.span
                  key={floatingPlusKey}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -32, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-teal-500 pointer-events-none z-10"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={handleOpenGoalInput}
              className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
            >
              {goalReached ? <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} /> : isWater ? (
                <CircleProgressButton progress={goalProgress} target={task.goal_target || 1}>
                  <Droplets className="h-5 w-5 text-sky-500" />
                </CircleProgressButton>
              ) : (
                <CircleProgressButton progress={goalProgress} target={task.goal_target || 1}>
                  <Plus className="h-5 w-5 text-foreground/70" strokeWidth={2} />
                </CircleProgressButton>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggleComplete}
            className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
          >
            {isCompleted ? <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} /> : (
              <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});
