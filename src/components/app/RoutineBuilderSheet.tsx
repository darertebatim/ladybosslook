import { useState, useMemo, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, Trash2, Search, X } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { EmojiPicker } from '@/components/app/EmojiPicker';
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

  // Reset state when sheet opens/closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // Reset after close animation
      setTimeout(() => {
        setStep(1);
        setRoutineTitle(initialTitle);
        setRoutineEmoji(initialEmoji);
        setTasks(initialTasks);
        setShowTaskPicker(false);
        setPickerSearch('');
        setShowCreateTask(false);
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

  const handleNext = () => {
    if (!routineTitle.trim()) return;
    haptic.light();
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

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-3xl px-0 pb-0"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 border-b border-border/50">
              {step === 2 ? (
                <button onClick={() => setStep(1)} className="p-1 active:opacity-70">
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              ) : (
                <button onClick={() => handleOpenChange(false)} className="p-1 active:opacity-70">
                  <X className="w-5 h-5 text-foreground" />
                </button>
              )}
              <h2 className="text-lg font-bold text-foreground flex-1">
                {editMode ? 'Edit Routine' : 'Create Routine'}
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                Step {step}/2
              </span>
            </div>

            {/* Step 1: Name + Emoji */}
            {step === 1 && (
              <div className="flex-1 flex flex-col px-4 pt-6">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <FluentEmoji emoji={routineEmoji} size={48} />
                  </button>
                  <p className="text-xs text-muted-foreground">Tap to change emoji</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Routine Name</label>
                  <Input
                    value={routineTitle}
                    onChange={(e) => setRoutineTitle(e.target.value.slice(0, 40))}
                    placeholder="e.g., Morning Power Hour"
                    className="text-base h-12 rounded-xl"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-right">{routineTitle.length}/40</p>
                </div>

                {/* Quick emoji grid */}
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground mb-2">Quick pick</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => { haptic.light(); setRoutineEmoji(emoji); }}
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                          routineEmoji === emoji
                            ? 'bg-primary/20 ring-2 ring-primary scale-110'
                            : 'bg-muted active:scale-95'
                        )}
                      >
                        <FluentEmoji emoji={emoji} size={24} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pb-6">
                  <Button
                    onClick={handleNext}
                    disabled={!routineTitle.trim()}
                    className="w-full h-12 rounded-xl text-base font-bold"
                  >
                    Next — Add Tasks
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Task list builder */}
            {step === 2 && !showTaskPicker && (
              <div className="flex-1 flex flex-col">
                {/* Routine header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                  <FluentEmoji emoji={routineEmoji} size={28} />
                  <span className="font-bold text-foreground">{routineTitle}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <FluentEmoji emoji="📝" size={48} className="mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Add tasks to your routine
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task, i) => {
                        const colorClass = TASK_COLOR_CLASSES[(task.color as TaskColor) || 'peach'] || TASK_COLOR_CLASSES.peach;
                        return (
                          <div
                            key={task.id}
                            className={cn('flex items-center gap-3 rounded-xl p-3', colorClass)}
                          >
                            <FluentEmoji emoji={task.emoji} size={28} />
                            <span className="flex-1 font-medium text-black text-sm truncate">{task.title}</span>
                            <button
                              onClick={() => removeTask(task.id)}
                              className="shrink-0 p-1.5 rounded-full bg-background/50 active:scale-95 transition-transform"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add task button */}
                <div className="px-4 py-3 border-t border-border/50">
                  <button
                    onClick={() => { haptic.light(); setShowTaskPicker(true); setPickerSearch(''); }}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-border active:bg-muted/50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Add Task</span>
                  </button>
                </div>

                {/* Create / Save button */}
                <div
                  className="px-4 pt-2"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                  <Button
                    onClick={handleCreate}
                    disabled={tasks.length === 0}
                    className="w-full h-12 rounded-xl text-base font-bold"
                  >
                    {editMode ? 'Save Changes' : 'Create'}
                  </Button>
                </div>
              </div>
            )}

            {/* Task Picker overlay */}
            {step === 2 && showTaskPicker && (
              <div className="flex-1 flex flex-col">
                {/* Picker header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                  <button onClick={() => { setShowTaskPicker(false); setPickerSearch(''); }} className="p-1 active:opacity-70">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <h3 className="text-base font-bold text-foreground">Add Tasks</h3>
                </div>

                {/* Search */}
                <div className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="pl-9 h-10 rounded-xl"
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-4 py-1">
                  {(['bank', 'my'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setPickerTab(tab)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                        pickerTab === tab
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {tab === 'my' ? 'My Tasks' : 'Suggestions'}
                    </button>
                  ))}
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  {pickerTab === 'my' ? (
                    filteredUserTasks.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        {pickerSearch ? 'No tasks found' : 'No tasks yet'}
                      </p>
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
                                'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors',
                                isAdded ? 'bg-muted/50 opacity-50' : 'bg-muted active:bg-muted/70'
                              )}
                            >
                              <FluentEmoji emoji={task.emoji || '📝'} size={24} />
                              <span className="flex-1 text-sm font-medium text-foreground truncate">{task.title}</span>
                              {isAdded ? (
                                <span className="text-[10px] text-muted-foreground font-medium bg-background px-2 py-0.5 rounded">Added</span>
                              ) : (
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    filteredBankTasks.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        {pickerSearch ? 'No tasks found' : 'No suggestions available'}
                      </p>
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
                                'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors',
                                isAdded ? 'bg-muted/50 opacity-50' : 'bg-muted active:bg-muted/70'
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
                                <span className="text-[10px] text-muted-foreground font-medium bg-background px-2 py-0.5 rounded">Added</span>
                              ) : (
                                <Plus className="w-4 h-4 text-muted-foreground" />
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
                  className="px-4 pt-2 border-t border-border/50"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                  <button
                    onClick={() => { haptic.light(); setShowCreateTask(true); setShowTaskPicker(false); }}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary/10 active:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Create New Task</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Emoji Picker */}
      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        selectedEmoji={routineEmoji}
        onSelect={(emoji) => { setRoutineEmoji(emoji); setShowEmojiPicker(false); }}
      />

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
