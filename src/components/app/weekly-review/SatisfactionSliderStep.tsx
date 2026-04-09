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
  { emoji: '😞', label: 'Unsatisfied', microcopy: "Every step counts. You showed up! 💛", bg: 'from-primary/5 to-white' },
  { emoji: '😐', label: 'A little', microcopy: "Progress isn't always visible — but it's there 🌱", bg: 'from-secondary/10 to-white' },
  { emoji: '😊', label: 'Satisfied', microcopy: "Nice work! Keep that momentum going ✨", bg: 'from-accent/15 to-white' },
  { emoji: '🤩', label: 'Really satisfied', microcopy: "You're on fire! What an amazing week 🔥", bg: 'from-secondary/15 to-white' },
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
      {/* Hero — compact */}
      <div className="shrink-0 relative" style={{ height: 140 }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>

      {/* Bottom sheet */}
      <div className={`flex-1 bg-gradient-to-b ${bgGradient} rounded-t-[28px] -mt-6 relative z-10 flex flex-col transition-all duration-500`}>
        <div className="px-5 pt-5 pb-5 flex flex-col flex-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-xl font-extrabold text-foreground text-center leading-snug mb-3">{step.title}</h1>
          </motion.div>

          {/* Big emoji */}
          <motion.div
            key={selected}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mb-2"
          >
            <FluentEmoji emoji={selected !== null ? levels[selected].emoji : '🤔'} size={48} />
          </motion.div>

          {/* Slider track */}
          <div className="relative px-2 mb-2">
            <div className="absolute top-1/2 left-2 right-2 h-2 -translate-y-1/2 bg-primary/15 rounded-full" />
            <div className="relative flex justify-between items-center">
              {levels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="relative z-10 flex items-center justify-center transition-all active:scale-95"
                >
                  <div
                    className={`rounded-full transition-all duration-200 ${
                      selected === i
                        ? 'w-12 h-12 bg-primary shadow-lg shadow-primary/20'
                        : 'w-6 h-6 bg-primary/25'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between px-1 mb-3">
            <span className="text-xs font-medium text-foreground">Unsatisfied</span>
            <span className="text-xs font-medium text-foreground">Really satisfied</span>
          </div>

          {/* Micro-copy */}
          <motion.div
            key={selected !== null ? `copy-${selected}` : 'none'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center mb-2 min-h-[1.5em]"
          >
            {selected !== null && (
              <p className="text-xs font-medium text-muted-foreground">{levels[selected].microcopy}</p>
            )}
          </motion.div>


          <div className="mt-auto">
            <button
              onClick={onNext}
              disabled={selected === null}
              className={`w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-all ${
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
