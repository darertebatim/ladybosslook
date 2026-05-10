import { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { AmbientGlow } from './visuals/AmbientGlow';

const WHY_OPTIONS = [
  { emoji: '💪', label: 'For my health' },
  { emoji: '👨‍👩‍👧', label: 'For my family' },
  { emoji: '✨', label: 'To feel like myself again' },
  { emoji: '😌', label: 'To finally feel calm' },
  { emoji: '🌅', label: 'To take back my mornings' },
  { emoji: '💕', label: 'To love myself more' },
];

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

export function SelfCareYourWhyStep({ step, onNext, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    setSelected(label);
    onAnswer?.(step.id, label);
    // Store for future motivational use
    localStorage.setItem('simora_onboarding_why', label);
    setTimeout(onNext, 400);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-gradient-to-b from-[#FFE6E2] via-[#FFE1EE] to-[#F1E1FF]">
      <AmbientGlow palette="rosé" />
      <div className="flex-1 flex flex-col px-5 pt-10 pb-6 relative z-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
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
          className="text-sm text-black/60 text-center mb-5"
        >
          {step.subtitle}
        </motion.p>

        <div className="grid grid-cols-2 gap-3 flex-1">
          {WHY_OPTIONS.map((opt, i) => {
            const isSelected = selected === opt.label;
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                onClick={() => handleSelect(opt.label)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-[0.97] ${
                  isSelected
                    ? 'border-[#1a1f3d] bg-[#1a1f3d]/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <FluentEmoji emoji={opt.emoji} size={32} />
                <span className="text-[13px] font-semibold text-black text-center leading-tight">
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
