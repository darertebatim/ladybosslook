import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Music } from 'lucide-react';
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
  
  // Check if this task is linked to a playlist
  const isLinkedTask = !!task.linked_playlist_id;
  const linkedPlaylist = task.linked_playlist;

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
    // If linked to playlist, navigate to player
    if (isLinkedTask && task.linked_playlist_id) {
      navigate(`/app/player/playlist/${task.linked_playlist_id}`);
      return;
    }
    
    // Otherwise open task detail
    if (onTap) {
      onTap(task);
    }
  };

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;

  // Linked playlist task - special styling
  if (isLinkedTask) {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40',
          isCompleted && 'opacity-60'
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-3">
          {/* Music icon circle */}
          <div className="w-11 h-11 rounded-full bg-white/90 dark:bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
            <Music className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top line: Listen badge + time */}
            <div className="flex items-center gap-2 text-xs mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">
                Listen
              </span>
              <span className="text-foreground/60">{formatTime(task.scheduled_time)}</span>
            </div>
            
            {/* Title */}
            <p className={cn(
              'font-semibold text-foreground truncate transition-all',
              isCompleted && 'line-through text-foreground/50'
            )}>
              {task.title}
            </p>
            
            {/* Playlist name subtitle */}
            {linkedPlaylist?.name && (
              <p className="text-xs text-foreground/60 truncate mt-0.5">
                {linkedPlaylist.name}
              </p>
            )}
          </div>

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
