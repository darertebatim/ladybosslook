import { useNavigate } from 'react-router-dom';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}

export function WeeklyReviewBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;
  const year = now.getFullYear();
  const week = getWeekNumber(now);

  const completedKey = `simora_weekly_review_completed_${year}_${week}`;
  const dismissedKey = `simora_weekly_review_dismissed_${year}_${week}`;

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissedKey) === 'true' || localStorage.getItem(completedKey) === 'true';
    } catch { return false; }
  });

  if (!user || !isWeekend || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  return (
    <button
      onClick={() => navigate('/app/onboarding/weekly-review')}
      className="w-full mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-purple-400 p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="shrink-0">
        <FluentEmoji emoji="📋" size={36} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">Plan your next week in 1 min!</p>
        <p className="text-white/70 text-xs mt-0.5">Review & set your goals</p>
      </div>
      <span className="shrink-0 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
        Let's go!
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="absolute top-2 right-2 p-1 text-white/60 active:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </button>
  );
}
