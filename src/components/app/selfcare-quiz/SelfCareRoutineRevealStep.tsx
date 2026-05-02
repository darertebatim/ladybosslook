import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';

interface RevealedTask {
  id: string;
  title: string;
  emoji: string;
  color?: string;
}

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

/**
 * Final step of the self-care quiz: shows the routine the user just built
 * as a friendly notepad-style card (Finch-inspired) so they actually
 * discover what's now waiting on Home, instead of being dropped in cold.
 */
export function SelfCareRoutineRevealStep({ step, onNext, answers }: Props) {
  const tasks: RevealedTask[] = useMemo(() => {
    const parse = (raw: unknown): RevealedTask[] | null => {
      if (typeof raw !== 'string') return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tasks)) return parsed.tasks as RevealedTask[];
      } catch {}
      return null;
    };
    const fromAnswers = parse(answers?.['sc-suggestions']);
    if (fromAnswers && fromAnswers.length) return fromAnswers;
    const fromStorage = parse(localStorage.getItem('simora_selfcare_revealed_tasks'));
    if (fromStorage && fromStorage.length) return fromStorage;
    return [];
  }, [answers]);

  const handleTap = () => {
    haptic.success();
    onNext();
  };

  const hasTasks = tasks.length > 0;

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-[#FFF7EC] via-[#FFEFE0] to-[#FFE6D6] relative overflow-hidden">
      {/* Soft ambient warmth */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="shrink-0 px-6 pt-10 pb-3 relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E]"
        >
          ✨ Meet your new routine
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-2 text-[24px] leading-tight font-extrabold text-[#1a1f3d]"
        >
          {step.title || 'Your starter plan'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="mt-2 text-[14px] text-[#1a1f3d]/65"
        >
          {step.subtitle || "These will be waiting for you on Home — one tiny win at a time."}
        </motion.p>
      </div>

      {/* Notepad card */}
      <div className="flex-1 px-5 pb-3 overflow-y-auto relative z-10">
        <div className="relative max-w-[380px] mx-auto">
          {/* Notepad rings */}
          <div className="flex justify-center gap-6 -mb-2 relative z-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="block w-3 h-5 rounded-b-md bg-[#E8B266]"
                style={{ boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.1)' }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-[#FFF6E1] border border-[#F2D9A6] shadow-[0_24px_60px_-20px_rgba(180,120,40,0.35)] p-5 pt-7"
          >
            <div className="text-center mb-4">
              <h2 className="text-[18px] font-extrabold text-[#1a1f3d]">Your starter plan</h2>
              <p className="text-[13px] text-[#1a1f3d]/55 mt-0.5">Tiny wins to start showing up for yourself.</p>
            </div>

            {hasTasks ? (
              <ul className="divide-y divide-[#F0DAA8]">
                {tasks.map((t, i) => (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.32, delay: 0.3 + i * 0.07 }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                      <FluentEmoji emoji={t.emoji || '✨'} size={22} />
                    </div>
                    <span className="text-[15px] font-semibold text-[#1a1f3d]">{t.title}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center text-[14px] text-[#1a1f3d]/60">
                Your plan is ready on Home — open it to see your tasks.
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-5 pt-3 pb-6 relative z-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          onClick={handleTap}
          className="w-full h-[56px] rounded-2xl text-white font-bold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)]"
        >
          {step.buttonLabel || "Let's do it!"}
        </motion.button>
      </div>
    </div>
  );
}