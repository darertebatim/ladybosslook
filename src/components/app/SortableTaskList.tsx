import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { TaskColor } from '@/hooks/useTaskPlanner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { UserTask, useReorderTasks, useCreateTask, useTaskTemplates, TaskTemplate, TASK_COLORS, TASK_COLOR_CLASSES } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { Dialog, DialogContent, DialogPortal } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TaskCard } from './TaskCard';
import { haptic } from '@/lib/haptics';
import { Plus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

interface SortableTaskItemProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  goalProgress: number;
  onTap: (task: UserTask) => void;
  onStreakIncrease: () => void;
  onOpenGoalInput: (task: UserTask) => void;
  onOpenTimer: (task: UserTask) => void;
  onOpenWaterTracking?: (task: UserTask) => void;
  isDragging?: boolean;
}

const SortableTaskItem = ({
  task,
  date,
  isCompleted,
  completedSubtaskIds,
  goalProgress,
  onTap,
  onStreakIncrease,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
  isDragging,
}: SortableTaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

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
        'touch-manipulation',
        isSortableDragging && 'opacity-50 scale-[1.02]'
      )}
    >
      <TaskCard
        task={task}
        date={date}
        isCompleted={isCompleted}
        completedSubtaskIds={completedSubtaskIds}
        goalProgress={goalProgress}
        onTap={onTap}
        onStreakIncrease={onStreakIncrease}
        onOpenGoalInput={onOpenGoalInput}
        onOpenTimer={onOpenTimer}
        onOpenWaterTracking={onOpenWaterTracking}
      />
    </div>
  );
};

interface SortableTaskListProps {
  tasks: UserTask[];
  date: Date;
  completedTaskIds: Set<string>;
  completedSubtaskIds: string[];
  goalProgressMap: Map<string, number>;
  onTaskTap: (task: UserTask) => void;
  onStreakIncrease: () => void;
  onOpenGoalInput: (task: UserTask) => void;
  onOpenTimer: (task: UserTask) => void;
  onOpenWaterTracking?: (task: UserTask) => void;
  hideQuickAdd?: boolean;
  
}

export const SortableTaskList = ({
  tasks,
  date,
  completedTaskIds,
  completedSubtaskIds,
  goalProgressMap,
  onTaskTap,
  onStreakIncrease,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
  hideQuickAdd = false,
  
}: SortableTaskListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<UserTask[]>(tasks);
  const reorderTasks = useReorderTasks();

  // Sync local tasks when props change (compare full task data, not just IDs)
  // This ensures edits to task properties (title, color, time) are reflected
  const tasksKey = JSON.stringify(tasks.map(t => ({ 
    id: t.id, 
    title: t.title, 
    color: t.color, 
    emoji: t.emoji,
    scheduled_time: t.scheduled_time,
    repeat_pattern: t.repeat_pattern,
    updated_at: t.updated_at 
  })));
  const localKey = JSON.stringify(localTasks.map(t => ({ 
    id: t.id, 
    title: t.title, 
    color: t.color, 
    emoji: t.emoji,
    scheduled_time: t.scheduled_time,
    repeat_pattern: t.repeat_pattern,
    updated_at: t.updated_at 
  })));

  if (tasksKey !== localKey) {
    setLocalTasks(tasks);
  }

  // Custom touch sensor with delay for long press
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // 300ms long press to activate
        tolerance: 5, // Allow 5px movement before canceling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    // Haptic feedback on drag start
    haptic.medium();
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex(t => t.id === active.id);
      const newIndex = localTasks.findIndex(t => t.id === over.id);

      const reorderedTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(reorderedTasks);

      // Haptic feedback on drop
      haptic.light();

      // Update order_index in database
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index,
      }));

      reorderTasks.mutate(updates);
    }
  }, [localTasks, reorderTasks]);

  const activeTask = activeId ? localTasks.find(t => t.id === activeId) : null;

  // Split tasks: repeating vs one-time
  const repeatingTasks = localTasks.filter(t => t.repeat_pattern && t.repeat_pattern !== 'none');
  const oneTimeTasks = localTasks.filter(t => !t.repeat_pattern || t.repeat_pattern === 'none');
  const allOrderedIds = [...repeatingTasks, ...oneTimeTasks].map(t => t.id);

  const renderTask = (task: UserTask) => (
    <SortableTaskItem
      key={task.id}
      task={task}
      date={date}
      isCompleted={completedTaskIds.has(task.id)}
      completedSubtaskIds={completedSubtaskIds}
      goalProgress={goalProgressMap.get(task.id) || 0}
      onTap={onTaskTap}
      onStreakIncrease={onStreakIncrease}
      onOpenGoalInput={onOpenGoalInput}
      onOpenTimer={onOpenTimer}
      onOpenWaterTracking={onOpenWaterTracking}
      isDragging={activeId === task.id}
    />
  );

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allOrderedIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {/* Repeating tasks */}
          {repeatingTasks.map(renderTask)}
        </div>

        {/* Separator between repeating and one-time tasks */}
        {repeatingTasks.length > 0 && oneTimeTasks.length > 0 && (
          <div className="my-3 flex items-center gap-3 px-2">
            <div className="flex-1 h-[1px] bg-border/60" />
          </div>
        )}

        {/* One-time tasks */}
        {oneTimeTasks.length > 0 && (
          <div className="space-y-3">
            {oneTimeTasks.map(renderTask)}
          </div>
        )}

        {/* Quick Add Card */}
        {!hideQuickAdd && <QuickAddCard date={date} taskCount={localTasks.length} />}
      </SortableContext>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 scale-105 shadow-2xl rounded-2xl">
            <TaskCard
              task={activeTask}
              date={date}
              isCompleted={completedTaskIds.has(activeTask.id)}
              completedSubtaskIds={completedSubtaskIds}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  </>
  );
};

const QUICK_ADD_VARIANTS: { emoji: string; color: TaskColor }[] = [
  { emoji: '☀️', color: 'yellow' },
  { emoji: '🌿', color: 'green' },
  { emoji: '💜', color: 'purple' },
  { emoji: '🔥', color: 'red' },
  { emoji: '💧', color: 'blue' },
  { emoji: '🧡', color: 'orange' },
  { emoji: '⭐', color: 'yellow' },
  { emoji: '🎯', color: 'red' },
  { emoji: '🌸', color: 'pink' },
  { emoji: '🍀', color: 'green' },
  { emoji: '✨', color: 'lavender' },
  { emoji: '🌊', color: 'sky' },
];

const TIME_PERIOD_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Bedtime',
};

function QuickAddCard({ date, taskCount }: { date: Date; taskCount: number }) {
  const QUICK_ADD_ANCHOR_TOP = '25%';
  const SUGGESTIONS_ANCHOR_TOP = 'calc(25% + 220px)';
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [showIdeas, setShowIdeas] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const navigate = useNavigate();
  const { data: templates = [] } = useTaskTemplates();
  const { data: rawCategories = [] } = useRoutineBankCategories();

  const categories = useMemo(() => {
    return [...rawCategories].sort((a, b) => {
      if (a.slug === 'pro') return 1;
      if (b.slug === 'pro') return -1;
      const aOrder = a.task_display_order || 0;
      const bOrder = b.task_display_order || 0;
      if (aOrder === 0 && bOrder === 0) return 0;
      if (aOrder === 0) return 1;
      if (bOrder === 0) return -1;
      return aOrder - bOrder;
    });
  }, [rawCategories]);

  const filteredSuggestions = useMemo(() => {
    let items = templates;
    if (selectedCategory === 'popular') {
      items = items.filter(t => t.is_popular);
    } else if (selectedCategory !== 'all') {
      items = items.filter(t => t.category === selectedCategory);
    }
    return items.slice(0, 5);
  }, [templates, selectedCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setTitle('');
    setShowIdeas(false);
    setSelectedCategory('popular');
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const variant = QUICK_ADD_VARIANTS[taskCount % QUICK_ADD_VARIANTS.length];
    haptic.medium();
    createTask.mutate({
      title: trimmed,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      emoji: variant.emoji,
      color: variant.color,
      order_index: -1,
    });
    setTitle('');
    handleClose();
  };

  const handleOpenDetails = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    haptic.light();
    handleClose();
    navigate(`/app/home/new?name=${encodeURIComponent(trimmed)}`);
  };

  const handleTemplateSelect = (template: TaskTemplate) => {
    haptic.light();
    handleClose();
    navigate(`/app/home/new?template=${template.id}`);
  };

  const handleShowIdeas = () => {
    haptic.light();
    setShowIdeas(true);
    inputRef.current?.blur();
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          setIsOpen(true);
          haptic.light();
        }}
        className="mt-3 w-full rounded-3xl pl-3 pr-4 py-1.5 bg-card border-2 border-urgency/30 flex items-center gap-2 active:scale-[0.98] transition-all"
      >
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <Plus className="h-5 w-5 text-urgency" strokeWidth={3} />
        </div>
        <span className="text-[15px] font-semibold text-foreground">Quick add task...</span>
      </button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent
          hideCloseButton
          className="w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none !top-[10%] !translate-y-0"
          style={{ top: QUICK_ADD_ANCHOR_TOP }}
        >
          {/* Card — two-tone */}
          <div className="rounded-3xl overflow-hidden bg-[#FFF5E6]">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <Plus className="h-6 w-6 text-urgency" strokeWidth={2.5} />
                </div>
                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') handleClose();
                  }}
                  placeholder="Type task name..."
                  className="flex-1 bg-transparent text-[15px] font-semibold text-black placeholder:text-black/40 outline-none"
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="on"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="px-4 py-3.5 bg-[#FFE6C0]">
              <p className="text-[13px] font-medium text-black text-center">
                Press enter to add. Tap outside to cancel.
              </p>
            </div>
          </div>

          {/* Buttons outside card */}
          <div className="flex gap-2 mt-3">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSubmit}
              disabled={!title.trim()}
              className={cn(
                "flex-1 gap-2 h-11 rounded-2xl text-sm font-medium flex items-center justify-center shadow-sm active:scale-95 transition-transform",
                title.trim()
                  ? "bg-urgency text-urgency-foreground"
                  : "bg-white text-black/40"
              )}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenDetails}
              disabled={!title.trim()}
              className={cn(
                "gap-1.5 h-11 px-5 rounded-2xl text-sm font-medium flex items-center justify-center shadow-sm active:scale-95 transition-transform",
                title.trim()
                  ? "bg-white text-black"
                  : "bg-white text-black/40"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
              Details
            </button>
          </div>

          {/* "Need some ideas?" tappable text */}
          <div className="mt-3 flex min-h-5 justify-center">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleShowIdeas}
              className={cn(
                "text-[13px] text-white/70 font-medium text-center active:text-white/90 transition-colors",
                showIdeas && "opacity-0 pointer-events-none"
              )}
            >
              Need some ideas?
            </button>
          </div>
        </DialogContent>

        {/* Suggestions — separate portal layer, grows downward from below the card */}
        {showIdeas && (
          <DialogPortal>
            <div
              className="fixed left-[50%] -translate-x-1/2 z-[60] w-[calc(100%-32px)] max-w-[calc(100%-32px)] flex flex-col gap-2.5"
              style={{ top: SUGGESTIONS_ANCHOR_TOP }}
            >
              {/* Category pills */}
              <ScrollArea className="w-full shrink-0">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { haptic.light(); setSelectedCategory('popular'); }}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                      selectedCategory === 'popular'
                        ? "bg-white text-black border-white/50"
                        : "bg-white/20 text-white/80 border-transparent"
                    )}
                  >
                    ⭐ Popular
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => { haptic.light(); setSelectedCategory(cat.slug); }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                        selectedCategory === cat.slug
                          ? "bg-white text-black border-white/50"
                          : "bg-white/20 text-white/80 border-transparent"
                      )}
                    >
                      {cat.emoji && <span className="mr-0.5">{cat.emoji}</span>}
                      {cat.name}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>

              {/* Task cards */}
              <div className="overflow-y-auto overscroll-contain space-y-1.5 max-h-[40vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
                {filteredSuggestions.map((template) => {
                  const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.blue;
                  const timePeriodLabel = template.time_period 
                    ? TIME_PERIOD_LABELS[template.time_period] || template.time_period
                    : 'Anytime';

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
                      style={{ backgroundColor: bgColor }}
                    >
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <FluentEmoji emoji={template.emoji || '📝'} size={28} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] text-black truncate">{template.title}</p>
                          <p className="text-[11px] text-black/60 truncate">
                            {template.category}
                            {template.repeat_pattern && template.repeat_pattern !== 'none' && (
                              <span>
                                {' • '}
                                {template.repeat_pattern === 'daily' ? 'Daily' : 
                                 template.repeat_pattern === 'weekly' ? 'Weekly' : 
                                 template.repeat_pattern === 'monthly' ? 'Monthly' :
                                 template.repeat_pattern === 'weekend' ? 'Weekends' : ''}
                              </span>
                            )}
                            <span>{' • '}{timePeriodLabel}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogPortal>
        )}
      </Dialog>
    </>
  );
}
