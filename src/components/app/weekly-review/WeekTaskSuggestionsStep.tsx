import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { useAuth } from '@/hooks/useAuth';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProLinkType } from '@/lib/proTaskTypes';
import { mapTaskToCluster, CLUSTER_LABELS, ClusterType } from '@/utils/selfcare-scoring';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

interface TaskSuggestion {
  id: string;
  emoji: string;
  title: string;
  color: string;
  difficulty?: string;
  timeEstimate?: string;
  reason?: string;
  badge?: string;
  linked_playlist_id?: string | null;
  pro_link_type?: string | null;
  pro_link_value?: string | null;
}

function parseDifficulty(desc: string | null): { difficulty?: string; timeEstimate?: string } {
  if (!desc) return {};
  const parts = desc.split('·').map(s => s.trim());
  return {
    difficulty: parts[0] || undefined,
    timeEstimate: parts[1] || undefined,
  };
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-orange-100 text-orange-700',
};

const MAX_ACTIVE_TASKS_FOR_EXPANSION = 12;

export function WeekTaskSuggestionsStep({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  const addRoutinePlan = useAddRoutinePlan();
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Analyzing your answers...');
  const [revealedCount, setRevealedCount] = useState(0);
  const [showWhyIdx, setShowWhyIdx] = useState<number | null>(null);

  // Parse downstream data from previous steps
  const weakClusters = useMemo<ClusterType[]>(() => {
    const raw = answers?.['wr-weak-clusters'];
    if (Array.isArray(raw)) return raw as ClusterType[];
    return [];
  }, [answers]);

  const replaceTasks = useMemo<{ id: string; title: string; cluster: string; tag: string | null }[]>(() => {
    const raw = answers?.['wr-replace-tasks'];
    if (!raw || typeof raw !== 'string') return [];
    try { return JSON.parse(raw); } catch { return []; }
  }, [answers]);

  // Fetch weekly review tasks from the task bank
  const { data: wrTasks } = useQuery({
    queryKey: ['wr-task-bank'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_task_bank')
        .select('id, title, emoji, color, tag, category, description, duration_minutes, linked_playlist_id, pro_link_type, pro_link_value')
        .eq('is_active', true);
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Fetch user's active tasks to detect untouched clusters
  const { data: userActiveTasks } = useQuery({
    queryKey: ['user-active-tasks-clusters', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_tasks')
        .select('id, tag')
        .eq('user_id', user.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

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
    if (!wrTasks) return [];
    const tasks: TaskSuggestion[] = [];
    const seen = new Set<string>();

    const addTask = (match: typeof wrTasks[0], reason: string, badge?: string) => {
      if (seen.has(match.title)) return;
      const { difficulty, timeEstimate } = parseDifficulty(match.description);
      tasks.push({
        id: match.id,
        emoji: match.emoji,
        title: match.title,
        color: match.color,
        difficulty,
        timeEstimate,
        reason,
        badge,
        linked_playlist_id: match.linked_playlist_id,
        pro_link_type: match.pro_link_type,
        pro_link_value: match.pro_link_value,
      });
      seen.add(match.title);
    };

    // Map selfcare-wins option labels → clusters for category-based matching
    const WINS_CLUSTER_MAP: Record<string, ClusterType> = {
      'Slept well': 'body', 'Moved my body': 'body', 'Ate nourishing food': 'body',
      'Spent time in nature': 'body', 'Drank enough water': 'body',
      'Practiced mindfulness': 'mind', 'Took breaks when needed': 'mind',
      'Journaled or reflected': 'mind', 'Felt grateful': 'mind',
      'Kept my space tidy': 'environment', 'Had an evening routine': 'environment',
      'Stayed organized': 'environment', 'Took care of hygiene': 'environment',
      'Connected with someone': 'people', 'Quality time with loved ones': 'people',
      'Was kind to myself': 'people',
    };

    const STRUGGLED_CLUSTER_MAP: Record<string, ClusterType> = {
      'Sleep & rest': 'body', 'Exercise or movement': 'body', 'Eating well': 'body',
      'Quieting my mind': 'mind', 'Being present': 'mind', 'Managing stress': 'mind',
      'Keeping things tidy': 'environment', 'Sticking to routines': 'environment',
      'Evening wind-down': 'environment',
      'Staying connected': 'people', 'Being kind to myself': 'people',
      'Making time for others': 'people',
    };

    // 1a. Legacy wr-felt-good / wr-focus tag matches (old flow compat)
    const feltGood = answers?.['wr-felt-good'];
    if (Array.isArray(feltGood)) {
      feltGood.forEach(answer => {
        const match = wrTasks.find(t => t.tag === `wr-felt-good:${answer}`);
        if (match) addTask(match, `You felt good about ${answer}`);
      });
    }

    const focusNext = answers?.['wr-focus-next'];
    if (Array.isArray(focusNext)) {
      focusNext.forEach(answer => {
        const match = wrTasks.find(t => t.tag === `wr-focus:${answer}`);
        if (match) addTask(match, `You want to ${answer}`);
      });
    }

    // 1b. New selfcare flow: use selfcare-wins to find tasks from winning clusters
    const selfcareWins = answers?.['wr-selfcare-wins'];
    if (Array.isArray(selfcareWins) && tasks.length < 3) {
      const winClusters = new Set(selfcareWins.map(w => WINS_CLUSTER_MAP[w]).filter(Boolean));
      for (const cluster of winClusters) {
        if (tasks.length >= 3) break;
        const match = wrTasks.find(t => {
          const tc = mapTaskToCluster(t.category);
          return tc === cluster && !seen.has(t.title);
        });
        if (match) addTask(match, `Keep building on your ${CLUSTER_LABELS[cluster]} wins`, 'Keep going');
      }
    }

    // 1c. New selfcare flow: use struggled areas to suggest help
    const struggled = answers?.['wr-struggled'];
    if (Array.isArray(struggled) && tasks.length < 4) {
      const struggleClusters = new Set(struggled.map(s => STRUGGLED_CLUSTER_MAP[s]).filter(Boolean));
      for (const cluster of struggleClusters) {
        if (tasks.length >= 4) break;
        const match = wrTasks.find(t => {
          const tc = mapTaskToCluster(t.category);
          return tc === cluster && !seen.has(t.title);
        });
        if (match) addTask(match, `This can help with ${CLUSTER_LABELS[cluster]} care`, 'Recommended');
      }
    }

    // 2. Gap-based: tasks from weak clusters
    if (weakClusters.length > 0 && tasks.length < 4) {
      // Get categories that map to the weak clusters
      const gapTasks = wrTasks.filter(t => {
        const cluster = mapTaskToCluster(t.category);
        return cluster && weakClusters.includes(cluster) && !t.tag?.startsWith('wr-');
      });
      // Pick up to 2 gap tasks
      for (const match of gapTasks.slice(0, 2)) {
        if (tasks.length >= 4) break;
        const cluster = mapTaskToCluster(match.category);
        const label = cluster ? CLUSTER_LABELS[cluster] : 'this area';
        addTask(match, `Your ${label} goals need attention`, 'Recommended');
      }
    }

    // 3. Replacement suggestions
    if (replaceTasks.length > 0 && tasks.length < 5) {
      for (const rt of replaceTasks) {
        if (tasks.length >= 5) break;
        const alternatives = wrTasks.filter(t => {
          const cluster = mapTaskToCluster(t.category);
          return cluster === rt.cluster && !seen.has(t.title) && t.id !== rt.id;
        });
        if (alternatives.length > 0) {
          addTask(alternatives[0], `Try this instead of "${rt.title}"`, 'Alternative');
        }
      }
    }

    // 4. Expansion: 1 task from untouched cluster
    if (userActiveTasks && userActiveTasks.length < MAX_ACTIVE_TASKS_FOR_EXPANSION && tasks.length < 5) {
      const coveredClusters = new Set<string>();
      userActiveTasks.forEach(t => {
        const c = mapTaskToCluster(t.tag);
        if (c) coveredClusters.add(c);
      });

      const allClusters: ClusterType[] = ['body', 'mind', 'environment', 'people'];
      const untouched = allClusters.filter(c => !coveredClusters.has(c));

      if (untouched.length > 0) {
        const targetCluster = untouched[0];
        const expansionTask = wrTasks.find(t => {
          const cluster = mapTaskToCluster(t.category);
          return cluster === targetCluster && !seen.has(t.title);
        });
        if (expansionTask) {
          addTask(
            expansionTask,
            `Expand into ${CLUSTER_LABELS[targetCluster]} care`,
            '✨ New area'
          );
        }
      }
    }

    // 5. Fallback defaults
    if (tasks.length === 0) {
      const defaults = wrTasks.filter(t => t.tag === 'wr-default');
      defaults.forEach(match => {
        const { difficulty, timeEstimate } = parseDifficulty(match.description);
        tasks.push({
          id: match.id,
          emoji: match.emoji,
          title: match.title,
          color: match.color,
          difficulty,
          timeEstimate,
          linked_playlist_id: match.linked_playlist_id,
          pro_link_type: match.pro_link_type,
          pro_link_value: match.pro_link_value,
        });
      });
    }

    return tasks.slice(0, 5);
  }, [answers, wrTasks, weakClusters, replaceTasks, userActiveTasks]);

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
      id: task.id,
      plan_id: 'synthetic-weekly-review',
      title: task.title,
      icon: task.emoji,
      color: task.color,
      task_order: i,
      is_active: true,
      created_at: new Date().toISOString(),
      linked_playlist_id: task.linked_playlist_id || null,
      pro_link_type: (task.pro_link_type as ProLinkType) || null,
      pro_link_value: task.pro_link_value || null,
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
          <p className="text-sm text-muted-foreground mt-2">✨ Based on your self-care balance</p>
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

        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
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
                    {task.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {task.badge}
                      </span>
                    )}
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
