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
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface SortableTaskItemProps {
  task: UserTask;
  date: Date;
  isCompleted: boolean;
  completedSubtaskIds: string[];
  onTap: (task: UserTask) => void;
  onStreakIncrease: () => void;
  isDragging?: boolean;
}

const SortableTaskItem = ({
  task,
  date,
  isCompleted,
  completedSubtaskIds,
  onTap,
  onStreakIncrease,
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
        onTap={onTap}
        onStreakIncrease={onStreakIncrease}
      />
    </div>
  );
};

interface SortableTaskListProps {
  tasks: UserTask[];
  date: Date;
  completedTaskIds: Set<string>;
  completedSubtaskIds: string[];
  onTaskTap: (task: UserTask) => void;
  onStreakIncrease: () => void;
}

export const SortableTaskList = ({
  tasks,
  date,
  completedTaskIds,
  completedSubtaskIds,
  onTaskTap,
  onStreakIncrease,
}: SortableTaskListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<UserTask[]>(tasks);
  const reorderTasks = useReorderTasks();

  // Sync local tasks when props change
  if (JSON.stringify(tasks.map(t => t.id)) !== JSON.stringify(localTasks.map(t => t.id))) {
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

  const handleDragStart = useCallback(async (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    // Haptic feedback on drag start
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex(t => t.id === active.id);
      const newIndex = localTasks.findIndex(t => t.id === over.id);

      const reorderedTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(reorderedTasks);

      // Haptic feedback on drop
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }

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
              onTap={onTaskTap}
              onStreakIncrease={onStreakIncrease}
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
