import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep } from '@/types/onboarding';
import confetti from 'canvas-confetti';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

export function WeekCelebrationStep({ step, onNext }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    // Mark this week's review as complete
    const now = new Date();
    const weekNum = getWeekNumber(now);
    localStorage.setItem(`simora_weekly_review_completed_${now.getFullYear()}_${weekNum}`, 'true');

    // Fire confetti
    setTimeout(() => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }, 300);
  }, []);

  return (
    <div className="h-full bg-gradient-to-b from-purple-500 to-purple-600 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <FluentEmoji emoji="💪" size={72} />
        <h1 className="text-3xl font-extrabold text-white mt-6 mb-3">{step.title}</h1>
        <p className="text-white/80 text-base leading-relaxed max-w-[280px] mx-auto">{step.subtitle}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute bottom-10 left-5 right-5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
      >
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-white text-[#1a1f3d] font-bold text-base active:scale-[0.98] transition-all"
        >
          {step.buttonLabel || 'Done'}
        </button>
      </motion.div>
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}
