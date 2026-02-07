import { useState } from 'react';
import { Flame, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

export type StreakGoalValue = 7 | 14 | 30 | 50;

interface StreakGoalSelectionProps {
  open: boolean;
  onClose: () => void;
  onSelectGoal: (goal: StreakGoalValue) => void;
  isLoading?: boolean;
}

const GOALS = [7, 14, 30, 50] as const;
type GoalValue = typeof GOALS[number];

const MULTIPLIERS: Record<GoalValue, { multiplier: string; text: string }> = {
  7: { multiplier: '2x', text: "You'll be 2x as likely to achieve a healthier lifestyle!" },
  14: { multiplier: '5x', text: "You'll be 5x as likely to achieve a healthier lifestyle!" },
  30: { multiplier: '7x', text: "You'll be 7x as likely to achieve a healthier lifestyle!" },
  50: { multiplier: '9x', text: "You'll be 9x as likely to achieve a healthier lifestyle!" },
};

/**
 * Full-screen streak goal selection modal
 * Shows after first streak day to encourage commitment
 */
export const StreakGoalSelection = ({ 
  open, 
  onClose, 
  onSelectGoal,
  isLoading 
}: StreakGoalSelectionProps) => {
  const [selectedGoal, setSelectedGoal] = useState<GoalValue>(7);

  const handleSelectGoal = (goal: GoalValue) => {
    setSelectedGoal(goal);
    haptic.light();
  };

  const handleConfirm = () => {
    haptic.success();
    onSelectGoal(selectedGoal);
  };

  if (!open) return null;

  const currentMultiplier = MULTIPLIERS[selectedGoal];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col">
      {/* Purple gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
        }}
      />
      
      {/* Decorative wavy curves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          className="absolute top-0 left-0 w-full h-full opacity-10" 
          viewBox="0 0 400 800" 
          preserveAspectRatio="none"
        >
          <path 
            d="M-50,100 Q100,150 50,300 T100,500 T50,700" 
            stroke="white" 
            strokeWidth="60" 
            fill="none"
          />
          <path 
            d="M350,50 Q450,200 350,350 T450,550 T350,750" 
            stroke="white" 
            strokeWidth="40" 
            fill="none"
          />
        </svg>
      </div>
      
      {/* Sparkle dots */}
      <div className="absolute top-20 left-8 w-2 h-2 rounded-full bg-white/40" />
      <div className="absolute top-32 right-12 w-1.5 h-1.5 rounded-full bg-white/30" />
      <div className="absolute top-48 left-16 w-1 h-1 rounded-full bg-white/25" />
      <div className="absolute top-60 right-8 w-2 h-2 rounded-full bg-white/35" />
      <div className="absolute bottom-40 left-12 w-1.5 h-1.5 rounded-full bg-white/30" />
      <div className="absolute bottom-60 right-20 w-1 h-1 rounded-full bg-white/25" />
      
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
        {/* Flame badge with selected number */}
        <div className="relative mt-4 mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-orange-400/30 blur-2xl" />
          
          {/* Badge */}
          <div 
            className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
              boxShadow: '0 8px 32px rgba(251, 146, 60, 0.4)',
            }}
          >
            <Flame className="w-10 h-10 text-white mb-1" strokeWidth={1.5} fill="rgba(255,255,255,0.3)" />
            <span className="text-3xl font-bold text-white">{selectedGoal}</span>
          </div>
        </div>
        
        {/* Days label */}
        <p className="text-white/70 text-sm font-medium mb-6">Days</p>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-8 leading-tight">
          Pick Your <span className="text-orange-300">Streak Goal</span><br />
          and Stay on Track!
        </h1>
        
        {/* Goal selection buttons */}
        <div className="grid grid-cols-4 gap-3 w-full max-w-xs mb-6">
          {GOALS.map((goal) => (
            <button
              key={goal}
              onClick={() => handleSelectGoal(goal)}
              className={cn(
                'h-14 rounded-2xl font-bold text-lg transition-all duration-200',
                selectedGoal === goal
                  ? 'bg-orange-400 text-white ring-4 ring-white shadow-lg'
                  : 'bg-violet-400/50 text-white/90 hover:bg-violet-400/70'
              )}
            >
              {goal}
            </button>
          ))}
        </div>
        
        {/* Motivational text */}
        <div className="text-center px-4 mb-8">
          <p className="text-white/90 text-sm leading-relaxed">
            {currentMultiplier.text.split(currentMultiplier.multiplier).map((part, i) => (
              <span key={i}>
                {part}
                {i === 0 && (
                  <span className="font-bold text-orange-300">{currentMultiplier.multiplier}</span>
                )}
              </span>
            ))}
          </p>
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* CTA Button - positioned above nav menu */}
        <div 
          className="w-full flex justify-center"
          style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full max-w-xs h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base rounded-2xl"
          >
            {isLoading ? 'Saving...' : 'Commit to my goal'}
          </Button>
        </div>
      </div>
    </div>
  );
};
