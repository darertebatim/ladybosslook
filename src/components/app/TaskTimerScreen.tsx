import { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Play, Square, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { TaskIcon } from './IconPicker';
import { UserTask, TASK_COLOR_CLASSES } from '@/hooks/useTaskPlanner';

interface TaskTimerScreenProps {
  task: UserTask;
  currentProgress: number; // in seconds
  onSaveProgress: (secondsElapsed: number) => void;
  onMarkComplete: () => void;
  onClose: () => void;
}

export const TaskTimerScreen = ({
  task,
  currentProgress,
  onSaveProgress,
  onMarkComplete,
  onClose,
}: TaskTimerScreenProps) => {
  const goalTargetSeconds = task.goal_target || 0;
  const remainingSeconds = Math.max(0, goalTargetSeconds - currentProgress);
  
  const [timeLeft, setTimeLeft] = useState(remainingSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isDone, setIsDone] = useState(remainingSeconds === 0);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || isDone) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsDone(true);
          haptic.success();
          return 0;
        }
        return prev - 1;
      });
      elapsedRef.current += 1;
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isDone]);

  // Track elapsed time when running changes
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
    }
  }, [isRunning]);

  const handlePause = useCallback(() => {
    haptic.light();
    setIsRunning(false);
  }, []);

  const handleResume = useCallback(() => {
    haptic.light();
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    haptic.medium();
    // Save elapsed seconds
    onSaveProgress(elapsedRef.current);
    onClose();
  }, [onSaveProgress, onClose]);

  const handleMarkComplete = useCallback(() => {
    haptic.success();
    onMarkComplete();
    onClose();
  }, [onMarkComplete, onClose]);

  const handleDone = useCallback(() => {
    haptic.success();
    // Save total elapsed time (reached goal)
    onSaveProgress(elapsedRef.current);
    onClose();
  }, [onSaveProgress, onClose]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the ring
  const progressPercent = goalTargetSeconds > 0 
    ? ((currentProgress + elapsedRef.current) / goalTargetSeconds) * 100 
    : 0;

  // Format goal display
  const progressMinutes = Math.floor((currentProgress + elapsedRef.current) / 60);
  const goalMinutes = Math.floor(goalTargetSeconds / 60);

  const colorClass = TASK_COLOR_CLASSES[task.color] || TASK_COLOR_CLASSES.yellow;

  // Done screen
  if (isDone) {
    return (
      <div className={cn('fixed inset-0 z-[9999] flex flex-col', colorClass)}>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Large emoji */}
          <div className="mb-4">
            <TaskIcon iconName={task.emoji} size={64} />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">{task.title}</h1>
          
          {/* Done message */}
          <div className="text-6xl mb-8">🎉</div>
          <p className="text-xl font-semibold text-foreground/80 mb-12">Done!</p>
          
          {/* I did it button */}
          <Button
            onClick={handleDone}
            className="w-full max-w-xs h-14 rounded-2xl bg-foreground text-background text-lg font-bold"
          >
            <Check className="h-5 w-5 mr-2" />
            I did it!
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('fixed inset-0 z-[9999] flex flex-col', colorClass)}>
      {/* Header with task info - includes safe area */}
      <div 
        className="flex flex-col items-center px-6 pt-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 32px)' }}
      >
        {/* Large emoji */}
        <div className="mb-3">
          <TaskIcon iconName={task.emoji} size={56} />
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-bold text-foreground mb-1">{task.title}</h1>
        
        {/* Goal progress */}
        <p className="text-sm text-foreground/60">
          Goal: {progressMinutes}/{goalMinutes} minutes
        </p>
      </div>

      {/* Timer display with circular progress */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="relative">
          {/* SVG ellipse with dashed stroke */}
          <svg width="280" height="280" viewBox="0 0 280 280">
            {/* Background dashed circle */}
            <ellipse
              cx="140"
              cy="140"
              rx="130"
              ry="130"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="12 8"
              className="text-foreground/20"
            />
            {/* Progress circle - fills with white */}
            <ellipse
              cx="140"
              cy="140"
              rx="130"
              ry="130"
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeDasharray={`${(progressPercent / 100) * 816} 816`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }}
            />
          </svg>
          
          {/* Time display in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div 
        className="px-6 pb-6"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-center gap-6">
          {/* Pause/Resume button */}
          <button
            onClick={isRunning ? handlePause : handleResume}
            className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            {isRunning ? (
              <Pause className="h-7 w-7 text-foreground" />
            ) : (
              <Play className="h-7 w-7 text-foreground ml-1" />
            )}
          </button>

          {/* Mark as complete button */}
          <Button
            onClick={handleMarkComplete}
            className="h-14 px-8 rounded-2xl bg-foreground text-background font-bold text-base"
          >
            Mark as complete
          </Button>

          {/* Stop button */}
          <button
            onClick={handleStop}
            className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Square className="h-6 w-6 text-foreground fill-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};
