import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

/**
 * Custom "What is Rilo?" teach flow screens.
 * Variant is encoded in `step.illustrationLabel`:
 *   'planner' | 'routine' | 'task-details' | 'tools-hub' | 'suggest'
 * No inputs, no questions — single tap to advance.
 */
export function RiloTeachScreen({ step, onNext }: Props) {
  const variant = step.illustrationLabel || 'planner';

  const handleTap = () => {
    haptic.light();
    onNext();
  };

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-[#FFF7F0] to-white">
      {/* Visual area */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-4">
        {variant === 'planner' && <PlannerVisual />}
        {variant === 'routine' && <RoutineVisual />}
        {variant === 'task-details' && <TaskDetailsVisual />}
        {variant === 'tools-hub' && <ToolsHubVisual />}
        {variant === 'suggest' && <SuggestVisual />}
      </div>

      {/* Text + CTA */}
      <div className="shrink-0 px-6 pb-10">
        <motion.h1
          key={`title-${step.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-[26px] leading-[1.2] font-bold text-[#1a1f3d] text-center"
        >
          {step.title}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="mt-3 text-[15px] leading-snug text-[#1a1f3d]/70 text-center"
          >
            {step.subtitle}
          </motion.p>
        )}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          onClick={handleTap}
          className="mt-7 w-full h-[56px] rounded-2xl bg-[#1a1f3d] text-white font-semibold text-[16px] active:opacity-80 transition-opacity"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {step.buttonLabel || 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}

/* ---------- Visual 1: Planner with 3 colored task blocks ---------- */
function PlannerVisual() {
  const blocks = [
    { time: '8:00', title: 'Morning stretch', color: '#FFD6A5', dot: '#F08A3E' },
    { time: '12:30', title: 'Gratitude break', color: '#CDE7FF', dot: '#3E8AF0' },
    { time: '20:00', title: 'Wind-down read', color: '#E5D6FF', dot: '#8A5CF0' },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Today</p>
            <p className="text-[18px] font-bold text-[#1a1f3d]">Wed, Apr 29</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1a1f3d] text-white flex items-center justify-center text-[14px] font-bold">R</div>
        </div>
        <div className="space-y-2.5">
          {blocks.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.35 }}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
              style={{ background: b.color }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.dot }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#1a1f3d]/60">{b.time}</p>
                <p className="text-[14px] font-semibold text-[#1a1f3d] truncate">{b.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Visual 2: Routine with 3 mini-tasks ticking off ---------- */
function RoutineVisual() {
  const tasks = [
    { emoji: '💧', title: 'Drink a glass of water' },
    { emoji: '🧘', title: '2 min of deep breathing' },
    { emoji: '📝', title: 'Write one good thing' },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[20px]">🌅</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Morning routine</p>
            <p className="text-[16px] font-bold text-[#1a1f3d]">3 small wins</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {tasks.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.18, duration: 0.3 }}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3 bg-[#F4F2EF]"
            >
              <motion.div
                initial={{ scale: 0.6, background: '#FFFFFF' }}
                animate={{ scale: 1, background: '#22C55E' }}
                transition={{ delay: 0.5 + i * 0.35, duration: 0.3 }}
                className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#22C55E] shrink-0"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.35, duration: 0.25 }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.span>
              </motion.div>
              <span className="text-[18px]">{t.emoji}</span>
              <motion.p
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.55 }}
                transition={{ delay: 0.6 + i * 0.35, duration: 0.3 }}
                className="flex-1 text-[14px] font-semibold text-[#1a1f3d] line-through decoration-[#1a1f3d]/40"
              >
                {t.title}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Visual 3: Suggested first routine + swap chip ---------- */
function SuggestVisual() {
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFE6CC] text-[#B8590E] text-[10px] font-bold uppercase tracking-wider">
            ✨ Suggested
          </span>
        </div>
        <p className="text-[18px] font-bold text-[#1a1f3d] leading-tight">Your first routine</p>
        <p className="text-[12px] text-[#1a1f3d]/60 mt-0.5">Morning · 5 min</p>

        <div className="mt-4 space-y-2">
          {[
            { emoji: '💧', title: 'Drink water' },
            { emoji: '🧘', title: 'Deep breathing' },
            { emoji: '📝', title: 'One good thing' },
          ].map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[#F4F2EF]"
            >
              <span className="text-[18px]">{t.emoji}</span>
              <p className="flex-1 text-[14px] font-semibold text-[#1a1f3d]">{t.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Swap chip floating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4, type: 'spring' }}
          className="absolute -right-2 -bottom-2 px-3 py-2 rounded-full bg-[#1a1f3d] text-white text-[12px] font-semibold shadow-lg flex items-center gap-1.5"
        >
          <span>🔄</span> Swap any task
        </motion.div>
      </div>
    </div>
  );
}