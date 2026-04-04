import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { useAuth } from '@/hooks/useAuth';
import { RoutinePreviewSheet, EditedTask, ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';
import { TaskColor } from '@/hooks/useTaskPlanner';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

interface TaskSuggestion {
  emoji: string;
  title: string;
  color: string;
}

// Mapping from "felt good about" (Step 3) → reinforcement tasks
const feltGoodMapping: Record<string, TaskSuggestion> = {
  'Sleep': { emoji: '😴', title: 'Wind-down routine at 10pm', color: 'lavender' },
  'Nutrition': { emoji: '🥗', title: 'Eat a home-cooked meal', color: 'mint' },
  'Learning': { emoji: '📚', title: 'Read for 15 minutes', color: 'yellow' },
  'Physical activities': { emoji: '🏃', title: '30-min workout', color: 'peach' },
  'Mindfulness': { emoji: '🧘', title: '5-min morning meditation', color: 'lavender' },
  'Relaxation': { emoji: '🛀', title: 'Take a relaxing bath', color: 'sky' },
  'Nature': { emoji: '🌿', title: '20-min nature walk', color: 'mint' },
  'Work': { emoji: '💼', title: 'Plan top 3 priorities', color: 'sky' },
  'Family': { emoji: '👨‍👩‍👧', title: 'Quality family time', color: 'pink' },
  'Friends': { emoji: '🤝', title: 'Reach out to a friend', color: 'peach' },
};

// Mapping from "focus on next week" (Step 4) → growth tasks
const focusMapping: Record<string, TaskSuggestion> = {
  'Sleep better': { emoji: '🌙', title: 'No screens after 9pm', color: 'lavender' },
  'Eat healthier': { emoji: '🥑', title: 'Meal prep Sunday', color: 'mint' },
  'Be more active': { emoji: '💪', title: 'Walk 10,000 steps', color: 'peach' },
  'Be present': { emoji: '🧠', title: 'Practice mindful breathing', color: 'lavender' },
  'Stay calm': { emoji: '🕊️', title: 'Breathing exercise 2x daily', color: 'sky' },
  'Be kind to self': { emoji: '💚', title: "Write 3 things I'm proud of", color: 'mint' },
  'Be organized': { emoji: '📋', title: 'Plan tomorrow before bed', color: 'yellow' },
  'Get things done': { emoji: '🎯', title: 'Complete top priority first', color: 'peach' },
  'Find joy': { emoji: '🌈', title: 'Do something fun for 30 min', color: 'pink' },
  'Feel more connected': { emoji: '💕', title: 'Send a kind message', color: 'pink' },
};

const defaultTasks: TaskSuggestion[] = [
  { emoji: '🌅', title: 'Morning stretch routine', color: 'yellow' },
  { emoji: '💧', title: 'Drink 8 glasses of water', color: 'sky' },
  { emoji: '📖', title: 'Read for 15 minutes', color: 'lavender' },
];

export function WeekTaskSuggestionsStep({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  const addRoutinePlan = useAddRoutinePlan();
  const [showPreview, setShowPreview] = useState(false);

  const suggestions = useMemo(() => {
    const tasks: TaskSuggestion[] = [];
    const seen = new Set<string>();

    const feltGood = answers?.['wr-felt-good'];
    if (Array.isArray(feltGood)) {
      feltGood.forEach(answer => {
        const task = feltGoodMapping[answer];
        if (task && !seen.has(task.title)) {
          tasks.push(task);
          seen.add(task.title);
        }
      });
    }

    const focusNext = answers?.['wr-focus-next'];
    if (Array.isArray(focusNext)) {
      focusNext.forEach(answer => {
        const task = focusMapping[answer];
        if (task && !seen.has(task.title)) {
          tasks.push(task);
          seen.add(task.title);
        }
      });
    }

    if (tasks.length === 0) return defaultTasks;
    return tasks.slice(0, 4);
  }, [answers]);

  // Convert suggestions to RoutinePlanTask format for RoutinePreviewSheet
  const routineTasks: RoutinePlanTask[] = useMemo(() => {
    return suggestions.map((task, i) => ({
      id: `wr-suggestion-${i}`,
      plan_id: 'weekly-review',
      title: task.title,
      icon: task.emoji,
      color: task.color as TaskColor,
      task_order: i,
      repeat_pattern: 'daily' as const,
      is_enabled: true,
    }));
  }, [suggestions]);

  const handleSave = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!user) return;
    try {
      await addRoutinePlan.mutateAsync({
        title: 'Weekly Goals',
        emoji: '🎯',
        color: 'lavender',
        tasks: selectedTaskIds.map((id, idx) => {
          const edited = editedTasks.find(t => t.id === id);
          const original = routineTasks.find(t => t.id === id);
          return {
            title: edited?.title || original?.title || '',
            icon: edited?.icon || original?.icon || '✨',
            color: (edited?.color || original?.color || ROUTINE_COLOR_CYCLE[idx % ROUTINE_COLOR_CYCLE.length]) as TaskColor,
            task_order: idx,
            repeat_pattern: edited?.repeatPattern || 'daily',
            is_enabled: true,
          };
        }),
      });
      toast.success('Routine added to your planner!');
      setShowPreview(false);
      onNext();
    } catch (err) {
      console.error('Failed to save routine:', err);
      toast.error('Failed to save routine');
    }
  };

  const pastelColors = ['bg-purple-50', 'bg-green-50', 'bg-orange-50', 'bg-blue-50'];

  return (
    <div className="h-full bg-white overflow-y-auto overscroll-contain">
      <div className="flex flex-col h-full px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
          {step.subtitle && <p className="text-sm text-gray-500 text-center mb-6">{step.subtitle}</p>}
        </motion.div>

        <div className="space-y-3 mb-8">
          {suggestions.map((task, i) => (
            <motion.div
              key={task.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-purple-200 ${pastelColors[i % pastelColors.length]}`}
            >
              <FluentEmoji emoji={task.emoji} size={28} />
              <span className="flex-1 text-sm font-semibold text-[#1a1f3d]">{task.title}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={() => setShowPreview(true)}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
          >
            {step.buttonLabel || 'Add to My Routines'}
          </button>
          <button
            onClick={onNext}
            className="w-full py-3 text-sm text-gray-500 font-medium active:opacity-60"
          >
            {step.secondaryButtonLabel || 'Skip'}
          </button>
        </div>
      </div>

      <RoutinePreviewSheet
        open={showPreview}
        onOpenChange={setShowPreview}
        tasks={routineTasks}
        routineTitle="Weekly Goals"
        routineColor="lavender"
        onSave={handleSave}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}
