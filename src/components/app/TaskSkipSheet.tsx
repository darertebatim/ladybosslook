import { useState } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, FastForward, CalendarDays } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { UserTask, useSkipTask, useSnoozeTask } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { TaskIcon } from './IconPicker';

interface TaskSkipSheetProps {
  task: UserTask | null;
  open: boolean;
  onClose: () => void;
  date: Date;
}

export const TaskSkipSheet = ({ task, open, onClose, date }: TaskSkipSheetProps) => {
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(addDays(date, 1));
  const [showCalendar, setShowCalendar] = useState(false);
  const skipTask = useSkipTask();
  const snoozeTask = useSnoozeTask();

  if (!task) return null;

  const isNonRepeating = task.repeat_pattern === 'none';
  const tomorrow = addDays(date, 1);

  const handleSkip = () => {
    haptic.light();
    skipTask.mutate({ taskId: task.id, date }, {
      onSuccess: () => onClose(),
    });
  };

  const handleSnooze = (toDate: Date) => {
    haptic.light();
    snoozeTask.mutate({ taskId: task.id, fromDate: date, toDate }, {
      onSuccess: () => onClose(),
    });
  };

  const handleQuickSnooze = (days: number) => {
    const targetDate = addDays(date, days);
    handleSnooze(targetDate);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Skip Task</SheetTitle>
        </SheetHeader>

        {/* Task preview */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl mb-6">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
            <TaskIcon iconName={task.emoji} size={24} className="text-foreground/80" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              {task.repeat_pattern === 'daily' ? 'Daily' : 
               task.repeat_pattern === 'weekly' ? 'Weekly' :
               task.repeat_pattern === 'none' ? 'One-time' : task.repeat_pattern}
            </p>
          </div>
        </div>

        {/* Skip option - always available */}
        <Button
          variant="outline"
          onClick={handleSkip}
          className="w-full h-14 rounded-2xl mb-3 justify-start gap-3 text-base"
          disabled={skipTask.isPending}
        >
          <FastForward className="h-5 w-5 text-muted-foreground" />
          Skip for Today
          {task.repeat_pattern !== 'none' && (
            <span className="text-sm text-muted-foreground ml-auto">Returns tomorrow</span>
          )}
        </Button>

        {/* Reschedule section - only for non-daily tasks or one-time */}
        {(isNonRepeating || task.repeat_pattern !== 'daily') && (
          <>
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or reschedule to</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Quick options */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                variant="outline"
                onClick={() => handleQuickSnooze(1)}
                className="h-12 rounded-xl flex-col gap-0.5"
                disabled={snoozeTask.isPending}
              >
                <span className="text-sm font-medium">Tomorrow</span>
                <span className="text-xs text-muted-foreground">{format(tomorrow, 'MMM d')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickSnooze(2)}
                className="h-12 rounded-xl flex-col gap-0.5"
                disabled={snoozeTask.isPending}
              >
                <span className="text-sm font-medium">In 2 days</span>
                <span className="text-xs text-muted-foreground">{format(addDays(date, 2), 'MMM d')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickSnooze(7)}
                className="h-12 rounded-xl flex-col gap-0.5"
                disabled={snoozeTask.isPending}
              >
                <span className="text-sm font-medium">Next week</span>
                <span className="text-xs text-muted-foreground">{format(addDays(date, 7), 'MMM d')}</span>
              </Button>
            </div>

            {/* Custom date picker */}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl justify-start gap-3"
                  disabled={snoozeTask.isPending}
                >
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  Pick a date
                  {snoozeDate && snoozeDate !== tomorrow && (
                    <span className="ml-auto text-muted-foreground">
                      {format(snoozeDate, 'MMM d, yyyy')}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={snoozeDate}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setSnoozeDate(newDate);
                      setShowCalendar(false);
                      handleSnooze(newDate);
                    }
                  }}
                  disabled={(d) => isBefore(d, startOfDay(tomorrow))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Cancel button */}
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full mt-4 text-muted-foreground"
        >
          Cancel
        </Button>
      </SheetContent>
    </Sheet>
  );
};
