import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, Trash2, ListChecks } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TASK_COLOR_CLASSES, TaskColor, TaskTemplate } from '@/hooks/useTaskPlanner';
import { TaskQuickStartSheet } from '@/components/app/TaskQuickStartSheet';
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
  const [routineColor] = useState(initialColor);

  const [tasks, setTasks] = useState<BuilderTask[]>(initialTasks);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
        setShowQuickStart(false);
      }, 300);
    } else {
      setRoutineTitle(initialTitle);
      setRoutineEmoji(initialEmoji);
      setTasks(initialTasks);
      if (editMode && initialTasks.length > 0) {
        setStep(2);
      } else {
        setStep(1);
      }
    }
    onOpenChange(v);
  }, [onOpenChange, initialTitle, initialEmoji, initialTasks, editMode]);

  // Auto-focus name input
  useEffect(() => {
    if (open && step === 1) {
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [open, step]);

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

  const handleQuickStartContinue = (taskName: string, template?: TaskTemplate) => {
    haptic.light();
    const variant = QUICK_ADD_VARIANTS[tasks.length % QUICK_ADD_VARIANTS.length];
    const newTask: BuilderTask = {
      id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: taskName,
      emoji: template?.emoji || variant.emoji,
      color: template?.color || variant.color,
      repeat_pattern: template?.repeat_pattern || 'daily',
      repeat_days: template?.repeat_days || null,
      description: template?.description || null,
      pro_link_type: template?.pro_link_type || null,
      pro_link_value: template?.pro_link_value || null,
      goal_enabled: template?.goal_enabled || false,
      goal_target: template?.goal_target || null,
      goal_type: template?.goal_type || null,
      goal_unit: template?.goal_unit || null,
      duration_minutes: template?.duration_minutes || null,
      time_period: template?.time_period || null,
      linked_playlist_id: template?.linked_playlist_id || null,
      category: template?.category || null,
    };
    setTasks(prev => [...prev, newTask]);
    setShowQuickStart(false);
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
      <Dialog open={open && !showMyTasks && !showQuickStart} onOpenChange={(v) => { if (!v) handleOpenChange(false); }}>
        <DialogContent
          hideCloseButton
          className="w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none !translate-y-0"
          style={{ top: step === 1 ? '25%' : '12%' }}
        >
          {/* Two-tone name card */}
          <div className="rounded-3xl overflow-hidden transition-all duration-300">
            {/* Top: name input */}
            <div className="bg-[#FFF5E6] dark:bg-amber-950/50 px-4 pt-4 pb-3">
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
            </div>

            {/* Bottom section — changes per step */}
            {step === 1 ? (
              <div className="px-4 py-3 bg-[#FFE6C0] dark:bg-amber-900/30">
                <p className="text-[13px] font-medium text-black/70 dark:text-muted-foreground text-center">
                  Press enter to continue. Tap outside to cancel.
                </p>
              </div>
            ) : (
              /* Step 2 expanded area */
              <div className="bg-[#FFE6C0] dark:bg-amber-900/30">
                {/* Task list */}
                <div className="max-h-[35vh] overflow-y-auto px-3 pt-2 pb-1">
                  {tasks.length === 0 ? (
                    <div className="text-center py-6">
                      <FluentEmoji emoji="🧩" size={32} className="mx-auto mb-2" />
                      <p className="text-xs text-black/50 dark:text-muted-foreground">Add tasks to build your routine</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {tasks.map((task, i) => {
                        const colorClass = TASK_COLOR_CLASSES[(task.color as TaskColor) || 'peach'] || TASK_COLOR_CLASSES.peach;
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'flex items-center gap-2.5 rounded-2xl overflow-hidden',
                              colorClass
                            )}
                          >
                            <div className="pl-3 shrink-0">
                              <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold text-black/60">
                                {i + 1}
                              </span>
                            </div>
                            <FluentEmoji emoji={task.emoji} size={24} className="shrink-0" />
                            <span className="flex-1 font-semibold text-black text-[13px] truncate py-2.5">{task.title}</span>
                            <button
                              onClick={() => removeTask(task.id)}
                              className="shrink-0 p-2 mr-1 rounded-full active:scale-95 transition-transform"
                            >
                              <Trash2 className="w-3 h-3 text-black/40" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-3 pb-2 pt-2 space-y-1.5">
                  {/* Add Quick Task — opens the same TaskQuickStartSheet as home */}
                  <button
                    onClick={() => {
                      haptic.light();
                      setShowQuickStart(true);
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
                        ? 'bg-amber-400 dark:bg-amber-500 text-black shadow-amber-200/40 dark:shadow-amber-900/30'
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

      {/* Quick Start Sheet — same as home page */}
      <TaskQuickStartSheet
        open={showQuickStart}
        onOpenChange={setShowQuickStart}
        onContinue={handleQuickStartContinue}
      />
    </>
  );
}

export default RoutineBuilderSheet;
