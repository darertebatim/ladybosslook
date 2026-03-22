import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { TaskColor } from '@/hooks/useTaskPlanner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
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
import { Plus, MoreHorizontal, Clock, Repeat } from 'lucide-react';
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
  onStepUnlocked?: (result: import('@/hooks/useProjectStepUnlock').StepUnlockResult) => void;
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
  onStepUnlocked,
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
        onStepUnlocked={onStepUnlocked}
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
  onStepUnlocked?: (result: import('@/hooks/useProjectStepUnlock').StepUnlockResult) => void;
  onOpenGoalInput: (task: UserTask) => void;
  onOpenTimer: (task: UserTask) => void;
  onOpenWaterTracking?: (task: UserTask) => void;
  hideQuickAdd?: boolean;
  defaultRepeatOverride?: 'Daily' | 'No' | 'Weekly';
  onOpenTaskSheet?: (params: { editTaskId?: string; createParams?: Record<string, string> }) => void;
}

export const SortableTaskList = ({
  tasks,
  date,
  completedTaskIds,
  completedSubtaskIds,
  goalProgressMap,
  onTaskTap,
  onStreakIncrease,
  onStepUnlocked,
  onOpenGoalInput,
  onOpenTimer,
  onOpenWaterTracking,
  hideQuickAdd = false,
  defaultRepeatOverride,
  onOpenTaskSheet,
}: SortableTaskListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<UserTask[]>(tasks);
  const reorderTasks = useReorderTasks();
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSyncRef = useRef(false);

  // Sync local tasks when props change, but skip right after a reorder
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

  if (tasksKey !== localKey && !skipSyncRef.current) {
    setLocalTasks(tasks);
  }

  // Long-press drag on touch, drag-by-move on mouse
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
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

      // Prevent prop sync from reverting the optimistic update
      skipSyncRef.current = true;
      if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
      reorderTimerRef.current = setTimeout(() => {
        skipSyncRef.current = false;
      }, 2000);

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
      onStepUnlocked={onStepUnlocked}
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
        {!hideQuickAdd && <QuickAddCard date={date} taskCount={localTasks.length} onOpenTaskSheet={onOpenTaskSheet} defaultRepeatOverride={defaultRepeatOverride} />}
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

function QuickAddCard({ date, taskCount, onOpenTaskSheet, defaultRepeatOverride }: { date: Date; taskCount: number; onOpenTaskSheet?: (params: { editTaskId?: string; createParams?: Record<string, string> }) => void; defaultRepeatOverride?: 'Daily' | 'No' | 'Weekly' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [showIdeas, setShowIdeas] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  
  // Quick shortcut states
  const TIME_OPTIONS = ['Anytime', 'Morning', 'Afternoon', 'Evening', 'Bedtime'] as const;
  const REPEAT_OPTIONS = ['Daily', 'No', 'Weekly'] as const;
  const [quickTime, setQuickTime] = useState<typeof TIME_OPTIONS[number]>('Anytime');
  const [quickRepeat, setQuickRepeat] = useState<typeof REPEAT_OPTIONS[number]>('Daily');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsLayerRef = useRef<HTMLDivElement>(null);
  // Capture full screen height before keyboard opens to prevent shifting
  const [anchorTop, setAnchorTop] = useState<string>('25%');
  const [suggestionsTop, setSuggestionsTop] = useState<string>('calc(25% + 220px)');

  // Listen for external trigger (e.g. FAB button)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const screenH = window.innerHeight;
      const topPx = Math.round(screenH * 0.25);
      setAnchorTop(`${topPx}px`);
      setSuggestionsTop(`${topPx + 220}px`);
      const detail = (e as CustomEvent).detail;
      if (detail?.defaultRepeat) {
        setQuickRepeat(detail.defaultRepeat);
      }
      setIsOpen(true);
      haptic.light();
    };
    window.addEventListener('quick-add-open', handleOpen);
    return () => window.removeEventListener('quick-add-open', handleOpen);
  }, []);
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

  // Search-based suggestions while typing (before ideas panel is open)
  const searchSuggestions = useMemo(() => {
    const q = title.trim().toLowerCase();
    if (!q || q.length < 2 || showIdeas) return [];
    return templates.filter(t => t.title.toLowerCase().includes(q)).slice(0, 4);
  }, [templates, title, showIdeas]);

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
    setQuickTime('Anytime');
    setQuickRepeat('Daily');
  };

  // Map quick shortcut values to task params
  const getQuickParams = () => {
    const params: Record<string, any> = {};
    if (quickTime !== 'Anytime') {
      const timeMap: Record<string, string> = { Morning: 'morning', Afternoon: 'afternoon', Evening: 'evening', Bedtime: 'night' };
      params.time_period = timeMap[quickTime];
    }
    if (quickRepeat === 'Daily') {
      params.repeat_pattern = 'daily';
    } else if (quickRepeat === 'Weekly') {
      params.repeat_pattern = 'weekly';
      params.repeat_days = [new Date().getDay()];
    }
    return params;
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const variant = QUICK_ADD_VARIANTS[taskCount % QUICK_ADD_VARIANTS.length];
    const qp = getQuickParams();
    haptic.medium();
    createTask.mutate({
      title: trimmed,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      emoji: variant.emoji,
      color: variant.color,
      order_index: -1,
      ...(qp.time_period ? { time_period: qp.time_period } : {}),
      ...(qp.repeat_pattern ? { repeat_pattern: qp.repeat_pattern as any } : {}),
      ...(qp.repeat_days ? { repeat_days: JSON.parse(qp.repeat_days) } : {}),
    });
    setTitle('');
    handleClose();
  };

  const handleOpenDetails = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    haptic.light();
    const qp = getQuickParams();
    const createParams: Record<string, string> = { name: trimmed, ...Object.fromEntries(Object.entries(qp).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])) };
    handleClose();
    if (onOpenTaskSheet) {
      onOpenTaskSheet({ createParams });
    } else {
      navigate(`/app/home/new?${new URLSearchParams(createParams).toString()}`);
    }
  };

  const handleTemplateSelect = (template: TaskTemplate) => {
    haptic.light();
    handleClose();
    const createParams: Record<string, string> = {
      name: template.title,
      emoji: template.emoji,
      color: template.color,
      repeat_pattern: template.repeat_pattern,
      ...(template.repeat_days ? { repeat_days: JSON.stringify(template.repeat_days) } : {}),
      ...(template.tag ? { tag: template.tag } : {}),
      ...(template.goal_enabled ? {
        goal_enabled: 'true',
        goal_type: template.goal_type || '',
        goal_target: String(template.goal_target || ''),
        goal_unit: template.goal_unit || ''
      } : {}),
      ...(template.pro_link_type ? {
        pro_link_type: template.pro_link_type,
        pro_link_value: template.pro_link_value || ''
      } : {}),
      ...(template.linked_playlist_id ? { linked_playlist_id: template.linked_playlist_id } : {}),
    };
    if (onOpenTaskSheet) {
      onOpenTaskSheet({ createParams });
    } else {
      navigate(`/app/home/new?${new URLSearchParams(createParams).toString()}`);
    }
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
          const screenH = window.innerHeight;
          const topPx = Math.round(screenH * 0.25);
          setAnchorTop(`${topPx}px`);
          setSuggestionsTop(`${topPx + 220}px`);
          if (defaultRepeatOverride) setQuickRepeat(defaultRepeatOverride);
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
          className="w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none !translate-y-0"
          style={{ top: anchorTop }}
          onInteractOutside={(event) => {
            if (showIdeas && suggestionsLayerRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
        >
          {/* Quick shortcut pills */}
          <div className="flex gap-2 mb-2.5">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                haptic.light();
                const idx = REPEAT_OPTIONS.indexOf(quickRepeat);
                setQuickRepeat(REPEAT_OPTIONS[(idx + 1) % REPEAT_OPTIONS.length]);
              }}
              className={cn(
                "h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all",
                quickRepeat !== 'No'
                  ? "bg-white text-black shadow-sm"
                  : "bg-white/20 text-white/80"
              )}
            >
              <Repeat className="h-3 w-3" />
              {quickRepeat.toUpperCase()}
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                haptic.light();
                const idx = TIME_OPTIONS.indexOf(quickTime);
                setQuickTime(TIME_OPTIONS[(idx + 1) % TIME_OPTIONS.length]);
              }}
              className={cn(
                "h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all",
                quickTime !== 'Anytime'
                  ? "bg-white text-black shadow-sm"
                  : "bg-white/20 text-white/80"
              )}
            >
              <Clock className="h-3 w-3" />
              {quickTime.toUpperCase()}
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                haptic.light();
                const qp = getQuickParams();
                const trimmed = title.trim();
                const createParams: Record<string, string> = {
                  ...(trimmed ? { name: trimmed } : {}),
                  ...Object.fromEntries(Object.entries(qp).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]))
                };
                handleClose();
                if (onOpenTaskSheet) {
                  onOpenTaskSheet({ createParams });
                } else {
                  navigate(`/app/home/new?${new URLSearchParams(createParams).toString()}`);
                }
              }}
              className="h-7 w-7 rounded-full bg-white/20 text-white/80 flex items-center justify-center active:scale-95 transition-all"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

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

          {/* Buttons outside card — reserve space so ideas text stays in place */}
          <div className="mt-3 min-h-11">
            {title.trim() ? (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleOpenDetails}
                  className="gap-1.5 h-11 px-5 rounded-2xl text-sm font-medium flex items-center justify-center shadow-sm active:scale-95 transition-transform bg-white text-black"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Details
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSubmit}
                  className="flex-1 gap-2 h-11 rounded-2xl text-sm font-medium flex items-center justify-center shadow-sm active:scale-95 transition-transform bg-urgency text-urgency-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </div>
            ) : (
              <div className="h-11" aria-hidden="true" />
            )}
          </div>

          {/* Search-based suggestions while typing */}
          {searchSuggestions.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
              <p className="text-sm text-white/70 font-medium text-center">Need some ideas?</p>
              {searchSuggestions.map((template) => {
                const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.blue;
                return (
                  <button
                    key={template.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl active:scale-[0.98] transition-transform overflow-hidden"
                    style={{ backgroundColor: `${bgColor}cc` }}
                  >
                    <FluentEmoji emoji={template.emoji || '📝'} size={22} className="shrink-0" />
                    <span className="text-sm font-semibold text-black truncate flex-1 min-w-0">{template.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* "Need some ideas?" tappable text */}
          {searchSuggestions.length === 0 && (
          <div className="mt-3 flex min-h-5 justify-center">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleShowIdeas}
              className={cn(
                "text-lg text-white/70 font-medium text-center active:text-white/90 transition-colors",
                showIdeas && "opacity-0 pointer-events-none"
              )}
            >
              Need some ideas?
            </button>
          </div>
          )}
        </DialogContent>

        {/* Suggestions — separate portal layer, grows downward from below the card */}
        {showIdeas && (
          <DialogPortal>
            <div
              ref={suggestionsLayerRef}
              className="fixed left-[50%] -translate-x-1/2 z-[10001] w-[calc(100%-32px)] max-w-[calc(100%-32px)] flex flex-col gap-2.5 pointer-events-auto"
              style={{ top: suggestionsTop }}
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
