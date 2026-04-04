import { useEffect, useState, useRef } from 'react';
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
  prevWeekTasks: number;
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

export function WeekReportStep({ step, onNext }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeekStats>({
    tasksCompleted: 0,
    bestStreak: 0,
    topHabit: 'Getting started',
    topHabitEmoji: '🌟',
    weeksCount: 1,
    prevWeekTasks: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    const fetchStats = async () => {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      const twoWeeksAgo = subDays(today, 14);
      const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');
      const twoWeeksAgoStr = format(twoWeeksAgo, 'yyyy-MM-dd');

      const { data: allCompletions } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', twoWeeksAgoStr);

      const completions = allCompletions?.filter(c => c.completed_date >= weekAgoStr) || [];
      const prevCompletions = allCompletions?.filter(c => c.completed_date >= twoWeeksAgoStr && c.completed_date < weekAgoStr) || [];

      const tasksCompleted = completions.length;
      const prevWeekTasks = prevCompletions.length;

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

      const taskCounts: Record<string, number> = {};
      completions.forEach(c => {
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

      setStats({ tasksCompleted, bestStreak, topHabit, topHabitEmoji, weeksCount, prevWeekTasks });
      setLoaded(true);
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: 'Tasks Done', displayValue: <AnimatedCounter value={stats.tasksCompleted} />, emoji: '✅', borderColor: 'border-primary/30', bgColor: 'bg-primary/5' },
    { label: 'Best Streak', displayValue: <><AnimatedCounter value={stats.bestStreak} /> days</>, emoji: '🔥', borderColor: 'border-secondary/40', bgColor: 'bg-secondary/10' },
    { label: 'Top Habit', displayValue: stats.topHabit, emoji: stats.topHabitEmoji, borderColor: 'border-accent/40', bgColor: 'bg-accent/10' },
  ];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Hero image — 40% height */}
      <div className="shrink-0 relative" style={{ height: '40%' }}>
        <img
          src={weeklyReviewMascot}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
        />
      </div>

      {/* Bottom sheet — 60% */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col">
        <div className="px-5 pt-6 pb-5 flex flex-col flex-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-3"
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
            className="text-center mb-3"
          >
            <ComparedBadge current={stats.tasksCompleted} previous={stats.prevWeekTasks} />
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
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

          {/* Button pinned at bottom */}
          <div className="mt-auto">
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
