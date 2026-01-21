import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { X, ChevronRight, Plus, Trash2, Music, XCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
import { PRO_LINK_TYPES, ProLinkType, PRO_LINK_CONFIGS } from '@/lib/proTaskTypes';

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
  reminderEnabled: boolean;
  reminderTime: string;
  tag: string | null;
  subtasks: string[];
  linkedPlaylistId: string | null;
  proLinkType: ProLinkType | null;
  proLinkValue: string | null;
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
  const [icon, setIcon] = useState(initialData?.icon || urlEmoji || 'Sun');
  const [color, setColor] = useState<TaskColor>(initialData?.color || urlColor || 'yellow');
  const [scheduledDate, setScheduledDate] = useState<Date>(initialData?.scheduledDate || new Date());
  const [scheduledTime, setScheduledTime] = useState<string | null>(initialData?.scheduledTime ?? null);
  const [repeatEnabled, setRepeatEnabled] = useState(initialData?.repeatEnabled ?? false);
  const [repeatPattern, setRepeatPattern] = useState<'daily' | 'weekly' | 'monthly'>(initialData?.repeatPattern || 'daily');
  const [repeatInterval, setRepeatInterval] = useState(initialData?.repeatInterval || 1);
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime || '09:00');
  const [tag, setTag] = useState<string | null>(initialData?.tag ?? null);
  const [subtasks, setSubtasks] = useState<string[]>(initialData?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [linkedPlaylistId, setLinkedPlaylistId] = useState<string | null>(initialData?.linkedPlaylistId ?? null);
  const [proLinkType, setProLinkType] = useState<ProLinkType | null>(initialData?.proLinkType ?? null);
  const [proLinkValue, setProLinkValue] = useState<string | null>(initialData?.proLinkValue ?? null);

  // Sheet states
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showProLinkPicker, setShowProLinkPicker] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  
  // Refs for subtask inputs to scroll into view
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const subtaskRefs = useRef<(HTMLInputElement | null)[]>([]);
  
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

  // Get selected playlist info
  const selectedPlaylist = playlists.find(p => p.id === linkedPlaylistId);

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

  // Reset form when initialData changes (sheet mode)
  useEffect(() => {
    if (isSheet && initialData) {
      setTitle(initialData.title || '');
      setIcon(initialData.icon || 'Sun');
      setColor(initialData.color || 'yellow');
      setScheduledDate(initialData.scheduledDate || new Date());
      setScheduledTime(initialData.scheduledTime ?? null);
      const repeatVal = initialData.repeatPattern as string | undefined;
      const hasRepeat = repeatVal && repeatVal !== 'none';
      setRepeatEnabled(initialData.repeatEnabled ?? !!hasRepeat);
      setRepeatPattern(hasRepeat && ['daily', 'weekly', 'monthly'].includes(repeatVal) ? repeatVal as 'daily' | 'weekly' | 'monthly' : 'daily');
      setRepeatInterval(initialData.repeatInterval || 1);
      setReminderEnabled(initialData.reminderEnabled ?? false);
      setReminderTime(initialData.reminderTime || '09:00');
      setTag(initialData.tag ?? null);
      setSubtasks(initialData.subtasks || []);
      setLinkedPlaylistId(initialData.linkedPlaylistId ?? null);
      setProLinkType(initialData.proLinkType ?? null);
      setProLinkValue(initialData.proLinkValue ?? null);
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
      
      setTag(existingTask.tag);
      setLinkedPlaylistId(existingTask.linked_playlist_id ?? null);
      setProLinkType(existingTask.pro_link_type ?? null);
      setProLinkValue(existingTask.pro_link_value ?? null);
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
        reminderEnabled,
        reminderTime,
        tag,
        subtasks: subtasks.filter(s => s.trim()),
        linkedPlaylistId,
        proLinkType,
        proLinkValue,
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
      reminder_enabled: reminderEnabled,
      reminder_offset: 0,
      tag,
      subtasks: subtasks.filter(s => s.trim()),
      linked_playlist_id: proLinkType === 'playlist' ? proLinkValue : linkedPlaylistId,
      pro_link_type: proLinkType,
      pro_link_value: proLinkValue,
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

  // Scroll input into view when focused (for iOS keyboard handling)
  const handleSubtaskInputFocus = (element: HTMLInputElement | null) => {
    if (element && Capacitor.isNativePlatform()) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Wait for keyboard to appear
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

  // The main content (shared between page and sheet modes)
  const content = (
    <>
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

        {/* Pro Task Link */}
        <button
          onClick={() => setShowProLinkPicker(true)}
          className={cn(
            "w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted",
            proLinkType && "bg-violet-50 dark:bg-violet-900/20"
          )}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={cn("h-5 w-5", proLinkType ? "text-violet-600" : "text-muted-foreground")} />
            <span className="font-medium">Pro Task Link</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {proConfig ? (
              <span className="flex items-center gap-1.5">
                <proConfig.icon className="h-4 w-4" />
                <span className="truncate max-w-[100px]">
                  {proConfig.label}
                </span>
              </span>
            ) : (
              <span>None</span>
            )}
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
            ref={newSubtaskInputRef}
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            onFocus={(e) => handleSubtaskInputFocus(e.target as HTMLInputElement)}
            placeholder="Add subtask"
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
          />
        </div>
      </div>

      {/* Delete button (edit mode only, page mode only) */}
      {!isSheet && taskId && (
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
    </>
  );

  // Picker sheets (shared between modes)
  const pickerSheets = (
    <>
      {/* Icon Picker */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedIcon={icon}
        onSelect={setIcon}
      />

      {/* Pro Task Link Picker Sheet */}
      <Sheet open={showProLinkPicker} onOpenChange={setShowProLinkPicker}>
        <SheetContent side="bottom" className="h-[75vh]">
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
        <SheetContent side="bottom" className="h-[70vh]">
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
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
                <button onClick={handleClose} className="p-2 -ml-2">
                  <X className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold">Edit Task</h1>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
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
    <div className="flex flex-col h-full bg-background">
      {/* Header - iOS Standard */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={handleClose} className="p-2 -ml-2">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {taskId ? 'Edit Task' : 'New Task'}
          </h1>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createTask.isPending || updateTask.isPending}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700"
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
    </div>
  );
};

export default AppTaskCreate;
