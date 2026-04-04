import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep } from '@/types/onboarding';
import confetti from 'canvas-confetti';
import celebrationImg from '@/assets/weekly-review-celebration.png';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

export function WeekCelebrationStep({ step, onNext }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const now = new Date();
    const weekNum = getWeekNumber(now);
    localStorage.setItem(`simora_weekly_review_completed_${now.getFullYear()}_${weekNum}`, 'true');

    setTimeout(() => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }, 300);
  }, []);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Celebration image */}
      <div className="shrink-0 relative" style={{ height: 320 }}>
        <img
          src={celebrationImg}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
      </div>

      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10">
        <div className="px-5 pt-8 pb-6 flex flex-col min-h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-3xl font-extrabold text-[#1a1f3d] mb-3">{step.title}</h1>
            <p className="text-gray-500 text-base leading-relaxed max-w-[300px] mx-auto">{step.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-auto"
          >
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
            >
              {step.buttonLabel || 'Done'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}
