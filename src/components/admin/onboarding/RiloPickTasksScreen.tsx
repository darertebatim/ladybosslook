import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

const BUCKET_META: Record<
  'morning' | 'afternoon' | 'evening',
  { label: string; emoji: string; chipBg: string; chipFg: string; pickedBg: string }
> = {
  morning: {
    label: 'MORNING',
    emoji: '🌅',
    chipBg: '#FDECDD',
    chipFg: '#5C3A1E',
    pickedBg: '#FFE4CC',
  },
  afternoon: {
    label: 'AFTERNOON',
    emoji: '☀️',
    chipBg: '#E5ECFF',
    chipFg: '#1F2C5C',
    pickedBg: '#D9E2FF',
  },
  evening: {
    label: 'EVENING',
    emoji: '🌙',
    chipBg: '#EAE2FF',
    chipFg: '#3A2766',
    pickedBg: '#DCD0FF',
  },
};

/**
 * Tiimo-style pill picker for Morning / Afternoon / Evening routine tasks.
 * UI-only: selections are echoed via onAnswer but no DB writes happen here.
 */
export function RiloPickTasksScreen({ step, onNext, onAnswer }: Props) {
  const bucket = step.bucket || 'morning';
  const meta = BUCKET_META[bucket];
  const tasks = step.pickerTasks || [];
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const togglePick = (label: string) => {
    haptic.light();
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleSuggest = () => {
    haptic.medium();
    // Pick 4 random tasks (Fisher–Yates shuffle on a copy)
    const pool = [...tasks];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const suggested = pool.slice(0, Math.min(4, pool.length)).map((t) => t.label);
    setPicked(new Set(suggested));
  };

  const handleContinue = () => {
    if (picked.size === 0) return;
    haptic.medium();
    if (onAnswer) onAnswer(step.id, Array.from(picked));
    onNext();
  };

  const canContinue = picked.size > 0;

  // Split into 2 columns for a slightly scattered, organic feel
  const { col1, col2 } = useMemo(() => {
    const c1: typeof tasks = [];
    const c2: typeof tasks = [];
    tasks.forEach((t, i) => (i % 2 === 0 ? c1 : c2).push(t));
    return { col1: c1, col2: c2 };
  }, [tasks]);

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
        {/* Bucket chip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mb-4"
          style={{ background: meta.chipBg }}
        >
          <span className="text-base leading-none">{meta.emoji}</span>
          <span
            className="text-[11px] font-semibold tracking-[0.12em]"
            style={{ color: meta.chipFg }}
          >
            {meta.label}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-[28px] leading-[1.15] font-bold text-[#1a1f3d]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {step.title}
        </motion.h1>

        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="mt-3 text-[15px] leading-snug text-[#1a1f3d]/70"
          >
            {step.subtitle}
          </motion.p>
        )}

        {/* Pill grid (2 columns, slightly staggered) */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3">
            {col1.map((t, idx) => (
              <PillButton
                key={t.label}
                task={t}
                picked={picked.has(t.label)}
                pickedBg={meta.pickedBg}
                onClick={() => togglePick(t.label)}
                delay={idx * 0.04}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {col2.map((t, idx) => (
              <PillButton
                key={t.label}
                task={t}
                picked={picked.has(t.label)}
                pickedBg={meta.pickedBg}
                onClick={() => togglePick(t.label)}
                delay={idx * 0.04 + 0.02}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom CTAs */}
      <div className="shrink-0 px-6 pb-8 pt-3 bg-white border-t border-black/5 space-y-2.5">
        <button
          onClick={handleSuggest}
          className="w-full h-12 rounded-full border-2 border-[#1a1f3d] bg-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Sparkles className="h-4 w-4 text-[#1a1f3d]" strokeWidth={2.5} />
          <span className="text-[15px] font-semibold text-[#1a1f3d]">
            Suggest for me
          </span>
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(
            'w-full h-12 rounded-full flex items-center justify-center transition-all',
            canContinue
              ? 'bg-[#1a1f3d] text-white active:scale-[0.98]'
              : 'bg-black/10 text-black/40 cursor-not-allowed',
          )}
        >
          <span className="text-[15px] font-semibold">
            {canContinue
              ? `Continue with ${picked.size} ${picked.size === 1 ? 'habit' : 'habits'}`
              : 'Choose at least one to begin'}
          </span>
        </button>
      </div>
    </div>
  );
}

function PillButton({
  task,
  picked,
  pickedBg,
  onClick,
  delay,
}: {
  task: { label: string; emoji: string };
  picked: boolean;
  pickedBg: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl px-3.5 py-3 flex items-center gap-2 text-left transition-all active:scale-[0.97]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
      )}
      style={{
        background: picked ? pickedBg : '#FFFFFF',
      }}
    >
      <FluentEmoji emoji={task.emoji} size={22} />
      <span className="text-[14.5px] font-semibold text-[#1a1f3d] leading-tight">
        {task.label}
      </span>
    </motion.button>
  );
}