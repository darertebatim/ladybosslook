import { useState } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TaskColor, TASK_COLOR_CLASSES } from '@/hooks/useTaskPlanner';
import { IconPicker, TaskIcon } from '@/components/app/IconPicker';

// Color options matching AppTaskCreate
const COLOR_OPTIONS: TaskColor[] = ['pink', 'peach', 'yellow', 'lime', 'sky', 'mint', 'lavender'];

// Repeat patterns
const REPEAT_PATTERNS = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'none', label: 'No repeat' },
] as const;

export interface EditableTask {
  id: string;
  title: string;
  icon: string;
  color: TaskColor;
  repeatPattern: 'daily' | 'weekly' | 'monthly' | 'none';
  scheduledTime: string | null;
  tag: string | null;
}

interface RoutineTaskEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: EditableTask | null;
  routineTag: string;
  onSave: (task: EditableTask) => void;
}

export function RoutineTaskEditSheet({
  open,
  onOpenChange,
  task,
  routineTag,
  onSave,
}: RoutineTaskEditSheetProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [icon, setIcon] = useState(task?.icon || 'Sun');
  const [color, setColor] = useState<TaskColor>(task?.color || 'yellow');
  const [repeatPattern, setRepeatPattern] = useState<'daily' | 'weekly' | 'monthly' | 'none'>(
    task?.repeatPattern || 'daily'
  );
  const [scheduledTime, setScheduledTime] = useState<string | null>(task?.scheduledTime || null);
  const [tag, setTag] = useState<string | null>(task?.tag || routineTag);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Sync state when task changes
  useState(() => {
    if (task) {
      setTitle(task.title);
      setIcon(task.icon);
      setColor(task.color);
      setRepeatPattern(task.repeatPattern);
      setScheduledTime(task.scheduledTime);
      setTag(task.tag || routineTag);
    }
  });

  const handleSave = () => {
    if (!task || !title.trim()) return;
    onSave({
      id: task.id,
      title: title.trim(),
      icon,
      color,
      repeatPattern,
      scheduledTime,
      tag,
    });
    onOpenChange(false);
  };

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return 'Anytime';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRepeatLabel = () => {
    return REPEAT_PATTERNS.find(p => p.value === repeatPattern)?.label || 'Every day';
  };

  // Time options (every 30 min)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  if (!task) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] rounded-t-3xl"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
              <button 
                onClick={() => onOpenChange(false)} 
                className="p-2 -ml-2"
              >
                <X className="h-5 w-5" />
              </button>
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                size="sm"
                variant="ghost"
                className="text-primary font-semibold"
              >
                Save
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Icon & Title - Colored header area */}
              <div className={cn(
                'p-6 text-center',
                TASK_COLOR_CLASSES[color]
              )}>
                <button
                  onClick={() => setShowIconPicker(true)}
                  className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur flex items-center justify-center mx-auto mb-3 hover:bg-white/80 transition-colors active:scale-95"
                >
                  <TaskIcon iconName={icon} size={32} className="text-foreground/80" />
                </button>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task name"
                  className="text-center text-xl font-semibold border-0 bg-transparent focus-visible:ring-0 placeholder:text-foreground/40"
                />
                <p className="text-sm text-foreground/50 mt-1">Tap to rename</p>
              </div>

              {/* Color picker */}
              <div className="p-4 border-b">
                <div className="flex justify-center gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        TASK_COLOR_CLASSES[c],
                        color === c && 'ring-2 ring-offset-2 ring-foreground/20'
                      )}
                    >
                      {color === c && <Check className="w-5 h-5 text-foreground/70" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white dark:bg-card rounded-2xl mx-4 mt-4 overflow-hidden divide-y">
                {/* Starting from */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <span className="font-medium">Starting from</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Today</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Repeat */}
                <button
                  onClick={() => setShowRepeatPicker(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔄</span>
                    <span className="font-medium">Repeat</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{getRepeatLabel()}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>

                {/* Time */}
                <button
                  onClick={() => setShowTimePicker(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏰</span>
                    <span className="font-medium">Time</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formatTimeDisplay(scheduledTime)}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>

                {/* Reminder - Display only for now */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔔</span>
                    <span className="font-medium">Reminder</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>No Reminder</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Tag */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏷️</span>
                    <span className="font-medium">Tag</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{tag || 'None'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Goal section */}
              <div className="bg-white dark:bg-card rounded-2xl mx-4 mt-4 overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium">Goal</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Off</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Subtasks placeholder */}
              <div className="bg-white dark:bg-card rounded-2xl mx-4 mt-4 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <span className="text-lg">➕</span>
                  <span className="font-medium">Subtasks</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-3 px-4">
                Subtasks can be set as your daily routine or checklist
              </p>

              <div className="pb-safe h-8" />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Icon Picker */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedIcon={icon}
        onSelect={setIcon}
      />

      {/* Repeat Picker */}
      <Sheet open={showRepeatPicker} onOpenChange={setShowRepeatPicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Repeat</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            {REPEAT_PATTERNS.map((pattern) => (
              <button
                key={pattern.value}
                onClick={() => {
                  setRepeatPattern(pattern.value);
                  setShowRepeatPicker(false);
                }}
                className={cn(
                  'w-full text-left p-4 rounded-xl hover:bg-muted flex items-center justify-between',
                  repeatPattern === pattern.value && 'bg-primary/10'
                )}
              >
                <span>{pattern.label}</span>
                {repeatPattern === pattern.value && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Time Picker */}
      <Sheet open={showTimePicker} onOpenChange={setShowTimePicker}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Select time</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <button
              onClick={() => {
                setScheduledTime(null);
                setShowTimePicker(false);
              }}
              className={cn(
                'w-full text-left p-3 rounded-xl hover:bg-muted mb-2 flex items-center justify-between',
                scheduledTime === null && 'bg-primary/10'
              )}
            >
              <span>Anytime</span>
              {scheduledTime === null && <Check className="w-5 h-5 text-primary" />}
            </button>
            <div className="h-48 overflow-y-auto space-y-1">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setScheduledTime(time);
                    setShowTimePicker(false);
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-xl hover:bg-muted flex items-center justify-between',
                    scheduledTime === time && 'bg-primary/10'
                  )}
                >
                  <span>{formatTimeDisplay(time)}</span>
                  {scheduledTime === time && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
