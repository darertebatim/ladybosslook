import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { subDays, format } from 'date-fns';
import { OnboardingStep } from '@/types/onboarding';
import { mapTaskToCluster, CLUSTER_LABELS, CLUSTER_EMOJIS, ClusterType } from '@/utils/selfcare-scoring';
import weeklyReviewMascot from '@/assets/weekly-review-mascot-new.png';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

interface WeekStats {
  tasksCompleted: number;
  bestStreak: number;
  topHabit: string;
  topHabitEmoji: string;
  weeksCount: number;
  prevWeekTasks: number;
}

interface ClusterScore {
  completed: number;
  skipped: number;
  rate: number;
}

interface SkippedTaskInfo {
  id: string;
  title: string;
  emoji: string;
  tag: string | null;
  skipCount: number;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <>{display}{suffix}</>;
}

function ComparedBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const diff = previous > 0
    ? Math.round(((current - previous) / previous) * 100)
    : current > 0 ? 100 : 0;
  if (diff === 0) return null;

  const isUp = diff > 0;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold ${isUp ? 'text-green-600' : 'text-orange-500'}`}>
      {isUp ? '↑' : '↓'}{Math.abs(diff)}% vs last week
    </span>
  );
}

const CLUSTER_COLORS: Record<ClusterType, string> = {
  body: 'bg-green-100 text-green-700',
  mind: 'bg-blue-100 text-blue-700',
  environment: 'bg-amber-100 text-amber-700',
  people: 'bg-pink-100 text-pink-700',
};

export function WeekReportStep({ step, onNext, onAnswer }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeekStats>({
    tasksCompleted: 0,
    bestStreak: 0,
    topHabit: 'Getting started',
    topHabitEmoji: '🌟',
    weeksCount: 1,
    prevWeekTasks: 0,
  });
  const [clusterScores, setClusterScores] = useState<Record<ClusterType, ClusterScore>>({
    body: { completed: 0, skipped: 0, rate: 0 },
    mind: { completed: 0, skipped: 0, rate: 0 },
    environment: { completed: 0, skipped: 0, rate: 0 },
    people: { completed: 0, skipped: 0, rate: 0 },
  });
  const [weakestCluster, setWeakestCluster] = useState<ClusterType | null>(null);
  const [loaded, setLoaded] = useState(false);
  const answersStored = useRef(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    const fetchStats = async () => {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      const twoWeeksAgo = subDays(today, 14);
      const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');
      const twoWeeksAgoStr = format(twoWeeksAgo, 'yyyy-MM-dd');

      // Fetch completions, skips, and user tasks in parallel
      const [completionsRes, skipsRes, tasksRes, profileRes] = await Promise.all([
        supabase
          .from('task_completions')
          .select('task_id, completed_date')
          .eq('user_id', user.id)
          .gte('completed_date', twoWeeksAgoStr),
        supabase
          .from('task_skips')
          .select('task_id, skipped_date')
          .eq('user_id', user.id)
          .gte('skipped_date', weekAgoStr),
        supabase
          .from('user_tasks')
          .select('id, title, emoji, tag')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .single(),
      ]);

      const allCompletions = completionsRes.data || [];
      const skips = skipsRes.data || [];
      const userTasks = tasksRes.data || [];

      // Build tag lookup from user tasks
      const taskMap = new Map(userTasks.map(t => [t.id, t]));

      // Basic stats
      const completions = allCompletions.filter(c => c.completed_date >= weekAgoStr);
      const prevCompletions = allCompletions.filter(c => c.completed_date >= twoWeeksAgoStr && c.completed_date < weekAgoStr);
      const tasksCompleted = completions.length;
      const prevWeekTasks = prevCompletions.length;

      // Streak
      const datesSet = new Set(completions.map(c => c.completed_date));
      let bestStreak = 0;
      let currentStreak = 0;
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(today, 6 - i), 'yyyy-MM-dd');
        if (datesSet.has(d)) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      // Top habit
      const taskCounts: Record<string, number> = {};
      completions.forEach(c => { taskCounts[c.task_id] = (taskCounts[c.task_id] || 0) + 1; });
      const topTaskId = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      let topHabit = 'Getting started';
      let topHabitEmoji = '🌟';
      const topTask = topTaskId ? taskMap.get(topTaskId) : null;
      if (topTask) {
        topHabit = topTask.title;
        topHabitEmoji = topTask.emoji || '🌟';
      } else if (topTaskId) {
        const { data: task } = await supabase
          .from('user_tasks')
          .select('title, emoji')
          .eq('id', topTaskId)
          .single();
        if (task) { topHabit = task.title; topHabitEmoji = task.emoji; }
      }

      // Weeks count
      const weeksCount = profileRes.data
        ? Math.max(1, Math.floor((today.getTime() - new Date(profileRes.data.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))
        : 1;

      // Cluster scoring
      const scores: Record<ClusterType, ClusterScore> = {
        body: { completed: 0, skipped: 0, rate: 0 },
        mind: { completed: 0, skipped: 0, rate: 0 },
        environment: { completed: 0, skipped: 0, rate: 0 },
        people: { completed: 0, skipped: 0, rate: 0 },
      };

      completions.forEach(c => {
        const task = taskMap.get(c.task_id);
        const cluster = mapTaskToCluster(task?.tag);
        if (cluster) scores[cluster].completed++;
      });

      skips.forEach(s => {
        const task = taskMap.get(s.task_id);
        const cluster = mapTaskToCluster(task?.tag);
        if (cluster) scores[cluster].skipped++;
      });

      // Compute rates
      const activeClusters: ClusterType[] = [];
      for (const key of Object.keys(scores) as ClusterType[]) {
        const total = scores[key].completed + scores[key].skipped;
        scores[key].rate = total > 0 ? Math.round((scores[key].completed / total) * 100) : -1; // -1 = no data
        if (total > 0) activeClusters.push(key);
      }

      // Find weakest cluster (with data)
      let weakest: ClusterType | null = null;
      if (activeClusters.length > 0) {
        weakest = activeClusters.reduce((a, b) => scores[a].rate < scores[b].rate ? a : b);
      }

      // Skipped tasks (3+ skips)
      const skipCounts: Record<string, number> = {};
      skips.forEach(s => { skipCounts[s.task_id] = (skipCounts[s.task_id] || 0) + 1; });
      const frequentlySkipped: SkippedTaskInfo[] = Object.entries(skipCounts)
        .filter(([, count]) => count >= 3)
        .map(([taskId, count]) => {
          const task = taskMap.get(taskId);
          return {
            id: taskId,
            title: task?.title || 'Unknown',
            emoji: task?.emoji || '📋',
            tag: task?.tag || null,
            skipCount: count,
          };
        });

      setStats({ tasksCompleted, bestStreak, topHabit, topHabitEmoji, weeksCount, prevWeekTasks });
      setClusterScores(scores);
      setWeakestCluster(weakest);
      setLoaded(true);

      // Store data for downstream steps
      if (onAnswer && !answersStored.current) {
        answersStored.current = true;
        const weakClusters = activeClusters
          .filter(c => scores[c].rate < 60)
          .sort((a, b) => scores[a].rate - scores[b].rate);
        if (weakClusters.length > 0) {
          onAnswer('wr-weak-clusters', weakClusters);
        }
        if (frequentlySkipped.length > 0) {
          onAnswer('wr-skipped-tasks', JSON.stringify(frequentlySkipped));
        }
      }
    };
    fetchStats();
  }, [user, onAnswer]);

  const statCards = [
    { label: 'Tasks Done', displayValue: <AnimatedCounter value={stats.tasksCompleted} />, emoji: '✅', borderColor: 'border-primary/30', bgColor: 'bg-primary/5' },
    { label: 'Best Streak', displayValue: <><AnimatedCounter value={stats.bestStreak} /> days</>, emoji: '🔥', borderColor: 'border-secondary/40', bgColor: 'bg-secondary/10' },
    { label: 'Top Habit', displayValue: stats.topHabit, emoji: stats.topHabitEmoji, borderColor: 'border-accent/40', bgColor: 'bg-accent/10' },
  ];

  const activeClusterEntries = (Object.keys(clusterScores) as ClusterType[])
    .filter(c => clusterScores[c].rate >= 0);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Hero image — 35% height */}
      <div className="shrink-0 relative" style={{ height: '35%' }}>
        <img
          src={weeklyReviewMascot}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
        />
      </div>

      {/* Bottom sheet — 65% */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col">
        <div className="px-5 pt-5 pb-5 flex flex-col flex-1 overflow-y-auto overscroll-contain">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-2"
          >
            <h1 className="text-5xl font-extrabold text-foreground leading-tight">
              Hooray!
            </h1>
            <p className="text-lg font-bold text-foreground mt-1">
              It's been {stats.weeksCount} week{stats.weeksCount !== 1 ? 's' : ''}!
            </p>
            <p className="text-xs text-muted-foreground mt-1">Here's how your last 7 days went</p>
          </motion.div>

          {/* Compared badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-center mb-2"
          >
            <ComparedBadge current={stats.tasksCompleted} previous={stats.prevWeekTasks} />
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={loaded ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
                className={`flex flex-col items-center p-2.5 rounded-2xl border-2 ${card.borderColor} ${card.bgColor}`}
              >
                <p className="text-[9px] font-bold text-foreground mb-1">{card.label}</p>
                <FluentEmoji emoji={card.emoji} size={24} />
                <p className="text-sm font-extrabold text-foreground mt-1 truncate max-w-full text-center leading-tight">
                  {card.displayValue}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Cluster breakdown */}
          {activeClusterEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.35 }}
              className="mb-2"
            >
              <p className="text-[10px] font-bold text-muted-foreground text-center mb-1.5">Self-Care Balance</p>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {activeClusterEntries.map(cluster => (
                  <div
                    key={cluster}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${CLUSTER_COLORS[cluster]}`}
                  >
                    <span>{CLUSTER_EMOJIS[cluster]}</span>
                    <span>{CLUSTER_LABELS[cluster]}</span>
                    <span>{clusterScores[cluster].rate}%</span>
                  </div>
                ))}
              </div>
              {weakestCluster && clusterScores[weakestCluster].rate < 60 && (
                <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                  💡 Your <span className="font-bold">{CLUSTER_LABELS[weakestCluster]}</span> goals need a little love
                </p>
              )}
            </motion.div>
          )}

          {/* Button pinned at bottom */}
          <div className="mt-auto pt-2">
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              {step.buttonLabel || 'Continue'}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
