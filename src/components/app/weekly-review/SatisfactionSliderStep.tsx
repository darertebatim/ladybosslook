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
  { emoji: '😞', label: 'Unsatisfied', microcopy: "Every step counts. You showed up! 💛", bg: 'from-blue-50 to-white' },
  { emoji: '😐', label: 'A little', microcopy: "Progress isn't always visible — but it's there 🌱", bg: 'from-yellow-50 to-white' },
  { emoji: '😊', label: 'Satisfied', microcopy: "Nice work! Keep that momentum going ✨", bg: 'from-green-50 to-white' },
  { emoji: '🤩', label: 'Really satisfied', microcopy: "You're on fire! What an amazing week 🔥", bg: 'from-orange-50 to-white' },
];

export function SatisfactionSliderStep({ step, onNext, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const handleSelect = (i: number) => {
    setSelected(i);
    onAnswer?.(step.id, levels[i].label);
  };

  const bgGradient = selected !== null ? levels[selected].bg : 'from-white to-white';

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-b transition-colors duration-500"
        animate={{ opacity: 1 }}
        style={{ zIndex: 0 }}
      />
      <div className="shrink-0 relative z-10" style={{ height: 200 }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>

      <div className={`flex-1 bg-gradient-to-b ${bgGradient} rounded-t-[28px] -mt-6 relative z-10 overflow-y-auto transition-all duration-500`}>
        <div className="px-5 pt-6 pb-6 flex flex-col min-h-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="min-h-[4.5em] flex items-start justify-center mb-4">
              <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center leading-snug">{step.title}</h1>
            </div>
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

          {/* Slider track with dots */}
          <div className="relative px-2 mb-2">
            <div className="absolute top-1/2 left-2 right-2 h-2 -translate-y-1/2 bg-purple-100 rounded-full" />
            <div className="relative flex justify-between items-center">
              {levels.map((level, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="relative z-10 flex items-center justify-center transition-all active:scale-95"
                >
                  <div
                    className={`rounded-full transition-all duration-200 ${
                      selected === i
                        ? 'w-12 h-12 bg-purple-500 shadow-lg shadow-purple-200'
                        : 'w-6 h-6 bg-purple-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Labels under the bar */}
          <div className="flex justify-between px-1 mb-4">
            <span className="text-xs font-medium text-[#1a1f3d]">Unsatisfied</span>
            <span className="text-xs font-medium text-[#1a1f3d]">Really satisfied</span>
          </div>

          {/* Dynamic micro-copy */}
          <motion.div
            key={selected !== null ? `copy-${selected}` : 'none'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center mb-4 min-h-[2em]"
          >
            {selected !== null && (
              <p className="text-sm font-medium text-gray-600">{levels[selected].microcopy}</p>
            )}
          </motion.div>

          {/* Optional note for low scores */}
          {selected !== null && selected <= 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What would've made it better? (optional)"
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white/80 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-400"
                rows={2}
              />
            </motion.div>
          )}

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
