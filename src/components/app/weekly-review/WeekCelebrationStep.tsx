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
    const items = [...focusItems.slice(0, 3)];
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
      {/* Hero — 38% */}
      <div className="shrink-0 relative" style={{ height: '38%' }}>
        <img
          src={celebrationImg}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
      </div>

      {/* Bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col">
        <div className="px-5 pt-6 pb-5 flex flex-col flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-2xl font-extrabold text-foreground mb-2">{step.title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">{step.subtitle}</p>
          </motion.div>

          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-4 bg-primary/5 rounded-2xl p-3 text-center"
            >
              <p className="text-xs font-semibold text-primary">✨ {summary}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-3"
          >
            <button
              onClick={() => setShowReminder(!showReminder)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                showReminder ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <span className="text-xs font-medium text-foreground">Mid-week check-in reminder</span>
              </div>
              <div className={`w-9 h-5 rounded-full transition-all flex items-center ${
                showReminder ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}>
                <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
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
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-all"
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
