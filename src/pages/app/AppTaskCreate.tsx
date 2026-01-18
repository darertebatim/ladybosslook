import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { X, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

// Emoji picker - common task emojis
const EMOJI_OPTIONS = [
  '☀️', '🎯', '💪', '🙏', '✨', '📝', '📖', '🧘', '💧', '🏃‍♀️',
  '💰', '📧', '📞', '🥗', '😴', '💕', '🌸', '🔥', '⭐', '🎨',
];

// Color options
const COLOR_OPTIONS: TaskColor[] = ['pink', 'peach', 'yellow', 'lime', 'sky', 'mint', 'lavender'];

// Repeat options
const REPEAT_OPTIONS: { value: RepeatPattern; label: string }[] = [
  { value: 'none', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekend', label: 'Weekends only' },
];

// Reminder options
const REMINDER_OPTIONS = [
  { value: -1, label: 'No reminder' },
  { value: 0, label: 'At time' },
  { value: 10, label: '10 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
];

const AppTaskCreate = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();
  const isEditing = !!taskId;

  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('☀️');
  const [color, setColor] = useState<TaskColor>('yellow');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>('none');
  const [reminderOffset, setReminderOffset] = useState(-1);
  const [tag, setTag] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Sheet states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
      setEmoji(existingTask.emoji);
      setColor(existingTask.color as TaskColor);
      if (existingTask.scheduled_date) {
        setScheduledDate(new Date(existingTask.scheduled_date));
      }
      setScheduledTime(existingTask.scheduled_time);
      setRepeatPattern(existingTask.repeat_pattern as RepeatPattern);
      setReminderOffset(existingTask.reminder_enabled ? existingTask.reminder_offset : -1);
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
      emoji,
      color,
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      scheduled_time: scheduledTime,
      repeat_pattern: repeatPattern,
      reminder_enabled: reminderOffset >= 0,
      reminder_offset: reminderOffset >= 0 ? reminderOffset : 0,
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

  const handleCreateTag = async (name: string) => {
    await createTag.mutateAsync(name);
    setTag(name);
    setShowTagPicker(false);
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b safe-area-inset-top">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Emoji & Title */}
        <div className="p-6 text-center border-b">
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="text-5xl mb-4 hover:scale-110 transition-transform"
          >
            {emoji}
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
                  color === c && 'ring-2 ring-offset-2 ring-foreground'
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
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span>📅</span>
              <span>Date</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Repeat */}
          <button
            onClick={() => setShowRepeatPicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span>🔄</span>
              <span>Repeat</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{REPEAT_OPTIONS.find(r => r.value === repeatPattern)?.label}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Time */}
          <button
            onClick={() => setShowTimePicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span>⏰</span>
              <span>Time</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{formatTimeDisplay(scheduledTime)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Reminder */}
          <button
            onClick={() => setShowReminderPicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span>🔔</span>
              <span>Reminder</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{REMINDER_OPTIONS.find(r => r.value === reminderOffset)?.label}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Tag */}
          <button
            onClick={() => setShowTagPicker(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span>🏷️</span>
              <span>Tag</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="capitalize">{tag || 'None'}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Subtasks */}
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Subtasks</h3>
          
          {subtasks.map((subtask, index) => (
            <div key={index} className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
              <span className="flex-1">{subtask}</span>
              <button onClick={() => removeSubtask(index)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-3">
            <Plus className="h-5 w-5 text-muted-foreground" />
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
      </div>

      {/* Emoji Picker Sheet */}
      <Sheet open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh]">
          <SheetHeader>
            <SheetTitle>Choose an emoji</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-5 gap-4 p-4">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setEmoji(e);
                  setShowEmojiPicker(false);
                }}
                className={cn(
                  'text-3xl p-2 rounded-lg hover:bg-muted transition-colors',
                  emoji === e && 'bg-muted ring-2 ring-primary'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

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
              className="w-full text-left p-3 rounded-lg hover:bg-muted"
            >
              Today
            </button>
            <button
              onClick={() => {
                setScheduledDate(new Date(Date.now() + 86400000));
                setShowDatePicker(false);
              }}
              className="w-full text-left p-3 rounded-lg hover:bg-muted"
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
              className="w-full p-3 rounded-lg border bg-background"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Time Picker Sheet */}
      <Sheet open={showTimePicker} onOpenChange={setShowTimePicker}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Select time</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setScheduledTime(null);
                setShowTimePicker(false);
              }}
              className={cn(
                "w-full text-left p-3 rounded-lg hover:bg-muted",
                scheduledTime === null && "bg-muted"
              )}
            >
              Anytime
            </button>
            <input
              type="time"
              value={scheduledTime || '09:00'}
              onChange={(e) => {
                setScheduledTime(e.target.value);
                setShowTimePicker(false);
              }}
              className="w-full p-3 rounded-lg border bg-background"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Repeat Picker Sheet */}
      <Sheet open={showRepeatPicker} onOpenChange={setShowRepeatPicker}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Repeat</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            {REPEAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setRepeatPattern(option.value);
                  setShowRepeatPicker(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-muted",
                  repeatPattern === option.value && "bg-muted"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Reminder Picker Sheet */}
      <Sheet open={showReminderPicker} onOpenChange={setShowReminderPicker}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Reminder</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            {REMINDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setReminderOffset(option.value);
                  setShowReminderPicker(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-muted",
                  reminderOffset === option.value && "bg-muted"
                )}
              >
                {option.label}
              </button>
            ))}
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
                "w-full text-left p-3 rounded-lg hover:bg-muted",
                tag === null && "bg-muted"
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
                  "w-full text-left p-3 rounded-lg hover:bg-muted capitalize",
                  tag === t && "bg-muted"
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
                  "w-full text-left p-3 rounded-lg hover:bg-muted capitalize",
                  tag === t.name && "bg-muted"
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
