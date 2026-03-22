import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, Trash2, ListChecks, MoreHorizontal, Repeat, Clock, Pencil } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TASK_COLOR_CLASSES, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import AppTaskCreate, { TaskFormData } from '@/pages/app/AppTaskCreate';
import { ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';

// Builder task — intermediate representation
export interface BuilderTask {
  id: string;
  title: string;
  emoji: string;
  color: string;
  repeat_pattern?: string;
  repeat_days?: number[] | null;
  description?: string | null;
  pro_link_type?: string | null;
  pro_link_value?: string | null;
  goal_enabled?: boolean;
  goal_target?: number | null;
  goal_type?: string | null;
  goal_unit?: string | null;
  duration_minutes?: number | null;
  time_period?: string | null;
  linked_playlist_id?: string | null;
  category?: string | null;
  schedule_days?: number[] | null;
}

interface RoutineBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (routineTitle: string, routineEmoji: string, routineColor: string, tasks: BuilderTask[]) => void;
  editMode?: boolean;
  initialTitle?: string;
  initialEmoji?: string;
  initialColor?: string;
  initialTasks?: BuilderTask[];
  onEditSave?: (routineTitle: string, routineEmoji: string, routineColor: string, tasks: BuilderTask[]) => void;
}

const QUICK_ADD_VARIANTS: { emoji: string; color: string }[] = [
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

const REPEAT_OPTIONS = ['Daily', 'Weekly', 'No'];
const TIME_OPTIONS = ['Anytime', 'Morning', 'Afternoon', 'Evening', 'Bedtime'];

export function RoutineBuilderSheet({
  open,
  onOpenChange,
  onComplete,
  editMode = false,
  initialTitle = '',
  initialEmoji = '✨',
  initialColor = 'peach',
  initialTasks = [],
  onEditSave,
}: RoutineBuilderSheetProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [routineTitle, setRoutineTitle] = useState(initialTitle);
  const [routineEmoji, setRoutineEmoji] = useState(initialEmoji);
  const [routineColor, setRoutineColor] = useState(initialColor);

  const [tasks, setTasks] = useState<BuilderTask[]>(initialTasks);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickRepeat, setQuickRepeat] = useState('Daily');
  const [quickTime, setQuickTime] = useState('Anytime');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<BuilderTask | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setStep(1);
        setRoutineTitle(initialTitle);
        setRoutineEmoji(initialEmoji);
        setTasks(initialTasks);
        setShowSuggestions(false);
        setShowMyTasks(false);
        setShowQuickAdd(false);
        setQuickAddTitle('');
        setShowCreateTask(false);
      }, 300);
    } else {
      setRoutineTitle(initialTitle);
      setRoutineEmoji(initialEmoji);
      setTasks(initialTasks);
      if (editMode) {
        setStep(2);
      } else {
        setStep(1);
      }
    }
    onOpenChange(v);
  }, [onOpenChange, initialTitle, initialEmoji, initialTasks, editMode]);

  // Sync state when dialog opens via props
  useEffect(() => {
    if (open) {
      setRoutineTitle(initialTitle);
      setRoutineEmoji(initialEmoji);
      setTasks(initialTasks);
      if (editMode) {
        setStep(2);
      } else {
        setStep(1);
      }
    }
  }, [open, editMode, initialTitle, initialEmoji, initialTasks]);

  // Auto-focus name input
  useEffect(() => {
    if (open && step === 1) {
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [open, step]);

  // Auto-focus quick add input
  useEffect(() => {
    if (showQuickAdd) {
      setTimeout(() => quickAddInputRef.current?.focus(), 150);
    }
  }, [showQuickAdd]);

  // Fetch routine name suggestions from routines_bank
  const { data: routineSuggestions = [] } = useQuery({
    queryKey: ['routine-name-suggestions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, color')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return data || [];
    },
    enabled: open,
  });

  const filteredSuggestions = useMemo(() => {
    if (!routineTitle.trim()) return routineSuggestions.slice(0, 6);
    const q = routineTitle.toLowerCase();
    return routineSuggestions.filter((r: any) => r.title.toLowerCase().includes(q)).slice(0, 5);
  }, [routineSuggestions, routineTitle]);

  // Fetch user's unlinked tasks (no source_routine_id) for "Add from My Tasks"
  const { data: unlinkedTasks = [] } = useQuery({
    queryKey: ['builder-unlinked-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_tasks')
        .select('id, title, emoji, color, repeat_pattern, category:tag, duration_minutes, pro_link_type, pro_link_value, goal_enabled, goal_target, goal_type, goal_unit, linked_playlist_id, time_period')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('source_routine_id', null)
        .or('pro_link_type.is.null,pro_link_type.neq.routine')
        .order('order_index', { ascending: true });
      return data || [];
    },
    enabled: !!user && open,
  });

  const addedTaskIds = useMemo(() => new Set(tasks.map(t => t.id)), [tasks]);

  const addTaskFromSource = (source: any) => {
    if (addedTaskIds.has(source.id)) return;
    haptic.light();
    const newTask: BuilderTask = {
      id: source.id,
      title: source.title,
      emoji: source.emoji || '📝',
      color: source.color || ROUTINE_COLOR_CYCLE[tasks.length % ROUTINE_COLOR_CYCLE.length],
      repeat_pattern: source.repeat_pattern || 'daily',
      repeat_days: source.repeat_days || null,
      description: source.description || null,
      pro_link_type: source.pro_link_type || null,
      pro_link_value: source.pro_link_value || null,
      goal_enabled: source.goal_enabled || false,
      goal_target: source.goal_target || null,
      goal_type: source.goal_type || null,
      goal_unit: source.goal_unit || null,
      duration_minutes: source.duration_minutes || null,
      time_period: source.time_period || null,
      linked_playlist_id: source.linked_playlist_id || null,
      category: source.category || null,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const removeTask = (taskId: string) => {
    haptic.light();
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Quick Add handlers (same as home page pattern)
  const handleQuickAddSubmit = () => {
    const trimmed = quickAddTitle.trim();
    if (!trimmed) return;
    haptic.medium();
    const variant = QUICK_ADD_VARIANTS[tasks.length % QUICK_ADD_VARIANTS.length];
    const timeMap: Record<string, string> = { Morning: 'morning', Afternoon: 'afternoon', Evening: 'evening', Bedtime: 'night' };
    const newTask: BuilderTask = {
      id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      emoji: variant.emoji,
      color: variant.color,
      repeat_pattern: quickRepeat === 'Daily' ? 'daily' : quickRepeat === 'Weekly' ? 'weekly' : 'none',
      time_period: timeMap[quickTime] || null,
    };
    setTasks(prev => [...prev, newTask]);
    setQuickAddTitle('');
    setShowQuickAdd(false);
  };

  const handleQuickAddClose = () => {
    setShowQuickAdd(false);
    setQuickAddTitle('');
    setQuickRepeat('Daily');
    setQuickTime('Anytime');
  };

  const handleQuickAddOpenDetails = () => {
    haptic.light();
    setShowQuickAdd(false);
    setShowCreateTask(true);
  };

  const handleCreateNewTask = (data: TaskFormData) => {
    haptic.light();
    const newTask: BuilderTask = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: data.title,
      emoji: data.icon || '📝',
      color: data.color || ROUTINE_COLOR_CYCLE[tasks.length % ROUTINE_COLOR_CYCLE.length],
      repeat_pattern: data.repeatEnabled ? data.repeatPattern : 'none',
      repeat_days: data.repeatDays || null,
      description: data.description || null,
      pro_link_type: data.proLinkType || null,
      pro_link_value: data.proLinkValue || null,
      goal_enabled: data.goalEnabled || false,
      goal_target: data.goalTarget || null,
      goal_type: data.goalType || null,
      goal_unit: data.goalUnit || null,
      duration_minutes: data.durationMinutes || null,
      linked_playlist_id: data.linkedPlaylistId || null,
    };
    setTasks(prev => [...prev, newTask]);
    setShowCreateTask(false);
  };

  const handleEditTaskSave = (data: TaskFormData) => {
    if (!editingTask) return;
    haptic.light();
    setTasks(prev => prev.map(t => t.id === editingTask.id ? {
      ...t,
      title: data.title,
      emoji: data.icon || t.emoji,
      color: data.color || t.color,
      repeat_pattern: data.repeatEnabled ? data.repeatPattern : 'none',
      repeat_days: data.repeatDays || null,
      description: data.description || null,
      pro_link_type: data.proLinkType || null,
      pro_link_value: data.proLinkValue || null,
      goal_enabled: data.goalEnabled || false,
      goal_target: data.goalTarget || null,
      goal_type: data.goalType || null,
      goal_unit: data.goalUnit || null,
      duration_minutes: data.durationMinutes || null,
      time_period: data.timePeriod || null,
      linked_playlist_id: data.linkedPlaylistId || null,
    } : t));
    setEditingTask(null);
  };

  const handleNext = () => {
    if (!routineTitle.trim()) return;
    haptic.light();
    setShowSuggestions(false);
    setStep(2);
  };

  const handleCreate = () => {
    if (tasks.length === 0) return;
    haptic.medium();
    if (editMode && onEditSave) {
      onEditSave(routineTitle.trim(), routineEmoji, routineColor, tasks);
    } else {
      onComplete(routineTitle.trim(), routineEmoji, routineColor, tasks);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    haptic.light();
    setRoutineTitle(suggestion.title);
    setRoutineEmoji(suggestion.emoji || '✨');
    setShowSuggestions(false);
  };

  return (
    <>
      {/* Main Dialog — both steps live here */}
      <Dialog open={open && !showMyTasks && !showQuickAdd} onOpenChange={(v) => { if (!v) handleOpenChange(false); }}>
        <DialogContent
          hideCloseButton
          className="w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none !translate-y-0"
          style={{ top: '12%' }}
        >
          {/* Two-tone name card */}
          <div className="rounded-3xl overflow-hidden transition-all duration-300">
            {/* Top: name input */}
            <div className="px-4 pt-4 pb-3 transition-colors duration-200" style={{ backgroundColor: TASK_COLORS[routineColor as TaskColor] || TASK_COLORS.peach }}>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <FluentEmoji emoji={routineEmoji} size={28} />
                </div>
                <input
                  ref={nameInputRef}
                  value={routineTitle}
                  onChange={(e) => {
                    setRoutineTitle(e.target.value.slice(0, 40));
                    if (step === 1) setShowSuggestions(true);
                  }}
                  onFocus={() => { if (step === 1) setShowSuggestions(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && routineTitle.trim()) {
                      if (step === 1) handleNext();
                    }
                  }}
                  placeholder="Type routine name..."
                  className="flex-1 bg-transparent text-[15px] font-semibold text-black dark:text-foreground placeholder:text-black/40 dark:placeholder:text-muted-foreground/50 outline-none"
                  enterKeyHint={step === 1 ? 'next' : 'done'}
                  autoComplete="off"
                />
              </div>
              {/* Color picker */}
              <div className="flex items-center gap-2 mt-2 pl-12">
                {(['peach', 'pink', 'yellow', 'mint', 'sky', 'lavender'] as TaskColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => { haptic.light(); setRoutineColor(color); }}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all active:scale-90',
                      routineColor === color && 'ring-2 ring-offset-2 ring-black/30'
                    )}
                    style={{ backgroundColor: TASK_COLORS[color] }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom section — changes per step */}
            {step === 1 ? (
              <div className="px-4 py-3 transition-colors duration-200" style={{ backgroundColor: `color-mix(in srgb, ${TASK_COLORS[routineColor as TaskColor] || TASK_COLORS.peach} 70%, #d4a574)` }}>
                <p className="text-[13px] font-medium text-black/70 dark:text-muted-foreground text-center">
                  Press enter to continue. Tap outside to cancel.
                </p>
              </div>
            ) : (
              /* Step 2 expanded area */
              <div className="transition-colors duration-200" style={{ backgroundColor: `color-mix(in srgb, ${TASK_COLORS[routineColor as TaskColor] || TASK_COLORS.peach} 70%, #d4a574)` }}>
                {/* Task list */}
                <div className="max-h-[35vh] overflow-y-auto px-3 pt-2 pb-1">
                  {tasks.length === 0 ? (
                    <div className="text-center py-6">
                      <FluentEmoji emoji="🧩" size={32} className="mx-auto mb-2" />
                      <p className="text-xs text-black/50 dark:text-muted-foreground">Add tasks to build your routine</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task, i) => {
                        const colorClass = TASK_COLOR_CLASSES[(task.color as TaskColor) || 'peach'] || TASK_COLOR_CLASSES.peach;
                        const repeatLabel = task.repeat_pattern === 'daily' ? 'Daily'
                          : task.repeat_pattern === 'weekly' ? 'Weekly'
                          : task.repeat_pattern === 'monthly' ? 'Monthly'
                          : task.repeat_pattern === 'weekend' ? 'Weekends'
                          : task.repeat_pattern === 'none' ? 'Once' : '';
                        const timeLabel = task.time_period === 'morning' ? 'Morning'
                          : task.time_period === 'afternoon' ? 'Afternoon'
                          : task.time_period === 'evening' ? 'Evening'
                          : task.time_period === 'night' ? 'Bedtime' : 'Anytime';
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'rounded-3xl pl-3 pr-4 py-3',
                              colorClass
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                <FluentEmoji emoji={task.emoji} size={32} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-black/80">{timeLabel}</span>
                                  {repeatLabel && <span className="text-[11px] text-black/80">• {repeatLabel}</span>}
                                </div>
                                <p className="text-black text-[15px] font-semibold leading-tight truncate">{task.title}</p>
                              </div>
                              <button
                                onClick={() => { haptic.light(); setEditingTask(task); }}
                                className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                              >
                                <Pencil className="w-3.5 h-3.5 text-black/30" />
                              </button>
                              <button
                                onClick={() => removeTask(task.id)}
                                className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                              >
                                <Trash2 className="w-4 h-4 text-black/30" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-3 pb-2 pt-2 space-y-1.5">
                  {/* Add Quick Task — opens same quick-add dialog as home */}
                  <button
                    onClick={() => {
                      haptic.light();
                      setShowQuickAdd(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/60 dark:bg-white/10 active:bg-white/80 dark:active:bg-white/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-semibold text-black/80 dark:text-foreground">Add Quick Task</span>
                  </button>

                  {/* Add from My Tasks */}
                  <button
                    onClick={() => {
                      haptic.light();
                      setShowMyTasks(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/60 dark:bg-white/10 active:bg-white/80 dark:active:bg-white/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-violet-400/20 flex items-center justify-center">
                      <ListChecks className="w-4 h-4 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-semibold text-black/80 dark:text-foreground">Add from My Tasks</span>
                  </button>
                </div>

                {/* Create Routine */}
                <div className="px-3 pb-3">
                  <button
                    onClick={handleCreate}
                    disabled={tasks.length === 0}
                    className={cn(
                      'w-full h-12 rounded-2xl text-[15px] font-bold shadow-md transition-all active:scale-[0.98]',
                      tasks.length > 0
                        ? 'bg-urgency text-urgency-foreground shadow-urgency/30'
                        : 'bg-black/10 dark:bg-white/10 text-black/30 dark:text-white/30 shadow-none'
                    )}
                  >
                    {editMode ? 'Save Changes' : `Create Routine${tasks.length > 0 ? ` (${tasks.length})` : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 1: Next button */}
          {step === 1 && (
            <div className="mt-3 min-h-11">
              {routineTitle.trim() ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleNext}
                    className="w-full gap-2 h-11 rounded-2xl text-sm font-bold flex items-center justify-center shadow-sm active:scale-95 transition-transform bg-amber-400 dark:bg-amber-500 text-black"
                  >
                    Next — Add Tasks
                  </button>
                </div>
              ) : (
                <div className="h-11" aria-hidden="true" />
              )}
            </div>
          )}

          {/* Step 1: Inspirations */}
          {step === 1 && showSuggestions && filteredSuggestions.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-white/70 font-medium text-center">Need inspiration?</p>
              <div className="space-y-1.5">
                {filteredSuggestions.slice(0, 4).map((s: any) => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionSelect(s)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/10 active:bg-white/20 transition-colors text-left"
                  >
                    <FluentEmoji emoji={s.emoji || '✨'} size={22} />
                    <span className="text-sm font-medium text-white truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* My Tasks picker — Sheet overlay */}
      <Sheet open={showMyTasks} onOpenChange={setShowMyTasks}>
        <SheetContent
          side="bottom"
          className="h-[70vh] rounded-t-3xl px-0 pb-0"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-5 pb-3 border-b border-border/30">
              <button onClick={() => setShowMyTasks(false)} className="p-1 active:opacity-70">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <h3 className="text-base font-bold text-foreground flex-1">My Tasks</h3>
              {tasks.length > 0 && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  {tasks.length} in routine
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {unlinkedTasks.length === 0 ? (
                <div className="text-center py-10">
                  <FluentEmoji emoji="📋" size={36} className="mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No unlinked tasks</p>
                  <p className="text-xs text-muted-foreground mt-1">Tasks already in a routine won't appear here</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {unlinkedTasks.map((task: any) => {
                    const isAdded = addedTaskIds.has(task.id);
                    return (
                      <button
                        key={task.id}
                        onClick={() => { addTaskFromSource(task); }}
                        disabled={isAdded}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all',
                          isAdded ? 'bg-muted/30 opacity-50' : 'bg-muted/50 active:bg-muted/80 active:scale-[0.99]'
                        )}
                      >
                        <FluentEmoji emoji={task.emoji || '📝'} size={24} />
                        <span className="flex-1 text-sm font-medium text-foreground truncate">{task.title}</span>
                        {isAdded ? (
                          <span className="text-[10px] text-muted-foreground font-semibold bg-background/80 px-2 py-0.5 rounded-full">Added</span>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="px-5 pt-2 border-t border-border/30"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <Button
                onClick={() => setShowMyTasks(false)}
                className="w-full h-12 rounded-2xl text-base font-bold bg-foreground text-background"
              >
                Done
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick Add Dialog — identical to home page quick-add */}
      <Dialog open={showQuickAdd} onOpenChange={(v) => { if (!v) handleQuickAddClose(); }}>
        <DialogContent
          hideCloseButton
          className="w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none !translate-y-0"
          style={{ top: '25%' }}
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
              onClick={handleQuickAddOpenDetails}
              className="h-7 w-7 rounded-full bg-white/20 text-white/80 flex items-center justify-center active:scale-95 transition-all"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card — two-tone (identical to home) */}
          <div className="rounded-3xl overflow-hidden bg-[#FFF5E6]">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <Plus className="h-6 w-6 text-urgency" strokeWidth={2.5} />
                </div>
                <input
                  ref={quickAddInputRef}
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAddSubmit();
                    if (e.key === 'Escape') handleQuickAddClose();
                  }}
                  placeholder="Type task name..."
                  className="flex-1 bg-transparent text-[15px] font-semibold text-black placeholder:text-black/40 outline-none"
                  enterKeyHint="done"
                  autoComplete="off"
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
          <div className="mt-3 min-h-11">
            {quickAddTitle.trim() ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleQuickAddOpenDetails}
                  className="gap-1.5 h-11 px-5 rounded-2xl text-sm font-medium flex items-center justify-center shadow-sm active:scale-95 transition-transform bg-white text-black"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Details
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleQuickAddSubmit}
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
        </DialogContent>
      </Dialog>

      {/* Create new task sheet (from Details button) */}
      {showCreateTask && (
        <AppTaskCreate
          isSheet={true}
          sheetOpen={showCreateTask}
          onSheetOpenChange={(v) => {
            if (!v) setShowCreateTask(false);
          }}
          onSaveSheet={handleCreateNewTask}
        />
      )}

      {/* Edit existing task sheet */}
      {editingTask && (
        <AppTaskCreate
          isSheet={true}
          sheetOpen={!!editingTask}
          onSheetOpenChange={(v) => {
            if (!v) setEditingTask(null);
          }}
          onSaveSheet={handleEditTaskSave}
          initialData={{
            title: editingTask.title,
            icon: editingTask.emoji,
            color: (editingTask.color as TaskColor) || 'peach',
            description: editingTask.description || null,
            repeatEnabled: editingTask.repeat_pattern !== 'none' && !!editingTask.repeat_pattern,
            repeatPattern: (editingTask.repeat_pattern === 'daily' || editingTask.repeat_pattern === 'weekly' || editingTask.repeat_pattern === 'monthly') ? editingTask.repeat_pattern : 'daily',
            repeatDays: editingTask.repeat_days || [],
            timePeriod: (editingTask.time_period as any) || null,
            durationMinutes: editingTask.duration_minutes || null,
            proLinkType: editingTask.pro_link_type as any || null,
            proLinkValue: editingTask.pro_link_value || null,
            goalEnabled: editingTask.goal_enabled || false,
            goalTarget: editingTask.goal_target || 0,
            goalType: (editingTask.goal_type as any) || 'count',
            goalUnit: editingTask.goal_unit || '',
            linkedPlaylistId: editingTask.linked_playlist_id || null,
          }}
        />
      )}
    </>
  );
}

export default RoutineBuilderSheet;
