import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { TaskTemplate, TaskColor } from '@/hooks/useTaskPlanner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { RoutineBuilderSheet, BuilderTask } from '@/components/app/RoutineBuilderSheet';
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

export function SelfCareSuggestionsStep({ step, onNext, answers }: Props) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBuilder, setShowBuilder] = useState(false);

  const diagnosisData = useMemo(() => {
    try {
      const raw = answers?.['sc-diagnosis-data'];
      if (typeof raw === 'string') return JSON.parse(raw);
    } catch {}
    return { suggested_tasks: [], gap_categories: [] };
  }, [answers]);

  const suggestedTasks: SuggestedTask[] = diagnosisData.suggested_tasks || [];

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

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectionCount = selectedTasks.size;

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

  const handleBuilderComplete = (_title: string, _emoji: string, _color: string, _tasks: BuilderTask[]) => {
    setShowBuilder(false);
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
            <p className="text-sm font-semibold text-foreground mb-5">Select the Tasks you want to add to your routine</p>

            {/* Task cards */}
            <div className="space-y-2.5 flex-1">
              {taskTemplates.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
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
