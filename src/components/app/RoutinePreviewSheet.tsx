import { useState, useEffect } from 'react';
import { Check, Pencil, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
import AppTaskCreate, { TaskFormData } from '@/pages/app/AppTaskCreate';
import { ProLinkType, PRO_LINK_CONFIGS } from '@/lib/proTaskTypes';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

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
  defaultTag?: string | null;
  scheduleType?: 'daily' | 'weekly' | 'challenge';
  onSave: (selectedTaskIds: string[], editedTasks: EditedTask[]) => void;
  isSaving?: boolean;
}

export function RoutinePreviewSheet({
  open,
  onOpenChange,
  tasks,
  routineTitle,
  defaultTag,
  scheduleType = 'daily',
  onSave,
  isSaving,
}: RoutinePreviewSheetProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(tasks.map(t => t.id))
  );
  const [editedTasks, setEditedTasks] = useState<Record<string, EditedTask>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number>(0);
  const [showEditSheet, setShowEditSheet] = useState(false);

  // Sync selectedTaskIds when tasks change (e.g., when data loads async)
  useEffect(() => {
    if (tasks.length > 0 && selectedTaskIds.size === 0) {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    }
  }, [tasks]);

  const allSelected = selectedTaskIds.size === tasks.length;

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
      setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    }
  };

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
    
    // Use per-task repeat_pattern (from admin_task_bank), or edited override
    const taskRepeatPattern = (task as any).repeat_pattern || 'daily';
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
    if (scheduleType === 'challenge' && (task as any).drip_day) {
      return `Day ${(task as any).drip_day}`;
    }
    switch (pattern) {
      case 'daily': return 'Repeats every day';
      case 'weekly': {
        const days = (task as any).repeat_days as number[] | null;
        if (days && days.length > 0) {
          const dayNames = days.map(d => WEEKDAY_NAMES[d] || `Day ${d}`).join(', ');
          return `Repeats every week on ${dayNames}`;
        }
        return 'Repeats every week';
      }
      case 'monthly': return 'Repeats every month';
      case 'none':
      case 'once': return 'Repeat is off';
      default: return 'Repeats every day';
    }
  };

  // Find the task being edited
  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;

  const renderTaskCard = (task: RoutinePlanTask, index: number) => {
    const isSelected = selectedTaskIds.has(task.id);
    const display = getTaskDisplay(task, index);
    const colorClass = TASK_COLOR_CLASSES[display.color];
    
    return (
      <div key={task.id} className="flex items-start gap-3">
        <button
          onClick={() => toggleTask(task.id)}
          className={cn(
            'w-6 h-6 mt-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            isSelected 
              ? 'bg-emerald-500 border-emerald-500' 
              : 'border-muted-foreground/40 bg-transparent'
          )}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </button>
        <div className={cn(
          'flex-1 rounded-xl border border-border/50 overflow-hidden',
          colorClass
        )}>
          <div className="flex items-center gap-3 p-3">
            <FluentEmoji emoji={display.icon || '📝'} size={28} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-black truncate">{display.title}</p>
              <p className="text-xs text-black/70 truncate">
                {getRepeatLabel(task, display.repeatPattern)}
              </p>
            </div>
            <button 
              className="shrink-0 p-2 text-black/60 hover:text-black"
              onClick={() => openTaskEditor(task, index)}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          {task.description && (
            <div className="mx-2 mb-2 p-2.5 bg-white/90 rounded-lg">
              <p className="text-xs text-black/80 leading-relaxed">
                {task.description}
              </p>
            </div>
          )}
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
              <SheetTitle className="text-xl font-bold">Edit Ritual</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Edit it to create your personalized ritual.
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4 -mx-4 px-4 min-h-0">
              {scheduleType === 'challenge' ? (
                <>
                  <p className="text-base font-semibold text-foreground mb-3">
                    Challenge actions
                  </p>
                  <div className="space-y-3">
                    {tasks.map((task, index) => renderTaskCard(task, index))}
                  </div>
                </>
              ) : (
                <>
                  {/* Group tasks by repeat_pattern */}
                  {(() => {
                    const groups = [
                      { key: 'daily', label: 'Daily tasks', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern || 'daily';
                        return p === 'daily';
                      }},
                      { key: 'weekly', label: 'Weekly tasks', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'weekly';
                      }},
                      { key: 'monthly', label: 'Monthly tasks', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'monthly';
                      }},
                      { key: 'none', label: 'Special events', filter: (t: RoutinePlanTask) => {
                        const p = editedTasks[t.id]?.repeatPattern || (t as any).repeat_pattern;
                        return p === 'none' || p === 'once';
                      }},
                    ];
                    return groups.map(group => {
                      const groupTasks = tasks.filter(group.filter);
                      if (groupTasks.length === 0) return null;
                      return (
                        <div key={group.key} className="mb-4">
                          <p className="text-base font-semibold text-foreground mb-3">
                            {group.label}
                          </p>
                          <div className="space-y-3">
                            {groupTasks.map((task) => {
                              const originalIndex = tasks.indexOf(task);
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
                onClick={handleSave}
                disabled={selectedTaskIds.size === 0 || isSaving}
                className="px-8"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
