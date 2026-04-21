import { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import selfcareQuizHero from '@/assets/selfcare-quiz-hero.png';

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
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Hero */}
      <div className="relative w-full h-[35%] min-h-[180px] flex-shrink-0">
        <img src={selfcareQuizHero} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-6 -mt-6 relative z-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-extrabold text-black text-center mb-1 leading-tight"
        >
          {step.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-black/60 text-center mb-6"
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
          <p className="text-sm font-bold text-black mb-3">How many days per week?</p>
          <div className="flex gap-3">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-3 rounded-2xl border-2 font-bold text-lg transition-all active:scale-[0.96] ${
                  days === d
                    ? 'border-[#1a1f3d] bg-[#1a1f3d] text-white'
                    : 'border-gray-200 bg-white text-black'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-black/40 mt-1.5 text-center">
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
          <p className="text-sm font-bold text-black mb-3">When do you want to start?</p>
          <div className="flex gap-3">
            {START_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setStart(opt.label)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-[0.96] ${
                  start === opt.label
                    ? 'border-[#1a1f3d] bg-[#1a1f3d]/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <FluentEmoji emoji={opt.emoji} size={22} />
                <span className={`text-sm font-semibold ${start === opt.label ? 'text-black' : 'text-black/70'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-auto"
        >
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
          >
            {step.buttonLabel}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
