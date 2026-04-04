import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { subDays, format } from 'date-fns';
import { OnboardingStep } from '@/types/onboarding';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

interface WeekStats {
  tasksCompleted: number;
  bestStreak: number;
  topHabit: string;
  topHabitEmoji: string;
  weeksCount: number;
}

export function WeekReportStep({ step, onNext }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeekStats>({
    tasksCompleted: 0,
    bestStreak: 0,
    topHabit: 'Getting started',
    topHabitEmoji: '🌟',
    weeksCount: 1,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    const fetchStats = async () => {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');

      // Get completions for last 7 days
      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', weekAgoStr);

      const tasksCompleted = completions?.length || 0;

      // Calculate best streak (consecutive days with completions)
      const datesSet = new Set(completions?.map(c => c.completed_date) || []);
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

      // Find top habit (most completed task)
      const taskCounts: Record<string, number> = {};
      completions?.forEach(c => {
        taskCounts[c.task_id] = (taskCounts[c.task_id] || 0) + 1;
      });
      const topTaskId = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      let topHabit = 'Getting started';
      let topHabitEmoji = '🌟';
      if (topTaskId) {
        const { data: task } = await supabase
          .from('user_tasks')
          .select('title, emoji')
          .eq('id', topTaskId)
          .single();
        if (task) {
          topHabit = task.title;
          topHabitEmoji = task.emoji;
        }
      }

      // Weeks since signup
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();
      const weeksCount = profile
        ? Math.max(1, Math.floor((today.getTime() - new Date(profile.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))
        : 1;

      setStats({ tasksCompleted, bestStreak, topHabit, topHabitEmoji, weeksCount });
      setLoaded(true);
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: 'Tasks Done', value: String(stats.tasksCompleted), emoji: '✅' },
    { label: 'Best Streak', value: `${stats.bestStreak} days`, emoji: '🔥' },
    { label: 'Top Habit', value: stats.topHabit, emoji: stats.topHabitEmoji },
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto overscroll-contain">
      {/* Purple gradient hero */}
      <div className="shrink-0 bg-gradient-to-b from-purple-500 to-purple-400 px-6 pt-10 pb-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: 60 + i * 20, height: 60 + i * 20,
              top: `${10 + i * 15}%`, left: `${10 + i * 18}%`,
              opacity: 0.1 + i * 0.05,
            }} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <FluentEmoji emoji="🎉" size={56} />
          <h1 className="text-2xl font-extrabold text-white mt-3">
            Hooray! It's been {stats.weeksCount} week{stats.weeksCount !== 1 ? 's' : ''}!
          </h1>
          <p className="text-white/80 text-sm mt-1">Here's how your last 7 days went</p>
        </motion.div>
      </div>

      {/* Stat cards */}
      <div className="flex-1 px-5 pt-6 pb-6 flex flex-col">
        <div className="space-y-3 mb-8">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, x: -20 }}
              animate={loaded ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100"
            >
              <FluentEmoji emoji={card.emoji} size={32} />
              <div className="flex-1">
                <p className="text-xs text-purple-400 font-medium">{card.label}</p>
                <p className="text-base font-bold text-[#1a1f3d] truncate">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto">
          <button
            onClick={onNext}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
          >
            {step.buttonLabel || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
