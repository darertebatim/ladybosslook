import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import confetti from 'canvas-confetti';
import celebrationImg from '@/assets/weekly-review-celebration.png';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

export function WeekCelebrationStep({ step, onNext, answers }: Props) {
  const firedRef = useRef(false);
  const [showReminder, setShowReminder] = useState(false);

  const summary = useMemo(() => {
    const focusItems = answers?.['wr-focus-next'];
    if (!Array.isArray(focusItems) || focusItems.length === 0) return null;
    const items = focusItems.slice(0, 3);
    if (items.length === 1) return `You'll focus on ${items[0].toLowerCase()} this week`;
    const last = items.pop();
    return `You'll focus on ${items.map(i => i.toLowerCase()).join(', ')} & ${last?.toLowerCase()} this week`;
  }, [answers]);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const now = new Date();
    const weekNum = getWeekNumber(now);
    localStorage.setItem(`simora_weekly_review_completed_${now.getFullYear()}_${weekNum}`, 'true');

    // Multi-burst confetti
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6, x: 0.3 } });
    }, 300);
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5, x: 0.7 } });
    }, 500);
    setTimeout(() => {
      confetti({ particleCount: 50, spread: 100, origin: { y: 0.4, x: 0.5 } });
    }, 700);
  }, []);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="shrink-0 relative" style={{ height: 320 }}>
        <img
          src={celebrationImg}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
      </div>

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

          {/* Personalized summary */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-5 bg-purple-50 rounded-2xl p-4 text-center"
            >
              <p className="text-sm font-semibold text-purple-700">✨ {summary}</p>
            </motion.div>
          )}

          {/* Mid-week reminder toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-4"
          >
            <button
              onClick={() => setShowReminder(!showReminder)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                showReminder ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔔</span>
                <span className="text-sm font-medium text-[#1a1f3d]">Mid-week check-in reminder</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all flex items-center ${
                showReminder ? 'bg-purple-500 justify-end' : 'bg-gray-300 justify-start'
              }`}>
                <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
              </div>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
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
