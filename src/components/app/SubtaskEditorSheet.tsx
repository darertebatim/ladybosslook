import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSensors, useSensor, TouchSensor, MouseSensor } from '@dnd-kit/core';
import { haptic } from '@/lib/haptics';

interface SubtaskEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtasks: string[];
  onSave: (subtasks: string[]) => void;
}

const SortableSubtaskRow = ({ 
  id, 
  value, 
  onRemove, 
  onChange,
  inputRef,
  onKeyDown,
}: { 
  id: string; 
  value: string; 
  onRemove: () => void; 
  onChange: (val: string) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) => {
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
        'flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-b border-muted/20',
        isDragging && 'opacity-50 z-50 shadow-lg'
      )}
    >
      <button {...attributes} {...listeners} className="touch-none p-1 -ml-1 text-muted-foreground/40">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-base"
      />
      <button onClick={onRemove} className="p-1.5 rounded-full active:bg-muted/50">
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

const SubtaskEditorSheet: React.FC<SubtaskEditorSheetProps> = ({
  open,
  onOpenChange,
  subtasks: initialSubtasks,
  onSave,
}) => {
  const [localSubtasks, setLocalSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync on open
  useEffect(() => {
    if (open) {
      setLocalSubtasks([...initialSubtasks]);
      setNewSubtask('');
      // Auto-focus the input after sheet animation completes
      setTimeout(() => newInputRef.current?.focus(), 400);
    }
  }, [open, initialSubtasks]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    haptic.medium();
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = localSubtasks.findIndex((_, i) => `st-${i}` === active.id);
    const newIndex = localSubtasks.findIndex((_, i) => `st-${i}` === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setLocalSubtasks(arrayMove(localSubtasks, oldIndex, newIndex));
      haptic.light();
    }
  }, [localSubtasks]);

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setLocalSubtasks(prev => [...prev, newSubtask.trim()]);
      setNewSubtask('');
      setTimeout(() => newInputRef.current?.focus(), 50);
    }
  };

  const removeSubtask = (index: number) => {
    setLocalSubtasks(prev => prev.filter((_, i) => i !== index));
    haptic.light();
  };

  const updateSubtask = (index: number, value: string) => {
    setLocalSubtasks(prev => prev.map((s, i) => i === index ? value : s));
  };

  const handleSave = () => {
    onSave(localSubtasks.filter(s => s.trim()));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-3xl px-0 pt-0 pb-0 border-0"
        hideCloseButton
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <button onClick={() => onOpenChange(false)} className="p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">Subtasks</h2>
            <Button
              onClick={handleSave}
              variant="ghost"
              className="text-primary font-semibold"
            >
              Done
            </Button>
          </div>

          {/* Add new subtask input - pinned at top for keyboard visibility */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-muted/20 flex-shrink-0">
            <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={newInputRef}
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              placeholder="Add subtask..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-base placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>

          {/* Subtitle */}
          {localSubtasks.length === 0 && (
            <p className="text-center text-sm text-muted-foreground px-6 py-6">
              Subtasks can be set as your daily routine or checklist
            </p>
          )}

          {/* Subtask list - scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={localSubtasks.map((_, i) => `st-${i}`)} strategy={verticalListSortingStrategy}>
                {localSubtasks.map((subtask, index) => (
                  <SortableSubtaskRow
                    key={`st-${index}`}
                    id={`st-${index}`}
                    value={subtask}
                    onRemove={() => removeSubtask(index)}
                    onChange={(val) => updateSubtask(index, val)}
                    inputRef={(el) => { itemRefs.current[index] = el; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        newInputRef.current?.focus();
                      }
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Bottom safe area */}
          <div className="flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubtaskEditorSheet;
