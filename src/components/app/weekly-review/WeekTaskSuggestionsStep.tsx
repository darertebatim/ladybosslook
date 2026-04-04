import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { useAuth } from '@/hooks/useAuth';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

interface TaskSuggestion {
  emoji: string;
  title: string;
  color: string;
  difficulty?: string;
  timeEstimate?: string;
  reason?: string;
}

const feltGoodMapping: Record<string, TaskSuggestion> = {
  'Sleep': { emoji: '😴', title: 'Wind-down routine at 10pm', color: 'lavender', difficulty: 'Easy', timeEstimate: '10 min', reason: 'You felt good about Sleep' },
  'Nutrition': { emoji: '🥗', title: 'Eat a home-cooked meal', color: 'mint', difficulty: 'Medium', timeEstimate: '30 min', reason: 'You felt good about Nutrition' },
  'Learning': { emoji: '📚', title: 'Read for 15 minutes', color: 'yellow', difficulty: 'Easy', timeEstimate: '15 min', reason: 'You felt good about Learning' },
  'Physical activities': { emoji: '🏃', title: '30-min workout', color: 'peach', difficulty: 'Medium', timeEstimate: '30 min', reason: 'You felt good about Physical activities' },
  'Mindfulness': { emoji: '🧘', title: '5-min morning meditation', color: 'lavender', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You felt good about Mindfulness' },
  'Relaxation': { emoji: '🛀', title: 'Take a relaxing bath', color: 'sky', difficulty: 'Easy', timeEstimate: '20 min', reason: 'You felt good about Relaxation' },
  'Nature': { emoji: '🌿', title: '20-min nature walk', color: 'mint', difficulty: 'Easy', timeEstimate: '20 min', reason: 'You felt good about Nature' },
  'School': { emoji: '🎓', title: 'Review notes for 20 min', color: 'sky', difficulty: 'Medium', timeEstimate: '20 min', reason: 'You felt good about School' },
  'Work': { emoji: '💼', title: 'Plan top 3 priorities', color: 'sky', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You felt good about Work' },
  'Family': { emoji: '👨‍👩‍👧', title: 'Quality family time', color: 'pink', difficulty: 'Easy', timeEstimate: '30 min', reason: 'You felt good about Family' },
  'Friends': { emoji: '🤝', title: 'Reach out to a friend', color: 'peach', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You felt good about Friends' },
  'Partner': { emoji: '💑', title: 'Plan a date night', color: 'pink', difficulty: 'Easy', timeEstimate: '10 min', reason: 'You felt good about Partner' },
  'Pet': { emoji: '🐾', title: 'Extra playtime with pet', color: 'yellow', difficulty: 'Easy', timeEstimate: '15 min', reason: 'You felt good about Pet' },
  'Community': { emoji: '🏘️', title: 'Join a local event', color: 'mint', difficulty: 'Medium', timeEstimate: '1 hr', reason: 'You felt good about Community' },
  'Productivity': { emoji: '⚡', title: 'Time-block your day', color: 'peach', difficulty: 'Easy', timeEstimate: '10 min', reason: 'You felt good about Productivity' },
  'Achievement': { emoji: '🏆', title: 'Celebrate a small win', color: 'yellow', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You felt good about Achievement' },
  'Hobbies': { emoji: '🎨', title: 'Spend 30 min on a hobby', color: 'lavender', difficulty: 'Easy', timeEstimate: '30 min', reason: 'You felt good about Hobbies' },
  'Creativity': { emoji: '✏️', title: 'Try something creative', color: 'pink', difficulty: 'Easy', timeEstimate: '20 min', reason: 'You felt good about Creativity' },
};

const focusMapping: Record<string, TaskSuggestion> = {
  'Sleep better': { emoji: '🌙', title: 'No screens after 9pm', color: 'lavender', difficulty: 'Medium', timeEstimate: 'Daily', reason: 'You want to Sleep better' },
  'Eat healthier': { emoji: '🥑', title: 'Meal prep Sunday', color: 'mint', difficulty: 'Medium', timeEstimate: '1 hr', reason: 'You want to Eat healthier' },
  'Be more active': { emoji: '💪', title: 'Walk 10,000 steps', color: 'peach', difficulty: 'Medium', timeEstimate: 'Daily', reason: 'You want to Be more active' },
  'Be present': { emoji: '🧠', title: 'Practice mindful breathing', color: 'lavender', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You want to Be present' },
  'Stay calm': { emoji: '🕊️', title: 'Breathing exercise 2x daily', color: 'sky', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You want to Stay calm' },
  'Be kind to self': { emoji: '💚', title: "Write 3 things I'm proud of", color: 'mint', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You want to Be kind to self' },
  'Be organized': { emoji: '📋', title: 'Plan tomorrow before bed', color: 'yellow', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You want to Be organized' },
  'Get things done': { emoji: '🎯', title: 'Complete top priority first', color: 'peach', difficulty: 'Medium', timeEstimate: 'Daily', reason: 'You want to Get things done' },
  'Find joy': { emoji: '🌈', title: 'Do something fun for 30 min', color: 'pink', difficulty: 'Easy', timeEstimate: '30 min', reason: 'You want to Find joy' },
  'Feel more connected': { emoji: '💕', title: 'Send a kind message', color: 'pink', difficulty: 'Easy', timeEstimate: '5 min', reason: 'You want to Feel more connected' },
};

const defaultTasks: TaskSuggestion[] = [
  { emoji: '🌅', title: 'Morning stretch routine', color: 'yellow', difficulty: 'Easy', timeEstimate: '10 min' },
  { emoji: '💧', title: 'Drink 8 glasses of water', color: 'sky', difficulty: 'Easy', timeEstimate: 'Daily' },
  { emoji: '📖', title: 'Read for 15 minutes', color: 'lavender', difficulty: 'Easy', timeEstimate: '15 min' },
];

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-orange-100 text-orange-700',
};

export function WeekTaskSuggestionsStep({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  const addRoutinePlan = useAddRoutinePlan();
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Analyzing your answers...');
  const [revealedCount, setRevealedCount] = useState(0);
  const [showWhyIdx, setShowWhyIdx] = useState<number | null>(null);

  useEffect(() => {
    const texts = [
      'Analyzing your answers...',
      'Finding the best goals for you...',
      'Personalizing your suggestions...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < texts.length) {
        setLoadingText(texts[i]);
      } else {
        clearInterval(interval);
        setLoading(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (loading) return;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setRevealedCount(count);
      if (count >= suggestions.length) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [loading, suggestions.length]);

  const routineTasks: RoutinePlanTask[] = useMemo(() => {
    return suggestions.map((task, i) => ({
      id: `wr-suggestion-${i}`,
      plan_id: 'synthetic-weekly-review',
      title: task.title,
      icon: task.emoji,
      color: task.color,
      task_order: i,
      is_active: true,
      created_at: new Date().toISOString(),
      linked_playlist_id: null,
      pro_link_type: null,
      pro_link_value: null,
    }));
  }, [suggestions]);

  const handleSave = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!user) return;
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-weekly-review',
        selectedTaskIds,
        editedTasks: editedTasks.map(t => ({
          id: t.id,
          title: t.title,
          icon: t.icon,
          color: t.color,
          repeatPattern: t.repeatPattern,
          scheduledTime: t.scheduledTime,
          tag: t.tag,
          linked_playlist_id: t.linked_playlist_id,
          pro_link_type: t.pro_link_type,
          pro_link_value: t.pro_link_value,
        })),
        syntheticTasks: routineTasks,
      });
      toast.success('Routine added to your planner!');
      setShowPreview(false);
      onNext();
    } catch (err) {
      console.error('Failed to save routine:', err);
      toast.error('Failed to save routine');
    }
  };

  const pastelColors = ['bg-primary/5', 'bg-accent/10', 'bg-secondary/10', 'bg-primary/8'];

  if (loading) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
          <motion.p
            key={loadingText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base font-semibold text-foreground text-center"
          >
            {loadingText}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-2">✨ Based on your weekly review</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex flex-col flex-1 px-5 pt-8 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-xl font-extrabold text-foreground text-center mb-1">{step.title}</h1>
          {step.subtitle && <p className="text-xs text-muted-foreground text-center mb-4">{step.subtitle}</p>}
        </motion.div>

        <div className="space-y-2 flex-1 min-h-0">
          <AnimatePresence>
            {suggestions.map((task, i) => (
              i < revealedCount && (
                <motion.div
                  key={task.title}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`p-3 rounded-2xl border-2 border-primary/20 ${pastelColors[i % pastelColors.length]}`}
                >
                  <div className="flex items-center gap-3">
                    <FluentEmoji emoji={task.emoji} size={24} />
                    <span className="flex-1 text-sm font-semibold text-foreground">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 ml-9">
                    {task.timeEstimate && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        ⏱ {task.timeEstimate}
                      </span>
                    )}
                    {task.difficulty && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColors[task.difficulty] || ''}`}>
                        {task.difficulty}
                      </span>
                    )}
                    {task.reason && (
                      <button
                        onClick={() => setShowWhyIdx(showWhyIdx === i ? null : i)}
                        className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full active:opacity-60"
                      >
                        Why this?
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {showWhyIdx === i && task.reason && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-primary mt-1.5 ml-9"
                      >
                        💡 {task.reason}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-auto space-y-2 pt-2">
          <button
            onClick={() => setShowPreview(true)}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-all"
          >
            {step.buttonLabel || 'Add to My Routines'}
          </button>
          <button
            onClick={onNext}
            className="w-full py-2 text-sm text-muted-foreground font-medium active:opacity-60"
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
