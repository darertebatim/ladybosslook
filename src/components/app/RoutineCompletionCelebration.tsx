import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SealCheck from '@/components/app/SealCheck';

interface RoutineCompletionCelebrationProps {
  routineEmoji: string;
  routineTitle: string;
  onComplete: () => void;
}

export function RoutineCompletionCelebration({
  routineEmoji,
  routineTitle,
  onComplete,
}: RoutineCompletionCelebrationProps) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    // Brief delay then show the seal check
    const t1 = setTimeout(() => setShowCheck(true), 150);
    // Transition to summary after animation plays
    const t2 = setTimeout(() => onComplete(), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Radiating pulse rings */}
      {showCheck && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ width: 80, height: 80, opacity: 0.3 }}
              animate={{ width: 300 + i * 60, height: 300 + i * 60, opacity: 0 }}
              transition={{
                duration: 1.4,
                delay: 0.1 * i,
                ease: 'easeOut',
              }}
              className="rounded-full border border-teal-400/30 absolute"
            />
          ))}
        </div>
      )}

      {/* Big SealCheck */}
      <AnimatePresence>
        {showCheck && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 12,
              mass: 0.8,
            }}
            className="relative"
          >
            <SealCheck
              showParticles
              className="w-28 h-28 text-teal-400 animate-seal-pop"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <AnimatePresence>
        {showCheck && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            className="mt-6 text-lg font-bold text-foreground"
          >
            Routine Complete!
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheck && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-1.5 text-sm text-muted-foreground"
          >
            {routineTitle}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
