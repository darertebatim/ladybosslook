import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyPresenceGridProps {
  lastActiveDate?: Date | null;
  showedUpToday?: boolean;
  variant?: 'light' | 'dark';
}

export function WeeklyPresenceGrid({ 
  lastActiveDate, 
  showedUpToday = false,
  variant = 'light' 
}: WeeklyPresenceGridProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const isToday = isSameDay(day, today);
    const isPast = isBefore(startOfDay(day), startOfDay(today));
    
    // Day is active if it's before or equal to lastActiveDate, or it's today and user showed up
    const isActive = lastActiveDate && (
      (isPast && isBefore(startOfDay(day), startOfDay(addDays(lastActiveDate, 1)))) ||
      (isToday && showedUpToday)
    );
    
    return {
      date: day,
      label: format(day, 'EEEEE'),
      fullLabel: format(day, 'EEE'),
      isActive,
      isToday,
      isPast,
    };
  });

  const isDark = variant === 'dark';

  return (
    <div className="flex justify-center gap-2">
      {weekDays.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          {/* Day label */}
          <span className={cn(
            'text-[10px] font-medium',
            isDark ? 'text-white/50' : 'text-muted-foreground'
          )}>
            {day.fullLabel}
          </span>
          
          {/* Circle */}
          <div 
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all',
              day.isToday && isDark && 'ring-2 ring-violet-300',
              day.isToday && !isDark && 'ring-2 ring-primary/30',
              day.isActive
                ? isDark 
                  ? 'bg-violet-500 text-white' 
                  : 'bg-primary text-primary-foreground'
                : isDark
                  ? 'bg-white/10 text-white/40'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {day.isActive ? (
              <Check className="h-4 w-4" />
            ) : (
              format(day.date, 'd')
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
