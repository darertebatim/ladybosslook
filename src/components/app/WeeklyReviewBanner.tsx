import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import weeklyReviewMascot from '@/assets/weekly-review-mascot.png';

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}

export function WeeklyReviewBanner({ onVisibilityChange }: { onVisibilityChange?: (visible: boolean) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = new Date();
  const day = now.getDay();
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
  const [fading, setFading] = useState(false);

  const isShowing = !!user && isWeekend && !dismissed;

  useEffect(() => {
    onVisibilityChange?.(isShowing);
  }, [isShowing, onVisibilityChange]);

  if (!isShowing) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    localStorage.setItem(dismissedKey, 'true');
    setFading(true);
    setTimeout(() => setDismissed(true), 300);
  };

  const handleTap = () => {
    haptic.medium();
    navigate('/app/onboarding/weekly-review');
  };

  return (
    <button
      onClick={handleTap}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-all",
        fading ? "animate-fade-out opacity-0" : "animate-fade-in"
      )}
    >
      {/* Banner image with overlay */}
      <div className="relative h-[100px]">
        <img
          src={weeklyReviewMascot}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 30%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-purple-500/60" />
        <div className="absolute inset-0 flex items-center px-4 gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Plan your next week in 1 min!</p>
            <p className="text-white/80 text-xs mt-0.5">Review & set your goals 📋</p>
          </div>
          <span className="shrink-0 bg-white text-purple-600 text-xs font-bold px-4 py-2 rounded-full">
            Let's go!
          </span>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </button>
  );
}
