import { useState, useEffect, useMemo } from 'react';
import { ProgramEventCard } from '@/components/app/ProgramEventCard';
import { type ProgramEvent } from '@/hooks/usePlannerProgramEvents';
import { SaveRoutineHandHint, useSaveRoutineHint } from '@/components/app/AddToRoutineHandHint';
import { Check, Pencil } from 'lucide-react';
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

// Secondary (darker) palette for card footer strips
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
  scheduleType?: 'daily' | 'weekly' | 'challenge' | 'project' | 'program';
  challengeStartDate?: string | null;
  startDayOfWeek?: number | null;
  endMode?: string | null;
  endDate?: string | null;
  endAfterDays?: number | null;
  badgeImageUrl?: string | null;
  onSave: (selectedTaskIds: string[], editedTasks: EditedTask[]) => void;
  isSaving?: boolean;
  isFree?: boolean;
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
  routineBankId,
  linkedProgramTitle,
  linkedProgramSlug,
}: RoutinePreviewSheetProps) {
  // Generate synthetic pro-task for multi-task routines
  const displayTasks = useMemo(() => {
    if (tasks.length > 1 && routineBankId) {
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
    new Set(tasks.filter(t => !t.id.startsWith('__pro_task_routine_')).map(t => t.id))
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
  // Pro-tasks (routine player launchers) are excluded from default selection
  useEffect(() => {
    const nonProTasks = displayTasks.filter(t => !t.id.startsWith('__pro_task_routine_'));
    const missingIds = nonProTasks.filter(t => !selectedTaskIds.has(t.id));
    if (nonProTasks.length > 0 && (selectedTaskIds.size === 0 || missingIds.length > 0)) {
      const newIds = new Set(nonProTasks.map(t => t.id));
      // Preserve pro-task selection if user manually selected it
      displayTasks.forEach(t => {
        if (t.id.startsWith('__pro_task_routine_') && selectedTaskIds.has(t.id)) {
          newIds.add(t.id);
        }
      });
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
    const editedTasksList = Object.values(editedTasks);
    onSave(Array.from(selectedTaskIds), editedTasksList);
  };

  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getRepeatLabel = (task: RoutinePlanTask, pattern: string) => {
    // Build base repeat text
    let repeatText = '';
    switch (pattern) {
      case 'daily': repeatText = 'Repeats every day'; break;
      case 'weekly': {
        const days = (task as any).repeat_days as number[] | null;
        if (days && days.length > 0) {
          const dayNames = days.map(d => WEEKDAY_NAMES[d] || `Day ${d}`).join(', ');
          repeatText = `Repeats every week on ${dayNames}`;
        } else {
          repeatText = 'Repeats every week';
        }
        break;
      }
      case 'monthly': repeatText = 'Repeats every month'; break;
      case 'none':
      case 'once': repeatText = 'One-time action'; break;
      default: repeatText = 'Repeats every day';
    }
    
    // Append end date if available
    if (endMode === 'date' && endDate) {
      const d = new Date(endDate + 'T00:00:00');
      repeatText += ` until ${format(d, 'MMM dd, yyyy')}`;
    } else if (endMode === 'after_days' && endAfterDays) {
      repeatText += ` for ${endAfterDays} day${endAfterDays !== 1 ? 's' : ''}`;
    }
    
    return repeatText;
  };

  // Find the task being edited
  const editingTask = editingTaskId ? displayTasks.find(t => t.id === editingTaskId) : null;

  const renderTaskCard = (task: RoutinePlanTask, index: number) => {
    const isSelected = selectedTaskIds.has(task.id);
    const isPro = isProTask(task.id);
    const display = getTaskDisplay(task, index);
    const colorClass = TASK_COLOR_CLASSES[display.color];
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
                <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-0.5">⚡ Routine Player</p>
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
              {isPro ? 'One-tap player for this routine' : getRepeatLabel(task, display.repeatPattern)}
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
              <SheetTitle className="text-xl font-bold">Preview Routine</SheetTitle>
              <p className="text-sm text-foreground">
                Edit it to create your personalized routine.
              </p>
              {/* Start/End banners + Badge */}
              <div className="mt-2 flex gap-2">
                {/* Left: start & end banners */}
                <div className={cn("flex flex-col gap-2", badgeImageUrl ? "flex-1" : "w-full")}>
                  {/* Start date banner */}
                  {(() => {
                    const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    let label = 'Starts today!';
                    let emoji = '🚀';
                    let isFuture = false;
                    if (challengeStartDate) {
                      const d = new Date(challengeStartDate + 'T00:00:00');
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (d <= today) {
                        label = 'Starts today!';
                      } else {
                        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        label = `Starts ${format(d, 'MMM d')}`;
                        emoji = '📅';
                        isFuture = true;
                      }
                    } else if (startDayOfWeek != null) {
                      label = `Starts next ${WEEKDAY_NAMES[startDayOfWeek]}`;
                      emoji = '📅';
                      isFuture = true;
                    }
                    return (
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                        isFuture 
                          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                          : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      }`}>
                        <span className="text-base">{emoji}</span>
                        <span className={`text-xs font-medium ${
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
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800">
                          <span className="text-base">🏁</span>
                          <span className="text-xs font-medium text-rose-800 dark:text-rose-300">
                            Ends {format(d, 'MMM d')}
                          </span>
                        </div>
                      );
                    }
                    if (endMode === 'after_days' && endAfterDays) {
                      return (
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800">
                          <span className="text-base">🏁</span>
                          <span className="text-xs font-medium text-rose-800 dark:text-rose-300">
                            Ends after {endAfterDays} day{endAfterDays !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                {/* Right: Badge preview */}
                {badgeImageUrl && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border-2 border-amber-300 bg-amber-50 shadow-md">
                      <img 
                        src={badgeImageUrl} 
                        alt="Challenge badge" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-amber-600 font-semibold mt-1">🏆 Badge</span>
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4 -mx-4 px-4 min-h-0">
            {/* Program Event Card Preview */}
            {linkedProgramTitle && linkedProgramSlug && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Added to your planner:</p>
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
            {scheduleType === 'challenge' ? (
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
                          Day {day}
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
                          🎯 Step {step}
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
                      { key: 'daily', label: 'Daily actions', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern || 'daily';
                        return p === 'daily';
                      }},
                      { key: 'weekly', label: 'Weekly actions', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'weekly';
                      }},
                      { key: 'monthly', label: 'Monthly actions', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'monthly';
                      }},
                      { key: 'none', label: 'Special events', filter: (t: RoutinePlanTask) => {
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
                <span className="text-sm font-medium">Add all</span>
              </div>
              
              <Button
                onClick={() => { dismissSaveHint(); handleSave(); }}
                disabled={selectedTaskIds.size === 0 || isSaving}
                className="px-8"
              >
                {isSaving ? 'Saving...' : 'Save'}
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
