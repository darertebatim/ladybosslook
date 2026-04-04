import { useState } from 'react';
import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep } from '@/types/onboarding';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';

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
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Purple gradient header with mascot */}
      <div className="shrink-0 relative" style={{ height: 200 }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>

      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 overflow-y-auto">
        <div className="px-5 pt-6 pb-6 flex flex-col min-h-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="min-h-[4.5em] flex items-start justify-center mb-4">
              <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center leading-snug">{step.title}</h1>
            </div>
            {step.subtitle && <p className="text-sm text-gray-500 text-center mb-6">{step.subtitle}</p>}
          </motion.div>

          {/* Big emoji display */}
          <motion.div
            key={selected}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mb-4"
          >
            <FluentEmoji emoji={selected !== null ? levels[selected].emoji : '🤔'} size={72} />
          </motion.div>

          {selected !== null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-base font-semibold text-[#1a1f3d] mb-5"
            >
              {levels[selected].label}
            </motion.p>
          )}

          {/* Selection buttons */}
          <div className="flex justify-center gap-3 mb-6">
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
    </div>
  );
}
