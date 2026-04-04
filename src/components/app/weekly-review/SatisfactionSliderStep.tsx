import { useState } from 'react';
import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep } from '@/types/onboarding';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

const levels = [
  { emoji: '😞', label: 'Not at all', color: 'bg-red-100 border-red-200' },
  { emoji: '😐', label: 'A little', color: 'bg-orange-100 border-orange-200' },
  { emoji: '😊', label: 'Satisfied', color: 'bg-green-100 border-green-200' },
  { emoji: '🤩', label: 'Really satisfied!', color: 'bg-purple-100 border-purple-200' },
];

export function SatisfactionSliderStep({ step, onNext, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    setSelected(i);
    onAnswer?.(step.id, levels[i].label);
  };

  return (
    <div className="h-full bg-white overflow-y-auto overscroll-contain">
      <div className="flex flex-col h-full px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
          {step.subtitle && <p className="text-sm text-gray-500 text-center mb-8">{step.subtitle}</p>}
        </motion.div>

        {/* Big emoji display */}
        <motion.div
          key={selected}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-8"
        >
          <FluentEmoji emoji={selected !== null ? levels[selected].emoji : '🤔'} size={80} />
        </motion.div>

        {selected !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-lg font-semibold text-[#1a1f3d] mb-6"
          >
            {levels[selected].label}
          </motion.p>
        )}

        {/* Selection dots/buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {levels.map((level, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
                selected === i
                  ? `${level.color} scale-110 shadow-md`
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <FluentEmoji emoji={level.emoji} size={32} />
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <button
            onClick={onNext}
            disabled={selected === null}
            className={`w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all ${
              selected === null ? 'opacity-40' : ''
            }`}
          >
            {step.buttonLabel || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
