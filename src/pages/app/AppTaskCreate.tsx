import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, addDays, nextMonday, startOfDay } from 'date-fns';
import { X, ChevronRight, Plus, Trash2, Music, XCircle, Sparkles, ArrowLeft, Check, Calendar, Repeat, Clock, Bell, Tag, AlarmClock, Target, Wind, Pencil, Brain, GripVertical, Headphones, MessageCircle, Clapperboard, Video, GraduationCap, Timer, CalendarPlus, Crown } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
import { Capacitor } from '@capacitor/core';
import { haptic } from '@/lib/haptics';
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
import { ProLinkPicker } from '@/components/app/ProLinkPicker';
import { GoalSettingsSheet, GoalSettings, formatGoalTarget } from '@/components/app/GoalSettingsSheet';
import { NumberKeypad } from '@/components/app/NumberKeypad';
import { TimePeriod, TIME_PERIODS, TimeMode, getTimeMode, formatTimeLabel, formatTimeRange, getTimePeriodConfig, normalizeTimePeriod } from '@/lib/taskScheduling';
import SubtaskEditorSheet from '@/components/app/SubtaskEditorSheet';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { isCalendarAvailable } from '@/lib/calendarIntegration';

// Me+ style pastel color options with hex values
const COLOR_OPTIONS: { name: TaskColor; hex: string }[] = [
  { name: 'pink', hex: '#FFE0F5' },
  { name: 'peach', hex: '#FFE6C9' },
  { name: 'yellow', hex: '#FFF492' },
  { name: 'lime', hex: '#E2F9F0' },
  { name: 'sky', hex: '#D7E9FF' },
  { name: 'mint', hex: '#E0FBB8' },
  { name: 'lavender', hex: '#F0E3FF' },
];

// Note: Tags are now fetched from routine_categories table dynamically

// Reminder presets (Me+ style)
const REMINDER_PRESETS = [
  { labelKey: 'taskPickers.morningReminder', time: '09:00' },
  { labelKey: 'taskPickers.middayReminder', time: '12:00' },
  { labelKey: 'taskPickers.afternoonReminder', time: '16:00' },
  { labelKey: 'taskPickers.eveningReminder', time: '19:00' },
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
  description: string | null;
  icon: string;
  color: TaskColor;
  scheduledDate: Date;
  scheduledTime: string | null;
  timePeriod: TimePeriod | null;
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
  durationMinutes?: number | null;
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
  editTaskId?: string;
  createParams?: Record<string, string>;
}

/** Buffered Time Picker Sheet - uses local state so changes only commit on Save */
const TimePickerSheet = ({
  open,
  onOpenChange,
  scheduledTime,
  timePeriod,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledTime: string | null;
  timePeriod: TimePeriod | null;
  onSave: (time: string | null, period: TimePeriod | null) => void;
}) => {
  const { t } = useTranslation();
  const [localTime, setLocalTime] = useState<string | null>(scheduledTime);
  const [localPeriod, setLocalPeriod] = useState<TimePeriod | null>(timePeriod);

  // Sync local state when sheet opens
  useEffect(() => {
    if (open) {
      setLocalTime(scheduledTime);
      setLocalPeriod(timePeriod);
    }
  }, [open, scheduledTime, timePeriod]);

  const localTimeMode: TimeMode = localPeriod ? 'part_of_day' : localTime ? 'specific' : 'anytime';

  const handleSave = () => {
    onSave(localTime, localPeriod);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl" hideCloseButton>
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <button onClick={handleCancel} className="p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-medium">{t('taskEdit.time')}</span>
            <Button
              variant="ghost"
              onClick={handleSave}
              className="text-primary font-medium"
            >
              {t('taskEdit.save')}
            </Button>
          </div>

          <div className="px-6 pb-4">
            <div className="flex items-center justify-between py-3 mb-4 border-b border-muted/30">
              <span className="font-medium text-foreground">{t('taskEdit.specificTime')}</span>
              <Switch
                checked={localTimeMode === 'specific'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setLocalPeriod(null);
                    if (!localTime) setLocalTime('09:00');
                  } else {
                    setLocalTime(null);
                  }
                }}
              />
            </div>

            {localTimeMode === 'specific' && localTime && (
              <div className="mb-4">
                <TimeWheelPicker
                  value={localTime}
                  onChange={setLocalTime}
                />
              </div>
            )}

            {localTimeMode !== 'specific' && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {TIME_PERIODS.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => {
                        setLocalTime(null);
                        setLocalPeriod(period.id);
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-5 rounded-2xl transition-all border outline-none",
                        "bg-muted/30 border-border",
                        localPeriod === period.id &&
                          "bg-background shadow-ios border-primary ring-2 ring-primary ring-offset-2 ring-offset-background",
                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                      aria-pressed={localPeriod === period.id}
                    >
                      <div className="mb-2">
                        {period.icon === 'sun' && (
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="8" fill="#FFB800"/>
                            <g stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="20" y1="4" x2="20" y2="8"/>
                              <line x1="20" y1="32" x2="20" y2="36"/>
                              <line x1="4" y1="20" x2="8" y2="20"/>
                              <line x1="32" y1="20" x2="36" y2="20"/>
                              <line x1="8.69" y1="8.69" x2="11.52" y2="11.52"/>
                              <line x1="28.48" y1="28.48" x2="31.31" y2="31.31"/>
                              <line x1="8.69" y1="31.31" x2="11.52" y2="28.48"/>
                              <line x1="28.48" y1="11.52" x2="31.31" y2="8.69"/>
                            </g>
                          </svg>
                        )}
                        {period.icon === 'mountains' && (
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="28" cy="10" r="3" fill="#FFB800"/>
                            <path d="M8 32L18 16L24 24L28 18L36 32H8Z" fill="#4CAF50"/>
                            <path d="M14 32L22 20L28 28L32 22L38 32H14Z" fill="#66BB6A"/>
                          </svg>
                        )}
                        {period.icon === 'sunset' && (
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="22" r="8" fill="#FF9800"/>
                            <rect x="4" y="26" width="32" height="8" fill="#64B5F6"/>
                            <path d="M4 26C10 26 14 22 20 22C26 22 30 26 36 26" stroke="#2196F3" strokeWidth="2"/>
                          </svg>
                        )}
                        {period.icon === 'moon' && (
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <path d="M28 8C22 10 18 16 18 23C18 30 22 34 28 36C20 38 12 32 12 22C12 12 20 6 28 8Z" fill="#7C4DFF"/>
                            <circle cx="30" cy="12" r="1.5" fill="#7C4DFF"/>
                            <circle cx="34" cy="18" r="1" fill="#7C4DFF"/>
                            <circle cx="32" cy="26" r="1.2" fill="#7C4DFF"/>
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        localPeriod === period.id ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {t(period.labelKey)}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setLocalTime(null);
                    setLocalPeriod(null);
                  }}
                  className={cn(
                    "w-full py-3.5 rounded-2xl text-center font-medium transition-all border-2 outline-none",
                    localTimeMode === 'anytime'
                      ? "bg-background border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-muted/30 border-border text-muted-foreground",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  aria-pressed={localTimeMode === 'anytime'}
                >
                  {t('timePeriods.anytime')}
                </button>
              </>
            )}
          </div>

          <div className="pb-safe h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Sortable subtask item for drag-to-reorder
const SortableSubtaskItem = ({ id, subtask, onRemove }: { id: string; subtask: string; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-4 py-3 border-b border-muted/30 bg-white dark:bg-slate-800',
        isDragging && 'opacity-50 z-50 shadow-lg'
      )}
    >
      <button {...attributes} {...listeners} className="touch-none p-1 -ml-1 text-muted-foreground/50">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
        <div className="w-2 h-0.5 bg-muted-foreground/50 rounded-full" />
      </div>
      <span className="flex-1 text-foreground">{subtask}</span>
      <button onClick={onRemove} className="p-1.5 rounded-full active:bg-muted/50">
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

const AppTaskCreate = ({ 
  isSheet = false, 
  sheetOpen = false, 
  onSheetOpenChange, 
  initialData,
  onSaveSheet,
  editTaskId: editTaskIdProp,
  createParams,
}: AppTaskCreateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { taskId: routeTaskId } = useParams<{ taskId?: string }>();
  const taskId = editTaskIdProp || routeTaskId;
  const [searchParams] = useSearchParams();
  
  // Get URL params for pre-filled data from quick start (or createParams in sheet mode)
  const getParam = (key: string) => createParams?.[key] || searchParams.get(key) || '';
  const urlName = getParam('name');
  const urlEmoji = getParam('emoji');
  const urlColor = (getParam('color') || null) as TaskColor | null;
  const urlRepeatPattern = (getParam('repeat_pattern') || null) as 'none' | 'daily' | 'weekly' | 'monthly' | null;
  const urlRepeatDays = getParam('repeat_days') || null;
  const urlTag = getParam('tag') || null;
  const urlGoalEnabled = getParam('goal_enabled') === 'true';
  const urlGoalType = (getParam('goal_type') || null) as 'count' | 'timer' | null;
  const urlGoalTarget = getParam('goal_target') || null;
  const urlGoalUnit = getParam('goal_unit') || null;
  const urlProLinkType = (getParam('pro_link_type') || null) as ProLinkType | null;
  const urlProLinkValue = getParam('pro_link_value') || null;
  const urlLinkedPlaylistId = getParam('linked_playlist_id') || null;
  
  const isEditing = !!taskId || !!initialData;
  const { effectiveInset, isKeyboardOpen } = useKeyboard();

  // Parse URL repeat days
  const parsedRepeatDays = urlRepeatDays ? JSON.parse(urlRepeatDays) as number[] : [];

  // Form state - prioritize URL params for new tasks
  const [title, setTitle] = useState(initialData?.title || urlName || '');
  const [description, setDescription] = useState<string | null>(initialData?.description ?? null);
  const [icon, setIcon] = useState(initialData?.icon || urlEmoji || '☀️');
  const [color, setColor] = useState<TaskColor>(initialData?.color || urlColor || 'mint');
  const [scheduledDate, setScheduledDate] = useState<Date>(initialData?.scheduledDate || new Date());
  const [scheduledTime, setScheduledTime] = useState<string | null>(initialData?.scheduledTime ?? null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(null);
  const [scheduledEndTime, setScheduledEndTime] = useState<string | null>(null);
  // Derive time mode from state
  const derivedTimeMode: TimeMode = timePeriod ? 'part_of_day' : scheduledTime ? 'specific' : 'anytime';
  const [repeatEnabled, setRepeatEnabled] = useState(
    initialData?.repeatEnabled ?? (urlRepeatPattern && urlRepeatPattern !== 'none') ?? !taskId
  );
  const [repeatPattern, setRepeatPattern] = useState<'daily' | 'weekly' | 'monthly'>(
    initialData?.repeatPattern || (urlRepeatPattern && urlRepeatPattern !== 'none' ? urlRepeatPattern : 'daily')
  );
  const [repeatInterval, setRepeatInterval] = useState(initialData?.repeatInterval || 1);
  const [repeatDays, setRepeatDays] = useState<number[]>(initialData?.repeatDays || parsedRepeatDays || []);
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime || '09:00');
  const [isUrgent, setIsUrgent] = useState(initialData?.isUrgent ?? false);
  const [showUrgentConfirm, setShowUrgentConfirm] = useState(false);
  // Calendar sync (Plus only) — adds task to native iOS/Android calendar
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [showCalendarPaywall, setShowCalendarPaywall] = useState(false);
  const { isSubscribed } = useSubscription();
  const [tag, setTag] = useState<string | null>(initialData?.tag ?? urlTag ?? null);
  const [subtasks, setSubtasks] = useState<string[]>(initialData?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [linkedPlaylistId, setLinkedPlaylistId] = useState<string | null>(
    initialData?.linkedPlaylistId ?? urlLinkedPlaylistId ?? null
  );
  const [proLinkType, setProLinkType] = useState<ProLinkType | null>(
    initialData?.proLinkType ?? urlProLinkType ?? null
  );
  const [proLinkValue, setProLinkValue] = useState<string | null>(
    initialData?.proLinkValue ?? urlProLinkValue ?? null
  );
  const [newTagName, setNewTagName] = useState('');
  
  // Goal settings state - defaults: timer=1 min (60s), count=2
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    enabled: initialData?.goalEnabled ?? urlGoalEnabled ?? false,
    type: initialData?.goalType ?? urlGoalType ?? 'count',
    target: initialData?.goalTarget ?? (urlGoalTarget ? parseInt(urlGoalTarget) : 2),
    unit: initialData?.goalUnit ?? urlGoalUnit ?? 'times',
  });
  
  // Duration estimate (minutes) for smart estimate in routine player
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [useHistoryDuration, setUseHistoryDuration] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCustomDurationKeypad, setShowCustomDurationKeypad] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');

  // Query routine player history for this task's average duration
  const { data: durationHistory } = useQuery({
    queryKey: ['task-duration-history', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data } = await supabase
        .rpc('get_task_duration_avg' as any, { p_task_id: taskId }) as any;
      
      // Fallback: direct query with type cast
      if (!data) {
        const { data: rows } = await (supabase
          .from('routine_session_tasks' as any)
          .select('actual_seconds')
          .eq('user_task_id', taskId)
          .eq('status', 'completed')
          .not('actual_seconds', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20) as any);
        
        if (!rows || rows.length < 3) return null;
        const avgSeconds = rows.reduce((sum: number, r: any) => sum + (r.actual_seconds || 0), 0) / rows.length;
        return { avgMinutes: Math.max(1, Math.round(avgSeconds / 60)), count: rows.length };
      }
      return data;
    },
    enabled: !!taskId,
  });

  // Auto-enable history duration when data is available
  useEffect(() => {
    if (durationHistory && !durationMinutes) {
      setUseHistoryDuration(true);
      setDurationMinutes(durationHistory.avgMinutes);
    }
  }, [durationHistory]);

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
  const [showReflectionPicker, setShowReflectionPicker] = useState(false);
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showVideoPlaylistPicker, setShowVideoPlaylistPicker] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showRoutineTemplatePicker, setShowRoutineTemplatePicker] = useState(false);
  const [showReadingPicker, setShowReadingPicker] = useState(false);
  const [routineTemplateSearchQuery, setRoutineTemplateSearchQuery] = useState('');
  const [showSubtaskEditor, setShowSubtaskEditor] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoPlaylistSearchQuery, setVideoPlaylistSearchQuery] = useState('');
  
  // Refs for inputs to scroll into view
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const subtaskRefs = useRef<(HTMLInputElement | null)[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // iOS keyboard scroll fix
  const { handleFocus: handleNewSubtaskFocus } = useKeyboardScroll(newSubtaskInputRef, { block: 'center' });
  const { handleFocus: handleTitleFocus } = useKeyboardScroll(titleInputRef, { block: 'center' });
  const { handleFocus: handleDescriptionFocus } = useKeyboardScroll(descriptionRef, { block: 'center' });

  // Subtask drag-to-reorder
  const subtaskSensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleSubtaskDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = subtasks.findIndex((_, i) => `subtask-${i}` === active.id);
    const newIndex = subtasks.findIndex((_, i) => `subtask-${i}` === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setSubtasks(arrayMove(subtasks, oldIndex, newIndex));
      haptic.light();
    }
  }, [subtasks]);
  // Determine the current pro link config
  const proConfig = proLinkType ? PRO_LINK_CONFIGS[proLinkType] : null;

  // Fetch playlists for linking (only ones user has access to)
  const { data: playlists = [] } = useQuery({
    queryKey: ['linkable-playlists'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      // Get user's enrolled program slugs
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', authUser.id)
        .eq('status', 'active');
      const enrolledSlugs = (enrollments || []).map(e => e.program_slug).filter(Boolean) as string[];

      // Check if user has Simora Plus subscription
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .limit(1);
      const hasSubscription = (subs && subs.length > 0);

      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url, category, is_free, requires_subscription, program_slug')
        .eq('is_hidden', false)
        .order('name', { ascending: true });
      
      if (error) throw error;

      // Filter to accessible playlists
      return (data || []).filter(p => {
        if (p.is_free) return true;
        if (p.requires_subscription && hasSubscription) return true;
        if (p.program_slug && enrolledSlugs.includes(p.program_slug)) return true;
        return false;
      }) as PlaylistOption[];
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

  // Fetch reflections for linking
  const { data: reflections = [] } = useQuery({
    queryKey: ['linkable-reflections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections' as any)
        .select('id, title, subtitle, cover_image_url, emoji')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as unknown as { id: string; title: string; subtitle: string | null; cover_image_url: string | null; emoji: string | null }[];
    },
  });

  // Fetch user's own routines for linking
  const { data: linkableRoutines = [] } = useQuery({
    queryKey: ['linkable-user-routines'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];
      const { data, error } = await supabase
        .from('user_routines_bank')
        .select('routine_id, title, emoji, category')
        .eq('user_id', authUser.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []).map((r: any) => ({ id: r.routine_id, title: r.title, emoji: r.emoji, category: r.category })) as { id: string; title: string; emoji: string | null; category: string }[];
    },
  });

  // Fetch routines bank templates for inspire linking
  const { data: routineTemplates = [] } = useQuery({
    queryKey: ['linkable-routine-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, category, subtitle, cover_image_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; title: string; emoji: string | null; category: string; subtitle: string | null; cover_image_url: string | null }[];
    },
  });


  const { data: audioTracks = [] } = useQuery({
    queryKey: ['linkable-audio-tracks'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      // Get accessible playlist IDs from the playlists query logic
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', authUser.id)
        .eq('status', 'active');
      const enrolledSlugs = (enrollments || []).map(e => e.program_slug).filter(Boolean) as string[];

      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .limit(1);
      const hasSubscription = (subs && subs.length > 0);

      // Get tracks with their playlist names
      const { data: allTracks, error } = await supabase
        .from('audio_content')
        .select('id, title, cover_image_url, category, duration_seconds, is_free, program_slug')
        .order('title', { ascending: true });
      
      if (error) throw error;

      // Get playlist mappings for all tracks
      const trackIds = (allTracks || []).map(t => t.id);
      const { data: playlistItems } = await supabase
        .from('audio_playlist_items')
        .select('audio_id, playlist_id')
        .in('audio_id', trackIds);

      // Get unique playlist IDs and fetch their names
      const playlistIds = [...new Set((playlistItems || []).map(i => i.playlist_id))];
      const { data: playlistNames } = playlistIds.length > 0
        ? await supabase.from('audio_playlists').select('id, name').in('id', playlistIds)
        : { data: [] };
      
      const playlistNameMap: Record<string, string> = {};
      (playlistNames || []).forEach(p => { playlistNameMap[p.id] = p.name; });

      // Build a map of track ID -> playlist name
      const trackPlaylistMap: Record<string, string> = {};
      (playlistItems || []).forEach((item) => {
        if (playlistNameMap[item.playlist_id]) {
          trackPlaylistMap[item.audio_id] = playlistNameMap[item.playlist_id];
        }
      });

      return (allTracks || []).filter(t => {
        if (t.is_free) return true;
        if (hasSubscription) return true;
        if (t.program_slug && enrolledSlugs.includes(t.program_slug)) return true;
        return false;
      }).map(t => ({
        ...t,
        playlist_name: trackPlaylistMap[t.id] || null,
      })) as { id: string; title: string; cover_image_url: string | null; category: string; duration_seconds: number; playlist_name: string | null }[];
    },
  });

  // Fetch community channels for linking
  const { data: feedChannels = [] } = useQuery({
    queryKey: ['linkable-feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('id, name, slug, cover_image_url, type')
        .eq('is_archived', false)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as { id: string; name: string; slug: string; cover_image_url: string | null; type: string }[];
    },
  });

  // Fetch video content for linking
  const { data: videoTracks = [] } = useQuery({
    queryKey: ['linkable-video-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_content')
        .select('id, title, thumbnail_url, video_type, duration_seconds')
        .order('title', { ascending: true });
      if (error) throw error;
      return data as { id: string; title: string; thumbnail_url: string | null; video_type: string; duration_seconds: number }[];
    },
  });

  // Fetch video playlists for linking
  const { data: videoPlaylists = [] } = useQuery({
    queryKey: ['linkable-video-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_playlists')
        .select('id, name, cover_image_url, category')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string; cover_image_url: string | null; category: string | null }[];
    },
  });

  // Fetch reading content for linking
  const { data: readingContent = [] } = useQuery({
    queryKey: ['linkable-reading-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_content' as any)
        .select('id, title, emoji, cover_url, type, category')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as { id: string; title: string; emoji: string | null; cover_url: string | null; type: string; category: string }[];
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

  // Load existing task data for editing (page mode, or sheet mode with editTaskId)
  const shouldLoadFromDb = !!taskId && (!isSheet || !!editTaskIdProp);
  const { data: existingTask } = useTask(shouldLoadFromDb ? taskId : undefined);
  const { data: existingSubtasks } = useSubtasks(shouldLoadFromDb ? taskId : undefined);
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
    enabled: !!taskId && shouldLoadFromDb,
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
      setDescription(initialData.description ?? null);
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
      setDurationMinutes(initialData.durationMinutes ?? null);
    }
  }, [isSheet, initialData, sheetOpen]);

  // Reset form when createParams changes (sheet mode - from Quick Add Details button)
  useEffect(() => {
    if (isSheet && sheetOpen && createParams && !editTaskIdProp) {
      setTitle(createParams.name || '');
      setIcon(createParams.emoji || '☀️');
      setColor((createParams.color as TaskColor) || 'mint');
      setDescription(null);
      setScheduledDate(new Date());
      setScheduledTime(null);
      const rp = createParams.repeat_pattern;
      const hasRepeat = rp && rp !== 'none';
      setRepeatEnabled(!!hasRepeat);
      setRepeatPattern(hasRepeat && ['daily', 'weekly', 'monthly'].includes(rp) ? rp as 'daily' | 'weekly' | 'monthly' : 'daily');
      setRepeatDays(createParams.repeat_days ? JSON.parse(createParams.repeat_days) : []);
      setRepeatInterval(1);
      setTag(createParams.tag || null);
      setReminderEnabled(false);
      setReminderTime('09:00');
      setIsUrgent(false);
      setSubtasks([]);
      setLinkedPlaylistId(createParams.linked_playlist_id || null);
      setProLinkType((createParams.pro_link_type as ProLinkType) || null);
      setProLinkValue(createParams.pro_link_value || null);
      setTimePeriod(createParams.time_period ? normalizeTimePeriod(createParams.time_period) : null);
      setGoalSettings({
        enabled: createParams.goal_enabled === 'true',
        type: (createParams.goal_type as 'count' | 'timer') || 'count',
        target: Number(createParams.goal_target) || 1,
        unit: createParams.goal_unit || 'times',
      });
      setDurationMinutes(null);
    }
  }, [isSheet, sheetOpen, createParams, editTaskIdProp]);

  // Populate form when editing - works for both page mode and sheet mode with editTaskIdProp
  const hasPopulatedRef = useRef(false);
  const lastPopulatedTaskId = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Reset populated flag when taskId changes (e.g. editing a different task in sheet mode)
    if (taskId !== lastPopulatedTaskId.current) {
      hasPopulatedRef.current = false;
      lastPopulatedTaskId.current = taskId;
    }
    if (existingTask && !hasPopulatedRef.current) {
      hasPopulatedRef.current = true;
      setTitle(existingTask.title);
      setDescription(existingTask.description ?? null);
      setIcon(existingTask.emoji);
      setColor(existingTask.color as TaskColor);
      if (existingTask.scheduled_date) {
        // Parse date components manually to avoid UTC timezone shift
        const [year, month, day] = existingTask.scheduled_date.split('-').map(Number);
        setScheduledDate(new Date(year, month - 1, day));
      }
      setScheduledTime(existingTask.scheduled_time);
      // Map legacy time_period values to new 4-period system using helper
      setTimePeriod(normalizeTimePeriod(existingTask.time_period as string | null));
      
      if (existingTask.repeat_pattern !== 'none') {
        setRepeatEnabled(true);
        if (['daily', 'weekly', 'monthly'].includes(existingTask.repeat_pattern)) {
          setRepeatPattern(existingTask.repeat_pattern as 'daily' | 'weekly' | 'monthly');
        }
      } else {
        setRepeatEnabled(false);
      }
      
      if (existingTask.reminder_enabled) {
        setReminderEnabled(true);
        if (existingTask.scheduled_time) {
          setReminderTime(existingTask.scheduled_time);
        }
      } else {
        setReminderEnabled(false);
      }
      
      setIsUrgent(existingTask.is_urgent ?? false);
      setCalendarSyncEnabled(!!(existingTask as any).calendar_event_id);
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
      
      // Duration estimate
      setDurationMinutes((existingTask as any).duration_minutes ?? null);
    }
  }, [existingTask, taskId]);

  useEffect(() => {
    if (existingSubtasks && shouldLoadFromDb) {
      setSubtasks(existingSubtasks.map(s => s.title));
    }
  }, [existingSubtasks, shouldLoadFromDb]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    // Sheet mode with onSaveSheet callback (admin bank pattern) — but NOT when editTaskIdProp is set
    if (isSheet && onSaveSheet && !editTaskIdProp) {
      onSaveSheet({
        title: title.trim(),
        description,
        icon,
        color,
        scheduledDate,
        scheduledTime,
        timePeriod,
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

    const effectiveScheduledTime = scheduledTime || (reminderEnabled ? reminderTime : null);
    const effectiveReminderOffset = reminderEnabled
      ? getReminderOffsetMinutes(scheduledTime, reminderTime)
      : 0;

    // Page mode - save to database
    const taskData = {
      title: title.trim(),
      description,
      emoji: icon,
      color,
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      scheduled_time: effectiveScheduledTime,
      time_period: effectiveScheduledTime ? null : timePeriod,
      repeat_pattern: (repeatEnabled ? repeatPattern : 'none') as RepeatPattern,
      repeat_days: repeatDays,
      reminder_enabled: reminderEnabled,
      reminder_offset: effectiveReminderOffset,
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
      duration_minutes: durationMinutes,
      // Calendar sync (only effective on native + Plus). UI prevents non-Plus
      // users from enabling it; we still gate again here as defense-in-depth.
      calendar_sync_enabled: !!(calendarSyncEnabled && isSubscribed && scheduledTime),
    };

    if (taskId) {
      await updateTask.mutateAsync({ id: taskId, ...taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }

    if (isSheet && onSheetOpenChange) {
      onSheetOpenChange(false);
    } else {
      navigate(-1);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    
    if (confirm('Delete this task?')) {
      await deleteTask.mutateAsync(taskId);
      if (isSheet && onSheetOpenChange) {
        onSheetOpenChange(false);
      } else {
        navigate(-1);
      }
    }
  };

  const handleClose = () => {
    if (isSheet && onSheetOpenChange) {
      onSheetOpenChange(false);
    } else {
      navigate(-1);
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


  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Format time for display - handles time_period, scheduled_time, or Anytime
  const formatTimeDisplay = (time: string | null) => {
    // Check for time period first
    if (timePeriod) {
      const config = getTimePeriodConfig(timePeriod);
      return config ? `${config.emoji} ${config.label}` : 'Anytime';
    }
    // Check for specific time
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

  const getReminderOffsetMinutes = (eventTime: string | null, notifyTime: string): number => {
    if (!eventTime) return 0;

    const [eventHours, eventMinutes] = eventTime.split(':').map(Number);
    const [notifyHours, notifyMinutes] = notifyTime.split(':').map(Number);
    const diff = eventHours * 60 + eventMinutes - (notifyHours * 60 + notifyMinutes);

    return diff >= 0 ? diff : 0;
  };

  const getRepeatSummary = () => {
    if (!repeatEnabled) return t('taskPickers.noRepeatSummary');

    const dayNames = [
      t('streakLost.sun', { defaultValue: 'Sun' }),
      t('streakLost.mon', { defaultValue: 'Mon' }),
      t('streakLost.tue', { defaultValue: 'Tue' }),
      t('streakLost.wed', { defaultValue: 'Wed' }),
      t('streakLost.thu', { defaultValue: 'Thu' }),
      t('streakLost.fri', { defaultValue: 'Fri' }),
      t('streakLost.sat', { defaultValue: 'Sat' }),
    ];
    
    if (repeatPattern === 'weekly' && repeatDays.length > 0) {
      const days = repeatDays.map(d => dayNames[d]).join(', ');
      return t('taskPickers.weeklySummary', { days });
    }
    
    if (repeatPattern === 'monthly') {
      const dayOfMonth = scheduledDate.getDate();
      const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
      return t('taskPickers.monthlySummary', { day: `${dayOfMonth}${suffix}` });
    }
    
    if (repeatPattern === 'daily') return t('taskEdit.daily');
    if (repeatPattern === 'weekly') return t('taskEdit.weekly');
    if (repeatPattern === 'monthly') return t('taskEdit.monthly');
    return t('taskEdit.daily');
  };

  const getReminderSummary = () => {
    if (!reminderEnabled) return t('taskPickers.noReminderSummary');
    // If time is set and reminder matches certain offsets, show friendly names
    if (scheduledTime) {
      const time = formatReminderTimeDisplay(reminderTime);
      if (reminderTime === scheduledTime) return t('taskPickers.atTimeOfEventSummary', { time });
      if (reminderTime === getTimeOffset(scheduledTime, 10)) return t('taskPickers.minutesEarlySummary', { n: 10, time });
      if (reminderTime === getTimeOffset(scheduledTime, 30)) return t('taskPickers.minutesEarlySummary', { n: 30, time });
      if (reminderTime === getTimeOffset(scheduledTime, 60)) return t('taskPickers.hourEarlySummary', { time });
    }
    return t('taskPickers.customSummary', { time: formatReminderTimeDisplay(reminderTime) });
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
    if (!repeatEnabled) return t('taskEdit.noRepeat');

    const dayNames = [
      t('streakLost.sun', { defaultValue: 'Sun' }),
      t('streakLost.mon', { defaultValue: 'Mon' }),
      t('streakLost.tue', { defaultValue: 'Tue' }),
      t('streakLost.wed', { defaultValue: 'Wed' }),
      t('streakLost.thu', { defaultValue: 'Thu' }),
      t('streakLost.fri', { defaultValue: 'Fri' }),
      t('streakLost.sat', { defaultValue: 'Sat' }),
    ];
    
    if (repeatPattern === 'weekly' && repeatDays.length > 0) {
      const days = repeatDays.map(d => dayNames[d]).join(', ');
      return t('taskPickers.repeatsEveryWeekOn', { days });
    }
    
    if (repeatPattern === 'monthly') {
      const dayOfMonth = scheduledDate.getDate();
      const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
      return t('taskPickers.repeatsEveryMonthOn', { day: `${dayOfMonth}${suffix}` });
    }
    
    if (repeatInterval === 1) {
      const unit = repeatPattern === 'daily' ? t('taskPickers.day') : repeatPattern === 'weekly' ? t('taskPickers.week') : t('taskPickers.month');
      return t('taskPickers.repeatsEvery', { unit });
    }
    
    const unit = repeatPattern === 'daily' ? t('taskPickers.days') : repeatPattern === 'weekly' ? t('taskPickers.weeks') : t('taskPickers.months');
    return t('taskPickers.repeatsEveryN', { n: repeatInterval, unit });
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
      {/* Task Icon & Name - Compact inline layout */}
      <div className="flex items-center gap-3 pt-2 pb-3 px-4">
        <button
          onClick={() => setShowIconPicker(true)}
          className="relative flex-shrink-0 active:scale-95 transition-transform"
        >
          <TaskIcon iconName={icon} size={48} className="text-foreground/70" />
          {/* Tiny pen indicator */}
          <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        </button>
        <div className="relative flex-1 min-w-0">
          <Input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            onFocus={handleTitleFocus}
            placeholder={t('taskEdit.taskNamePlaceholder')}
            className="w-full text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto py-1 px-0 pr-6"
            maxLength={50}
          />
          {/* Tiny pen indicator for title */}
          <div className="absolute -bottom-2.5 left-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Color picker - Horizontal circles with checkmark */}
      <div className="px-6 pb-3">
        <div className="flex justify-center gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.name)}
              className={cn(
                'w-10 h-10 rounded-full transition-all flex items-center justify-center border-[3px]',
                color === c.name ? 'border-white ring-2 ring-white' : 'border-white'
              )}
              style={{ backgroundColor: c.hex }}
            >
              {color === c.name && (
                <Check className="h-5 w-5 text-black" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Description - Simple textarea with placeholder */}
      <div className="px-4 pb-3">
        <Textarea
          ref={descriptionRef}
          value={description || ''}
          onChange={(e) => setDescription(e.target.value || null)}
          onFocus={handleDescriptionFocus}
          placeholder={t('taskEdit.addDescription')}
          className="w-full bg-white/60 dark:bg-slate-700/60 border-0 rounded-xl resize-none text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-foreground/20 min-h-0"
          rows={1}
        />
      </div>

      {/* Settings Card - White rounded card with list */}
      <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-ios">
        {/* Date */}
        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full flex items-center justify-between py-2 px-4 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-black" />
            <span className="font-medium text-black">{repeatEnabled ? t('taskEdit.startingFrom') : t('taskEdit.date')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>{format(scheduledDate, 'MMM d') === format(new Date(), 'MMM d') ? t('taskEdit.today') : format(scheduledDate, 'MMM d, yyyy')}</span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>

        {/* Repeat */}
        <button
          onClick={() => setShowRepeatPicker(true)}
          className="w-full flex items-center justify-between py-2 px-4 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-black" />
            <span className="font-medium text-black">{t('taskEdit.repeat')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>{getRepeatSummary()}</span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>

        {/* Time */}
        <button
          onClick={() => setShowTimePicker(true)}
          className="w-full flex items-center justify-between py-2 px-4 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-black" />
            <span className="font-medium text-black">{t('taskEdit.time')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>{formatTimeDisplay(scheduledTime)}</span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>

        {/* Duration */}
        <button
          onClick={() => setShowDurationPicker(true)}
          className="w-full flex items-center justify-between py-2 px-4 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-black" />
            <span className="font-medium text-black">{t('taskEdit.duration')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>
              {durationMinutes 
                ? (useHistoryDuration ? t('taskEdit.minAvg', { min: durationMinutes }) : t('taskEdit.minutesShort', { min: durationMinutes }))
                : t('taskEdit.notSet')}
            </span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>

        {/* Reminder */}
        <button
          onClick={() => setShowReminderPicker(true)}
          className="w-full flex items-center justify-between py-2 px-4 active:bg-muted/50 border-b border-muted/30"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-black" />
            <span className="font-medium text-black">{t('taskEdit.reminder')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>{getReminderSummary()}</span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>

        {/* Urgent - Only show when reminder is enabled and time is set */}
        {reminderEnabled && scheduledTime && (
          <div className="flex items-center justify-between py-2 px-4 border-b border-muted/30">
            <div className="flex items-center gap-3">
              <AlarmClock className={cn("h-5 w-5", isUrgent ? "text-red-500" : "text-black")} />
              <div className="flex flex-col">
                <span className={cn("font-medium text-black", isUrgent && "text-red-600")}>{t('taskEdit.urgent')}</span>
                <span className="text-xs text-black/60">{t('taskEdit.urgentHint')}</span>
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

        {/* Add to Calendar — Plus only, requires a specific time.
            Visible in web preview so the design can be reviewed; actual
            sync only fires on native (gracefully no-ops on web). */}
        {(
          <div className="flex items-center justify-between py-2 px-4 border-b border-muted/30">
            <div className="flex items-center gap-3">
              <CalendarPlus className={cn("h-5 w-5", calendarSyncEnabled ? "text-primary" : "text-black")} />
              <div className="flex flex-col">
                <span className="font-medium text-black inline-flex items-center gap-1.5">
                  {t('taskEdit.addToCalendar')}
                  {!isSubscribed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5">
                      <Crown className="h-3 w-3 text-amber-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Plus</span>
                    </span>
                  )}
                </span>
                <span className="text-xs text-black/60">{t('taskEdit.addToCalendarHint')}</span>
              </div>
            </div>
            <Switch
              checked={calendarSyncEnabled}
              onCheckedChange={(checked) => {
                if (checked && !isSubscribed) {
                  haptic.light();
                  setShowCalendarPaywall(true);
                  return;
                }
                if (checked && !scheduledTime) {
                  haptic.light();
                  toast('Please choose a specific time first');
                  return;
                }
                setCalendarSyncEnabled(checked);
              }}
            />
          </div>
        )}

        {/* Tag */}
        <button
          onClick={() => setShowTagPicker(true)}
          className="w-full flex items-center justify-between py-2 px-4 active:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-black" />
            <span className="font-medium text-black">{t('taskEdit.category')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>{tag || t('taskEdit.noCategory')}</span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>
      </div>

      {/* Goal - Separate card */}
      <div className="mx-4 mt-2 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-ios">
        <button
          onClick={() => setShowGoalSettings(true)}
          className={cn(
            "w-full flex items-center justify-between py-2 px-4 active:bg-muted/50",
            goalSettings.enabled && "bg-emerald-50 dark:bg-emerald-900/20"
          )}
        >
          <div className="flex items-center gap-3">
            <Target className={cn("h-5 w-5", goalSettings.enabled ? "text-emerald-600" : "text-black")} />
            <span className="font-medium text-black">{t('taskEdit.goal')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <span>{goalSettings.enabled ? formatGoalTarget(goalSettings) : t('taskEdit.off')}</span>
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>
      </div>

      {/* Pro Task Link - Separate card */}
      <div className="mx-4 mt-2 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-ios">
        <button
          onClick={() => setShowProLinkPicker(true)}
          className={cn(
            "w-full flex items-center justify-between py-2 px-4 active:bg-muted/50",
            proLinkType && "bg-violet-50 dark:bg-violet-900/20"
          )}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={cn("h-5 w-5", proLinkType ? "text-violet-600" : "text-black")} />
            <span className="font-medium text-black">{t('taskEdit.proActionLink')}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            {proConfig ? (
              <span className="flex items-center gap-1.5">
                <proConfig.icon className="h-4 w-4" />
                <span className="truncate max-w-[100px]">{proConfig.label}</span>
              </span>
            ) : (
              <span>{t('taskEdit.off')}</span>
            )}
            <ChevronRight className="h-4 w-4 text-black" />
          </div>
        </button>
      </div>

      {/* Subtasks - Opens sub-sheet */}
      <button
        onClick={() => setShowSubtaskEditor(true)}
        className="mx-4 mt-2 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-ios px-4 py-3.5 flex items-center gap-3 w-[calc(100%-2rem)] active:scale-[0.98] transition-transform"
      >
        <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
        <span className={cn(
          "flex-1 text-left text-base",
          subtasks.length > 0 ? "text-foreground font-medium" : "text-muted-foreground/50"
        )}>
          {subtasks.length > 0 ? t('taskEdit.subtaskCount', { count: subtasks.length }) : t('taskEdit.subtasks')}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </button>

      {/* Subtasks hint text */}
      <p className="text-center text-sm text-black mt-3 px-6">
        {t('taskEdit.subtasksHint')}
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

      {/* Subtask Editor Sheet */}
      <SubtaskEditorSheet
        open={showSubtaskEditor}
        onOpenChange={setShowSubtaskEditor}
        subtasks={subtasks}
        onSave={setSubtasks}
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
              <span className="text-lg font-medium">{t('taskEdit.date')}</span>
              <Button
                variant="ghost"
                onClick={() => setShowDatePicker(false)}
                className="text-primary font-medium"
              >
                {t('taskPickers.save')}
              </Button>
            </div>

            {/* Title */}
            <div className="text-center pb-4">
              <h2 className="text-2xl font-bold">
                {format(scheduledDate, 'MMM d') === format(new Date(), 'MMM d') ? t('taskEdit.today') : format(scheduledDate, 'EEEE, MMM d')}
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
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {t('taskEdit.today')}
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
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {t('taskPickers.tomorrow')}
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
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {t('taskPickers.nextMonday')}
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Time Picker Sheet - Finch-Style with 3 Modes (uses local buffered state) */}
      <TimePickerSheet
        open={showTimePicker}
        onOpenChange={setShowTimePicker}
        scheduledTime={scheduledTime}
        timePeriod={timePeriod}
        onSave={(newTime, newPeriod) => {
          setScheduledTime(newTime);
          setTimePeriod(newPeriod);
        }}
      />

      {/* Duration Picker Sheet */}
      <Sheet open={showDurationPicker} onOpenChange={setShowDurationPicker}>
        <SheetContent side="bottom" className="h-auto max-h-[65vh] rounded-t-3xl" hideCloseButton>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button onClick={() => setShowDurationPicker(false)} className="p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            <span className="text-base font-medium">{t('taskEdit.estimatedDuration')}</span>
            <button
              onClick={() => {
                setDurationMinutes(null);
                setShowDurationPicker(false);
              }}
              className="text-sm text-muted-foreground active:opacity-70 px-2"
            >
              {t('taskPickers.clear')}
            </button>
          </div>
          <div className="px-5 pt-4 pb-6 overflow-y-auto">
            {/* History average banner */}
            {durationHistory && (
              <button
                onClick={() => {
                  const newVal = !useHistoryDuration;
                  setUseHistoryDuration(newVal);
                  if (newVal) {
                    setDurationMinutes(durationHistory.avgMinutes);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-4 transition-all border-2",
                  useHistoryDuration
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400"
                    : "bg-muted/30 border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="text-lg">⏱️</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('taskPickers.avgFromHistory')} <span className="tabular-nums font-bold">{durationHistory.avgMinutes} {t('taskPickers.minLabel')}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t('taskPickers.basedOnSessions', { count: durationHistory.count })}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={useHistoryDuration}
                  onCheckedChange={(checked) => {
                    setUseHistoryDuration(checked);
                    if (checked) {
                      setDurationMinutes(durationHistory.avgMinutes);
                    }
                  }}
                  className="pointer-events-none"
                />
              </button>
            )}

            <p className="text-xs text-muted-foreground text-center mb-4">
              {t('taskPickers.countdownEstimate')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 5, 10, 15, 20, 30].map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setDurationMinutes(mins);
                    setUseHistoryDuration(false);
                    setShowDurationPicker(false);
                  }}
                  className={cn(
                    "relative py-3.5 rounded-2xl font-semibold text-center transition-all border-2 outline-none",
                    durationMinutes === mins
                      ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                      : "bg-muted/30 border-transparent text-foreground active:scale-95"
                  )}
                >
                  <span className="text-lg tabular-nums">{mins}</span>
                  <span className="text-[11px] text-muted-foreground block -mt-0.5">{t('taskPickers.minLabel')}</span>
                </button>
              ))}
              {/* Custom duration button */}
              <button
                onClick={() => setShowCustomDurationKeypad(true)}
                className={cn(
                  "relative py-3.5 rounded-2xl font-semibold text-center transition-all border-2 outline-none",
                  durationMinutes && ![1,2,3,5,10,15,20,30].includes(durationMinutes)
                    ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                    : "bg-muted/30 border-transparent text-foreground active:scale-95"
                )}
              >
                <span className="text-lg tabular-nums">
                  {durationMinutes && ![1,2,3,5,10,15,20,30].includes(durationMinutes) ? durationMinutes : '···'}
                </span>
                <span className="text-[11px] text-muted-foreground block -mt-0.5">{t('taskPickers.custom')}</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom Duration Number Keypad */}
      <NumberKeypad
        open={showCustomDurationKeypad}
        onOpenChange={(open) => {
          if (!open) {
            const num = parseInt(customDurationValue) || 0;
            if (num > 0 && num <= 480) {
              setDurationMinutes(num);
              setUseHistoryDuration(false);
              setShowDurationPicker(false);
            }
          } else {
            setCustomDurationValue(
              durationMinutes && ![1,2,3,5,10,15,20,30].includes(durationMinutes) ? String(durationMinutes) : ''
            );
          }
          setShowCustomDurationKeypad(open);
        }}
        value={customDurationValue}
        onChange={setCustomDurationValue}
        onConfirm={() => {
          const num = parseInt(customDurationValue) || 0;
          if (num > 0 && num <= 480) {
            setDurationMinutes(num);
            setUseHistoryDuration(false);
            setShowDurationPicker(false);
          }
          setShowCustomDurationKeypad(false);
        }}
        title={t('taskEdit.durationMinutes')}
        maxLength={3}
      />

      <Sheet open={showRepeatPicker} onOpenChange={setShowRepeatPicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl" hideCloseButton>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button onClick={() => setShowRepeatPicker(false)} className="p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            <span className="text-base font-medium">{t('taskEdit.setTaskRepeat')}</span>
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
              <span className="font-medium">{t('taskEdit.noRepeat')}</span>
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
              <span className="font-medium">{t('taskEdit.daily')}</span>
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
                {t('taskEdit.weekly')} <span className="text-muted-foreground">({format(scheduledDate, 'EEEE')})</span>
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
                {t('taskEdit.monthly')} <span className="text-muted-foreground">(On {scheduledDate.getDate()}{scheduledDate.getDate() === 1 ? 'st' : scheduledDate.getDate() === 2 ? 'nd' : scheduledDate.getDate() === 3 ? 'rd' : 'th'})</span>
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
                {t('taskPickers.weekendDays')}
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
              <span className="font-medium">{t('taskEdit.custom')}</span>
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
              <span className="text-lg font-medium">{t('taskEdit.repeat')}</span>
              <Button
                variant="ghost"
                onClick={() => setShowRepeatCustom(false)}
                className="text-primary font-medium"
              >
                {t('taskPickers.save')}
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
                    <p className="font-medium">{t('taskEdit.repeat')}</p>
                    <p className="text-sm text-muted-foreground">{t('taskEdit.setCycleHint')}</p>
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
                            ? 'bg-[#E8F4FD] text-foreground shadow-ios'
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
                    <span className="font-medium">{t('taskEdit.interval')}</span>
                    <select
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
                      className="bg-transparent text-right font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {t('taskPickers.every', { n })} {repeatPattern === 'daily' ? (n === 1 ? t('taskPickers.day') : t('taskPickers.days')) : repeatPattern === 'weekly' ? (n === 1 ? t('taskPickers.week') : t('taskPickers.weeks')) : (n === 1 ? t('taskPickers.month') : t('taskPickers.months'))}
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
            <span className="text-base font-medium">{t('taskEdit.setReminder')}</span>
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
              <span className="font-medium">{t('taskEdit.noReminder')}</span>
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
                    {t('taskPickers.atTimeOfEvent')} <span className="text-muted-foreground">({formatReminderTimeDisplay(scheduledTime)})</span>
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
                    {t('taskPickers.minutesEarly', { n: 10 })} <span className="text-muted-foreground">({formatReminderTimeDisplay(getTimeOffset(scheduledTime, 10))})</span>
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
                    {t('taskPickers.minutesEarly', { n: 30 })} <span className="text-muted-foreground">({formatReminderTimeDisplay(getTimeOffset(scheduledTime, 30))})</span>
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
                    {t('taskPickers.hourEarly')} <span className="text-muted-foreground">({formatReminderTimeDisplay(getTimeOffset(scheduledTime, 60))})</span>
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
                    {t(preset.labelKey)} <span className="text-muted-foreground">({formatReminderTimeDisplay(preset.time)})</span>
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
                {t('taskEdit.custom')} {reminderEnabled && <span className="text-muted-foreground">({t('taskPickers.remindMeAt', { time: formatReminderTimeDisplay(reminderTime) })})</span>}
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
              <span className="text-lg font-medium">{t('taskEdit.reminder')}</span>
              <Button
                variant="ghost"
                onClick={() => setShowReminderCustom(false)}
                className="text-primary font-medium"
              >
                {t('taskPickers.save')}
              </Button>
            </div>

            {/* Dynamic title */}
            <div className="text-center pb-4 px-6">
              <h2 className="text-2xl font-bold">
                {t('taskPickers.remindMeAt', { time: formatTimeDisplay(reminderTime) })}
              </h2>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-b">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <div>
                  <p className="font-medium">{t('taskEdit.reminder')}</p>
                  <p className="text-sm text-muted-foreground">{t('taskEdit.setSpecificTimeHint')}</p>
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
                      {t('taskPickers.atTimeOfEvent')}
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
                      {t('taskPickers.minsBefore', { n: 10 })}
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
              <span className="text-lg font-medium">{t('taskEdit.category')}</span>
              <Button
                variant="ghost"
                onClick={() => setShowTagPicker(false)}
                className="text-primary font-medium"
              >
                {t('taskPickers.save')}
              </Button>
            </div>

            {/* Title */}
            <div className="px-6 pb-2">
              <h2 className="text-3xl font-bold">{t('taskEdit.category')}</h2>
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
                  <span className="font-medium">{t('taskEdit.noTag')}</span>
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
                className="w-full bg-foreground text-background rounded-full py-6 text-base font-medium"
              >
                Add New
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Pro Task Link Picker */}
      <ProLinkPicker
        open={showProLinkPicker}
        onOpenChange={setShowProLinkPicker}
        proLinkType={proLinkType as ProLinkType | null}
        onSelect={(type) => {
          setProLinkType(type);
          if (!PRO_LINK_CONFIGS[type].requiresValue) {
            setProLinkValue(null);
            setShowProLinkPicker(false);
          } else if (type === 'playlist') {
            setShowProLinkPicker(false);
            setShowPlaylistPicker(true);
          } else if (type === 'breathe') {
            setShowProLinkPicker(false);
            setShowBreathingPicker(true);
          } else if (type === 'reflection') {
            setShowProLinkPicker(false);
            setShowReflectionPicker(true);
          } else if (type === 'routine') {
            setShowProLinkPicker(false);
            setShowRoutinePicker(true);
          } else if (type === 'audio') {
            setShowProLinkPicker(false);
            setShowAudioPicker(true);
          } else if (type === 'channel') {
            setShowProLinkPicker(false);
            setShowChannelPicker(true);
          } else if (type === 'video') {
            setShowProLinkPicker(false);
            setShowVideoPicker(true);
          } else if (type === 'video_playlist') {
            setShowProLinkPicker(false);
            setShowVideoPlaylistPicker(true);
          } else if (type === 'program') {
            setShowProLinkPicker(false);
            setShowProgramPicker(true);
          } else if (type === 'inspire') {
            setShowProLinkPicker(false);
            setShowRoutineTemplatePicker(true);
          } else if (type === 'reading_item') {
            setShowProLinkPicker(false);
            setShowReadingPicker(true);
          }
          // route handled by the picker's built-in value input
        }}
        onClear={() => {
          setProLinkType(null);
          setProLinkValue(null);
          setLinkedPlaylistId(null);
          setShowProLinkPicker(false);
        }}
        proLinkValue={proLinkValue}
        onValueChange={(val) => setProLinkValue(val)}
        onDone={() => setShowProLinkPicker(false)}
      />

      {/* Playlist Picker Sheet */}
      <Sheet open={showPlaylistPicker} onOpenChange={setShowPlaylistPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowPlaylistPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectPlaylist')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={playlistSearchQuery}
              onChange={(e) => setPlaylistSearchQuery(e.target.value)}
              placeholder={t('taskEdit.searchPlaylists')}
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
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === playlist.id && 'bg-primary/10 ring-1 ring-primary/30'
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
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowBreathingPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectBreathingExercise')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('taskPickers.chooseExerciseHint')}
            </p>
            
            <button
              onClick={() => {
                setProLinkType('breathe');
                setProLinkValue(null);
                setShowBreathingPicker(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                proLinkType === 'breathe' && !proLinkValue && 'bg-primary/10 ring-1 ring-primary/30'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                <Wind className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{t('taskEdit.anyExercise')}</p>
                <p className="text-xs text-muted-foreground">{t('taskEdit.anyExerciseHint')}</p>
              </div>
            </button>
            
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">{t('taskPickers.orSelectSpecificExercise')}</p>
            </div>
            
            <ScrollArea className="h-[35vh]">
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
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === exercise.id && 'bg-primary/10 ring-1 ring-primary/30'
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

      {/* Reflection Picker Sheet */}
      <Sheet open={showReflectionPicker} onOpenChange={setShowReflectionPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowReflectionPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectReflection')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <button
              onClick={() => {
                setProLinkType('reflection');
                setProLinkValue(null);
                setShowReflectionPicker(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                proLinkType === 'reflection' && !proLinkValue && 'bg-primary/10 ring-1 ring-primary/30'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 flex items-center justify-center">
                <Brain className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{t('taskEdit.anyReflection')}</p>
                <p className="text-xs text-muted-foreground">{t('taskEdit.anyReflectionHint')}</p>
              </div>
            </button>
            
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">{t('taskPickers.orSelectSpecificReflection')}</p>
            </div>
            
            <ScrollArea className="h-[40vh]">
              <div className="space-y-2 pr-4">
                {reflections.map((reflection) => (
                  <button
                    key={reflection.id}
                    onClick={() => {
                      setProLinkType('reflection');
                      setProLinkValue(reflection.id);
                      setShowReflectionPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === reflection.id && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {reflection.cover_image_url ? (
                      <img src={reflection.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 flex items-center justify-center">
                        <FluentEmoji emoji={reflection.emoji || '✏️'} size={22} />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{reflection.title}</p>
                      {reflection.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{reflection.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Routine Picker Sheet */}
      <Sheet open={showRoutinePicker} onOpenChange={setShowRoutinePicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowRoutinePicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectRoutine')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('taskPickers.chooseRoutineHint')}
            </p>
            
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {linkableRoutines.map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => {
                      setProLinkType('routine');
                      setProLinkValue(routine.id);
                      setShowRoutinePicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === routine.id && proLinkType === 'routine' && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center">
                      <span className="text-xl">{routine.emoji || '✨'}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{routine.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{routine.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>


      {/* Routine Template Picker Sheet */}
      <Sheet open={showRoutineTemplatePicker} onOpenChange={setShowRoutineTemplatePicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowRoutineTemplatePicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectRoutineTemplate')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={routineTemplateSearchQuery} onChange={(e) => setRoutineTemplateSearchQuery(e.target.value)} placeholder={t('taskEdit.searchTemplates')} className="mb-2" />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {routineTemplates.filter(r => !routineTemplateSearchQuery || r.title.toLowerCase().includes(routineTemplateSearchQuery.toLowerCase())).map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => {
                      setProLinkType('inspire');
                      setProLinkValue(routine.id);
                      setShowRoutineTemplatePicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === routine.id && proLinkType === 'inspire' && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 flex items-center justify-center">
                      <span className="text-xl">{routine.emoji || '📋'}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{routine.title}</p>
                      {routine.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{routine.subtitle}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Audio Track Picker Sheet */}
      <Sheet open={showAudioPicker} onOpenChange={setShowAudioPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowAudioPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectAudioTrack')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={audioSearchQuery}
              onChange={(e) => setAudioSearchQuery(e.target.value)}
              placeholder={t('taskEdit.searchAudioTracks')}
              className="mb-2"
            />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {audioTracks
                  .filter(a => a.title.toLowerCase().includes(audioSearchQuery.toLowerCase()))
                  .map((audio) => (
                  <button
                    key={audio.id}
                    onClick={() => {
                      setProLinkType('audio');
                      setProLinkValue(audio.id);
                      setShowAudioPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === audio.id && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {audio.cover_image_url ? (
                      <img src={audio.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center">
                        <Headphones className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{audio.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {audio.playlist_name || audio.category} • {Math.floor(audio.duration_seconds / 60)}min
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Community Channel Picker Sheet */}
      <Sheet open={showChannelPicker} onOpenChange={setShowChannelPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowChannelPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectChannel')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={channelSearchQuery}
              onChange={(e) => setChannelSearchQuery(e.target.value)}
              placeholder={t('taskEdit.searchChannels')}
              className="mb-2"
            />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {feedChannels
                  .filter(c => c.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                  .map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setProLinkType('channel');
                      setProLinkValue(channel.slug);
                      setShowChannelPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === channel.slug && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {channel.cover_image_url && !channel.cover_image_url.startsWith('emoji:') ? (
                      <img src={channel.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 flex items-center justify-center">
                        {channel.cover_image_url?.startsWith('emoji:') ? (
                          <span className="text-xl">{channel.cover_image_url.replace('emoji:', '')}</span>
                        ) : (
                          <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{channel.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Video Picker Sheet */}
      <Sheet open={showVideoPicker} onOpenChange={setShowVideoPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowVideoPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectVideo')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={videoSearchQuery}
              onChange={(e) => setVideoSearchQuery(e.target.value)}
              placeholder={t('taskEdit.searchVideos')}
              className="mb-2"
            />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {videoTracks
                  .filter(v => v.title.toLowerCase().includes(videoSearchQuery.toLowerCase()))
                  .map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setProLinkType('video');
                      setProLinkValue(video.id);
                      setShowVideoPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === video.id && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt="" className="w-14 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 flex items-center justify-center">
                        <Video className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {video.video_type} • {Math.floor(video.duration_seconds / 60)}min
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Video Playlist Picker Sheet */}
      <Sheet open={showVideoPlaylistPicker} onOpenChange={setShowVideoPlaylistPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowVideoPlaylistPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectVideoPlaylist')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={videoPlaylistSearchQuery}
              onChange={(e) => setVideoPlaylistSearchQuery(e.target.value)}
              placeholder={t('taskEdit.searchVideoPlaylists')}
              className="mb-2"
            />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {videoPlaylists
                  .filter(vp => vp.name.toLowerCase().includes(videoPlaylistSearchQuery.toLowerCase()))
                  .map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      setProLinkType('video_playlist');
                      setProLinkValue(playlist.id);
                      setShowVideoPlaylistPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === playlist.id && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {playlist.cover_image_url ? (
                      <img src={playlist.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 flex items-center justify-center">
                        <Clapperboard className="h-5 w-5 text-rose-600 dark:text-rose-400" />
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

      {/* Program Picker Sheet */}
      <Sheet open={showProgramPicker} onOpenChange={setShowProgramPicker}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowProgramPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.linkProgram')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{t('taskPickers.enterProgramSlug')}</p>
            <Input
              value={proLinkValue || ''}
              onChange={(e) => setProLinkValue(e.target.value || null)}
              placeholder={t('taskEdit.programSlugPlaceholder')}
              autoFocus
            />
            <Button
              onClick={() => setShowProgramPicker(false)}
              className="w-full rounded-xl"
              disabled={!proLinkValue}
            >
              {t('taskPickers.done')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reading Content Picker Sheet */}
      <Sheet open={showReadingPicker} onOpenChange={setShowReadingPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowReadingPicker(false); setShowProLinkPicker(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>{t('taskEdit.selectReading')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-2 pr-4">
                {readingContent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setProLinkType('reading_item');
                      setProLinkValue(item.id);
                      setShowReadingPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      proLinkValue === item.id && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {item.cover_url ? (
                      <img src={item.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 flex items-center justify-center">
                        <FluentEmoji emoji={item.emoji || '📖'} size={22} />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type} · {item.category}</p>
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
            className="h-[90vh] rounded-t-3xl px-0 pt-0 pb-0 border-0 pointer-events-auto"
            overlayClassName="pointer-events-auto"
            style={{ backgroundColor: bgColor }}
            hideCloseButton
          >
            <div className="flex flex-col h-full">
              {/* Header - sits inside the rounded top area */}
              <div 
                className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0"
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
                <h1 className="text-lg font-semibold">{taskId ? t('taskEdit.editTask') : t('taskEdit.newTask')}</h1>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  variant="ghost"
                  className="text-primary font-semibold"
                >
                  {t('taskEdit.save')}
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
            size="sm"
            className="bg-primary text-primary-foreground font-semibold rounded-full px-5 active:scale-95"
          >
            {taskId ? t('taskEdit.save') : t('taskEdit.create')}
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
              {t('taskEdit.enableUrgentAlarm')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {t('taskEdit.enableUrgentMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0">{t('taskEdit.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 bg-red-500"
              onClick={() => {
                setIsUrgent(true);
                setShowUrgentConfirm(false);
              }}
            >
              {t('taskEdit.enableUrgent')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plus paywall when non-Plus user toggles Add to Calendar */}
      <PaywallSheet open={showCalendarPaywall} onOpenChange={setShowCalendarPaywall} />
    </div>
  );
};

export default AppTaskCreate;
