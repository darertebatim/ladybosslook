import { useState } from 'react';
import { Check, Pencil, Clock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
import { RoutineTaskEditSheet, EditableTask } from './RoutineTaskEditSheet';

// Color cycle for variety in planner
export const ROUTINE_COLOR_CYCLE: TaskColor[] = [
  'peach',
  'sky', 
  'pink',
  'yellow',
  'lavender',
  'mint',
  'lime',
];

export const getTaskColor = (index: number): TaskColor => {
  return ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length];
};

export interface EditedTask {
  id: string;
  title: string;
  icon?: string;
  color?: TaskColor;
  repeatPattern?: 'daily' | 'weekly' | 'monthly' | 'none';
  scheduledTime?: string | null;
  tag?: string | null;
}

interface RoutinePreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: RoutinePlanTask[];
  routineTitle: string;
  onSave: (selectedTaskIds: string[], editedTasks: EditedTask[]) => void;
  isSaving?: boolean;
}

export function RoutinePreviewSheet({
  open,
  onOpenChange,
  tasks,
  routineTitle,
  onSave,
  isSaving,
}: RoutinePreviewSheetProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(tasks.map(t => t.id))
  );
  const [editedTasks, setEditedTasks] = useState<Record<string, EditedTask>>({});
  const [editingTask, setEditingTask] = useState<EditableTask | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);

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
    const existingEdit = editedTasks[task.id];
    setEditingTask({
      id: task.id,
      title: existingEdit?.title || task.title,
      icon: existingEdit?.icon || task.icon,
      color: existingEdit?.color || getTaskColor(index),
      repeatPattern: existingEdit?.repeatPattern || 'daily',
      scheduledTime: existingEdit?.scheduledTime ?? null,
      tag: existingEdit?.tag ?? routineTitle,
    });
    setShowEditSheet(true);
  };

  const handleTaskEditSave = (updated: EditableTask) => {
    setEditedTasks(prev => ({
      ...prev,
      [updated.id]: {
        id: updated.id,
        title: updated.title,
        icon: updated.icon,
        color: updated.color,
        repeatPattern: updated.repeatPattern,
        scheduledTime: updated.scheduledTime,
        tag: updated.tag,
      },
    }));
    setShowEditSheet(false);
    setEditingTask(null);
  };

  const getTaskDisplay = (task: RoutinePlanTask, index: number) => {
    const edited = editedTasks[task.id];
    return {
      title: edited?.title || task.title,
      icon: edited?.icon || task.icon,
      color: edited?.color || getTaskColor(index),
      repeatPattern: edited?.repeatPattern || 'daily',
    };
  };

  const handleSave = () => {
    const editedTasksList = Object.values(editedTasks);
    onSave(Array.from(selectedTaskIds), editedTasksList);
  };

  const getRepeatLabel = (pattern: string) => {
    switch (pattern) {
      case 'daily': return 'Repeats every day';
      case 'weekly': return 'Repeats every week';
      case 'monthly': return 'Repeats every month';
      default: return 'No repeat';
    }
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
              <SheetTitle className="text-xl font-bold">Edit Routine</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Edit it to create your personalized routine.
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4 -mx-4 px-4 min-h-0">
              <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Daily Tasks
              </p>
              
              <div className="space-y-3">
                {tasks.map((task, index) => {
                  const isSelected = selectedTaskIds.has(task.id);
                  const display = getTaskDisplay(task, index);
                  const colorClass = TASK_COLOR_CLASSES[display.color];
                  const TaskIcon = (LucideIcons as any)[display.icon] || LucideIcons.Sparkles;
                  
                  return (
                    <div 
                      key={task.id}
                      className="flex items-start gap-3"
                    >
                      {/* Checkbox */}
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

                      {/* Task Card */}
                      <div className={cn(
                        'flex-1 rounded-2xl overflow-hidden',
                        colorClass
                      )}>
                        <div className="p-3">
                          <div className="flex items-center gap-2 text-xs text-foreground/70 mb-1">
                            <TaskIcon className="w-4 h-4" />
                            <span>Anytime</span>
                          </div>
                          <p className="font-medium text-foreground">{display.title}</p>
                        </div>
                        {/* Footer bar */}
                        <div className="px-3 py-2 bg-black/5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-foreground/60" />
                          <span className="text-xs text-foreground/60">
                            {getRepeatLabel(display.repeatPattern)}
                          </span>
                        </div>
                      </div>

                      {/* Edit button - opens full editor */}
                      <button 
                        className="p-2 mt-2 text-muted-foreground hover:text-foreground"
                        onClick={() => openTaskEditor(task, index)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
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

      {/* Full Task Edit Sheet */}
      <RoutineTaskEditSheet
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        task={editingTask}
        routineTag={routineTitle}
        onSave={handleTaskEditSave}
      />
    </>
  );
}
