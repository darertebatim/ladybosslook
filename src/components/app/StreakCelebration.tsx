import { useEffect, useState } from 'react';
import { format, subDays, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useUserStreak } from '@/hooks/useTaskPlanner';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface StreakCelebrationProps {
  open: boolean;
  onClose: () => void;
}

export const StreakCelebration = ({ open, onClose }: StreakCelebrationProps) => {
  const { data: streak } = useUserStreak();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();
    }
  }, [open]);

  if (!open) return null;

  const currentStreak = streak?.current_streak || 1;
  const lastCompletionDate = streak?.last_completion_date 
    ? new Date(streak.last_completion_date)
    : new Date();

  // Generate week days for progress bar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      date: day,
      label: format(day, 'EEEEE'), // Single letter
      isCompleted: day <= lastCompletionDate && 
        (currentStreak >= 7 || 
          // Check if this day is within the streak
          isSameDay(day, lastCompletionDate) ||
          (day < lastCompletionDate && day >= subDays(lastCompletionDate, currentStreak - 1))),
      isToday: isSameDay(day, new Date()),
    };
  });

  // Motivational messages based on streak
  const getMessage = () => {
    if (currentStreak === 1) return "Great start! Keep it going!";
    if (currentStreak === 2) return "Two days in a row! You're building momentum!";
    if (currentStreak === 3) return "Three-day streak! You're on fire!";
    if (currentStreak === 7) return "One full week! You're unstoppable!";
    if (currentStreak >= 30) return "30+ day streak! You're a legend!";
    if (currentStreak >= 14) return "Two weeks strong! Amazing dedication!";
    return "Great job! Let's see how far you can go!";
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal content */}
      <div 
        className={cn(
          'relative bg-neutral-900 rounded-3xl p-8 w-full max-w-[280px] text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Flame icon */}
        <div className={cn(
          'text-6xl mb-2 transition-transform duration-700',
          isAnimating && 'animate-bounce'
        )}>
          🔥
        </div>

        {/* Streak number */}
        <div className={cn(
          'text-5xl font-bold text-white mb-4 transition-all duration-500 delay-200',
          isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}>
          {currentStreak}
        </div>

        {/* Message */}
        <p className="text-white/80 text-sm mb-6">
          {getMessage()}
        </p>

        {/* Week progress */}
        <div className="flex justify-center gap-2 mb-6">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div 
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  day.isCompleted
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-700 text-neutral-400',
                  day.isToday && !day.isCompleted && 'ring-2 ring-orange-500/50'
                )}
              >
                {day.label}
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <Button
          onClick={onClose}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl"
        >
          I'm committed 💪
        </Button>
      </div>
    </div>
  );
};
