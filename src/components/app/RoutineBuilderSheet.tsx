import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, Trash2, Search } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
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
  // Edit mode
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
const QUICK_EMOJIS = ['✨', '🎯', '💪', '🧘', '📚', '🏃', '💼', '🎨', '🌟', '💖', '🔥', '🌿'];


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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tasks, setTasks] = useState<BuilderTask[]>(initialTasks);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'my' | 'bank'>('bank');
  const [pickerSearch, setPickerSearch] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // Reset state when sheet opens/closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setRoutineTitle(initialTitle);
        setRoutineEmoji(initialEmoji);
        setTasks(initialTasks);
        setShowTaskPicker(false);
        setPickerSearch('');
        setShowCreateTask(false);
        setShowSuggestions(false);
        setQuickAddTitle('');
        setQuickAddOpen(false);
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
    onOpenChange(open);
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

  // Filter suggestions based on typing
  const filteredSuggestions = useMemo(() => {
    if (!routineTitle.trim()) return routineSuggestions.slice(0, 6);
    const q = routineTitle.toLowerCase();
    return routineSuggestions.filter((r: any) => r.title.toLowerCase().includes(q)).slice(0, 5);
  }, [routineSuggestions, routineTitle]);

  // Fetch user's tasks for picker
  const { data: userTasks = [] } = useQuery({
    queryKey: ['builder-user-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_tasks')
        .select('id, title, emoji, color, repeat_pattern, category:tag, duration_minutes, pro_link_type, pro_link_value, goal_enabled, goal_target, goal_type, goal_unit, linked_playlist_id, time_period')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('pro_link_type.is.null,pro_link_type.neq.routine')
        .order('order_index', { ascending: true });
      return data || [];
    },
    enabled: !!user && open,
  });

  // Fetch admin task bank for suggestions
  const { data: bankTasks = [] } = useQuery({
    queryKey: ['builder-admin-bank'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_task_bank')
        .select('id, title, emoji, color, category, repeat_pattern, repeat_days, duration_minutes, pro_link_type, pro_link_value, goal_enabled, goal_target, goal_type, goal_unit, linked_playlist_id, time_period, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return data || [];
    },
    enabled: open,
  });

  // Filter tasks by search
  const filteredUserTasks = useMemo(() => {
    if (!pickerSearch) return userTasks;
    const q = pickerSearch.toLowerCase();
    return userTasks.filter((t: any) => t.title.toLowerCase().includes(q));
  }, [userTasks, pickerSearch]);

  const filteredBankTasks = useMemo(() => {
    if (!pickerSearch) return bankTasks;
    const q = pickerSearch.toLowerCase();
    return bankTasks.filter((t: any) => t.title.toLowerCase().includes(q));
  }, [bankTasks, pickerSearch]);

  // Already-added task IDs (prevent duplicates)
  const addedTaskIds = useMemo(() => new Set(tasks.map(t => t.id)), [tasks]);

  const addTaskFromSource = (source: any, type: 'user' | 'bank') => {
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
      category: type === 'user' ? (source.category || null) : (source.category || null),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const removeTask = (taskId: string) => {
    haptic.light();
    setTasks(prev => prev.filter(t => t.id !== taskId));
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

  const handleQuickAddSubmit = () => {
    const trimmed = quickAddTitle.trim();
    if (!trimmed) return;
    haptic.medium();
    const variant = QUICK_ADD_VARIANTS[tasks.length % QUICK_ADD_VARIANTS.length];
    const newTask: BuilderTask = {
      id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      emoji: variant.emoji,
      color: variant.color,
      repeat_pattern: 'daily',
    };
    setTasks(prev => [...prev, newTask]);
    setQuickAddTitle('');
    // Keep input focused for rapid entry
    setTimeout(() => quickAddInputRef.current?.focus(), 50);
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
      {/* Step 1: Dialog overlay — like home quick-add */}
      <Dialog open={open && step === 1} onOpenChange={(v) => { if (!v) handleOpenChange(false); }}>
        <DialogContent
          hideCloseButton
          className="w-[calc(100%-32px)] max-w-[calc(100%-32px)] p-0 gap-0 bg-transparent border-0 shadow-none !translate-y-0"
          style={{ top: '25%' }}
        >
          {/* Name input — two-tone card */}
          <div className="rounded-3xl overflow-hidden">
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
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && routineTitle.trim()) handleNext(); }}
                  placeholder="Type routine name..."
                  className="flex-1 bg-transparent text-[15px] font-semibold text-black dark:text-foreground placeholder:text-black/40 dark:placeholder:text-muted-foreground/50 outline-none"
                  enterKeyHint="next"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="px-4 py-3 bg-[#FFE6C0] dark:bg-amber-900/30">
              <p className="text-[13px] font-medium text-black/70 dark:text-muted-foreground text-center">
                Press enter to continue. Tap outside to cancel.
              </p>
            </div>
          </div>

          {/* Next button — appears when title is entered */}
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

          {/* Inspirations */}
          {showSuggestions && filteredSuggestions.length > 0 && (
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

      {/* Step 2: Sheet */}
      <Sheet open={open && step === 2} onOpenChange={(v) => { if (!v) { setStep(1); } }}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-3xl px-0 pb-0"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pb-3 border-b border-border/30">
              <button onClick={() => setStep(1)} className="p-1 active:opacity-70">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <h2 className="text-lg font-bold text-foreground flex-1">
                {editMode ? 'Edit Routine' : 'Add Tasks'}
              </h2>
            </div>

            {!showTaskPicker ? (
              <div className="flex-1 flex flex-col">
                {/* Routine header — gradient banner */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-100/30 dark:border-amber-800/20">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 flex items-center justify-center">
                    <FluentEmoji emoji={routineEmoji} size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-foreground text-[15px] block truncate">{routineTitle}</span>
                    <span className="text-[11px] text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''} added</span>
                  </div>
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 flex items-center justify-center mx-auto mb-4">
                        <FluentEmoji emoji="🧩" size={36} />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1">Add tasks to your routine</p>
                      <p className="text-xs text-muted-foreground">Tap the button below to start building</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task, i) => {
                        const colorClass = TASK_COLOR_CLASSES[(task.color as TaskColor) || 'peach'] || TASK_COLOR_CLASSES.peach;
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'flex items-center gap-3 rounded-2xl overflow-hidden transition-all',
                              colorClass
                            )}
                          >
                            <div className="pl-3 shrink-0">
                              <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-[11px] font-bold text-black/60">
                                {i + 1}
                              </span>
                            </div>
                            <FluentEmoji emoji={task.emoji} size={28} className="shrink-0" />
                            <span className="flex-1 font-semibold text-black text-sm truncate py-3">{task.title}</span>
                            <button
                              onClick={() => removeTask(task.id)}
                              className="shrink-0 p-2.5 mr-1 rounded-full active:scale-95 transition-transform"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-black/40" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick add inline + Browse */}
                <div className="px-5 py-3 border-t border-border/30 space-y-2">
                  <div className="rounded-2xl overflow-hidden border border-amber-200/50 dark:border-amber-800/30">
                    <div className="bg-[#FFF5E6] dark:bg-amber-950/30 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          <Plus className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
                        </div>
                        <input
                          ref={quickAddInputRef}
                          value={quickAddTitle}
                          onChange={(e) => setQuickAddTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickAddSubmit();
                            if (e.key === 'Escape') { setQuickAddTitle(''); quickAddInputRef.current?.blur(); }
                          }}
                          placeholder="Type task name..."
                          className="flex-1 bg-transparent text-[14px] font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none"
                          enterKeyHint="done"
                          autoComplete="off"
                        />
                        {quickAddTitle.trim() && (
                          <button
                            onClick={handleQuickAddSubmit}
                            className="shrink-0 h-8 px-3.5 rounded-xl bg-amber-400 dark:bg-amber-500 text-black text-xs font-bold active:scale-95 transition-transform shadow-sm"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-[#FFE6C0] dark:bg-amber-900/20">
                      <p className="text-[11px] font-medium text-black/50 dark:text-muted-foreground text-center">
                        Press enter to add quickly
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => { haptic.light(); setShowTaskPicker(true); setPickerSearch(''); }}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-muted-foreground active:bg-muted/50 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Browse existing tasks
                  </button>
                </div>

                {/* Create / Save button */}
                <div
                  className="px-5 pt-2"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                  <Button
                    onClick={handleCreate}
                    disabled={tasks.length === 0}
                    className="w-full h-13 rounded-2xl text-base font-bold bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black shadow-md shadow-amber-200/40 dark:shadow-amber-900/30 border-0"
                  >
                    {editMode ? 'Save Changes' : `Create Routine (${tasks.length})`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Picker header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30">
                  <button onClick={() => { setShowTaskPicker(false); setPickerSearch(''); }} className="p-1 active:opacity-70">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <h3 className="text-base font-bold text-foreground">Add Tasks</h3>
                  {tasks.length > 0 && (
                    <span className="ml-auto text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                      {tasks.length} added
                    </span>
                  )}
                </div>

                {/* Search */}
                <div className="px-5 py-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full pl-9 pr-3 h-10 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-amber-300/50 transition-all"
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-5 py-1">
                  {(['bank', 'my'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setPickerTab(tab)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
                        pickerTab === tab
                          ? 'bg-foreground text-background shadow-sm'
                          : 'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      {tab === 'my' ? 'My Tasks' : 'Suggestions'}
                    </button>
                  ))}
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-5 py-2.5">
                  {pickerTab === 'my' ? (
                    filteredUserTasks.length === 0 ? (
                      <div className="text-center py-10">
                        <FluentEmoji emoji="📋" size={36} className="mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {pickerSearch ? 'No tasks found' : 'No tasks yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredUserTasks.map((task: any) => {
                          const isAdded = addedTaskIds.has(task.id);
                          return (
                            <button
                              key={task.id}
                              onClick={() => addTaskFromSource(task, 'user')}
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
                    )
                  ) : (
                    filteredBankTasks.length === 0 ? (
                      <div className="text-center py-10">
                        <FluentEmoji emoji="💡" size={36} className="mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {pickerSearch ? 'No tasks found' : 'No suggestions available'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredBankTasks.map((task: any) => {
                          const isAdded = addedTaskIds.has(task.id);
                          return (
                            <button
                              key={task.id}
                              onClick={() => addTaskFromSource(task, 'bank')}
                              disabled={isAdded}
                              className={cn(
                                'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all',
                                isAdded ? 'bg-muted/30 opacity-50' : 'bg-muted/50 active:bg-muted/80 active:scale-[0.99]'
                              )}
                            >
                              <FluentEmoji emoji={task.emoji || '📝'} size={24} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground block truncate">{task.title}</span>
                                {task.category && (
                                  <span className="text-[10px] text-muted-foreground">{task.category}</span>
                                )}
                              </div>
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
                    )
                  )}
                </div>

                {/* Create new task button */}
                <div
                  className="px-5 pt-2.5 border-t border-border/30"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                  <button
                    onClick={() => { haptic.light(); setShowCreateTask(true); setShowTaskPicker(false); }}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-amber-400/15 to-orange-400/10 dark:from-amber-500/10 dark:to-orange-500/5 active:from-amber-400/25 active:to-orange-400/20 transition-colors border border-amber-200/40 dark:border-amber-800/30"
                  >
                    <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Create New Task</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>




      {/* Create new task sheet */}
      {showCreateTask && (
        <AppTaskCreate
          isSheet={true}
          sheetOpen={showCreateTask}
          onSheetOpenChange={(open) => {
            if (!open) setShowCreateTask(false);
          }}
          onSaveSheet={handleCreateNewTask}
        />
      )}
    </>
  );
}

export default RoutineBuilderSheet;
