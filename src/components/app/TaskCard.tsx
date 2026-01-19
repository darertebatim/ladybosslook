import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UserTask, 
  TASK_COLOR_CLASSES,
  useSubtasks,
  useCompleteTask,
  useUncompleteTask,
} from '@/hooks/useTaskPlanner';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TaskIcon } from './IconPicker';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, ProLinkType } from '@/lib/proTaskTypes';

interface TaskCardProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  onTap?: (task: UserTask) => void;
  onStreakIncrease?: () => void;
}

export const TaskCard = ({
  task,
  date,
  isCompleted,
  completedSubtaskIds,
  onTap,
  onStreakIncrease,
}: TaskCardProps) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  
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

  const handleCardClick = () => {
    // Always open task detail modal (for both regular and Pro tasks)
    if (onTap) {
      onTap(task);
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;

  // Pro Task - uses user's chosen color but shows Pro icon and badge
  if (isProTask && proConfig) {
    const ProIcon = proConfig.icon;
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          colorClass, // Use user's chosen task color
          isCompleted && 'opacity-60'
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-3">
          {/* Icon circle - shows Pro link type icon */}
          <div className="w-11 h-11 rounded-full bg-white/90 dark:bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
            <ProIcon className={cn('h-5 w-5', proConfig.iconColorClass)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top line: Time + Badge */}
            <div className="flex items-center gap-2 text-xs mb-0.5">
              <span className="text-foreground/60">{formatTime(task.scheduled_time)}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full font-medium',
                proConfig.badgeColorClass
              )}>
                {proConfig.badgeText}
              </span>
            </div>
            
            {/* Title */}
            <p className={cn(
              'font-semibold text-foreground truncate transition-all',
              isCompleted && 'line-through text-foreground/50'
            )}>
              {task.title}
            </p>
            
            {/* Linked content name subtitle */}
            {proLinkType === 'playlist' && task.linked_playlist?.name && (
              <p className="text-xs text-foreground/60 truncate mt-0.5">
                {task.linked_playlist.name}
              </p>
            )}
          </div>

          {/* Quick navigation button - prominent action button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(getProTaskNavigationPath(proLinkType!, proLinkValue));
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all shadow-sm active:scale-95',
              proConfig.buttonClass
            )}
          >
            <ProIcon className="h-4 w-4" />
            {proConfig.badgeText}
          </button>

          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              isCompleted
                ? 'bg-emerald-500 text-white shadow-md'
                : 'border-2 border-foreground/25 hover:border-foreground/40 bg-white/50',
              isAnimating && 'scale-110'
            )}
          >
            {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
        </div>
      </div>
    );
  }

  // Regular task styling
  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
        colorClass,
        isCompleted && 'opacity-60'
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Icon circle */}
        <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-sm">
          <TaskIcon iconName={task.emoji} size={22} className="text-foreground/80" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top line: subtask count + time */}
          <div className="flex items-center gap-2 text-xs text-foreground/60 mb-0.5">
            {hasSubtasks && (
              <span className="font-semibold text-foreground/70">
                {completedCount}/{totalSubtasks}
              </span>
            )}
            <span>{formatTime(task.scheduled_time)}</span>
          </div>
          
          {/* Title */}
          <p className={cn(
            'font-semibold text-foreground truncate transition-all',
            isCompleted && 'line-through text-foreground/50'
          )}>
            {task.title}
          </p>
        </div>

        {/* Checkbox / Badge */}
        <button
          onClick={handleToggleComplete}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
            isCompleted
              ? 'bg-emerald-500 text-white shadow-md'
              : 'border-2 border-foreground/25 hover:border-foreground/40 bg-white/50',
            isAnimating && 'scale-110'
          )}
        >
          {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
};
