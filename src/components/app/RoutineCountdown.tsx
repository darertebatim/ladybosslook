import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface RoutineCountdownProps {
  routineEmoji: string;
  routineTitle: string;
  onComplete: () => void;
}

const countdownItems = [
  { value: '3', color: 'hsl(var(--primary))' },
  { value: '2', color: 'hsl(var(--accent))' },
  { value: '1', color: 'hsl(var(--primary))' },
  { value: '🚀', color: 'hsl(var(--primary))' },
];

export function RoutineCountdown({ routineEmoji, routineTitle, onComplete }: RoutineCountdownProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= countdownItems.length) {
      onComplete();
      return;
    }
    const delay = step === countdownItems.length - 1 ? 600 : 800;
    const timer = setTimeout(() => setStep(s => s + 1), delay);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  const current = countdownItems[step] || null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Pulsing ring background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={step}
              initial={{ width: 80, height: 80, opacity: 0.4 }}
              animate={{ width: 280, height: 280, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="rounded-full border-2 border-primary/30 absolute"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Routine info at top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-20 flex flex-col items-center gap-2"
      >
        <FluentEmoji emoji={routineEmoji} size={40} />
        <p className="text-muted-foreground text-sm font-medium">{routineTitle}</p>
      </motion.div>

      {/* Countdown number */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={step}
            initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{
              type: 'spring', stiffness: 300, damping: 18,
              exit: { duration: 0.2, ease: 'easeOut' },
            }}
            className="relative flex items-center justify-center"
          >
            {current.value === '🚀' ? (
              <span className="text-8xl">🚀</span>
            ) : (
              <span
                className="text-[120px] font-black leading-none tabular-nums"
                style={{ color: current.color }}
              >
                {current.value}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-24 flex gap-3">
        {countdownItems.slice(0, 3).map((_, i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            animate={{
              backgroundColor: i <= step
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted))',
              scale: i === step ? 1.4 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-16 text-muted-foreground text-xs font-medium tracking-wider uppercase"
      >
        Get Ready
      </motion.p>
    </div>
  );
}
