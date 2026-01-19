import { useState } from 'react';
import { Check, Pencil, Clock, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { TASK_COLORS, TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
import { IconPicker } from './IconPicker';

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

// Available colors for the simple picker
const COLOR_OPTIONS: TaskColor[] = ['pink', 'peach', 'yellow', 'lime', 'sky', 'mint', 'lavender'];

export interface EditedTask {
  id: string;
  title: string;
  icon?: string;
  color?: TaskColor;
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
  
  // Simple inline edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState<TaskColor>('peach');
  const [showIconPicker, setShowIconPicker] = useState(false);

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
    setEditingTaskId(task.id);
    setEditTitle(existingEdit?.title || task.title);
    setEditIcon(existingEdit?.icon || task.icon);
    setEditColor(existingEdit?.color || getTaskColor(index));
  };

  const closeEditor = () => {
    setEditingTaskId(null);
    setShowIconPicker(false);
  };

  const saveEdit = () => {
    if (!editingTaskId || !editTitle.trim()) return;
    
    setEditedTasks(prev => ({
      ...prev,
      [editingTaskId]: {
        id: editingTaskId,
        title: editTitle.trim(),
        icon: editIcon,
        color: editColor,
      },
    }));
    closeEditor();
  };

  const getTaskDisplay = (task: RoutinePlanTask, index: number) => {
    const edited = editedTasks[task.id];
    return {
      title: edited?.title || task.title,
      icon: edited?.icon || task.icon,
      color: edited?.color || getTaskColor(index),
    };
  };

  const handleSave = () => {
    const editedTasksList = Object.values(editedTasks);
    onSave(Array.from(selectedTaskIds), editedTasksList);
  };

  // Get selected icon component for display
  const EditIconComponent = (LucideIcons as any)[editIcon] || LucideIcons.Sparkles;

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
                            Repeats every day
                          </span>
                        </div>
                      </div>

                      {/* Edit button */}
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

      {/* Simple Inline Edit Sheet */}
      <Sheet open={editingTaskId !== null} onOpenChange={(open) => !open && closeEditor()}>
        <SheetContent 
          side="bottom" 
          className="h-auto rounded-t-3xl px-4"
          hideCloseButton
        >
          <div className="flex flex-col gap-6 py-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button onClick={closeEditor} className="p-2 -ml-2">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">Edit Task</h3>
              <Button 
                size="sm" 
                onClick={saveEdit}
                disabled={!editTitle.trim()}
              >
                Save
              </Button>
            </div>

            {/* Icon Picker Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowIconPicker(true)}
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center',
                  TASK_COLOR_CLASSES[editColor]
                )}
              >
                <EditIconComponent className="w-8 h-8 text-foreground/80" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Task name</p>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter task name"
                  className="text-lg font-medium"
                />
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Color</p>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all',
                      editColor === color && 'ring-2 ring-offset-2 ring-foreground'
                    )}
                    style={{ backgroundColor: TASK_COLORS[color] }}
                  />
                ))}
              </div>
            </div>

            {/* Note about advanced editing */}
            <p className="text-xs text-muted-foreground text-center pb-2">
              You can edit time, reminders & more from your planner after adding.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Icon Picker Sheet */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedIcon={editIcon}
        onSelect={(icon) => {
          setEditIcon(icon);
          setShowIconPicker(false);
        }}
      />
    </>
  );
}
