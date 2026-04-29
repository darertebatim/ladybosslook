import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import riloAppIcon from '@/assets/rilo-app-icon.png';
import { whatIsRiloFlow } from '@/data/onboarding-flows/what-is-rilo';
import type { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

/**
 * Reassurance screen shown after the 3 task pickers, before the AI step.
 * Picks 3 representative chips from what the user just selected and
 * animates them folding down into a small planner card — making it
 * visceral that "we got your answers and put them in your routine."
 * Auto-advances after the animation; tap to skip.
 */
export function RiloBuildingPlanScreen({ step, onNext, answers }: Props) {
  // Build a label -> emoji lookup from the picker steps in this flow
  const labelEmoji = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of whatIsRiloFlow.steps as any[]) {
      if (s.type === 'rilo-pick-tasks' && Array.isArray(s.pickerTasks)) {
        for (const t of s.pickerTasks) map[t.label] = t.emoji;
      }
    }
    return map;
  }, []);

  // Pick 3 reps: one from morning, midday/afternoon, evening if possible
  const chips = useMemo(() => {
    const picks: { label: string; emoji: string; color: string }[] = [];
    const palette = ['#FFB347', '#F08AB5', '#8A5CF0']; // sun, midday, dusk
    const bucketIds = ['wir-pick-morning', 'wir-pick-afternoon', 'wir-pick-evening'];
    bucketIds.forEach((id, i) => {
      const a = answers?.[id];
      const arr = Array.isArray(a) ? a : a ? [a] : [];
      if (arr.length > 0) {
        const label = arr[0];
        picks.push({ label, emoji: labelEmoji[label] || '✨', color: palette[i] });
      }
    });
    // Pad to 3 with any other answers if we came up short
    if (picks.length < 3) {
      const leftover: string[] = [];
      bucketIds.forEach((id) => {
        const a = answers?.[id];
        const arr = Array.isArray(a) ? a : a ? [a] : [];
        arr.slice(1).forEach((l) => leftover.push(l));
      });
      while (picks.length < 3 && leftover.length > 0) {
        const label = leftover.shift()!;
        picks.push({
          label,
          emoji: labelEmoji[label] || '✨',
          color: palette[picks.length] || '#8A5CF0',
        });
      }
    }
    // Final fallback so the screen is never empty
    while (picks.length < 3) {
      const fallbacks = [
        { label: 'Morning routine', emoji: '🌅', color: '#FFB347' },
        { label: 'Midday reset', emoji: '🥗', color: '#F08AB5' },
        { label: 'Wind down', emoji: '🌙', color: '#8A5CF0' },
      ];
      picks.push(fallbacks[picks.length]);
    }
    return picks.slice(0, 3);
  }, [answers, labelEmoji]);

  const [phase, setPhase] = useState<'chips' | 'fold' | 'planner' | 'done'>('chips');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fold'), 900);
    const t2 = setTimeout(() => {
      haptic.light();
      setPhase('planner');
    }, 1700);
    const t3 = setTimeout(() => setPhase('done'), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleTap = () => {
    haptic.light();
    onNext();
  };

  return (
    <div
      onClick={handleTap}
      className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF4DC] via-[#FFE0E6] to-[#FBD4E2] cursor-pointer"
    >
      {/* Soft glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(circle, #FFD36E 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, #E84A6F 0%, transparent 70%)' }}
        />
      </div>

      {/* Visual stage */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="relative w-[280px] h-[340px] flex items-center justify-center">
          {/* Floating chips that fold down into the card */}
          {chips.map((c, i) => {
            const startX = (i - 1) * 90; // -90, 0, 90
            const startY = -90;
            const targetY = 60 + i * 44; // row inside the card
            const isFolding = phase !== 'chips';
            return (
              <motion.div
                key={c.label + i}
                initial={{ opacity: 0, y: startY - 20, x: startX, scale: 0.8 }}
                animate={
                  isFolding
                    ? {
                        opacity: 1,
                        x: 0,
                        y: targetY,
                        scale: 0.78,
                      }
                    : { opacity: 1, y: startY, x: startX, scale: 1 }
                }
                transition={{
                  duration: isFolding ? 0.7 : 0.45,
                  delay: isFolding ? i * 0.12 : i * 0.15,
                  ease: [0.65, 0, 0.35, 1],
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.18)] border"
                style={{ borderColor: `${c.color}55` }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: c.color }}
                />
                <img
                  src={getFluentEmojiUrl(c.emoji)}
                  alt=""
                  className="w-4 h-4"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-[12px] font-semibold text-black whitespace-nowrap max-w-[140px] truncate">
                  {c.label}
                </span>
              </motion.div>
            );
          })}

          {/* Planner card that rises to catch the chips */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.92 }}
            animate={
              phase === 'chips'
                ? { opacity: 0, y: 80, scale: 0.92 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-6 mx-auto w-[260px] h-[300px] rounded-[24px] bg-white shadow-[0_24px_50px_-18px_rgba(232,74,111,0.45)] border border-black/5 overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5">
              <img
                src={riloAppIcon}
                alt="Rilo"
                className="w-6 h-6 rounded-[7px]"
              />
              <span className="text-[12px] font-bold text-black">
                Today
              </span>
              <span className="ml-auto text-[10px] font-semibold text-black/40 uppercase tracking-wider">
                Building…
              </span>
            </div>
            {/* Three empty rows where the chips will land — rendered as faint lines */}
            <div className="px-4 pt-3 space-y-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'planner' || phase === 'done' ? 0.08 : 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="h-9 rounded-xl bg-black"
                />
              ))}
            </div>

            {/* Subtle progress shimmer at the bottom of the card */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: phase !== 'chips' ? '100%' : '-100%' }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#E84A6F] to-transparent"
            />
          </motion.div>
        </div>
      </div>

      {/* Copy */}
      <div className="shrink-0 px-6 pb-12 relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A0123F] mb-2"
        >
          ✨ Got it
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-[26px] leading-[1.2] font-bold text-black"
        >
          {step.title || 'Building your plan…'}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-3 text-[15px] leading-snug text-black/70"
          >
            {step.subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}