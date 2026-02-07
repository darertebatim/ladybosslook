import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { Diamond, Sparkles } from 'lucide-react';
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
  '#FFA500', // Orange
  '#DAA520', // Goldenrod
  '#F4A460', // Sandy brown
  '#FFEC8B', // Light goldenrod
];

/**
 * Gold Streak Celebration - Shows after collecting gold badge
 * Displays consecutive days with 100% completion in a week view
 * Uses gold/amber luxury theme
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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5, x: 0.5 },
        colors: GOLD_CONFETTI_COLORS,
        scalar: 1.1,
        ticks: 250,
      });

      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.45, x: 0.3 },
          colors: GOLD_CONFETTI_COLORS,
          scalar: 0.9,
        });
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.45, x: 0.7 },
          colors: GOLD_CONFETTI_COLORS,
          scalar: 0.9,
        });
      }, 300);
    }
  }, [open]);

  if (!open) return null;

  const nextGoal = currentGoldStreak + 1;
  const message = currentGoldStreak === 1 
    ? "Great start! Come back tomorrow to build your streak!"
    : `Hey, come back tomorrow to keep your self-care streak alive!`;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col"
      onClick={onClose}
    >
      {/* Gold gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #B8860B 0%, #DAA520 30%, #F4A460 60%, #FFD700 100%)',
        }}
      />
      
      {/* Radial glow from center */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,236,139,0.4) 0%, transparent 60%)',
        }}
      />
      
      {/* Sparkle decorations */}
      <div className="absolute top-20 left-8 text-white/50">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>
      <div className="absolute top-32 right-12 text-white/40">
        <Sparkles className="w-3 h-3 animate-pulse delay-100" />
      </div>
      <div className="absolute top-48 left-16 text-white/30">
        <Diamond className="w-3 h-3 animate-pulse delay-200" />
      </div>
      <div className="absolute top-60 right-8 text-white/50">
        <Diamond className="w-4 h-4 animate-pulse delay-300" />
      </div>

      {/* Content */}
      <div 
        className={cn(
          'relative z-10 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Speech bubble */}
        <div className="bg-white rounded-3xl px-6 py-4 mb-8 shadow-xl relative max-w-[280px]">
          <p className="text-gray-800 text-center font-medium">
            See you tomorrow! Don't forget me~
          </p>
          {/* Bubble tail */}
          <div 
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '16px solid white',
            }}
          />
        </div>

        {/* Badge display */}
        <div className="relative mb-8">
          {/* Glow */}
          <div className="absolute inset-0 bg-amber-300/40 blur-3xl rounded-full scale-150" />
          <img 
            src={badgeGold}
            alt="Gold badge"
            className="w-28 h-28 object-contain relative z-10 drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))' }}
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-6 drop-shadow-lg">
          Can you make it to a {nextGoal} day streak?
        </h1>

        {/* Week view with gold badges */}
        <div className="bg-amber-800/40 backdrop-blur-sm rounded-2xl p-4 w-full max-w-[320px] mb-6">
          <div className="flex justify-between items-center">
            {weekDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                {/* Badge or circle */}
                <div 
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-all',
                    day.isGold 
                      ? 'bg-transparent' // Gold badge takes full space
                      : day.isToday
                      ? 'border-2 border-dashed border-white/60 bg-transparent'
                      : 'bg-amber-900/50'
                  )}
                >
                  {day.isGold ? (
                    <img 
                      src={badgeGold}
                      alt="Gold"
                      className="w-11 h-11 object-contain"
                    />
                  ) : day.isToday ? (
                    <Diamond className="w-4 h-4 text-white/60" />
                  ) : null}
                </div>
                {/* Day label */}
                <span className="text-xs font-medium text-white/80">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement message */}
        <p className="text-amber-100/80 text-sm text-center mb-8 max-w-[280px]">
          {message}
        </p>

        {/* Spacer */}
        <div className="flex-1 min-h-8" />

        {/* CTA Button */}
        <Button
          onClick={onClose}
          className="w-full max-w-[320px] h-14 bg-white hover:bg-white/95 text-amber-800 font-semibold text-base rounded-2xl shadow-xl mb-8"
        >
          I'm in!
        </Button>
      </div>
    </div>
  );
};
