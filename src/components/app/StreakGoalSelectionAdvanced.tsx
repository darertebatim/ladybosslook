import { useState } from 'react';
import { Flame, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { OverlayPortal } from '@/components/app/OverlayPortal';

export type AdvancedStreakGoalValue = 90 | 180 | 270 | 365;

interface StreakGoalSelectionAdvancedProps {
  open: boolean;
  onClose: () => void;
  onSelectGoal: (goal: AdvancedStreakGoalValue) => void;
  isLoading?: boolean;
  /** Only show goals higher than this value */
  minGoal?: number;
}

const GOALS = [90, 180, 270, 365] as const;
type GoalValue = typeof GOALS[number];

const GOAL_META: Record<GoalValue, { label: string; subtitle: string; tagline: string }> = {
  90: { label: '90', subtitle: '3 months', tagline: 'Build a lasting habit. 90 days rewires your brain.' },
  180: { label: '180', subtitle: '6 months', tagline: 'Half a year of dedication. You become unstoppable.' },
  270: { label: '270', subtitle: '9 months', tagline: 'A new identity. This is who you are now.' },
  365: { label: '365', subtitle: '1 full year', tagline: 'Legendary. A full year of showing up — for life.' },
};

/**
 * Advanced streak goal selection — appears AFTER user completes the 50-day challenge.
 * Offers long-term commitments: 90, 180, 270, 365 days.
 */
export const StreakGoalSelectionAdvanced = ({
  open,
  onClose,
  onSelectGoal,
  isLoading,
  minGoal = 50,
}: StreakGoalSelectionAdvancedProps) => {
  const availableGoals = GOALS.filter(g => g > minGoal);
  const [selectedGoal, setSelectedGoal] = useState<GoalValue>(availableGoals[0] || 90);

  const handleSelectGoal = (goal: GoalValue) => {
    setSelectedGoal(goal);
    haptic.light();
  };

  const handleConfirm = () => {
    haptic.success();
    onSelectGoal(selectedGoal);
  };

  if (!open) return null;

  const meta = GOAL_META[selectedGoal];

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-[10100] flex flex-col">
        {/* Premium gold/amber gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #1e1b4b 0%, #3b0764 50%, #581c87 100%)',
          }}
        />

        {/* Decorative wavy curves */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-10"
            viewBox="0 0 400 800"
            preserveAspectRatio="none"
          >
            <path d="M-50,100 Q100,150 50,300 T100,500 T50,700" stroke="#fbbf24" strokeWidth="60" fill="none" />
            <path d="M350,50 Q450,200 350,350 T450,550 T350,750" stroke="#fbbf24" strokeWidth="40" fill="none" />
          </svg>
        </div>

        {/* Sparkle dots */}
        <div className="absolute top-20 left-8 w-2 h-2 rounded-full bg-amber-300/60" />
        <div className="absolute top-32 right-12 w-1.5 h-1.5 rounded-full bg-amber-300/40" />
        <div className="absolute top-48 left-16 w-1 h-1 rounded-full bg-amber-300/50" />
        <div className="absolute top-60 right-8 w-2 h-2 rounded-full bg-amber-300/50" />
        <div className="absolute bottom-40 left-12 w-1.5 h-1.5 rounded-full bg-amber-300/40" />
        <div className="absolute bottom-60 right-20 w-1 h-1 rounded-full bg-amber-300/50" />

        {/* Close button */}
        <div
          className="relative z-10 pt-safe-top px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-safe-bottom">
          {/* Trophy + flame badge */}
          <div className="relative mt-2 mb-4">
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-amber-400/30 blur-2xl" />
            <div
              className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.5)',
              }}
            >
              <Flame className="w-8 h-8 text-white mb-0.5" strokeWidth={1.5} fill="rgba(255,255,255,0.3)" />
              <span className="text-2xl font-bold text-white">{selectedGoal}</span>
            </div>
            {/* Trophy badge */}
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center shadow-lg ring-2 ring-amber-100">
              <Trophy className="w-5 h-5 text-amber-700" fill="currentColor" />
            </div>
          </div>

          {/* Subtitle (e.g., "3 months") */}
          <p className="text-amber-200 text-sm font-semibold mb-4 uppercase tracking-wider">
            {meta.subtitle}
          </p>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2 leading-tight">
            🏆 You've Mastered 50 Days!
          </h1>
          <p className="text-white/80 text-center text-sm mb-6 max-w-xs">
            You're in elite territory. Choose your next legendary goal:
          </p>

          {/* Goal selection buttons */}
          <div className={cn(
            'grid gap-3 w-full max-w-xs mb-6',
            availableGoals.length <= 2 ? 'grid-cols-2' : availableGoals.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
          )}>
            {availableGoals.map((goal) => (
              <button
                key={goal}
                onClick={() => handleSelectGoal(goal)}
                className={cn(
                  'h-14 rounded-2xl font-bold text-lg transition-all duration-200',
                  selectedGoal === goal
                    ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-100 shadow-lg'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                )}
              >
                {goal}
              </button>
            ))}
          </div>

          {/* Tagline for selected goal */}
          <div className="text-center px-4 mb-8 min-h-[3rem]">
            <p className="text-amber-100 text-sm leading-relaxed">
              {meta.tagline}
            </p>
          </div>

          <div className="flex-1" />

          {/* CTA Button */}
          <div
            className="w-full flex justify-center"
            style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full max-w-xs h-14 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-base rounded-2xl"
            >
              {isLoading ? 'Saving...' : `Commit to ${selectedGoal} days`}
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};
