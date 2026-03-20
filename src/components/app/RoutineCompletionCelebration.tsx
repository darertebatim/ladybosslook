import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

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
  const [step, setStep] = useState(0);

  // step 0: emoji flies in (hold ~1.2s), step 1: "Done!" text (hold ~1s), step 2: triggers onComplete
  useEffect(() => {
    if (step >= 2) {
      onComplete();
      return;
    }
    const delay = step === 0 ? 1400 : 900;
    const timer = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Radiating rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ width: 60, height: 60, opacity: 0.25 }}
            animate={{ width: 350 + i * 80, height: 350 + i * 80, opacity: 0 }}
            transition={{
              duration: 1.8,
              delay: 0.15 * i,
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 0.6,
            }}
            className="rounded-full border border-primary/20 absolute"
          />
        ))}
      </div>

      {/* Confetti-like dots */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(rad) * 120,
              y: Math.sin(rad) * 120,
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 1,
              delay: 0.3 + i * 0.04,
              ease: 'easeOut',
            }}
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: [
                'hsl(var(--primary))',
                'hsl(var(--accent))',
                'hsl(45, 90%, 60%)',
                'hsl(160, 60%, 50%)',
              ][i % 4],
            }}
          />
        );
      })}

      {/* Main content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="emoji"
            initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="flex flex-col items-center gap-4"
          >
            <FluentEmoji emoji={routineEmoji} size={96} />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-sm font-medium text-muted-foreground"
            >
              {routineTitle}
            </motion.p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="done"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 250, damping: 16 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-6xl font-black text-foreground tracking-tight">
              Done!
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg">
              🎉
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-16 text-muted-foreground text-xs font-medium tracking-wider uppercase"
      >
        Routine Complete
      </motion.p>
    </div>
  );
}
