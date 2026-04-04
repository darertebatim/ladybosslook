import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
  'Sleep': { emoji: '😴', title: 'Wind-down routine at 10pm', color: '#6366f1' },
  'Nutrition': { emoji: '🥗', title: 'Eat a home-cooked meal', color: '#22c55e' },
  'Learning': { emoji: '📚', title: 'Read for 15 minutes', color: '#f59e0b' },
  'Physical activities': { emoji: '🏃', title: '30-min workout', color: '#ef4444' },
  'Mindfulness': { emoji: '🧘', title: '5-min morning meditation', color: '#8b5cf6' },
  'Relaxation': { emoji: '🛀', title: 'Take a relaxing bath', color: '#06b6d4' },
  'Nature': { emoji: '🌿', title: '20-min nature walk', color: '#10b981' },
  'Work': { emoji: '💼', title: 'Plan top 3 priorities', color: '#6366f1' },
  'Family': { emoji: '👨‍👩‍👧', title: 'Quality family time', color: '#ec4899' },
  'Friends': { emoji: '🤝', title: 'Reach out to a friend', color: '#f97316' },
};

// Mapping from "focus on next week" (Step 4) → growth tasks
const focusMapping: Record<string, TaskSuggestion> = {
  'Sleep better': { emoji: '🌙', title: 'No screens after 9pm', color: '#6366f1' },
  'Eat healthier': { emoji: '🥑', title: 'Meal prep Sunday', color: '#22c55e' },
  'Be more active': { emoji: '💪', title: 'Walk 10,000 steps', color: '#ef4444' },
  'Be present': { emoji: '🧠', title: 'Practice mindful breathing', color: '#8b5cf6' },
  'Stay calm': { emoji: '🕊️', title: 'Breathing exercise 2x daily', color: '#06b6d4' },
  'Be kind to self': { emoji: '💚', title: 'Write 3 things I\'m proud of', color: '#10b981' },
  'Be organized': { emoji: '📋', title: 'Plan tomorrow before bed', color: '#f59e0b' },
  'Get things done': { emoji: '🎯', title: 'Complete top priority first', color: '#f97316' },
  'Find joy': { emoji: '🌈', title: 'Do something fun for 30 min', color: '#ec4899' },
  'Feel more connected': { emoji: '💕', title: 'Send a kind message', color: '#f43f5e' },
};

const defaultTasks: TaskSuggestion[] = [
  { emoji: '🌅', title: 'Morning stretch routine', color: '#f59e0b' },
  { emoji: '💧', title: 'Drink 8 glasses of water', color: '#06b6d4' },
  { emoji: '📖', title: 'Read for 15 minutes', color: '#8b5cf6' },
];

export function WeekTaskSuggestionsStep({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const suggestions = useMemo(() => {
    const tasks: TaskSuggestion[] = [];
    const seen = new Set<string>();

    // Collect from felt-good answers (reinforcement)
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

    // Collect from focus answers (growth) — prioritize these
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

    // If no answers, use defaults
    if (tasks.length === 0) return defaultTasks;

    // Return top 4
    return tasks.slice(0, 4);
  }, [answers]);

  const [checked, setChecked] = useState<Set<number>>(() => new Set(suggestions.map((_, i) => i)));
  const [adding, setAdding] = useState(false);

  const toggleTask = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!user || checked.size === 0) { onNext(); return; }
    setAdding(true);
    try {
      const tasksToAdd = Array.from(checked).map(i => suggestions[i]);
      const inserts = tasksToAdd.map((t, idx) => ({
        user_id: user.id,
        title: t.title,
        emoji: t.emoji,
        color: t.color,
        repeat_pattern: 'daily' as const,
        order_index: 100 + idx,
        is_active: true,
      }));

      const { error } = await supabase.from('user_tasks').insert(inserts);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast.success(`Added ${tasksToAdd.length} tasks to your planner!`);
    } catch (err) {
      console.error('Failed to add tasks:', err);
      toast.error('Failed to add tasks');
    } finally {
      setAdding(false);
      onNext();
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
            <motion.button
              key={task.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              onClick={() => toggleTask(i)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                checked.has(i)
                  ? 'border-purple-300 ' + pastelColors[i % pastelColors.length]
                  : 'border-gray-200 bg-white opacity-60'
              }`}
            >
              <FluentEmoji emoji={task.emoji} size={28} />
              <span className="flex-1 text-sm font-semibold text-[#1a1f3d]">{task.title}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                checked.has(i) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
              }`}>
                {checked.has(i) && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {adding ? 'Adding...' : step.buttonLabel || 'Add to My Planner'}
          </button>
          <button
            onClick={onNext}
            className="w-full py-3 text-sm text-gray-500 font-medium active:opacity-60"
          >
            {step.secondaryButtonLabel || 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
