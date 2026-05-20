import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { TaskTemplate, TaskColor } from '@/hooks/useTaskPlanner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { RoutinePreviewSheet, EditedTask, ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ProLinkType } from '@/lib/proTaskTypes';
import { AmbientGlow } from './visuals/AmbientGlow';
import {
  getOrCreateMyRilo,
  fetchMyRiloTaskTitles,
  getNextOrderIndex,
  MY_RILO_TITLE,
  MY_RILO_EMOJI,
} from '@/lib/myRilo';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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
  onAnswer?: (stepId: string, answer: string | string[]) => void;
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

export function SelfCareSuggestionsStep({ step, onNext, answers, onAnswer }: Props) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
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

    for (const cat of categoryOrder) {
      const catTasks = taskTemplates.filter(t => t.category === cat);
      if (catTasks.length > 0) {
        groups.push({ category: cat, tasks: catTasks });
        seen.add(cat);
      }
    }

    for (const t of taskTemplates) {
      if (!seen.has(t.category)) {
        const catTasks = taskTemplates.filter(tt => tt.category === t.category);
        groups.push({ category: t.category, tasks: catTasks });
        seen.add(t.category);
      }
    }

    return groups;
  }, [taskTemplates, gapCategories]);

  // Pre-select ALL suggested tasks on mount
  useEffect(() => {
    if (taskTemplates.length === 0) return;
    setSelectedTasks(new Set(taskTemplates.map(t => t.id)));
  }, [taskTemplates.length]);

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

  // Convert selected tasks to RoutinePlanTask format for the preview sheet
  const routineTasks: RoutinePlanTask[] = useMemo(() => {
    return taskTemplates
      .filter(t => selectedTasks.has(t.id))
      .map((t, i) => ({
        id: t.id,
        plan_id: 'synthetic-selfcare-quiz',
        title: t.title,
        icon: t.emoji,
        color: t.color || ROUTINE_COLOR_CYCLE[i % ROUTINE_COLOR_CYCLE.length],
        task_order: i,
        is_active: true,
        created_at: new Date().toISOString(),
        linked_playlist_id: t.linked_playlist_id || null,
        pro_link_type: (t.pro_link_type as ProLinkType) || null,
        pro_link_value: t.pro_link_value || null,
        // Use the task's own category from the task bank as its tag (like FAB-added tasks)
        tag: t.category || null,
        goal_enabled: t.goal_enabled || false,
        goal_type: t.goal_type || null,
        goal_target: t.goal_target || null,
        goal_unit: t.goal_unit || null,
      }));
  }, [taskTemplates, selectedTasks]);

  const handleBuildRoutine = () => {
    if (selectionCount === 0) return;
    setShowPreview(true);
  };

  const handleSave = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Append picks to the user's single "My Rilo" routine (create if missing).
      const routineId = await getOrCreateMyRilo(user.id);
      const existingTitles = await fetchMyRiloTaskTitles(user.id, routineId);
      const startOrder = await getNextOrderIndex(user.id);

      const editedById = new Map(editedTasks.map(t => [t.id, t]));
      const sourceById = new Map(routineTasks.map(t => [t.id, t]));

      const rows: any[] = [];
      let idx = 0;
      for (const id of selectedTaskIds) {
        const edited = editedById.get(id);
        const src = sourceById.get(id);
        const template = taskTemplates.find(t => t.id === id);
        const title = (edited?.title || src?.title || template?.title || '').trim();
        if (!title) continue;
        const key = title.toLowerCase();
        if (existingTitles.has(key)) continue; // dedupe
        existingTitles.add(key);

        const proLinkType =
          (edited?.pro_link_type as ProLinkType | null | undefined) ??
          src?.pro_link_type ??
          null;
        const proLinkValue =
          edited?.pro_link_value ?? src?.pro_link_value ?? null;

        rows.push({
          user_id: user.id,
          title,
          emoji: edited?.icon || src?.icon || template?.emoji || MY_RILO_EMOJI,
          color:
            edited?.color ||
            src?.color ||
            ROUTINE_COLOR_CYCLE[idx % ROUTINE_COLOR_CYCLE.length],
          repeat_pattern: edited?.repeatPattern || 'daily',
          repeat_days: null,
          scheduled_time: edited?.scheduledTime || null,
          time_period: template?.time_period || null,
          tag: proLinkType ? 'pro' : (edited?.tag ?? MY_RILO_TITLE),
          linked_playlist_id:
            proLinkType === 'playlist'
              ? (proLinkValue as string | null)
              : null,
          pro_link_type: proLinkType,
          pro_link_value: proLinkValue,
          is_active: true,
          order_index: startOrder + idx,
          source_routine_id: routineId,
        });
        idx++;
      }

      if (rows.length > 0) {
        const { error: insErr } = await supabase
          .from('user_tasks')
          .insert(rows);
        if (insErr) throw insErr;
      }

      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-tasks-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-task-ids'] });
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });

      toast.success(
        rows.length > 0
          ? `Added ${rows.length} to My Rilo 🔥`
          : 'Already in My Rilo',
      );
      // Persist the chosen tasks so the routine-reveal step can show them.
      try {
        const editedById = new Map(editedTasks.map(t => [t.id, t]));
        const finalTasks = selectedTaskIds.map(id => {
          const edited = editedById.get(id);
          const base = taskTemplates.find(t => t.id === id);
          return {
            id,
            title: edited?.title || base?.title || '',
            emoji: edited?.icon || base?.emoji || '✨',
            color: edited?.color || base?.color || 'mint',
          };
        });
        const payload = JSON.stringify({ tasks: finalTasks });
        onAnswer?.(step.id, payload);
        localStorage.setItem('simora_selfcare_revealed_tasks', payload);
      } catch {}
      setShowPreview(false);
      onNext();
    } catch (err) {
      console.error('Failed to add to My Rilo:', err);
      toast.error('Failed to add to My Rilo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      <AmbientGlow palette="rosé" />

      {/* Animated header visual */}
      <div className="shrink-0 relative z-10 pt-7 pb-2 flex justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#FFD49A] via-[#EC4899] to-[#8A5CF0] shadow-[0_14px_30px_-10px_rgba(236,72,153,0.55)] flex items-center justify-center"
        >
          <FluentEmoji emoji="🌿" size={44} />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10 flex flex-col overflow-y-auto overscroll-contain">
        <div className="px-5 pt-5 flex flex-col flex-1 min-h-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-[24px] font-extrabold text-[#1a1f3d] text-center mb-1">Suggested Goals for You</h2>
            
            {/* Subtitle + Select All row */}
            <div className="flex items-center justify-between mb-5 mt-2">
              <p className="text-sm font-semibold text-[#1a1f3d]/80">Select the Tasks you want to add</p>
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-[#B8590E] px-3 py-1.5 rounded-full border border-[#F08A3E]/30 bg-white/70 backdrop-blur active:scale-95 transition-all shrink-0"
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
                          hideSubtitle
                          lightUnselectedCircle
                          hideSelectedBorder
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
        className="fixed left-0 right-0 bottom-0 z-40 px-5 pb-5 pt-3 bg-gradient-to-t from-[#F0E6FF] via-[#F0E6FF]/85 to-transparent"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}
      >
        {selectionCount > 0 ? (
          <button
            onClick={handleBuildRoutine}
            className="w-full h-[56px] rounded-2xl text-white font-bold text-base active:opacity-80 transition-opacity flex items-center justify-center gap-2 bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)]"
          >
            <FluentEmoji emoji="✨" size={20} />
            Build My Routine ({selectionCount})
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full py-4 rounded-2xl bg-white/70 backdrop-blur text-[#1a1f3d]/60 font-bold text-base active:scale-[0.98] transition-all"
          >
            Skip
          </button>
        )}
      </div>

      <RoutinePreviewSheet
        open={showPreview}
        onOpenChange={setShowPreview}
        tasks={routineTasks}
        routineTitle={MY_RILO_TITLE}
        routineColor="pink"
        routineBankId="my-rilo"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
