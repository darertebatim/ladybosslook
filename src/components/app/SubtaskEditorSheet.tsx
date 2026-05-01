import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
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
import { useTranslation } from 'react-i18next';

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
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 px-4 py-3 bg-background border-b border-muted/20 touch-manipulation',
        isDragging && 'opacity-50 z-50 shadow-lg'
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-base"
        onPointerDown={(e) => e.stopPropagation()}
      />
      <button 
        onClick={onRemove} 
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1.5 rounded-full active:bg-muted/50"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

type SubtaskItem = { id: string; title: string };
let subtaskIdCounter = 0;
const makeSubtaskItem = (title: string): SubtaskItem => ({ id: `si-${++subtaskIdCounter}`, title });

const SubtaskEditorSheet: React.FC<SubtaskEditorSheetProps> = ({
  open,
  onOpenChange,
  subtasks: initialSubtasks,
  onSave,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<SubtaskItem[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync on open
  useEffect(() => {
    if (open) {
      setItems(initialSubtasks.map(makeSubtaskItem));
      setNewSubtask('');
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
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setItems(arrayMove(items, oldIndex, newIndex));
      haptic.light();
    }
  }, [items]);

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setItems(prev => [...prev, makeSubtaskItem(newSubtask.trim())]);
      setNewSubtask('');
      setTimeout(() => newInputRef.current?.focus(), 50);
    }
  };

  const removeSubtask = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    haptic.light();
  };

  const updateSubtask = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, title: value } : item));
  };

  const handleSave = () => {
    onSave(items.map(i => i.title).filter(s => s.trim()));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
        if (!isOpen) handleSave();
      }}>
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
            <h2 className="text-lg font-semibold">{t('task.subtasks')}</h2>
            <Button
              onClick={handleSave}
              variant="ghost"
              className="text-primary font-semibold"
            >
              {t('routineBuilder.done')}
            </Button>
          </div>

          {/* Add new subtask input - pinned at top for keyboard visibility */}
          <div 
            className="flex items-center gap-3 px-4 py-3 border-b border-muted/20 flex-shrink-0 cursor-text"
            onClick={() => newInputRef.current?.focus()}
          >
            <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={newInputRef}
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              placeholder={t('task.addSubtask')}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-base placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>

          {/* Subtitle */}
          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground px-6 py-6">
              Subtasks can be set as your daily routine or checklist
            </p>
          )}

          {/* Subtask list - scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => (
                  <SortableSubtaskRow
                    key={item.id}
                    id={item.id}
                    value={item.title}
                    onRemove={() => removeSubtask(item.id)}
                    onChange={(val) => updateSubtask(item.id, val)}
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

              <DragOverlay>
                {activeId ? (() => {
                  const item = items.find(i => i.id === activeId);
                  return item ? (
                    <div className="opacity-90 scale-105 shadow-2xl rounded-xl bg-background flex items-center gap-2 px-4 py-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      <span className="flex-1 text-base">{item.title}</span>
                    </div>
                  ) : null;
                })() : null}
              </DragOverlay>
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
