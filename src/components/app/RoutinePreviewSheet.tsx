import { useState, useEffect, useMemo } from 'react';
import { ProgramEventCard } from '@/components/app/ProgramEventCard';
import { type ProgramEvent } from '@/hooks/usePlannerProgramEvents';
import { SaveRoutineHandHint, useSaveRoutineHint } from '@/components/app/AddToRoutineHandHint';
import { Check, Pencil, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
import AppTaskCreate, { TaskFormData } from '@/pages/app/AppTaskCreate';
import { useAllActiveTasks } from '@/hooks/useTaskPlanner';
import { ProLinkType, PRO_LINK_CONFIGS } from '@/lib/proTaskTypes';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { ActionLimitSheet, hasSeenActionLimitSoft, markActionLimitSoftSeen } from '@/components/app/ActionLimitSheet';
import { formatTimeLabel } from '@/lib/taskScheduling';
import { useTranslation } from 'react-i18next';

// Secondary (darker) palette for card footer strips
// Visible mid-tone tints for the card body (top half)
const TASK_COLOR_LIGHT_CLASSES: Record<string, string> = {
  pink: 'bg-[#FFE0F5]',
  peach: 'bg-[#FFE6C9]',
  yellow: 'bg-[#FFF492]',
  lime: 'bg-[#E2F9F0]',
  sky: 'bg-[#D7E9FF]',
  mint: 'bg-[#E0FBB8]',
  lavender: 'bg-[#F0E3FF]',
  purple: 'bg-[#F0E3FF]',
  blue: 'bg-[#D7E9FF]',
  red: 'bg-[#FFE0F5]',
  orange: 'bg-[#FFE6C9]',
  green: 'bg-[#E2F9F0]',
};

const TASK_COLOR_DARK_CLASSES: Record<string, string> = {
  pink: 'bg-[#FFC2EA]',
  peach: 'bg-[#FFD2A1]',
  yellow: 'bg-[#FFEA4E]',
  lime: 'bg-[#C3F1E1]',
  sky: 'bg-[#B9D6FF]',
  mint: 'bg-[#C9F588]',
  lavender: 'bg-[#DEC1FF]',
  purple: 'bg-[#DEC1FF]',
  blue: 'bg-[#B9D6FF]',
  red: 'bg-[#FFC2EA]',
  orange: 'bg-[#FFD2A1]',
  green: 'bg-[#C3F1E1]',
};

// Color cycle for variety in planner (used when no specific color is set)
export const ROUTINE_COLOR_CYCLE: TaskColor[] = [
  'sky', 
  'mint',
  'lavender',
  'pink',
  'lime',
  'yellow',
  'peach',
];

export const getTaskColor = (index: number): TaskColor => {
  return ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length];
};

// Get color based on pro_link_type or fall back to cycle
export const getProLinkColor = (proLinkType: ProLinkType | null | undefined, index: number): TaskColor => {
  if (proLinkType && PRO_LINK_CONFIGS[proLinkType]) {
    return PRO_LINK_CONFIGS[proLinkType].color as TaskColor;
  }
  return getTaskColor(index);
};

export interface EditedTask {
  id: string;
  title: string;
  description?: string | null;
  icon?: string;
  color?: TaskColor;
  repeatPattern?: 'daily' | 'weekly' | 'monthly' | 'none';
  scheduledTime?: string | null;
  tag?: string | null;
  reminderEnabled?: boolean;
  reminderTime?: string;
  subtasks?: string[];
  linked_playlist_id?: string | null;
  pro_link_type?: ProLinkType | null;
  pro_link_value?: string | null;
}

interface RoutinePreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: RoutinePlanTask[];
  routineTitle: string;
  routineColor?: string | null;
  defaultTag?: string | null;
  scheduleType?: 'daily' | 'weekly' | 'drip' | 'project' | 'program';
  challengeStartDate?: string | null;
  startDayOfWeek?: number | null;
  endMode?: string | null;
  endDate?: string | null;
  endAfterDays?: number | null;
  badgeImageUrl?: string | null;
  onSave: (selectedTaskIds: string[], editedTasks: EditedTask[]) => void;
  isSaving?: boolean;
  isFree?: boolean;
  /** True when the source routine_plans row has is_pro_routine = true. */
  isPro?: boolean;
  routineBankId?: string | null;
  linkedProgramTitle?: string | null;
  linkedProgramSlug?: string | null;
}

export function RoutinePreviewSheet({
  open,
  onOpenChange,
  tasks,
  routineTitle,
  routineColor,
  defaultTag,
  scheduleType = 'daily',
  challengeStartDate,
  startDayOfWeek,
  endMode,
  endDate,
  endAfterDays,
  badgeImageUrl,
  onSave,
  isSaving,
  isFree,
  isPro,
  routineBankId,
  linkedProgramTitle,
  linkedProgramSlug,
}: RoutinePreviewSheetProps) {
  const { t } = useTranslation();
  // Generate synthetic pro-task for multi-task routines
  const displayTasks = useMemo(() => {
    // Routine player synthetic task — temporarily hidden. Admin can re-enable from /admin/system.
    const SHOW_ROUTINE_PLAYER = typeof window !== 'undefined'
      && localStorage.getItem('simora_show_routine_player_task') === 'true';
    if (SHOW_ROUTINE_PLAYER && tasks.length > 1 && routineBankId) {
      const proTask: RoutinePlanTask = {
        id: `__pro_task_routine_${routineBankId}`,
        plan_id: routineBankId,
        title: routineTitle,
        icon: '🎬',
        color: (routineColor as string) || 'mint',
        task_order: -1,
        is_active: true,
        created_at: new Date().toISOString(),
        linked_playlist_id: null,
        pro_link_type: 'routine' as any,
        pro_link_value: routineBankId,
        goal_enabled: false,
        goal_target: null,
        goal_type: null,
        goal_unit: null,
        linked_playlist: null,
      };
      (proTask as any).repeat_pattern = 'daily';
      return [proTask, ...tasks];
    }
    return tasks;
  }, [tasks, routineBankId, routineTitle]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(tasks.map(t => t.id))
  );
  const [editedTasks, setEditedTasks] = useState<Record<string, EditedTask>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number>(0);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showActionLimit, setShowActionLimit] = useState(false);
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const { data: allExistingTasks = [] } = useAllActiveTasks();
  const { showHint: showSaveHint, dismissHint: dismissSaveHint } = useSaveRoutineHint(open);
  const MAX_FREE_ACTIONS = 6;

  // Sync selectedTaskIds when displayTasks change (e.g., when data loads async)
  // All tasks including pro-tasks are selected by default
  useEffect(() => {
    const missingIds = displayTasks.filter(t => !selectedTaskIds.has(t.id));
    if (displayTasks.length > 0 && (selectedTaskIds.size === 0 || missingIds.length > 0)) {
      const newIds = new Set(displayTasks.map(t => t.id));
      setSelectedTaskIds(newIds);
    }
  }, [displayTasks.length]);

  const allSelected = selectedTaskIds.size === displayTasks.length;

  const toggleTask = (taskId: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(displayTasks.map(t => t.id)));
    }
  };

  const isProTask = (taskId: string) => taskId.startsWith('__pro_task_routine_');

  const openTaskEditor = (task: RoutinePlanTask, index: number) => {
    setEditingTaskId(task.id);
    setEditingTaskIndex(index);
    setShowEditSheet(true);
  };

  const handleTaskEditSave = (data: TaskFormData) => {
    if (!editingTaskId) return;
    
    // Find the original task to preserve pro_link fields
    const originalTask = tasks.find(t => t.id === editingTaskId);
    
    setEditedTasks(prev => ({
      ...prev,
      [editingTaskId]: {
        id: editingTaskId,
        title: data.title,
        description: data.description,
        icon: data.icon,
        color: data.color,
        repeatPattern: data.repeatEnabled ? data.repeatPattern : 'none',
        scheduledTime: data.scheduledTime,
        tag: data.tag,
        reminderEnabled: data.reminderEnabled,
        reminderTime: data.reminderTime,
        subtasks: data.subtasks,
        linked_playlist_id: data.proLinkType === 'playlist' ? data.proLinkValue : originalTask?.linked_playlist_id ?? null,
        pro_link_type: data.proLinkType ?? originalTask?.pro_link_type ?? null,
        pro_link_value: data.proLinkValue ?? originalTask?.pro_link_value ?? null,
      },
    }));
    setShowEditSheet(false);
    setEditingTaskId(null);
  };

  const getTaskDisplay = (task: RoutinePlanTask, index: number) => {
    const edited = editedTasks[task.id];
    // Priority: edited color > task.color > pro_link_type color > cycle color
    const defaultColor = task.color as TaskColor || getProLinkColor(task.pro_link_type, index);
    
    // Use per-task repeat_pattern (from admin_task_bank), or derive from schedule_days
    const scheduleDays = (task as any).schedule_days as number[] | null;
    const taskRepeatPattern = (task as any).repeat_pattern 
      || (scheduleDays && scheduleDays.length > 0 ? 'weekly' : 'daily');
    const repeatPattern = edited?.repeatPattern || taskRepeatPattern;
    
    return {
      title: edited?.title || task.title,
      icon: edited?.icon || task.icon,
      color: edited?.color || defaultColor,
      repeatPattern,
    };
  };

  const getInitialDataForEdit = (task: RoutinePlanTask, index: number): Partial<TaskFormData> => {
    const existing = editedTasks[task.id];
    // Determine pro_link fields - prefer existing edits, fall back to template
    const proLinkType = existing?.pro_link_type ?? task.pro_link_type ?? (task.linked_playlist_id ? 'playlist' : null);
    const proLinkValue = existing?.pro_link_value ?? task.pro_link_value ?? task.linked_playlist_id ?? null;
    // Priority: edited color > task.color > pro_link_type color > cycle color
    const defaultColor = task.color as TaskColor || getProLinkColor(task.pro_link_type, index);
    
    // Use per-task repeat settings from the bank
    const taskRepeatPattern = (task as any).repeat_pattern || 'daily';
    const repeatPattern = existing?.repeatPattern || taskRepeatPattern;
    const repeatEnabled = repeatPattern !== 'none';

    return {
      title: existing?.title || task.title,
      description: existing?.description ?? task.description ?? null,
      icon: existing?.icon || task.icon,
      color: existing?.color || defaultColor,
      scheduledDate: new Date(),
      scheduledTime: existing?.scheduledTime ?? null,
      repeatEnabled,
      repeatPattern: (repeatEnabled ? repeatPattern : 'daily') as 'daily' | 'weekly' | 'monthly',
      repeatInterval: 1,
      repeatDays: (task as any).repeat_days || [],
      reminderEnabled: existing?.reminderEnabled ?? false,
      reminderTime: existing?.reminderTime || '09:00',
      tag: existing?.tag ?? defaultTag ?? routineTitle,
      subtasks: existing?.subtasks || [],
      linkedPlaylistId: proLinkType === 'playlist' ? proLinkValue : null,
      proLinkType: proLinkType as ProLinkType | null,
      proLinkValue: proLinkValue,
      // Goal fields from task template
      goalEnabled: task.goal_enabled ?? false,
      goalType: (task.goal_type as 'count' | 'timer') ?? 'count',
      goalTarget: task.goal_target ?? 1,
      goalUnit: task.goal_unit ?? 'times',
    };
  };

  const handleSave = () => {
    // Plus-only routine: never allow save until subscription state is loaded.
    if (isPro) {
      if (subLoading) return;
      if (!isSubscribed) {
        setShowPaywall(true);
        return;
      }
    }
    const editedTasksList = Object.values(editedTasks);
    onSave(Array.from(selectedTaskIds), editedTasksList);
  };

  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getRepeatLabel = (task: RoutinePlanTask, pattern: string) => {
    // Build base repeat text
    let repeatText = '';
    switch (pattern) {
      case 'daily': repeatText = t('routinePreview.repeatsEveryDay'); break;
      case 'weekly': {
        const days = (task as any).repeat_days as number[] | null;
        if (days && days.length > 0) {
          const dayNames = days.map(d => WEEKDAY_NAMES[d] || `Day ${d}`).join(', ');
          repeatText = t('routinePreview.weeklyOnDays', { days: dayNames });
        } else {
          repeatText = t('routinePreview.repeatsEveryWeek');
        }
        break;
      }
      case 'monthly': repeatText = t('routinePreview.repeatsEveryMonth'); break;
      case 'none':
      case 'once': repeatText = t('routinePreview.oneTimeAction'); break;
      default: repeatText = t('routinePreview.repeatsEveryDay');
    }
    
    // Append end date if available
    if (endMode === 'date' && endDate) {
      const d = new Date(endDate + 'T00:00:00');
      repeatText += t('routinePreview.untilDate', { date: format(d, 'MMM dd, yyyy') });
    } else if (endMode === 'after_days' && endAfterDays) {
      repeatText += t('routinePreview.forDays', { n: endAfterDays, count: endAfterDays });
    }
    
    return repeatText;
  };

  // Find the task being edited
  const editingTask = editingTaskId ? displayTasks.find(t => t.id === editingTaskId) : null;

  const renderTaskCard = (task: RoutinePlanTask, index: number) => {
    const isSelected = selectedTaskIds.has(task.id);
    const isPro = isProTask(task.id);
    const display = getTaskDisplay(task, index);
    const colorClass = TASK_COLOR_LIGHT_CLASSES[display.color] || TASK_COLOR_CLASSES[display.color];
    const darkColorClass = TASK_COLOR_DARK_CLASSES[display.color] || 'bg-black/10';
    const edited = editedTasks[task.id];
    
    // Time label
    const timeLabel = formatTimeLabel({
      scheduled_time: edited?.scheduledTime ?? (task as any).scheduled_time ?? null,
      time_period: (task as any).time_period ?? null,
    });
    
    return (
      <div key={task.id} className="flex items-start gap-3">
        <button
          onClick={() => toggleTask(task.id)}
          className={cn(
            'w-7 h-7 mt-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            isSelected 
              ? 'bg-emerald-500 border-emerald-500' 
              : 'border-muted-foreground/40 bg-transparent'
          )}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </button>
        <div className={cn(
          'flex-1 rounded-2xl overflow-hidden',
          isPro ? 'ring-2 ring-teal-300 dark:ring-teal-600' : '',
          colorClass
        )}>
          {/* Main content area */}
          <div className="flex items-center gap-3 px-3 pt-3 pb-2.5">
            <FluentEmoji emoji={display.icon || '📝'} size={40} className="shrink-0" />
            <div className="flex-1 min-w-0">
              {isPro ? (
                <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-0.5">{t('routinePreview.routinePlayer')}</p>
              ) : (
                <p className="text-xs font-medium text-black mb-0.5">{timeLabel}</p>
              )}
              <p className="font-semibold text-[15px] text-black leading-snug line-clamp-2">{display.title}</p>
            </div>
            {!isPro && (
              <button 
                className={cn("shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-black/60 active:scale-95 transition-transform", darkColorClass)}
                onClick={() => openTaskEditor(task, index)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Footer strip with repeat info */}
          <div className={cn('px-4 py-3.5', darkColorClass)}>
            <p className="text-[13px] font-medium text-black text-center">
              {isPro ? t('routinePreview.onTapPlayer') : getRepeatLabel(task, display.repeatPattern)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl px-4"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="text-left pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-bold">{t('routinePreview.previewRoutine')}</SheetTitle>
                {isPro && !isSubscribed && !subLoading && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-[#1a1f3d]"
                    style={{ background: 'linear-gradient(135deg, #FFD27A 0%, #FF8A5C 100%)' }}
                  >
                    <Crown className="h-3 w-3" strokeWidth={2.6} />
                    Plus
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">
                {t('routinePreview.editToPersonalize')}
              </p>
              {/* Start/End banners */}
              <div className="mt-2 flex gap-2">
                <div className="flex flex-row gap-2 w-full">
                  {/* Start date banner */}
                  {(() => {
                    const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    let label = t('routinePreview.startsToday');
                    let emoji = '🚀';
                    let isFuture = false;
                    if (challengeStartDate) {
                      const d = new Date(challengeStartDate + 'T00:00:00');
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (d <= today) {
                        label = t('routinePreview.startsToday');
                      } else {
                        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        label = t('routinePreview.startsOn', { date: format(d, 'MMM d') });
                        emoji = '📅';
                        isFuture = true;
                      }
                    } else if (startDayOfWeek != null) {
                      label = t('routinePreview.startsNext', { day: WEEKDAY_NAMES[startDayOfWeek] });
                      emoji = '📅';
                      isFuture = true;
                    }
                    return (
                      <div className={`flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2 border ${
                        isFuture 
                          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                          : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      }`}>
                        <span className="text-sm shrink-0">{emoji}</span>
                        <span className={`text-xs font-medium truncate ${
                          isFuture 
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {label}
                        </span>
                      </div>
                    );
                  })()}
                  {/* End date banner */}
                  {(() => {
                    if (endMode === 'date' && endDate) {
                      const d = new Date(endDate + 'T00:00:00');
                      return (
                        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2 border bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800">
                          <span className="text-sm shrink-0">🏁</span>
                          <span className="text-xs font-medium text-rose-800 dark:text-rose-300 truncate">
                            {t('routinePreview.endsOn', { date: format(d, 'MMM d') })}
                          </span>
                        </div>
                      );
                    }
                    if (endMode === 'after_days' && endAfterDays) {
                      return (
                        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2 border bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800">
                          <span className="text-sm shrink-0">🏁</span>
                          <span className="text-xs font-medium text-rose-800 dark:text-rose-300 truncate">
                            {t('routinePreview.endsAfterDays', { n: endAfterDays, count: endAfterDays })}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              {/* Trophy banner — earned by completing the challenge */}
              {badgeImageUrl && (
                <div
                  className="mt-2 flex items-center gap-3 rounded-2xl p-3 border border-amber-200 dark:border-amber-800/60"
                  style={{
                    background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE9C2 100%)',
                  }}
                >
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-amber-300/40 blur-xl" />
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-[0_6px_16px_-4px_rgba(217,119,6,0.45)] ring-2 ring-amber-300/70">
                      <img
                        src={badgeImageUrl}
                        alt={t('routinePreview.challengeBadge')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700">
                        🏆 {t('routinePreview.trophyLabel')}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-amber-900 leading-snug mt-0.5">
                      {t('routinePreview.trophyTitle')}
                    </p>
                    <p className="text-[11px] text-amber-800/80 leading-snug mt-0.5">
                      {t('routinePreview.trophySubtitle')}
                    </p>
                  </div>
                </div>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4 -mx-4 px-4 min-h-0">
            {/* Program Event Card Preview */}
            {linkedProgramTitle && linkedProgramSlug && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('routinePreview.addedToPlanner')}</p>
                <div className="pointer-events-none opacity-90">
                  <ProgramEventCard
                    event={{
                      id: 'preview',
                      type: 'enrollment',
                      title: linkedProgramTitle,
                      programSlug: linkedProgramSlug,
                      programTitle: linkedProgramTitle,
                      isCompleted: false,
                    } as ProgramEvent}
                    date={new Date()}
                  />
                </div>
              </div>
            )}
            {scheduleType === 'drip' ? (
                <>
                  {/* Pro-task at top for challenges */}
                  {displayTasks.length > tasks.length && (
                    <div className="space-y-3 mb-4">
                      {renderTaskCard(displayTasks[0], 0)}
                    </div>
                  )}
                  {(() => {
                    // Group tasks by drip_day
                    const dayGroups = new Map<number, { task: RoutinePlanTask; index: number }[]>();
                    tasks.forEach((task, index) => {
                      const day = (task as any).drip_day ?? 1;
                      if (!dayGroups.has(day)) dayGroups.set(day, []);
                      dayGroups.get(day)!.push({ task, index: index + (displayTasks.length > tasks.length ? 1 : 0) });
                    });
                    const sortedDays = Array.from(dayGroups.keys()).sort((a, b) => a - b);
                    return sortedDays.map(day => (
                      <div key={day} className="mb-4">
                        <p className="text-base font-semibold text-foreground mb-3">
                          {t('routinePreview.day', { n: day })}
                        </p>
                        <div className="space-y-3">
                          {dayGroups.get(day)!.map(({ task, index }) => renderTaskCard(task, index))}
                        </div>
                      </div>
                    ));
                  })()}
                </>
              ) : scheduleType === 'project' ? (
                <>
                  {/* Pro-task at top for projects */}
                  {displayTasks.length > tasks.length && (
                    <div className="space-y-3 mb-4">
                      {renderTaskCard(displayTasks[0], 0)}
                    </div>
                  )}
                  {(() => {
                    // Group tasks by drip_day as step number
                    const stepGroups = new Map<number, { task: RoutinePlanTask; index: number }[]>();
                    tasks.forEach((task, index) => {
                      const step = (task as any).drip_day ?? (index + 1);
                      if (!stepGroups.has(step)) stepGroups.set(step, []);
                      stepGroups.get(step)!.push({ task, index: index + (displayTasks.length > tasks.length ? 1 : 0) });
                    });
                    const sortedSteps = Array.from(stepGroups.keys()).sort((a, b) => a - b);
                    return sortedSteps.map(step => (
                      <div key={step} className="mb-4">
                        <p className="text-base font-semibold text-foreground mb-3">
                          {t('routinePreview.step', { n: step })}
                        </p>
                        <div className="space-y-3">
                          {stepGroups.get(step)!.map(({ task, index }) => renderTaskCard(task, index))}
                        </div>
                      </div>
                    ));
                  })()}
                </>
              ) : (
                <>
                  {/* Group tasks by repeat_pattern */}
                  {(() => {
                    const groups = [
                      { key: 'daily', label: t('routinePreview.dailyActions'), filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern || 'daily';
                        return p === 'daily';
                      }},
                      { key: 'weekly', label: t('routinePreview.weeklyActions'), filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'weekly';
                      }},
                      { key: 'monthly', label: t('routinePreview.monthlyActions'), filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'monthly';
                      }},
                      { key: 'none', label: t('routinePreview.specialEvents'), filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'none' || p === 'once';
                      }},
                    ];
                    return groups.map(group => {
                      const groupTasks = displayTasks.filter(group.filter);
                      if (groupTasks.length === 0) return null;
                      return (
                        <div key={group.key} className="mb-4">
                          <p className="text-base font-semibold text-foreground mb-3">
                            {group.label}
                          </p>
                          <div className="space-y-3">
                            {groupTasks.map((task) => {
                              const originalIndex = displayTasks.indexOf(task);
                              return renderTaskCard(task, originalIndex);
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>

            {/* Footer with toggle and save */}
            <div 
              className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-border"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center gap-3">
                <Switch 
                  checked={allSelected} 
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">{t('routinePreview.addAll')}</span>
              </div>
              
              <Button
                onClick={() => { dismissSaveHint(); handleSave(); }}
                disabled={selectedTaskIds.size === 0 || isSaving || (isPro && subLoading)}
                className="px-8"
              >
                {isSaving ? t('routinePreview.saving') : t('routinePreview.save')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <SaveRoutineHandHint show={showSaveHint} />

      {/* Full Task Edit Sheet - uses the REAL AppTaskCreate component */}
      {editingTask && (
        <AppTaskCreate
          isSheet={true}
          sheetOpen={showEditSheet}
          onSheetOpenChange={setShowEditSheet}
          initialData={getInitialDataForEdit(editingTask, editingTaskIndex)}
          onSaveSheet={handleTaskEditSave}
        />
      )}

      <PaywallSheet
        open={showPaywall}
        onOpenChange={setShowPaywall}
      />

      <ActionLimitSheet
        open={showActionLimit}
        onOpenChange={setShowActionLimit}
        onTakeChallenge={() => setShowPaywall(true)}
      />
    </>
  );
}
