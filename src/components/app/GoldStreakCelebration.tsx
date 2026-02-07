import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';

import badgeGold from '@/assets/badge-gold.png';

interface GoldStreakCelebrationProps {
  open: boolean;
  onClose: () => void;
  currentGoldStreak: number;
  goldDatesThisWeek: Date[]; // Dates that earned gold this week
}

const GOLD_CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#FFC107', // Amber
  '#E6B800', // Dark gold
  '#FFECB3', // Light amber
  '#BF9B30', // Bronze-gold
];

/**
 * Gold Streak Celebration - Shows after collecting gold badge
 * Displays consecutive days with 100% completion in a week view
 * Uses elegant dark gold luxury theme
 */
export const GoldStreakCelebration = ({
  open,
  onClose,
  currentGoldStreak,
  goldDatesThisWeek,
}: GoldStreakCelebrationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate week days for display
  const weekDays = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const isGold = goldDatesThisWeek.some(d => isSameDay(d, day));
      const isToday = isSameDay(day, today);
      const isPast = isBefore(startOfDay(day), startOfDay(today));
      const isFuture = !isPast && !isToday;
      
      return {
        date: day,
        label: format(day, 'EEEEE'), // Single letter
        isGold,
        isToday,
        isFuture,
      };
    });
  }, [goldDatesThisWeek]);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      haptic.success();

      // Gold confetti burst
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4, x: 0.5 },
        colors: GOLD_CONFETTI_COLORS,
        scalar: 1.2,
        ticks: 300,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.35, x: 0.3 },
          colors: GOLD_CONFETTI_COLORS,
          scalar: 1,
        });
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.35, x: 0.7 },
          colors: GOLD_CONFETTI_COLORS,
          scalar: 1,
        });
      }, 400);
    }
  }, [open]);

  if (!open) return null;

  const nextGoal = currentGoldStreak + 1;
  const message = currentGoldStreak === 1 
    ? "Amazing start! Come back tomorrow to keep your golden streak!"
    : `${currentGoldStreak} days strong! Keep your momentum going!`;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col"
      onClick={onClose}
    >
      {/* Elegant dark gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #1a1410 0%, #2d2318 25%, #3d2f1e 50%, #4a3726 75%, #2d2318 100%)',
        }}
      />
      
      {/* Golden radial glow from center-top */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 25%, rgba(255, 193, 7, 0.2) 0%, rgba(255, 193, 7, 0.08) 40%, transparent 70%)',
        }}
      />
      
      {/* Subtle golden shimmer overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255, 215, 0, 0.15) 0%, transparent 40%), radial-gradient(circle at 70% 30%, rgba(255, 193, 7, 0.1) 0%, transparent 35%)',
        }}
      />
      
      {/* Sparkle decorations */}
      <Sparkles className="absolute top-24 left-10 w-5 h-5 text-amber-400/60 animate-pulse" />
      <Sparkles className="absolute top-36 right-8 w-4 h-4 text-yellow-300/50 animate-pulse delay-100" />
      <Crown className="absolute top-52 left-6 w-4 h-4 text-amber-500/40 animate-pulse delay-200" />
      <Sparkles className="absolute top-64 right-12 w-3 h-3 text-amber-300/50 animate-pulse delay-300" />

      {/* Content */}
      <div 
        className={cn(
          'relative z-10 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Speech bubble with elegant style */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-3xl px-6 py-4 mb-10 shadow-2xl relative max-w-[280px] border border-amber-100">
          <p className="text-gray-800 text-center font-medium text-[15px]">
            ✨ See you tomorrow, champion!
          </p>
          {/* Bubble tail */}
          <div 
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '14px solid white',
            }}
          />
        </div>

        {/* Badge display with enhanced glow */}
        <div className="relative mb-10">
          {/* Outer glow rings */}
          <div 
            className="absolute inset-0 rounded-full scale-[2]"
            style={{
              background: 'radial-gradient(circle, rgba(255, 193, 7, 0.3) 0%, rgba(255, 193, 7, 0.1) 40%, transparent 70%)',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full scale-[1.5] animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 60%)',
            }}
          />
          <img 
            src={badgeGold}
            alt="Gold badge"
            className="w-32 h-32 object-contain relative z-10"
            style={{ 
              filter: 'drop-shadow(0 0 30px rgba(255, 193, 7, 0.5)) drop-shadow(0 8px 20px rgba(0,0,0,0.3))' 
            }}
          />
        </div>

        {/* Title with gold accent */}
        <h1 className="text-2xl font-bold text-center mb-2">
          <span className="text-amber-400">Can you make it to a</span>
        </h1>
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
            {nextGoal} day streak?
          </span>
        </h2>

        {/* Week view with gold badges - elegant dark card */}
        <div className="bg-gradient-to-br from-stone-800/90 to-stone-900/90 backdrop-blur-sm rounded-2xl p-5 w-full max-w-[340px] mb-6 border border-amber-900/30 shadow-xl">
          <div className="flex justify-between items-center gap-1">
            {weekDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                {/* Badge or circle */}
                <div 
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    day.isGold 
                      ? 'bg-transparent' 
                      : day.isToday
                      ? 'border-2 border-dashed border-amber-500/50 bg-amber-900/20'
                      : 'bg-stone-700/50'
                  )}
                >
                  {day.isGold ? (
                    <img 
                      src={badgeGold}
                      alt="Gold"
                      className="w-10 h-10 object-contain"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    />
                  ) : day.isToday ? (
                    <Sparkles className="w-4 h-4 text-amber-400/70" />
                  ) : null}
                </div>
                {/* Day label */}
                <span className={cn(
                  'text-xs font-medium',
                  day.isGold ? 'text-amber-300' : day.isToday ? 'text-amber-400/80' : 'text-stone-500'
                )}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement message */}
        <p className="text-amber-200/70 text-sm text-center mb-10 max-w-[280px]">
          {message}
        </p>

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* CTA Button - positioned above nav menu */}
        <div 
          className="w-full flex justify-center"
          style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <Button
            onClick={onClose}
            className="w-full max-w-[320px] h-14 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-300 text-stone-900 font-bold text-base rounded-2xl shadow-xl border-0"
            style={{
              boxShadow: '0 4px 20px rgba(255, 193, 7, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            I'm in! 💪
          </Button>
        </div>
      </div>
    </div>
  );
};
