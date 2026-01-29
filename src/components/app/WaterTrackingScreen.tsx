import { useState, useEffect, useRef } from 'react';
import { X, Plus, Settings, Droplets } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { UserTask } from '@/hooks/useTaskPlanner';
import { WaterInputSheet } from './WaterInputSheet';
import confetti from 'canvas-confetti';

interface WaterTrackingScreenProps {
  task: UserTask;
  date: Date;
  goalProgress: number;
  onClose: () => void;
  onAddWater: (amount: number) => void;
  onOpenSettings: () => void;
}

export const WaterTrackingScreen = ({
  task,
  date,
  goalProgress,
  onClose,
  onAddWater,
  onOpenSettings,
}: WaterTrackingScreenProps) => {
  const [showInputSheet, setShowInputSheet] = useState(false);
  const prevProgressRef = useRef(goalProgress);
  const hasCelebratedRef = useRef(false);

  const goalTarget = task.goal_target || 64;
  const unit = task.goal_unit || 'oz';
  const progressPercent = Math.min((goalProgress / goalTarget) * 100, 100);
  const goalReached = goalProgress >= goalTarget;

  // Check if goal was just reached
  useEffect(() => {
    if (goalProgress >= goalTarget && prevProgressRef.current < goalTarget && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      haptic.success();
      
      // Fire celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0ea5e9', '#0284c7', '#7dd3fc', '#bae6fd']
      });
    }
    prevProgressRef.current = goalProgress;
  }, [goalProgress, goalTarget]);

  const handleAddWater = (amount: number) => {
    haptic.medium();
    onAddWater(amount);
  };

  // Format the date display
  const formatDate = () => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden">
      {/* Sky background with gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #E0F4FF 60%, #FFFFFF 100%)',
        }}
      />

      {/* Clouds decoration */}
      <div className="absolute top-20 left-4 w-24 h-10 bg-white/60 rounded-full blur-sm" />
      <div className="absolute top-28 left-16 w-16 h-8 bg-white/50 rounded-full blur-sm" />
      <div className="absolute top-16 right-8 w-20 h-8 bg-white/50 rounded-full blur-sm" />
      <div className="absolute top-24 right-4 w-12 h-6 bg-white/40 rounded-full blur-sm" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe-top">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="h-5 w-5 text-sky-700" />
        </button>
        
        <h1 className="text-lg font-semibold text-sky-800">{formatDate()}</h1>
        
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center z-10 px-6">
        {/* Water droplet icon */}
        <Droplets className="h-16 w-16 text-sky-500 mb-4" />
        
        {/* Progress display */}
        <div className="text-center mb-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold text-sky-700">
              {Math.round(goalProgress * 10) / 10}
            </span>
            <span className="text-3xl text-sky-500/70">
              /{goalTarget}{unit}
            </span>
          </div>
          <p className="text-sky-600 mt-2">
            Water intake & your goal
          </p>
        </div>

        {/* Goal reached badge */}
        {goalReached && (
          <div className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-semibold flex items-center gap-2">
            <span>🎉</span>
            Goal Reached!
          </div>
        )}
      </div>

      {/* Water wave animation */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
        {/* Wave layers */}
        <div 
          className="relative transition-all duration-1000 ease-out"
          style={{ height: `${Math.max(progressPercent * 2.5, 20)}px` }}
        >
          {/* Back wave */}
          <div 
            className="absolute bottom-0 left-0 w-[200%] animate-wave-slow"
            style={{
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(14, 165, 233, 0.4), rgba(2, 132, 199, 0.6))',
              borderRadius: '100% 100% 0 0',
            }}
          />
          {/* Front wave */}
          <div 
            className="absolute bottom-0 left-0 w-[200%] animate-wave"
            style={{
              height: '90%',
              background: 'linear-gradient(to bottom, rgba(56, 189, 248, 0.6), rgba(14, 165, 233, 0.8))',
              borderRadius: '100% 100% 0 0',
            }}
          />
        </div>
        
        {/* Water body */}
        <div 
          className="transition-all duration-1000 ease-out"
          style={{ 
            height: `${Math.min(progressPercent * 3, 250)}px`,
            background: 'linear-gradient(to bottom, rgba(14, 165, 233, 0.8), rgba(2, 132, 199, 1))',
          }}
        >
          {/* Decorative bubbles */}
          <div className="absolute bottom-8 left-[20%] w-3 h-3 bg-white/30 rounded-full animate-float" />
          <div className="absolute bottom-16 left-[40%] w-2 h-2 bg-white/25 rounded-full animate-float-delayed" />
          <div className="absolute bottom-12 right-[30%] w-4 h-4 bg-white/20 rounded-full animate-float" />
          <div className="absolute bottom-20 right-[15%] w-2 h-2 bg-white/30 rounded-full animate-float-delayed" />
        </div>
      </div>

      {/* Bottom actions */}
      <div 
        className="relative z-10 flex items-center justify-center gap-4 pb-8 px-6"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        {/* Settings button */}
        <button
          onClick={() => {
            haptic.light();
            onOpenSettings();
          }}
          className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center"
        >
          <Settings className="h-6 w-6 text-sky-700" />
        </button>

        {/* Add Water button */}
        <button
          onClick={() => {
            haptic.light();
            setShowInputSheet(true);
          }}
          className="flex-1 max-w-[200px] h-14 rounded-full bg-sky-500 shadow-lg flex items-center justify-center gap-2 text-white font-semibold"
        >
          <Plus className="h-5 w-5" />
          Add Water
        </button>

        {/* Placeholder for symmetry (or future history button) */}
        <div className="w-14" />
      </div>

      {/* Water input sheet */}
      <WaterInputSheet
        open={showInputSheet}
        onOpenChange={setShowInputSheet}
        unit={unit}
        onConfirm={handleAddWater}
      />

      {/* Animation styles */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
        }
        @keyframes wave-slow {
          0%, 100% { transform: translateX(-25%); }
          50% { transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(-10px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-30px) scale(1.15); opacity: 0.4; }
        }
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
        .animate-wave-slow {
          animation: wave-slow 5s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
