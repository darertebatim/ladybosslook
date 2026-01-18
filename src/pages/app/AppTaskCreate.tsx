import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { X, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useKeyboard } from '@/hooks/useKeyboard';
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTask,
  useSubtasks,
  useUserTags,
  useCreateTag,
  TaskColor,
  RepeatPattern,
  TASK_COLOR_CLASSES,
} from '@/hooks/useTaskPlanner';
import { IconPicker, TaskIcon } from '@/components/app/IconPicker';

// Color options
const COLOR_OPTIONS: TaskColor[] = ['pink', 'peach', 'yellow', 'lime', 'sky', 'mint', 'lavender'];

// Repeat intervals
const REPEAT_INTERVALS = [1, 2, 3, 4, 5, 6, 7, 14, 21, 30];

// Reminder time options
const REMINDER_TIMES = Array.from({ length: 24 * 4 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

const AppTaskCreate = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();
  const isEditing = !!taskId;
  const { effectiveInset, isKeyboardOpen } = useKeyboard();

  // Form state
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('Sun');
  const [color, setColor] = useState<TaskColor>('yellow');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatPattern, setRepeatPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [tag, setTag] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Sheet states
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Load existing task data for editing
  const { data: existingTask } = useTask(taskId);
  const { data: existingSubtasks } = useSubtasks(taskId);
  const { data: userTags = [] } = useUserTags();
  const createTag = useCreateTag();

  // Populate form when editing
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setIcon(existingTask.emoji);
      setColor(existingTask.color as TaskColor);
      if (existingTask.scheduled_date) {
        setScheduledDate(new Date(existingTask.scheduled_date));
      }
      setScheduledTime(existingTask.scheduled_time);
      
      if (existingTask.repeat_pattern !== 'none') {
        setRepeatEnabled(true);
        if (['daily', 'weekly', 'monthly'].includes(existingTask.repeat_pattern)) {
          setRepeatPattern(existingTask.repeat_pattern as 'daily' | 'weekly' | 'monthly');
        }
      }
      
      if (existingTask.reminder_enabled) {
        setReminderEnabled(true);
        if (existingTask.scheduled_time) {
          setReminderTime(existingTask.scheduled_time);
        }
      }
      
      setTag(existingTask.tag);
    }
  }, [existingTask]);

  useEffect(() => {
    if (existingSubtasks) {
      setSubtasks(existingSubtasks.map(s => s.title));
    }
  }, [existingSubtasks]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      emoji: icon,
      color,
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      scheduled_time: scheduledTime,
      repeat_pattern: (repeatEnabled ? repeatPattern : 'none') as RepeatPattern,
      reminder_enabled: reminderEnabled,
      reminder_offset: 0,
      tag,
      subtasks: subtasks.filter(s => s.trim()),
    };

    if (isEditing && taskId) {
      await updateTask.mutateAsync({ id: taskId, ...taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }

    navigate('/app/planner');
  };

  const handleDelete = async () => {
    if (!taskId) return;
    
    if (confirm('Delete this task?')) {
      await deleteTask.mutateAsync(taskId);
      navigate('/app/planner');
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Format time for display
  const formatTimeDisplay = (time: string | null) => {
    if (!time) return 'Anytime';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatReminderTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRepeatSummary = () => {
    if (!repeatEnabled) return 'Off';
    const intervalText = repeatInterval === 1 ? '' : `${repeatInterval} `;
    const patternText = {
      daily: repeatInterval === 1 ? 'day' : 'days',
      weekly: repeatInterval === 1 ? 'week' : 'weeks', 
      monthly: repeatInterval === 1 ? 'month' : 'months',
    }[repeatPattern];
    return `Every ${intervalText}${patternText}`;
  };

  return (
    <div 
      className="flex flex-col min-h-screen bg-background"
      style={{ paddingBottom: isKeyboardOpen ? effectiveInset : 0 }}
    >
      {/* Header - iOS Standard */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={() => navigate('/app/planner')} className="p-2 -ml-2">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h1>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createTask.isPending || updateTask.isPending}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div style={{ height: 'calc(48px + max(12px, env(safe-area-inset-top)))' }} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Icon & Title */}
        <div className="p-6 text-center border-b">
          <button
            onClick={() => setShowIconPicker(true)}
            className="w-20 h-20 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4 hover:bg-muted transition-colors active:scale-95"
          >
            <TaskIcon iconName={icon} size={36} className="text-foreground/80" />
          </button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            placeholder="Task name"
            className="text-center text-lg border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
            maxLength={50}
          />
          <span className="text-xs text-muted-foreground">{title.length}/50</span>
        </div>

        {/* Color picker */}
        <div className="p-4 border-b">
          <div className="flex justify-center gap-3">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all',
                  TASK_COLOR_CLASSES[c],
                  color === c && 'ring-2 ring-offset-2 ring-foreground scale-110'
                )}
              />
            ))}
          </div>
        </div>

        {/* Settings list */}
        <div className="divide-y">
          {/* Date */}
          <button
            onClick={() => setShowDatePicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📅</span>
              <span className="font-medium">Date</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

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
              <span>{getRepeatSummary()}</span>
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

          {/* Reminder */}
          <button
            onClick={() => setShowReminderPicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔔</span>
              <span className="font-medium">Reminder</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{reminderEnabled ? formatReminderTimeDisplay(reminderTime) : 'Off'}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Tag */}
          <button
            onClick={() => setShowTagPicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🏷️</span>
              <span className="font-medium">Tag</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="capitalize">{tag || 'None'}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Subtasks */}
        <div className="p-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Subtasks</h3>
          
          {subtasks.map((subtask, index) => (
            <div key={index} className="flex items-center gap-3 mb-3 bg-muted/50 rounded-xl px-4 py-3">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              <span className="flex-1">{subtask}</span>
              <button onClick={() => removeSubtask(index)} className="p-1">
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
            <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              placeholder="Add subtask"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
            />
          </div>
        </div>

        {/* Delete button (edit mode only) */}
        {isEditing && (
          <div className="p-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full"
              disabled={deleteTask.isPending}
            >
              Delete Task
            </Button>
          </div>
        )}

        {/* Bottom safe area */}
        <div className="pb-safe" />
      </div>

      {/* Icon Picker */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedIcon={icon}
        onSelect={setIcon}
      />

      {/* Date Picker Sheet */}
      <Sheet open={showDatePicker} onOpenChange={setShowDatePicker}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Select date</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setScheduledDate(new Date());
                setShowDatePicker(false);
              }}
              className="w-full text-left p-3 rounded-xl hover:bg-muted active:bg-muted/80"
            >
              Today
            </button>
            <button
              onClick={() => {
                setScheduledDate(new Date(Date.now() + 86400000));
                setShowDatePicker(false);
              }}
              className="w-full text-left p-3 rounded-xl hover:bg-muted active:bg-muted/80"
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={format(scheduledDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setScheduledDate(new Date(e.target.value));
                setShowDatePicker(false);
              }}
              className="w-full p-3 rounded-xl border bg-background"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Time Picker Sheet */}
      <Sheet open={showTimePicker} onOpenChange={setShowTimePicker}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh]">
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
                "w-full text-left p-3 rounded-xl hover:bg-muted mb-2",
                scheduledTime === null && "bg-violet-100 text-violet-700 font-medium"
              )}
            >
              Anytime
            </button>
            <div className="h-48 overflow-y-auto space-y-1">
              {REMINDER_TIMES.filter((_, i) => i % 2 === 0).map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setScheduledTime(time);
                    setShowTimePicker(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl hover:bg-muted",
                    scheduledTime === time && "bg-violet-100 text-violet-700 font-medium"
                  )}
                >
                  {formatTimeDisplay(time)}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Repeat Picker Sheet - Enhanced Me+ Style */}
      <Sheet open={showRepeatPicker} onOpenChange={setShowRepeatPicker}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Repeat</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Repeat</p>
                <p className="text-sm text-muted-foreground">Set a cycle for your plan</p>
              </div>
              <Switch
                checked={repeatEnabled}
                onCheckedChange={setRepeatEnabled}
              />
            </div>

            {repeatEnabled && (
              <>
                {/* Pattern selector */}
                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                  {(['daily', 'weekly', 'monthly'] as const).map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setRepeatPattern(pattern)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize',
                        repeatPattern === pattern
                          ? 'bg-background shadow-sm text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>

                {/* Interval selector */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Every {repeatInterval} {repeatPattern === 'daily' ? (repeatInterval === 1 ? 'day' : 'days') : repeatPattern === 'weekly' ? (repeatInterval === 1 ? 'week' : 'weeks') : (repeatInterval === 1 ? 'month' : 'months')}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {REPEAT_INTERVALS.slice(0, 7).map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setRepeatInterval(interval)}
                        className={cn(
                          'w-10 h-10 rounded-full text-sm font-medium transition-all shrink-0',
                          repeatInterval === interval
                            ? 'bg-violet-600 text-white'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={() => setShowRepeatPicker(false)}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reminder Picker Sheet - Enhanced Me+ Style */}
      <Sheet open={showReminderPicker} onOpenChange={setShowReminderPicker}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh]">
          <SheetHeader>
            <SheetTitle>
              {reminderEnabled ? `Remind me at ${formatReminderTimeDisplay(reminderTime)}` : 'Reminder'}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reminder</p>
                <p className="text-sm text-muted-foreground">Set a specific time to remind me</p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="h-48 overflow-y-auto space-y-1 bg-muted/30 rounded-xl p-2">
                {REMINDER_TIMES.filter((_, i) => i % 2 === 0).map((time) => (
                  <button
                    key={time}
                    onClick={() => setReminderTime(time)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all",
                      reminderTime === time 
                        ? "bg-violet-100 text-violet-700 font-medium" 
                        : "hover:bg-muted"
                    )}
                  >
                    {formatReminderTimeDisplay(time)}
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={() => setShowReminderPicker(false)}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tag Picker Sheet */}
      <Sheet open={showTagPicker} onOpenChange={setShowTagPicker}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh]">
          <SheetHeader>
            <SheetTitle>Select tag</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setTag(null);
                setShowTagPicker(false);
              }}
              className={cn(
                "w-full text-left p-3 rounded-xl hover:bg-muted",
                tag === null && "bg-violet-100 text-violet-700 font-medium"
              )}
            >
              None
            </button>
            {['morning', 'business', 'selfcare', 'evening', 'wellness'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTag(t);
                  setShowTagPicker(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl hover:bg-muted capitalize",
                  tag === t && "bg-violet-100 text-violet-700 font-medium"
                )}
              >
                {t}
              </button>
            ))}
            {userTags.filter(t => !['morning', 'business', 'selfcare', 'evening', 'wellness'].includes(t.name)).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTag(t.name);
                  setShowTagPicker(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl hover:bg-muted capitalize",
                  tag === t.name && "bg-violet-100 text-violet-700 font-medium"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AppTaskCreate;
