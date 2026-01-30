import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, addDays, nextMonday, startOfDay } from 'date-fns';
import { X, ChevronRight, Plus, Trash2, Music, XCircle, Sparkles, ArrowLeft, Check, Calendar, Repeat, Clock, Bell, Tag, AlarmClock, Target, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useKeyboard } from '@/hooks/useKeyboard';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
  TASK_COLORS,
} from '@/hooks/useTaskPlanner';
import { EmojiPicker } from '@/components/app/EmojiPicker';
import { TaskIcon } from '@/components/app/IconPicker';
import { TimeWheelPicker } from '@/components/app/TimeWheelPicker';
import { PRO_LINK_TYPES, ProLinkType, PRO_LINK_CONFIGS } from '@/lib/proTaskTypes';
import { GoalSettingsSheet, GoalSettings, formatGoalTarget } from '@/components/app/GoalSettingsSheet';

// Me+ style pastel color options with hex values
const COLOR_OPTIONS: { name: TaskColor; hex: string }[] = [
  { name: 'pink', hex: '#FFD6E8' },
  { name: 'peach', hex: '#FFE4C4' },
  { name: 'yellow', hex: '#FFF59D' },
  { name: 'lime', hex: '#E8F5A3' },
  { name: 'sky', hex: '#C5E8FA' },
  { name: 'mint', hex: '#B8F5E4' },
  { name: 'lavender', hex: '#E8D4F8' },
];

// Note: Tags are now fetched from routine_categories table dynamically

// Reminder presets (Me+ style)
const REMINDER_PRESETS = [
  { label: 'Morning reminder', time: '09:00' },
  { label: 'Midday reminder', time: '12:00' },
  { label: 'Afternoon reminder', time: '16:00' },
  { label: 'Evening reminder', time: '19:00' },
];

// Repeat intervals
const REPEAT_INTERVALS = [1, 2, 3, 4, 5, 6, 7, 14, 21, 30];

// Reminder time options
const REMINDER_TIMES = Array.from({ length: 24 * 4 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

// Data type for sheet mode callback
export interface TaskFormData {
  title: string;
  icon: string;
  color: TaskColor;
  scheduledDate: Date;
  scheduledTime: string | null;
  repeatEnabled: boolean;
  repeatPattern: 'daily' | 'weekly' | 'monthly';
  repeatInterval: number;
  repeatDays: number[];
  reminderEnabled: boolean;
  reminderTime: string;
  isUrgent: boolean;
  tag: string | null;
  subtasks: string[];
  linkedPlaylistId: string | null;
  proLinkType: ProLinkType | null;
  proLinkValue: string | null;
  goalEnabled: boolean;
  goalType: 'timer' | 'count';
  goalTarget: number;
  goalUnit: string;
}

// Playlist type for the picker
interface PlaylistOption {
  id: string;
  name: string;
  cover_image_url: string | null;
  category: string | null;
}

// Props for sheet mode
interface AppTaskCreateProps {
  isSheet?: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  initialData?: Partial<TaskFormData>;
  onSaveSheet?: (data: TaskFormData) => void;
}

const AppTaskCreate = ({ 
  isSheet = false, 
  sheetOpen = false, 
  onSheetOpenChange, 
  initialData,
  onSaveSheet 
}: AppTaskCreateProps) => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();
  const [searchParams] = useSearchParams();
  
  // Get URL params for pre-filled data from quick start
  const urlName = searchParams.get('name') || '';
  const urlEmoji = searchParams.get('emoji') || '';
  const urlColor = searchParams.get('color') as TaskColor | null;
  
  const isEditing = !!taskId || !!initialData;
  const { effectiveInset, isKeyboardOpen } = useKeyboard();

  // Form state - prioritize URL params for new tasks
  const [title, setTitle] = useState(initialData?.title || urlName || '');
  const [icon, setIcon] = useState(initialData?.icon || urlEmoji || '☀️');
  const [color, setColor] = useState<TaskColor>(initialData?.color || urlColor || 'yellow');
  const [scheduledDate, setScheduledDate] = useState<Date>(initialData?.scheduledDate || new Date());
  const [scheduledTime, setScheduledTime] = useState<string | null>(initialData?.scheduledTime ?? null);
  const [scheduledEndTime, setScheduledEndTime] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<'point' | 'period'>('point');
  const [repeatEnabled, setRepeatEnabled] = useState(initialData?.repeatEnabled ?? false);
  const [repeatPattern, setRepeatPattern] = useState<'daily' | 'weekly' | 'monthly'>(initialData?.repeatPattern || 'daily');
  const [repeatInterval, setRepeatInterval] = useState(initialData?.repeatInterval || 1);
  const [repeatDays, setRepeatDays] = useState<number[]>(initialData?.repeatDays || []);
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime || '09:00');
  const [isUrgent, setIsUrgent] = useState(initialData?.isUrgent ?? false);
  const [showUrgentConfirm, setShowUrgentConfirm] = useState(false);
  const [tag, setTag] = useState<string | null>(initialData?.tag ?? null);
  const [subtasks, setSubtasks] = useState<string[]>(initialData?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [linkedPlaylistId, setLinkedPlaylistId] = useState<string | null>(initialData?.linkedPlaylistId ?? null);
  const [proLinkType, setProLinkType] = useState<ProLinkType | null>(initialData?.proLinkType ?? null);
  const [proLinkValue, setProLinkValue] = useState<string | null>(initialData?.proLinkValue ?? null);
  const [newTagName, setNewTagName] = useState('');
  
  // Goal settings state - defaults: timer=1 min (60s), count=2
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    enabled: initialData?.goalEnabled ?? false,
    type: initialData?.goalType ?? 'count',
    target: initialData?.goalTarget ?? 2,
    unit: initialData?.goalUnit ?? 'times',
  });

  // Sheet states
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showRepeatCustom, setShowRepeatCustom] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showReminderCustom, setShowReminderCustom] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showProLinkPicker, setShowProLinkPicker] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showBreathingPicker, setShowBreathingPicker] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  
  // Refs for subtask inputs to scroll into view
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const subtaskRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Ref to track the currently focused input for keyboard scroll fix
  const focusedInputRef = useRef<HTMLInputElement | null>(null);
  const prevKeyboardOpen = useRef(false);
  
  // iOS keyboard scroll fix: scroll focused input into view when keyboard opens
  useEffect(() => {
    if (isKeyboardOpen && !prevKeyboardOpen.current && focusedInputRef.current) {
      // Keyboard just opened - scroll the focused input into view after viewport settles
      setTimeout(() => {
        focusedInputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 50);
    }
    prevKeyboardOpen.current = isKeyboardOpen;
  }, [isKeyboardOpen]);
  
  // Determine the current pro link config
  const proConfig = proLinkType ? PRO_LINK_CONFIGS[proLinkType] : null;

  // Fetch playlists for linking
  const { data: playlists = [] } = useQuery({
    queryKey: ['linkable-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url, category')
        .eq('is_hidden', false)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as PlaylistOption[];
    },
  });

  // Fetch breathing exercises for linking
  const { data: breathingExercises = [] } = useQuery({
    queryKey: ['linkable-breathing-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('id, name, emoji, category')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as { id: string; name: string; emoji: string | null; category: string }[];
    },
  });

  // Fetch routine categories for tags (dynamic instead of hardcoded)
  const { data: routineCategories = [] } = useQuery({
    queryKey: ['routine-categories-for-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('name, slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as { name: string; slug: string }[];
    },
  });

  // Get selected playlist info
  const selectedPlaylist = playlists.find(p => p.id === linkedPlaylistId);
  
  // Get selected breathing exercise info
  const selectedBreathingExercise = breathingExercises.find(b => b.id === proLinkValue);

  // Filter playlists by search
  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(playlistSearchQuery.toLowerCase())
  );

  // Mutations (only used in page mode)
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Load existing task data for editing (page mode only)
  const { data: existingTask } = useTask(isSheet ? undefined : taskId);
  const { data: existingSubtasks } = useSubtasks(isSheet ? undefined : taskId);
  const { data: userTags = [] } = useUserTags();
  const createTag = useCreateTag();

  // Check for existing goal progress (task completions)
  const { data: hasExistingProgress = false } = useQuery({
    queryKey: ['task-has-progress', taskId],
    queryFn: async () => {
      if (!taskId) return false;
      
      const { data, error } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', taskId)
        .limit(1);
      
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!taskId && !isSheet,
  });

  // Handler to reset progress when goal type/unit changes
  const handleResetProgress = async () => {
    if (!taskId) return;
    
    await supabase
      .from('task_completions')
      .delete()
      .eq('task_id', taskId);
  };

  // Reset form when initialData changes (sheet mode)
  useEffect(() => {
    if (isSheet && initialData) {
      setTitle(initialData.title || '');
      setIcon(initialData.icon || '☀️');
      setColor(initialData.color || 'yellow');
      setScheduledDate(initialData.scheduledDate || new Date());
      setScheduledTime(initialData.scheduledTime ?? null);
      const repeatVal = initialData.repeatPattern as string | undefined;
      const hasRepeat = repeatVal && repeatVal !== 'none';
      setRepeatEnabled(initialData.repeatEnabled ?? !!hasRepeat);
      setRepeatPattern(hasRepeat && ['daily', 'weekly', 'monthly'].includes(repeatVal) ? repeatVal as 'daily' | 'weekly' | 'monthly' : 'daily');
      setRepeatInterval(initialData.repeatInterval || 1);
      setRepeatDays(initialData.repeatDays || []);
      setReminderEnabled(initialData.reminderEnabled ?? false);
      setReminderTime(initialData.reminderTime || '09:00');
      setIsUrgent(initialData.isUrgent ?? false);
      setTag(initialData.tag ?? null);
      setSubtasks(initialData.subtasks || []);
      setLinkedPlaylistId(initialData.linkedPlaylistId ?? null);
      setProLinkType(initialData.proLinkType ?? null);
      setProLinkValue(initialData.proLinkValue ?? null);
      setGoalSettings({
        enabled: initialData.goalEnabled ?? false,
        type: initialData.goalType ?? 'count',
        target: initialData.goalTarget ?? 1,
        unit: initialData.goalUnit ?? 'times',
      });
    }
  }, [isSheet, initialData, sheetOpen]);

  // Populate form when editing (page mode)
  useEffect(() => {
    if (!isSheet && existingTask) {
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
      
      setIsUrgent(existingTask.is_urgent ?? false);
      setTag(existingTask.tag);
      setLinkedPlaylistId(existingTask.linked_playlist_id ?? null);
      setProLinkType(existingTask.pro_link_type ?? null);
      setProLinkValue(existingTask.pro_link_value ?? null);
      
      // Goal settings from existing task
      setGoalSettings({
        enabled: (existingTask as any).goal_enabled ?? false,
        type: (existingTask as any).goal_type ?? 'count',
        target: (existingTask as any).goal_target ?? 1,
        unit: (existingTask as any).goal_unit ?? 'times',
      });
    }
  }, [existingTask, isSheet]);

  useEffect(() => {
    if (!isSheet && existingSubtasks) {
      setSubtasks(existingSubtasks.map(s => s.title));
    }
  }, [existingSubtasks, isSheet]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    // Sheet mode - return data via callback
    if (isSheet && onSaveSheet) {
      onSaveSheet({
        title: title.trim(),
        icon,
        color,
        scheduledDate,
        scheduledTime,
        repeatEnabled,
        repeatPattern,
        repeatInterval,
        repeatDays,
        reminderEnabled,
        reminderTime,
        isUrgent,
        tag,
        subtasks: subtasks.filter(s => s.trim()),
        linkedPlaylistId,
        proLinkType,
        proLinkValue,
        goalEnabled: goalSettings.enabled,
        goalType: goalSettings.type,
        goalTarget: goalSettings.target,
        goalUnit: goalSettings.unit,
      });
      return;
    }

    // Page mode - save to database
    const taskData = {
      title: title.trim(),
      emoji: icon,
      color,
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      scheduled_time: scheduledTime,
      repeat_pattern: (repeatEnabled ? repeatPattern : 'none') as RepeatPattern,
      repeat_days: repeatDays,
      reminder_enabled: reminderEnabled,
      reminder_offset: 0,
      is_urgent: isUrgent,
      tag,
      subtasks: subtasks.filter(s => s.trim()),
      linked_playlist_id: proLinkType === 'playlist' ? proLinkValue : linkedPlaylistId,
      pro_link_type: proLinkType,
      pro_link_value: proLinkValue,
      goal_enabled: goalSettings.enabled,
      goal_type: goalSettings.enabled ? goalSettings.type : null,
      goal_target: goalSettings.enabled ? goalSettings.target : null,
      goal_unit: goalSettings.enabled ? goalSettings.unit : null,
    };

    if (taskId) {
      await updateTask.mutateAsync({ id: taskId, ...taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }

    navigate('/app/home');
  };

  const handleDelete = async () => {
    if (!taskId) return;
    
    if (confirm('Delete this task?')) {
      await deleteTask.mutateAsync(taskId);
      navigate('/app/home');
    }
  };

  const handleClose = () => {
    if (isSheet && onSheetOpenChange) {
      onSheetOpenChange(false);
    } else {
      navigate('/app/home');
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
      // Keep focus on the new subtask input and scroll it into view
      setTimeout(() => {
        if (newSubtaskInputRef.current) {
          newSubtaskInputRef.current.focus();
          newSubtaskInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Store focused input ref for iOS keyboard scroll fix
  const handleSubtaskInputFocus = (element: HTMLInputElement | null) => {
    if (element && Capacitor.isNativePlatform()) {
      focusedInputRef.current = element;
      // The useEffect watching isKeyboardOpen will handle scrolling
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
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatReminderTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Calculate time offset (e.g., 10 mins before)
  const getTimeOffset = (time: string, offsetMinutes: number): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes - offsetMinutes;
    const newHours = Math.floor((totalMinutes + 1440) % 1440 / 60);
    const newMinutes = (totalMinutes + 1440) % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const getRepeatSummary = () => {
    if (!repeatEnabled) return 'No repeat';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (repeatPattern === 'weekly' && repeatDays.length > 0) {
      const days = repeatDays.map(d => dayNames[d]).join(', ');
      return `Weekly (${days})`;
    }
    
    if (repeatPattern === 'monthly') {
      const dayOfMonth = scheduledDate.getDate();
      const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
      return `Monthly (On ${dayOfMonth}${suffix})`;
    }
    
    return repeatPattern.charAt(0).toUpperCase() + repeatPattern.slice(1);
  };

  const getReminderSummary = () => {
    if (!reminderEnabled) return 'No Reminder';
    // If time is set and reminder matches certain offsets, show friendly names
    if (scheduledTime) {
      if (reminderTime === scheduledTime) return `At time of event (${formatReminderTimeDisplay(reminderTime)})`;
      if (reminderTime === getTimeOffset(scheduledTime, 10)) return `10 minutes early (${formatReminderTimeDisplay(reminderTime)})`;
      if (reminderTime === getTimeOffset(scheduledTime, 30)) return `30 minutes early (${formatReminderTimeDisplay(reminderTime)})`;
      if (reminderTime === getTimeOffset(scheduledTime, 60)) return `1 hour early (${formatReminderTimeDisplay(reminderTime)})`;
    }
    return `Custom (${formatReminderTimeDisplay(reminderTime)})`;
  };

  // Get color hex for background
  const getColorHex = (colorName: TaskColor): string => {
    const colorOption = COLOR_OPTIONS.find(c => c.name === colorName);
    return colorOption?.hex || '#E8F4FD';
  };

  // Darken color for cards/containers
  const getDarkenedColor = (hex: string, amount: number = 0.15): string => {
    // Convert hex to HSL and reduce lightness
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    // Return slightly darker version
    const factor = 1 - amount;
    const newR = Math.round(r * factor * 255);
    const newG = Math.round(g * factor * 255);
    const newB = Math.round(b * factor * 255);
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const getRepeatTitle = () => {
    if (!repeatEnabled) return 'No repeat';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (repeatPattern === 'weekly' && repeatDays.length > 0) {
      const days = repeatDays.map(d => dayNames[d]).join(', ');
      return `Repeats every week on ${days}`;
    }
    
    if (repeatPattern === 'monthly') {
      const dayOfMonth = scheduledDate.getDate();
      const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
      return `Repeats every month on the ${dayOfMonth}${suffix}`;
    }
    
    if (repeatInterval === 1) {
      return `Repeats every ${repeatPattern === 'daily' ? 'day' : repeatPattern}`;
    }
    
    const unit = repeatPattern === 'daily' ? 'days' : repeatPattern === 'weekly' ? 'weeks' : 'months';
    return `Repeats every ${repeatInterval} ${unit}`;
  };

  const toggleRepeatDay = (day: number) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter(d => d !== day));
    } else {
      setRepeatDays([...repeatDays, day].sort());
    }
  };

  const handleAddTag = async () => {
    if (newTagName.trim()) {
      await createTag.mutateAsync(newTagName.trim());
      setTag(newTagName.trim());
      setNewTagName('');
      setShowTagPicker(false);
    }
  };

  // All tags combined (category names + user created tags that aren't already categories)
  const categoryNames = routineCategories.map(c => c.name);
  const allTags = [...categoryNames, ...userTags.filter(t => !categoryNames.includes(t.name)).map(t => t.name)];

  // The main content (Me+ style with dynamic background color)
  const bgColor = getColorHex(color);
  const content = (
    <div className="min-h-full transition-colors duration-300" style={{ backgroundColor: bgColor }}>
      {/* Icon & Title - Centered large emoji */}
      <div className="px-6 pt-6 pb-4 text-center">
        <button
          onClick={() => setShowIconPicker(true)}
          className="mx-auto mb-3 active:scale-95 transition-transform"
        >
          <TaskIcon iconName={icon} size={64} className="text-foreground/70" />
        </button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 50))}
          onFocus={(e) => {
            if (Capacitor.isNativePlatform()) {
              focusedInputRef.current = e.target;
            }
          }}
          placeholder="Task name"
          className="text-center text-xl font-semibold border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto py-1"
          maxLength={50}
        />
        <p className="text-sm text-muted-foreground mt-1">Tap to rename</p>
      </div>

      {/* Color picker - Horizontal circles with checkmark */}
      <div className="px-6 pb-6">
        <div className="flex justify-center gap-4">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.name)}
              className={cn(
                'w-12 h-12 rounded-full transition-all flex items-center justify-center',
                'border-2 border-transparent',
                color === c.name && 'ring-2 ring-foreground/20 ring-offset-2'
              )}
              style={{ backgroundColor: c.hex }}
            >
              {color === c.name && (
                <Check className="h-5 w-5 text-foreground/70" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Card - White rounded card with list */}
      <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Date */}
        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-foreground/70" />
            <span className="font-medium">{repeatEnabled ? 'Starting from' : 'Date'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{format(scheduledDate, 'MMM d') === format(new Date(), 'MMM d') ? 'Today' : format(scheduledDate, 'MMM d, yyyy')}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>

        {/* Repeat */}
        <button
          onClick={() => setShowRepeatPicker(true)}
          className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-foreground/70" />
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
          className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-foreground/70" />
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
          className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-foreground/70" />
            <span className="font-medium">Reminder</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{getReminderSummary()}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>

        {/* Urgent - Only show when reminder is enabled and time is set */}
        {reminderEnabled && scheduledTime && (
          <div className="flex items-center justify-between py-3 px-4 border-b border-muted/30">
            <div className="flex items-center gap-3">
              <AlarmClock className={cn("h-5 w-5", isUrgent ? "text-red-500" : "text-foreground/70")} />
              <div className="flex flex-col">
                <span className={cn("font-medium", isUrgent && "text-red-600")}>Urgent</span>
                <span className="text-xs text-muted-foreground">Alarm rings even on silent</span>
              </div>
            </div>
            <Switch 
              checked={isUrgent} 
              onCheckedChange={(checked) => {
                if (checked) {
                  setShowUrgentConfirm(true);
                } else {
                  setIsUrgent(false);
                }
              }}
              className="data-[state=checked]:bg-red-500"
            />
          </div>
        )}

        {/* Tag */}
        <button
          onClick={() => setShowTagPicker(true)}
          className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-foreground/70" />
            <span className="font-medium">Tag</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{tag || 'No tag'}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Goal - Separate card */}
      <div className="mx-4 mt-2 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowGoalSettings(true)}
          className={cn(
            "w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50",
            goalSettings.enabled && "bg-emerald-50 dark:bg-emerald-900/20"
          )}
        >
          <div className="flex items-center gap-3">
            <Target className={cn("h-5 w-5", goalSettings.enabled ? "text-emerald-600" : "text-foreground/70")} />
            <span className="font-medium">Goal</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{goalSettings.enabled ? formatGoalTarget(goalSettings) : 'Off'}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Pro Task Link - Separate card */}
      <div className="mx-4 mt-2 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowProLinkPicker(true)}
          className={cn(
            "w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 active:bg-muted/50",
            proLinkType && "bg-violet-50 dark:bg-violet-900/20"
          )}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={cn("h-5 w-5", proLinkType ? "text-violet-600" : "text-foreground/70")} />
            <span className="font-medium">Pro Task Link</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {proConfig ? (
              <span className="flex items-center gap-1.5">
                <proConfig.icon className="h-4 w-4" />
                <span className="truncate max-w-[100px]">{proConfig.label}</span>
              </span>
            ) : (
              <span>Off</span>
            )}
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Subtasks Card */}
      <div className="mx-4 mt-3 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {subtasks.map((subtask, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3 border-b border-muted/30">
            <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <div className="w-2 h-0.5 bg-muted-foreground/50 rounded-full" />
            </div>
            <span className="flex-1 text-foreground">{subtask}</span>
            <button 
              onClick={() => removeSubtask(index)} 
              className="p-1.5 rounded-full hover:bg-muted/50"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-3 px-4 py-3">
          <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={newSubtaskInputRef}
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            onFocus={(e) => handleSubtaskInputFocus(e.target as HTMLInputElement)}
            placeholder="Subtasks"
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-base placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Subtasks hint text */}
      <p className="text-center text-sm text-muted-foreground mt-3 px-6">
        Subtasks can be set as your daily routine or checklist
      </p>

      {/* Bottom safe area */}
      <div className="pb-safe h-8" />
    </div>
  );

  // Picker sheets (Me+ style)
  const pickerSheets = (
    <>
      {/* Emoji Picker */}
      <EmojiPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedEmoji={icon}
        onSelect={setIcon}
      />

      {/* Goal Settings Sheet */}
      <GoalSettingsSheet
        open={showGoalSettings}
        onOpenChange={setShowGoalSettings}
        value={goalSettings}
        onChange={setGoalSettings}
        hasExistingProgress={hasExistingProgress}
        onResetProgress={handleResetProgress}
      />

      {/* Date Picker Sheet - Me+ Full Page Style */}
      <Sheet open={showDatePicker} onOpenChange={setShowDatePicker}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl" hideCloseButton>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <button onClick={() => setShowDatePicker(false)} className="p-2 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">Date</span>
              <Button
                variant="ghost"
                onClick={() => setShowDatePicker(false)}
                className="text-primary font-medium"
              >
                Save
              </Button>
            </div>

            {/* Title */}
            <div className="text-center pb-4">
              <h2 className="text-2xl font-bold">
                {format(scheduledDate, 'MMM d') === format(new Date(), 'MMM d') ? 'Today' : format(scheduledDate, 'EEEE, MMM d')}
              </h2>
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-y-auto px-4">
              <CalendarComponent
                mode="single"
                selected={scheduledDate}
                onSelect={(date) => date && setScheduledDate(date)}
                disabled={(date) => date < startOfDay(new Date())}
                className="rounded-lg border-0 w-full pointer-events-auto"
              />

              {/* Quick select buttons */}
              <div className="flex gap-2 mt-6 pb-4">
                <button
                  onClick={() => {
                    setScheduledDate(new Date());
                    setShowDatePicker(false);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    format(scheduledDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      ? "bg-[#E8F4FD] text-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    setScheduledDate(addDays(new Date(), 1));
                    setShowDatePicker(false);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    format(scheduledDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd')
                      ? "bg-[#E8F4FD] text-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => {
                    setScheduledDate(nextMonday(new Date()));
                    setShowDatePicker(false);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    format(scheduledDate, 'yyyy-MM-dd') === format(nextMonday(new Date()), 'yyyy-MM-dd')
                      ? "bg-[#E8F4FD] text-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  Next Monday
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Time Picker Sheet - Me+ Style with Wheel */}
      <Sheet open={showTimePicker} onOpenChange={setShowTimePicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl" hideCloseButton>
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <button onClick={() => setShowTimePicker(false)} className="p-2 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">Time</span>
              <Button
                variant="ghost"
                onClick={() => setShowTimePicker(false)}
                className="text-primary font-medium"
              >
                Save
              </Button>
            </div>

            {/* Dynamic title */}
            <div className="text-center pb-4 px-6">
              <h2 className="text-2xl font-bold">
                {scheduledTime 
                  ? timeMode === 'period' && scheduledEndTime
                    ? `Do it at ${formatTimeDisplay(scheduledTime)} ~ ${formatTimeDisplay(scheduledEndTime)} of the day`
                    : `Do it at ${formatTimeDisplay(scheduledTime)} of the day`
                  : 'Anytime'}
              </h2>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                  <Clock className="h-5 w-5 text-background" />
                </div>
                <div>
                  <p className="font-medium">Specified time</p>
                  <p className="text-sm text-muted-foreground">Set a specific time to do it</p>
                </div>
              </div>
              <Switch
                checked={scheduledTime !== null}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setScheduledTime('09:00');
                    setScheduledEndTime('10:00');
                  } else {
                    setScheduledTime(null);
                    setScheduledEndTime(null);
                  }
                }}
              />
            </div>

            {scheduledTime && (
              <>
                {/* Time type selector */}
                <div className="flex gap-1 p-1 mx-6 mt-6 bg-muted rounded-xl">
                  <button 
                    onClick={() => setTimeMode('point')}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-sm font-medium transition-colors",
                      timeMode === 'point' ? "bg-[#FFF59D] text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Point time
                  </button>
                  <button 
                    onClick={() => setTimeMode('period')}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-sm font-medium transition-colors",
                      timeMode === 'period' ? "bg-[#FFF59D] text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Time period
                  </button>
                </div>

                {/* Scroll container for time pickers */}
                <div className={cn(
                  "overflow-y-auto",
                  timeMode === 'period' ? "max-h-[400px]" : ""
                )}>
                  {/* Scroll wheel picker(s) */}
                  <TimeWheelPicker
                    value={scheduledTime}
                    onChange={setScheduledTime}
                  />

                  {/* Time period - show second picker with TO label */}
                  {timeMode === 'period' && (
                    <>
                      <div className="text-center py-2">
                        <span className="text-lg font-bold text-foreground">TO</span>
                      </div>
                      <TimeWheelPicker
                        value={scheduledEndTime || '10:00'}
                        onChange={setScheduledEndTime}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            <div className="pb-safe h-4" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Repeat Picker Sheet - Me+ Style Bottom Sheet */}
      <Sheet open={showRepeatPicker} onOpenChange={setShowRepeatPicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl" hideCloseButton>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button onClick={() => setShowRepeatPicker(false)} className="p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            <span className="text-base font-medium">Set task repeat</span>
            <div className="w-9" />
          </div>
          <div className="py-2">
            {/* No repeat */}
            <button
              onClick={() => {
                setRepeatEnabled(false);
                setShowRepeatPicker(false);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                !repeatEnabled && "bg-[#E8F4FD]"
              )}
            >
              <span className="font-medium">No repeat</span>
              {!repeatEnabled && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
            </button>

            {/* Daily */}
            <button
              onClick={() => {
                setRepeatEnabled(true);
                setRepeatPattern('daily');
                setRepeatInterval(1);
                setShowRepeatPicker(false);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                repeatEnabled && repeatPattern === 'daily' && repeatInterval === 1 && "bg-[#E8F4FD]"
              )}
            >
              <span className="font-medium">Daily</span>
              {repeatEnabled && repeatPattern === 'daily' && repeatInterval === 1 && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
            </button>

            {/* Weekly */}
            <button
              onClick={() => {
                setRepeatEnabled(true);
                setRepeatPattern('weekly');
                setRepeatDays([scheduledDate.getDay()]);
                setShowRepeatPicker(false);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                repeatEnabled && repeatPattern === 'weekly' && "bg-[#E8F4FD]"
              )}
            >
              <span className="font-medium">
                Weekly <span className="text-muted-foreground">({format(scheduledDate, 'EEEE')})</span>
              </span>
              {repeatEnabled && repeatPattern === 'weekly' && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
            </button>

            {/* Monthly */}
            <button
              onClick={() => {
                setRepeatEnabled(true);
                setRepeatPattern('monthly');
                setShowRepeatPicker(false);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                repeatEnabled && repeatPattern === 'monthly' && "bg-[#E8F4FD]"
              )}
            >
              <span className="font-medium">
                Monthly <span className="text-muted-foreground">(On {scheduledDate.getDate()}{scheduledDate.getDate() === 1 ? 'st' : scheduledDate.getDate() === 2 ? 'nd' : scheduledDate.getDate() === 3 ? 'rd' : 'th'})</span>
              </span>
              {repeatEnabled && repeatPattern === 'monthly' && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
            </button>

            {/* Weekend */}
            <button
              onClick={() => {
                setRepeatEnabled(true);
                setRepeatPattern('weekly');
                setRepeatDays([0, 6]);
                setShowRepeatPicker(false);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                repeatEnabled && repeatPattern === 'weekly' && repeatDays.length === 2 && repeatDays.includes(0) && repeatDays.includes(6) && "bg-[#E8F4FD]"
              )}
            >
              <span className="font-medium">
                Weekend <span className="text-muted-foreground">(Sat, Sun)</span>
              </span>
            </button>

            {/* Custom */}
            <button
              onClick={() => {
                setRepeatEnabled(true);
                setShowRepeatPicker(false);
                setShowRepeatCustom(true);
              }}
              className="w-full text-left px-6 py-4 flex items-center justify-between"
            >
              <span className="font-medium">Custom</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom Repeat Sheet - Me+ Full Page Style */}
      <Sheet open={showRepeatCustom} onOpenChange={setShowRepeatCustom}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl" hideCloseButton>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <button onClick={() => setShowRepeatCustom(false)} className="p-2 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">Repeat</span>
              <Button
                variant="ghost"
                onClick={() => setShowRepeatCustom(false)}
                className="text-primary font-medium"
              >
                Save
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {/* Dynamic title */}
              <h2 className="text-2xl font-bold text-center mb-8">
                {getRepeatTitle()}
              </h2>

              {/* Repeat toggle */}
              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <Repeat className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Repeat</p>
                    <p className="text-sm text-muted-foreground">Set a cycle for your plan</p>
                  </div>
                </div>
                <Switch
                  checked={repeatEnabled}
                  onCheckedChange={setRepeatEnabled}
                />
              </div>

              {repeatEnabled && (
                <>
                  {/* Pattern selector */}
                  <div className="flex gap-1 p-1 bg-muted rounded-xl mt-6">
                    {(['daily', 'weekly', 'monthly'] as const).map((pattern) => (
                      <button
                        key={pattern}
                        onClick={() => setRepeatPattern(pattern)}
                        className={cn(
                          'flex-1 py-3 rounded-lg text-sm font-medium transition-all capitalize',
                          repeatPattern === pattern
                            ? 'bg-[#E8F4FD] text-foreground shadow-sm'
                            : 'text-muted-foreground'
                        )}
                      >
                        {pattern}
                      </button>
                    ))}
                  </div>

                  {/* Day selector for weekly */}
                  {repeatPattern === 'weekly' && (
                    <div className="flex justify-center gap-2 mt-6">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleRepeatDay(idx)}
                          className={cn(
                            'w-10 h-10 rounded-full text-sm font-medium transition-all',
                            repeatDays.includes(idx)
                              ? 'bg-[#E8F4FD] text-foreground'
                              : 'bg-muted/50 text-muted-foreground'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Interval selector */}
                  <div className="flex items-center justify-between py-4 border-t border-b mt-6">
                    <span className="font-medium">Interval</span>
                    <select
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
                      className="bg-transparent text-right font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          Every {n} {repeatPattern === 'daily' ? (n === 1 ? 'day' : 'days') : repeatPattern === 'weekly' ? (n === 1 ? 'week' : 'weeks') : (n === 1 ? 'month' : 'months')}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reminder Picker Sheet - Me+ Style with dynamic options based on time */}
      <Sheet open={showReminderPicker} onOpenChange={setShowReminderPicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl" hideCloseButton>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button onClick={() => setShowReminderPicker(false)} className="p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            <span className="text-base font-medium">Set reminder</span>
            <div className="w-9" />
          </div>
          <div className="py-2">
            {/* No reminder */}
            <button
              onClick={() => {
                setReminderEnabled(false);
                setShowReminderPicker(false);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                !reminderEnabled && "bg-[#FFF59D]"
              )}
            >
              <span className="font-medium">No reminder</span>
              {!reminderEnabled && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
            </button>

            {/* Dynamic reminder options when time is set */}
            {scheduledTime ? (
              <>
                {/* At time of event */}
                <button
                  onClick={() => {
                    setReminderEnabled(true);
                    setReminderTime(scheduledTime);
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                    reminderEnabled && reminderTime === scheduledTime && "bg-[#FFF59D]"
                  )}
                >
                  <span className="font-medium">
                    At time of event <span className="text-muted-foreground">({formatReminderTimeDisplay(scheduledTime)})</span>
                  </span>
                  {reminderEnabled && reminderTime === scheduledTime && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                </button>

                {/* 10 minutes early */}
                <button
                  onClick={() => {
                    setReminderEnabled(true);
                    setReminderTime(getTimeOffset(scheduledTime, 10));
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                    reminderEnabled && reminderTime === getTimeOffset(scheduledTime, 10) && "bg-[#FFF59D]"
                  )}
                >
                  <span className="font-medium">
                    10 minutes early <span className="text-muted-foreground">({formatReminderTimeDisplay(getTimeOffset(scheduledTime, 10))})</span>
                  </span>
                  {reminderEnabled && reminderTime === getTimeOffset(scheduledTime, 10) && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                </button>

                {/* 30 minutes early */}
                <button
                  onClick={() => {
                    setReminderEnabled(true);
                    setReminderTime(getTimeOffset(scheduledTime, 30));
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                    reminderEnabled && reminderTime === getTimeOffset(scheduledTime, 30) && "bg-[#FFF59D]"
                  )}
                >
                  <span className="font-medium">
                    30 minutes early <span className="text-muted-foreground">({formatReminderTimeDisplay(getTimeOffset(scheduledTime, 30))})</span>
                  </span>
                  {reminderEnabled && reminderTime === getTimeOffset(scheduledTime, 30) && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                </button>

                {/* 1 hour early */}
                <button
                  onClick={() => {
                    setReminderEnabled(true);
                    setReminderTime(getTimeOffset(scheduledTime, 60));
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                    reminderEnabled && reminderTime === getTimeOffset(scheduledTime, 60) && "bg-[#FFF59D]"
                  )}
                >
                  <span className="font-medium">
                    1 hour early <span className="text-muted-foreground">({formatReminderTimeDisplay(getTimeOffset(scheduledTime, 60))})</span>
                  </span>
                  {reminderEnabled && reminderTime === getTimeOffset(scheduledTime, 60) && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                </button>
              </>
            ) : (
              /* Preset reminders when no time is set */
              REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.time}
                  onClick={() => {
                    setReminderEnabled(true);
                    setReminderTime(preset.time);
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                    reminderEnabled && reminderTime === preset.time && "bg-[#FFF59D]"
                  )}
                >
                  <span className="font-medium">
                    {preset.label} <span className="text-muted-foreground">({formatReminderTimeDisplay(preset.time)})</span>
                  </span>
                  {reminderEnabled && reminderTime === preset.time && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                </button>
              ))
            )}

            {/* Custom */}
            <button
              onClick={() => {
                setReminderEnabled(true);
                setShowReminderPicker(false);
                setShowReminderCustom(true);
              }}
              className={cn(
                "w-full text-left px-6 py-4 flex items-center justify-between",
                reminderEnabled && !REMINDER_PRESETS.some(p => p.time === reminderTime) && 
                  (scheduledTime ? reminderTime !== scheduledTime && reminderTime !== getTimeOffset(scheduledTime, 10) && reminderTime !== getTimeOffset(scheduledTime, 30) && reminderTime !== getTimeOffset(scheduledTime, 60) : true) && "bg-[#FFF59D]"
              )}
            >
              <span className="font-medium">
                Custom {reminderEnabled && <span className="text-muted-foreground">(Remind me at {formatReminderTimeDisplay(reminderTime)})</span>}
              </span>
              {reminderEnabled && !REMINDER_PRESETS.some(p => p.time === reminderTime) && 
                (scheduledTime ? reminderTime !== scheduledTime && reminderTime !== getTimeOffset(scheduledTime, 10) && reminderTime !== getTimeOffset(scheduledTime, 30) && reminderTime !== getTimeOffset(scheduledTime, 60) : true) && (
                <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom Reminder Time Picker - Me+ Style with Wheel */}
      <Sheet open={showReminderCustom} onOpenChange={setShowReminderCustom}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl" hideCloseButton>
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <button onClick={() => setShowReminderCustom(false)} className="p-2 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">Reminder</span>
              <Button
                variant="ghost"
                onClick={() => setShowReminderCustom(false)}
                className="text-primary font-medium"
              >
                Save
              </Button>
            </div>

            {/* Dynamic title */}
            <div className="text-center pb-4 px-6">
              <h2 className="text-2xl font-bold">
                Remind me at {formatTimeDisplay(reminderTime)}
              </h2>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-b">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <div>
                  <p className="font-medium">Reminder</p>
                  <p className="text-sm text-muted-foreground">Set a specific time to remind me</p>
                </div>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <>
                {/* Scroll wheel picker */}
                <TimeWheelPicker
                  value={reminderTime}
                  onChange={setReminderTime}
                />

                {/* Quick action buttons - functional */}
                {scheduledTime && (
                  <div className="flex gap-2 px-6 pb-4">
                    <button
                      onClick={() => setReminderTime(scheduledTime)}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-medium border transition-colors",
                        reminderTime === scheduledTime 
                          ? "bg-foreground text-background border-foreground" 
                          : "bg-white border-muted-foreground/30 text-foreground"
                      )}
                    >
                      At time of event
                    </button>
                    <button
                      onClick={() => setReminderTime(getTimeOffset(scheduledTime, 10))}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-medium border transition-colors",
                        reminderTime === getTimeOffset(scheduledTime, 10) 
                          ? "bg-foreground text-background border-foreground" 
                          : "bg-white border-muted-foreground/30 text-foreground"
                      )}
                    >
                      10 mins before
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="pb-safe h-4" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Tag Picker Sheet - Me+ Full Page Style */}
      <Sheet open={showTagPicker} onOpenChange={setShowTagPicker}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl" hideCloseButton>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <button onClick={() => setShowTagPicker(false)} className="p-2 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">Tag</span>
              <Button
                variant="ghost"
                onClick={() => setShowTagPicker(false)}
                className="text-primary font-medium"
              >
                Save
              </Button>
            </div>

            {/* Title */}
            <div className="px-6 pb-2">
              <h2 className="text-3xl font-bold">Tag</h2>
            </div>

            {/* Tag list */}
            <ScrollArea className="flex-1">
              <div className="px-0">
                {/* No tag option */}
                <button
                  onClick={() => {
                    setTag(null);
                    setShowTagPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                    tag === null && "bg-[#E8F4FD]"
                  )}
                >
                  <span className="font-medium">No tag</span>
                  {tag === null && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                </button>

                {/* All tags */}
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTag(t);
                      setShowTagPicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-6 py-4 flex items-center justify-between border-b border-muted/30",
                      tag === t && "bg-[#E8F4FD]"
                    )}
                  >
                    <span className="font-medium">{t}</span>
                    {tag === t && <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-foreground" /></div>}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Add New button */}
            <div className="p-4 flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <Button
                onClick={() => {
                  const name = prompt('Enter new tag name:');
                  if (name?.trim()) {
                    createTag.mutateAsync(name.trim()).then(() => {
                      setTag(name.trim());
                      setShowTagPicker(false);
                    });
                  }
                }}
                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full py-6 text-base font-medium"
              >
                Add New
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Pro Task Link Picker Sheet */}
      <Sheet open={showProLinkPicker} onOpenChange={setShowProLinkPicker}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Pro Task Link</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Make this a Pro Task that links directly to an app feature.
            </p>
            
            {/* Clear option */}
            {proLinkType && (
              <button
                onClick={() => {
                  setProLinkType(null);
                  setProLinkValue(null);
                  setLinkedPlaylistId(null);
                  setShowProLinkPicker(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <XCircle className="h-5 w-5" />
                <span>Remove Pro Task link</span>
              </button>
            )}

            <ScrollArea className="h-[50vh]">
              <div className="space-y-2 pr-4">
                {/* Link type options */}
                {PRO_LINK_TYPES.map((config) => {
                  const Icon = config.icon;
                  const isSelected = proLinkType === config.value;
                  
                  return (
                    <button
                      key={config.value}
                      onClick={() => {
                        setProLinkType(config.value);
                        if (!config.requiresValue) {
                          setProLinkValue(null);
                          setShowProLinkPicker(false);
                        } else if (config.value === 'playlist') {
                          // Show playlist picker
                          setShowProLinkPicker(false);
                          setShowPlaylistPicker(true);
                        } else if (config.value === 'breathe') {
                          // Show breathing exercise picker
                          setShowProLinkPicker(false);
                          setShowBreathingPicker(true);
                        }
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted/80 text-left',
                        isSelected && 'bg-violet-100 dark:bg-violet-900/30 ring-2 ring-violet-500'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        config.gradientClass
                      )}>
                        <Icon className="h-5 w-5 text-foreground/80" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                      {isSelected && (
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          `bg-${config.color}-500/20 text-${config.color}-700 dark:text-${config.color}-300`
                        )}>
                          {config.badgeText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Value input for link types that need it */}
            {proLinkType && ['channel', 'program', 'route'].includes(proLinkType) && (
              <div className="pt-2 border-t space-y-2">
                <Input
                  value={proLinkValue || ''}
                  onChange={(e) => setProLinkValue(e.target.value || null)}
                  placeholder={
                    proLinkType === 'channel' ? 'Channel slug (e.g., general)' :
                    proLinkType === 'program' ? 'Program slug' :
                    'Route path (e.g., /app/profile)'
                  }
                />
                <Button
                  onClick={() => setShowProLinkPicker(false)}
                  className="w-full"
                  disabled={!proLinkValue}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Playlist Picker Sheet (for Pro Task playlist selection) */}
      <Sheet open={showPlaylistPicker} onOpenChange={setShowPlaylistPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Select Playlist</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={playlistSearchQuery}
              onChange={(e) => setPlaylistSearchQuery(e.target.value)}
              placeholder="Search playlists..."
              className="mb-2"
            />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {filteredPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      setProLinkType('playlist');
                      setProLinkValue(playlist.id);
                      setLinkedPlaylistId(playlist.id);
                      setShowPlaylistPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80',
                      proLinkValue === playlist.id && 'bg-emerald-100 dark:bg-emerald-900/30'
                    )}
                  >
                    {playlist.cover_image_url ? (
                      <img src={playlist.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Music className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{playlist.name}</p>
                      {playlist.category && (
                        <p className="text-xs text-muted-foreground capitalize">{playlist.category}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Breathing Exercise Picker Sheet */}
      <Sheet open={showBreathingPicker} onOpenChange={setShowBreathingPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Select Breathing Exercise</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a breathing exercise to link to this task.
            </p>
            
            {/* Option for generic breathe (no specific exercise) */}
            <button
              onClick={() => {
                setProLinkType('breathe');
                setProLinkValue(null);
                setShowBreathingPicker(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80',
                proLinkType === 'breathe' && !proLinkValue && 'bg-indigo-100 dark:bg-indigo-900/30'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                <Wind className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Any Exercise</p>
                <p className="text-xs text-muted-foreground">Open the Breathe page to choose</p>
              </div>
            </button>
            
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">Or select a specific exercise:</p>
            </div>
            
            <ScrollArea className="h-[40vh]">
              <div className="space-y-2 pr-4">
                {breathingExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setProLinkType('breathe');
                      setProLinkValue(exercise.id);
                      setShowBreathingPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80',
                      proLinkValue === exercise.id && 'bg-indigo-100 dark:bg-indigo-900/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                      <span className="text-xl">{exercise.emoji || '🫁'}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{exercise.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );

  // Sheet mode - render inside a Sheet
  if (isSheet) {
    return (
      <>
        <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-3xl px-0"
            hideCloseButton
          >
            <div className="flex flex-col h-full">
              {/* Header - dynamic color */}
              <div 
                className="flex items-center justify-between px-4 py-3 flex-shrink-0 transition-colors duration-300"
                style={{ backgroundColor: bgColor }}
              >
                <div className="flex items-center gap-1">
                  <button onClick={handleClose} className="p-2 -ml-2">
                    <X className="h-5 w-5" />
                  </button>
                  {taskId && (
                    <button 
                      onClick={handleDelete} 
                      disabled={deleteTask.isPending}
                      className="p-2 text-destructive"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <h1 className="text-lg font-semibold">Edit Task</h1>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  variant="ghost"
                  className="text-primary font-semibold"
                >
                  Save
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {content}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        {pickerSheets}
      </>
    );
  }

  // Page mode - render as full page
  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{ backgroundColor: bgColor }}>
      {/* Header - Me+ Style with dynamic color */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 transition-colors duration-300"
        style={{ 
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          backgroundColor: bgColor 
        }}
      >
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-1">
            <button onClick={handleClose} className="p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            {taskId && (
              <button 
                onClick={handleDelete} 
                disabled={deleteTask.isPending}
                className="p-2 text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex-1" />
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createTask.isPending || updateTask.isPending}
            variant="ghost"
            className="text-primary font-semibold"
          >
            {taskId ? 'Save' : 'Create'}
          </Button>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div style={{ height: 'calc(48px + max(12px, env(safe-area-inset-top)))' }} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {content}
      </div>

      {pickerSheets}

      {/* Urgent Confirmation Dialog */}
      <AlertDialog open={showUrgentConfirm} onOpenChange={setShowUrgentConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlarmClock className="h-5 w-5 text-red-500" />
              Enable Urgent Alarm?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              This will create an alarm that rings even when your phone is on silent mode. The alarm will be added to your device's calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={() => {
                setIsUrgent(true);
                setShowUrgentConfirm(false);
              }}
            >
              Enable Urgent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppTaskCreate;
