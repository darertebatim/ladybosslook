import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { TaskTemplate, TaskColor } from '@/hooks/useTaskPlanner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { RoutineBuilderSheet, BuilderTask } from '@/components/app/RoutineBuilderSheet';
import { ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';

interface SuggestedTask {
  id: string;
  title: string;
  emoji: string;
  category: string;
  description?: string;
  color?: string;
  repeat_pattern?: string;
  time_period?: string;
}

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

const CATEGORY_EMOJI: Record<string, string> = {
  calm: '🧘', sleep: '😴', nutrition: '🥗', movement: '🏃',
  Exercise: '💪', hygiene: '🧴', Presence: '🧠', connection: '💬',
  'self-kindness': '💚', gratitude: '🙏', productivity: '📋',
  TidyUp: '🧹', Evening: '🌙', LovedOnes: '🥰', 'easy-win': '✨',
};

const CATEGORY_LABELS: Record<string, string> = {
  calm: 'Calm', sleep: 'Sleep', nutrition: 'Nutrition', movement: 'Movement',
  Exercise: 'Exercise', hygiene: 'Hygiene', Presence: 'Presence', connection: 'Connection',
  'self-kindness': 'Self-Kindness', gratitude: 'Gratitude', productivity: 'Productivity',
  TidyUp: 'Tidy Up', Evening: 'Evening', LovedOnes: 'Loved Ones', 'easy-win': 'Easy Win',
};

export function SelfCareSuggestionsStep({ step, onNext, answers }: Props) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBuilder, setShowBuilder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const diagnosisData = useMemo(() => {
    try {
      const raw = answers?.['sc-diagnosis-data'];
      if (typeof raw === 'string') return JSON.parse(raw);
    } catch {}
    return { suggested_tasks: [], gap_categories: [] };
  }, [answers]);

  const suggestedTasks: SuggestedTask[] = diagnosisData.suggested_tasks || [];
  const gapCategories: string[] = diagnosisData.gap_categories || [];

  const taskTemplates: TaskTemplate[] = useMemo(() => {
    return suggestedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji || '📝',
      color: (t.color || 'mint') as TaskColor,
      category: t.category || '',
      description: t.description || null,
      repeat_pattern: (t.repeat_pattern || 'daily') as any,
      repeat_days: null,
      sort_order: 0,
      is_active: true,
      is_popular: false,
      pro_link_type: null,
      pro_link_value: null,
      goal_enabled: false,
      goal_type: null,
      goal_target: null,
      goal_unit: null,
      tag: null,
      linked_playlist_id: null,
      time_period: t.time_period || null,
      created_at: '',
      updated_at: '',
    }));
  }, [suggestedTasks]);

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    const groups: { category: string; tasks: TaskTemplate[] }[] = [];
    const categoryOrder = gapCategories.length > 0 ? gapCategories : [];
    const seen = new Set<string>();

    // First add tasks in gap category order
    for (const cat of categoryOrder) {
      const catTasks = taskTemplates.filter(t => t.category === cat);
      if (catTasks.length > 0) {
        groups.push({ category: cat, tasks: catTasks });
        seen.add(cat);
      }
    }

    // Then any remaining categories
    for (const t of taskTemplates) {
      if (!seen.has(t.category)) {
        const catTasks = taskTemplates.filter(tt => tt.category === t.category);
        groups.push({ category: t.category, tasks: catTasks });
        seen.add(t.category);
      }
    }

    return groups;
  }, [taskTemplates, gapCategories]);

  // Pre-select popular/first tasks on mount
  useEffect(() => {
    if (taskTemplates.length === 0) return;
    const preSelected = new Set<string>();
    for (const group of groupedTasks) {
      // Select first task from each category
      if (group.tasks[0]) {
        preSelected.add(group.tasks[0].id);
      }
    }
    setSelectedTasks(preSelected);
  }, [taskTemplates.length]); // only on first load

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === taskTemplates.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(taskTemplates.map(t => t.id)));
    }
  };

  const selectionCount = selectedTasks.size;
  const allSelected = selectionCount === taskTemplates.length && taskTemplates.length > 0;

  const getBuilderTasks = (): BuilderTask[] => {
    return taskTemplates
      .filter(t => selectedTasks.has(t.id))
      .map((t) => ({
        id: t.id,
        title: t.title,
        emoji: t.emoji,
        color: t.color,
        repeat_pattern: t.repeat_pattern,
        repeat_days: t.repeat_days,
        goal_enabled: t.goal_enabled,
        goal_type: t.goal_type,
        goal_target: t.goal_target,
        goal_unit: t.goal_unit,
        description: t.description,
        time_period: t.time_period,
        linked_playlist_id: t.linked_playlist_id,
        pro_link_type: t.pro_link_type,
        pro_link_value: t.pro_link_value,
      }));
  };

  const handleBuildRoutine = () => {
    if (selectionCount === 0) return;
    setShowBuilder(true);
  };

  const handleBuilderComplete = async (title: string, emoji: string, color: string, tasks: BuilderTask[]) => {
    setShowBuilder(false);
    if (!user) { onNext(); return; }
    setIsSaving(true);
    try {
      // Create the routine in user_routines_bank
      const { data: newRoutine, error: routineError } = await supabase
        .from('user_routines_bank')
        .insert({
          user_id: user.id,
          title,
          emoji,
          color,
          is_active: true,
          is_user_created: true,
          category: null,
        } as any)
        .select('id, routine_id')
        .single();

      if (routineError) throw routineError;
      const routineId = (newRoutine as any).routine_id;

      // Get current max order index
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      const startOrder = (existingTasks?.[0]?.order_index ?? -1) + 1;

      const regularTasks = tasks.filter(t => !t.id.startsWith('__pro_task_routine_'));

      if (regularTasks.length > 0) {
        const userTasks = regularTasks.map((task: any, index: number) => ({
          user_id: user.id,
          title: task.title,
          emoji: task.emoji || '📝',
          color: task.color || ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length],
          repeat_pattern: task.repeat_pattern || 'daily',
          repeat_days: task.repeat_days || null,
          tag: title,
          time_period: task.time_period || null,
          linked_playlist_id: task.pro_link_type === 'playlist' ? task.pro_link_value : null,
          pro_link_type: task.pro_link_type || null,
          pro_link_value: task.pro_link_value || null,
          is_active: true,
          order_index: startOrder + index,
          goal_enabled: task.goal_enabled || false,
          goal_target: task.goal_target || null,
          goal_type: task.goal_type || null,
          goal_unit: task.goal_unit || null,
          duration_minutes: task.duration_minutes || null,
          source_routine_id: routineId,
        }));
        await supabase.from('user_tasks').insert(userTasks);
      }

      // Check for pro-task (routine launcher)
      const hasProTask = tasks.some(t => t.id.startsWith('__pro_task_routine_'));
      if (hasProTask) {
        await supabase.from('user_tasks').insert({
          user_id: user.id,
          title,
          emoji: '🎬',
          color: 'mint',
          repeat_pattern: 'daily',
          tag: title,
          pro_link_type: 'routine',
          pro_link_value: routineId,
          is_active: true,
          order_index: startOrder + regularTasks.length,
          source_routine_id: null,
        });
      }

      toast.success('Routine created! 🎉');
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    } catch (err) {
      console.error('Failed to create routine:', err);
      toast.error('Failed to create routine');
    } finally {
      setIsSaving(false);
    }
    onNext();
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Hero mascot header */}
      <div className="shrink-0 relative" style={{ height: 140 }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>

      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-y-auto overscroll-contain">
        <div className="px-5 pt-5 flex flex-col flex-1 min-h-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-[22px] font-extrabold text-foreground mb-1">Suggested Goals for You</h2>
            
            {/* Subtitle + Select All row */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-foreground">Select the Tasks you want to add</p>
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-primary px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 active:scale-95 transition-all shrink-0"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Grouped task cards */}
            <div className="space-y-5 flex-1">
              {groupedTasks.map((group, gi) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.1 }}
                >
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-base">{CATEGORY_EMOJI[group.category] || '📌'}</span>
                    <h3 className="text-[15px] font-bold text-foreground">
                      {CATEGORY_LABELS[group.category] || group.category}
                    </h3>
                    {gapCategories.includes(group.category) && (
                      <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>

                  {/* Tasks in this category */}
                  <div className="space-y-2">
                    {group.tasks.map((template, i) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gi * 0.1 + i * 0.05 }}
                      >
                        <TaskTemplateCard
                          template={template}
                          onAdd={() => handleToggleTask(template.id)}
                          isSelected={selectedTasks.has(template.id)}
                          selectable
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Spacer for fixed button */}
            <div className="h-24" />
          </motion.div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div
        className="fixed left-0 right-0 bottom-0 z-40 px-5 pb-5 pt-3 bg-gradient-to-t from-white via-white to-white/0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
      >
        {selectionCount > 0 ? (
          <button
            onClick={handleBuildRoutine}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <FluentEmoji emoji="✨" size={20} />
            Build My Routine ({selectionCount})
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-bold text-base active:scale-[0.98] transition-all"
          >
            Skip
          </button>
        )}
      </div>

      <RoutineBuilderSheet
        open={showBuilder}
        onOpenChange={setShowBuilder}
        onComplete={handleBuilderComplete}
        initialTitle="My Self-Care Routine"
        initialEmoji="✨"
        initialColor="mint"
        initialTasks={getBuilderTasks()}
      />
    </div>
  );
}
