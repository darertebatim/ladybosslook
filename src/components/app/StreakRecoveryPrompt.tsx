import { useState } from 'react';
import { Flame, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface StreakRecoveryPromptProps {
  open: boolean;
  previousStreak: number;
  onRecover: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

/**
 * Full-screen prompt shown when user has broken their streak
 * and still has their one-time recovery chance.
 */
export const StreakRecoveryPrompt = ({
  open,
  previousStreak,
  onRecover,
  onDismiss,
  isLoading,
}: StreakRecoveryPromptProps) => {
  const [isAnimating, setIsAnimating] = useState(true);

  if (!open) return null;

  const handleRecover = () => {
    haptic.success();
    onRecover();
  };

  const handleDismiss = () => {
    haptic.light();
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleDismiss}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className={cn(
          'relative bg-gradient-to-b from-orange-400 to-orange-500 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="grid place-items-center size-20 rounded-2xl bg-orange-300/40 text-white shadow-inner">
            <Shield className="h-9 w-9 fill-white/20 stroke-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-3xl font-bold text-white mb-1">
          Day {previousStreak}
        </div>
        <p className="text-white/70 text-sm mb-4">streak is at risk</p>

        {/* Message */}
        <p className="text-white/90 text-sm mb-6 leading-relaxed">
          You missed yesterday. But you have <span className="font-semibold text-white">one recovery</span> — use it to restore your {previousStreak}-day streak.
        </p>

        {/* Flame dots */}
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: Math.min(previousStreak, 7) }).map((_, i) => (
            <Flame
              key={i}
              className="h-4 w-4 text-white/80 fill-white/60"
            />
          ))}
        </div>

        {/* Recover button */}
        <Button
          onClick={handleRecover}
          disabled={isLoading}
          className="w-full bg-white hover:bg-white/90 text-orange-600 font-semibold py-3 rounded-xl mb-3"
        >
          🛡️ Recover My Streak
        </Button>

        {/* Skip */}
        <button
          onClick={handleDismiss}
          className="text-white/60 text-xs hover:text-white/80 transition-colors"
        >
          Let the streak reset
        </button>
      </div>
    </div>
  );
};
