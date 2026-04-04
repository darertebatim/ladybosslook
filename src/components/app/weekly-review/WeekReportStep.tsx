import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { subDays, format } from 'date-fns';
import { OnboardingStep } from '@/types/onboarding';
import weeklyReviewMascot from '@/assets/weekly-review-mascot-new.png';

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

      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', weekAgoStr);

      const tasksCompleted = completions?.length || 0;

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
    { label: 'Tasks Done', value: String(stats.tasksCompleted), emoji: '✅', borderColor: 'border-blue-300', bgColor: 'bg-blue-50' },
    { label: 'Best Streak', value: `${stats.bestStreak} days`, emoji: '🔥', borderColor: 'border-orange-300', bgColor: 'bg-orange-50' },
    { label: 'Top Habit', value: stats.topHabit, emoji: stats.topHabitEmoji, borderColor: 'border-purple-300', bgColor: 'bg-purple-50' },
  ];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Hero image area */}
      <div className="shrink-0 relative" style={{ height: 260 }}>
        <img
          src={weeklyReviewMascot}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
        />
      </div>

      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 overflow-y-auto">
        <div className="px-5 pt-7 pb-6 flex flex-col min-h-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-extrabold text-[#1a1f3d] leading-snug">
              Hooray!{'\n'}It's been {stats.weeksCount} week{stats.weeksCount !== 1 ? 's' : ''}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">Here's how your last 7 days went</p>
          </motion.div>

          {/* Stat cards in a row like me+ */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={loaded ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 ${card.borderColor} ${card.bgColor}`}
              >
                <p className="text-[10px] font-bold text-[#1a1f3d] mb-1.5">{card.label}</p>
                <FluentEmoji emoji={card.emoji} size={28} />
                <p className="text-lg font-extrabold text-[#1a1f3d] mt-1 truncate max-w-full text-center leading-tight">
                  {card.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto">
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
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
