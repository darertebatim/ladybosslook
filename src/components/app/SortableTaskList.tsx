import { useState, useCallback, useRef } from 'react';
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
import { UserTask, useReorderTasks, useCreateTask } from '@/hooks/useTaskPlanner';
import { TaskCard } from './TaskCard';
import { haptic } from '@/lib/haptics';
import { Plus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

        {/* Quick Add Card */}
        <QuickAddCard date={date} taskCount={localTasks.length} />

        {/* One-time tasks */}
        {oneTimeTasks.length > 0 && (
          <div className="space-y-3 mt-3">
            {oneTimeTasks.map(renderTask)}
          </div>
        )}
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

function QuickAddCard({ date, taskCount }: { date: Date; taskCount: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const navigate = useNavigate();

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
      order_index: taskCount,
    });
    setTitle('');
    inputRef.current?.focus();
  };

  const handleOpenDetails = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    haptic.light();
    setIsOpen(false);
    setTitle('');
    navigate(`/app/home/new?name=${encodeURIComponent(trimmed)}`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          haptic.light();
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="mt-3 w-full rounded-3xl pl-3 pr-4 py-3 bg-card border-2 border-urgency/30 flex items-center gap-2 active:scale-[0.98] transition-all"
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <Plus className="h-5 w-5 text-urgency" />
        </div>
        <span className="text-[15px] font-semibold text-muted-foreground">Quick add action...</span>
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-3xl pl-3 pr-4 py-3 bg-card border-2 border-urgency/30 flex items-center gap-2">
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        <Plus className="h-5 w-5 text-urgency" />
      </div>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') { setIsOpen(false); setTitle(''); }
        }}
        onBlur={() => {
          if (!title.trim()) {
            setIsOpen(false);
          }
        }}
        placeholder="Type action name..."
        className="flex-1 bg-transparent text-[15px] font-semibold text-foreground placeholder:text-muted-foreground outline-none"
        autoFocus
      />
      {title.trim() && (
        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 rounded-2xl bg-urgency text-urgency-foreground text-xs font-semibold active:scale-95 transition-transform"
        >
          Add
        </button>
      )}
    </div>
  );
}
