import { useState, useCallback, useRef } from 'react';
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
import { UserTask, useReorderTasks } from '@/hooks/useTaskPlanner';
import { TaskCard } from './TaskCard';
import { haptic } from '@/lib/haptics';

interface SortableTaskItemProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  goalProgress: number;
  onTap: (task: UserTask) => void;
  onStreakIncrease: () => void;
  onOpenGoalInput: (task: UserTask) => void;
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {localTasks.map((task) => (
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
              isDragging={activeId === task.id}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay - the visual element that follows the cursor */}
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
  );
};
