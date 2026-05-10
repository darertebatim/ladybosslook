import { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { AmbientGlow } from './visuals/AmbientGlow';
import { PrimaryButton } from './visuals/QuizShell';

const DAY_OPTIONS = [3, 5, 6, 7];
const START_OPTIONS = [
  { label: 'Today', emoji: '⚡' },
  { label: 'Tomorrow', emoji: '🌅' },
  { label: 'Monday', emoji: '📅' },
];

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

export function SelfCareCommitmentStep({ step, onNext, onAnswer }: Props) {
  const [days, setDays] = useState(5);
  const [start, setStart] = useState('Today');

  const handleContinue = () => {
    const answer = JSON.stringify({ days, start });
    onAnswer?.(step.id, answer);
    localStorage.setItem('simora_onboarding_commitment', answer);
    onNext();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      <AmbientGlow palette="sunrise" />

      {/* Visual badge */}
      <div className="shrink-0 pt-10 pb-4 flex justify-center relative z-10">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#FFD49A] via-[#F08A3E] to-[#EC4899] shadow-[0_20px_40px_-12px_rgba(240,138,62,0.6)] flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-14px] rounded-full border-2 border-dashed border-[#F08A3E]/40"
          />
          <FluentEmoji emoji="🎯" size={64} />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-6 relative z-10 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-1 leading-tight"
        >
          {step.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#1a1f3d]/65 text-center mb-6"
        >
          {step.subtitle}
        </motion.p>

        {/* Days per week */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-5"
        >
          <p className="text-sm font-bold text-[#1a1f3d] mb-3">How many days per week?</p>
          <div className="flex gap-3">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-3 rounded-2xl border font-bold text-lg transition-all active:scale-[0.96] ${
                  days === d
                    ? 'border-transparent bg-gradient-to-br from-[#F08A3E] to-[#EC4899] text-white shadow-[0_10px_20px_-8px_rgba(236,72,153,0.5)]'
                    : 'border-white/60 bg-white/70 backdrop-blur text-[#1a1f3d]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#1a1f3d]/50 mt-1.5 text-center">
            {days <= 3 ? 'Easy start — build momentum!' : days <= 5 ? 'Great balance!' : days === 6 ? 'Ambitious — love it!' : 'Full commitment! 🔥'}
          </p>
        </motion.div>

        {/* Start date */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <p className="text-sm font-bold text-[#1a1f3d] mb-3">When do you want to start?</p>
          <div className="flex gap-3">
            {START_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setStart(opt.label)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-[0.96] ${
                  start === opt.label
                    ? 'border-[#F08A3E]/60 bg-white shadow-[0_8px_18px_-8px_rgba(240,138,62,0.4)]'
                    : 'border-white/60 bg-white/70 backdrop-blur'
                }`}
              >
                <FluentEmoji emoji={opt.emoji} size={22} />
                <span className={`text-sm font-semibold ${start === opt.label ? 'text-[#1a1f3d]' : 'text-[#1a1f3d]/70'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="mt-auto">
          <PrimaryButton onClick={handleContinue} delay={0.35}>
            {step.buttonLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
