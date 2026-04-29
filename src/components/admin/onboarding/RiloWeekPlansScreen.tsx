import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

const HINTS: { emoji: string; label: string }[] = [
  { emoji: '📚', label: 'Work or school' },
  { emoji: '✅', label: 'To-dos and errands' },
  { emoji: '💜', label: 'Social plans' },
  { emoji: '🏡', label: 'Home & family' },
];

/**
 * Final onboarding screen — Tiimo-style "Any other plans this week?" chat.
 * UI-only: text is captured and passed via onAnswer; AI extraction wired later.
 */
export function RiloWeekPlansScreen({ step, onNext, onAnswer }: Props) {
  const [text, setText] = useState('');

  const handleContinue = () => {
    haptic.medium();
    if (onAnswer) onAnswer(step.id, text.trim());
    onNext();
  };

  const handleSkip = () => {
    haptic.light();
    if (onAnswer) onAnswer(step.id, '');
    onNext();
  };

  return (
    <div
      className="h-full w-full flex flex-col relative"
      style={{
        background:
          'linear-gradient(170deg, #C7B8FF 0%, #D8C9FF 35%, #E9DFFF 65%, #F6F1FF 100%)',
      }}
    >
      {/* Top-right Skip */}
      <div className="shrink-0 px-6 pt-2 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-[14px] font-medium text-[#1a1f3d]/70 active:opacity-60 px-2 py-1.5"
        >
          Skip
        </button>
      </div>

      {/* Spacer above content */}
      <div className="flex-1" />

      {/* Content (anchored toward bottom like Tiimo) */}
      <div className="shrink-0 px-6 pb-4">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[28px] leading-[1.15] font-bold text-[#1a1f3d]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {step.title || 'Any other plans this week?'}
        </motion.h1>

        <motion.ul
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 space-y-1.5"
        >
          {HINTS.map((h) => (
            <li
              key={h.label}
              className="flex items-center gap-2 text-[15px] text-[#1a1f3d]"
            >
              <span className="text-base leading-none">{h.emoji}</span>
              <span className="font-medium">{h.label}</span>
            </li>
          ))}
        </motion.ul>

        {/* Textarea */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="mt-5 relative"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your plans for the week"
            rows={4}
            className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3.5 pr-14 text-[15px] text-[#1a1f3d] placeholder:text-[#1a1f3d]/40 outline-none focus:bg-white/90 transition-colors resize-none"
          />
          {/* Disabled mic placeholder */}
          <button
            type="button"
            disabled
            className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black/20 flex items-center justify-center opacity-50 cursor-not-allowed"
            aria-label="Voice input (coming soon)"
          >
            <Mic className="h-4 w-4 text-white" />
          </button>
        </motion.div>

        {/* Continue */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          onClick={handleContinue}
          className={cn(
            'mt-5 w-full h-12 rounded-full bg-[#1a1f3d] text-white flex items-center justify-center active:scale-[0.98] transition-transform',
          )}
        >
          <span className="text-[15px] font-semibold">
            {step.buttonLabel || 'Build my week'}
          </span>
        </motion.button>
      </div>

      {/* Bottom safe-area */}
      <div className="shrink-0 h-6" />
    </div>
  );
}