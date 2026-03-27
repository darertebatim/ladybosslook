import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface RoutinePlayerBreathIntroProps {
  routineTitle: string;
  routineEmoji: string;
  onComplete: () => void;
  onCancel: () => void;
}

const PHASES = ['Inhale', 'Hold', 'Exhale'] as const;
const PHASE_DURATIONS = [4, 2, 4]; // seconds
const TOTAL_CYCLES = 1;

export function RoutinePlayerBreathIntro({
  routineTitle,
  routineEmoji,
  onComplete,
  onCancel,
}: RoutinePlayerBreathIntroProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(PHASE_DURATIONS[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhase = (currentPhase + 1) % 3;
          const nextCycle = nextPhase === 0 ? currentCycle + 1 : currentCycle;

          if (nextCycle >= TOTAL_CYCLES) {
            clearInterval(timer);
            haptic.success();
            onComplete();
            return 0;
          }

          setCurrentPhase(nextPhase);
          setCurrentCycle(nextCycle);
          
          if (nextPhase === 0) haptic.medium();
          else if (nextPhase === 2) haptic.light();

          return PHASE_DURATIONS[nextPhase];
        }
        return prev - 1;
      });
    }, 1000);

    haptic.medium();
    return () => clearInterval(timer);
  }, [currentPhase, currentCycle, onComplete]);

  const scale = currentPhase === 0 ? 1.3 : currentPhase === 1 ? 1.3 : 0.9;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a1628]">
      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 text-white/60 active:text-white/80"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Cycle indicator */}
      <div className="absolute top-16 flex gap-2" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < currentCycle ? 'bg-white/80' : i === currentCycle ? 'bg-white/50' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Breathing circle */}
      <motion.div
        animate={{ scale }}
        transition={{ duration: PHASE_DURATIONS[currentPhase], ease: 'easeInOut' }}
        className="relative w-48 h-48 rounded-full flex items-center justify-center"
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-white/5 blur-xl" />
        
        {/* Main circle */}
        <div className="relative w-full h-full rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm">
          <span className="text-5xl mb-2">{routineEmoji}</span>
          <p className="text-white/80 text-sm font-medium text-center px-4 line-clamp-2">
            {routineTitle}
          </p>
        </div>
      </motion.div>

      {/* Phase text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-10 text-2xl font-light text-white/90 tracking-widest"
        >
          {PHASES[currentPhase]}
        </motion.p>
      </AnimatePresence>

      {/* Skip button */}
      <button
        onClick={() => {
          haptic.light();
          onComplete();
        }}
        className="absolute bottom-12 text-white/40 text-sm active:text-white/60"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        Skip breathing
      </button>
    </div>
  );
}
