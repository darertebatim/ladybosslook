import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, ArrowUp, RotateCcw, Pencil, Check } from 'lucide-react';
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

type Stage = 'input' | 'building' | 'matching' | 'picker' | 'success';

interface ExtractedTask {
  id: string;
  label: string;
  emoji: string;
  kind: string;
}

/**
 * Final onboarding screen — "Any other plans this week?" with a fake-AI
 * extraction sequence. Stages:
 *   input   → typing UI (white card + hints)
 *   building → user bubble at top + orb + "Building your tasks…"
 *   matching → same + "Matching the right titles…"
 *   picker   → "Pick tasks for your plan" list with select/reset/edit
 *   success  → green banner → auto-advance
 */
export function RiloWeekPlansScreen({ step, onNext, onAnswer }: Props) {
  const [stage, setStage] = useState<Stage>('input');
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Submit / sequence ───────────────────────────────────────
  const startSequence = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    haptic.medium();
    setStage('building');
    // Building → Matching → Picker (fake AI; UI-only for now)
    setTimeout(() => setStage('matching'), 1600);
    setTimeout(() => {
      const extracted = fakeExtract(trimmed);
      setTasks(extracted);
      setSelectedIds(new Set(extracted.map((t) => t.id)));
      setStage('picker');
      haptic.light();
    }, 3200);
  };

  const handleReset = () => {
    haptic.light();
    setStage('input');
    setTasks([]);
    setSelectedIds(new Set());
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleEditPrompt = () => {
    haptic.light();
    setStage('input');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const toggleSelect = (id: string) => {
    haptic.light();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddTasks = () => {
    if (selectedIds.size === 0) return;
    haptic.medium();
    const chosen = tasks
      .filter((t) => selectedIds.has(t.id))
      .map((t) => t.label);
    if (onAnswer) onAnswer(step.id, chosen);
    setStage('success');
    setTimeout(() => onNext(), 1700);
  };

  const handleSkip = () => {
    haptic.light();
    if (onAnswer) onAnswer(step.id, '');
    onNext();
  };

  const selectedCount = selectedIds.size;

  return (
    <div
      className="h-full w-full flex flex-col relative overflow-hidden"
      style={{
        background:
          stage === 'input'
            ? 'linear-gradient(170deg, #C7B8FF 0%, #D8C9FF 35%, #E9DFFF 65%, #F6F1FF 100%)'
            : stage === 'success'
              ? 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)'
              : '#FFFFFF',
        transition: 'background 400ms ease',
      }}
    >
      {/* ── Top success banner (stage: success) ────────────── */}
      <AnimatePresence>
        {stage === 'success' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute inset-x-0 top-0 z-30 px-4 pt-4 pb-3"
            style={{ background: '#A98AF0' }}
          >
            <p className="text-center text-white font-semibold text-[15px]">
              ✨ {selectedCount} task{selectedCount === 1 ? '' : 's'} successfully added to your plan ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT stage (original UI) ───────────────────────── */}
      {stage === 'input' && (
        <>
          <div className="shrink-0 px-6 pt-2 flex justify-end">
            <button
              onClick={handleSkip}
              className="text-[14px] font-medium text-[#1a1f3d]/70 active:opacity-60 px-2 py-1.5"
            >
              Skip
            </button>
          </div>
          <div className="flex-1" />
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

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="mt-5 relative"
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write or speak your plans"
                rows={4}
                className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3.5 pr-14 text-[15px] text-[#1a1f3d] placeholder:text-[#1a1f3d]/40 outline-none focus:bg-white/90 transition-colors resize-none"
              />
              {text.trim() ? (
                <button
                  type="button"
                  onClick={() => startSequence(text)}
                  className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Submit"
                >
                  <ArrowUp className="h-4 w-4 text-white" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black/80 flex items-center justify-center opacity-90"
                  aria-label="Voice input (coming soon)"
                >
                  <Mic className="h-4 w-4 text-white" />
                </button>
              )}
            </motion.div>
          </div>
          <div className="shrink-0 h-6" />
        </>
      )}

      {/* ── BUILDING / MATCHING / PICKER / SUCCESS stages ──── */}
      {stage !== 'input' && (
        <div className="flex-1 flex flex-col px-5 pt-14 overflow-hidden">
          {/* User prompt bubble */}
          <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="shrink-0"
          >
            <div className="w-full rounded-2xl bg-white border border-black/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-2.5">
              <Sparkles className="h-[18px] w-[18px] text-[#A98AF0] shrink-0" />
              <p className="text-[16px] font-semibold text-[#1a1f3d] truncate">
                {text}
              </p>
            </div>
            {/* Reset / edit row */}
            {(stage === 'building' || stage === 'matching' || stage === 'picker') && (
              <div className="mt-2.5 flex items-center justify-end gap-3 pr-1">
                <button
                  onClick={handleReset}
                  className="h-8 w-8 flex items-center justify-center text-[#1a1f3d]/70 active:opacity-60"
                  aria-label="Reset"
                >
                  <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <button
                  onClick={handleEditPrompt}
                  className="h-8 w-8 flex items-center justify-center text-[#1a1f3d]/70 active:opacity-60"
                  aria-label="Edit"
                >
                  <Pencil className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Loading orb (building / matching) */}
          <AnimatePresence mode="wait">
            {(stage === 'building' || stage === 'matching') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center pb-24"
              >
                <PulsingOrb />
                <motion.h2
                  key={stage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-10 text-[24px] font-bold text-[#1a1f3d]"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {stage === 'building' ? 'Building your tasks…' : 'Matching the right titles…'}
                </motion.h2>
              </motion.div>
            )}

            {/* Picker stage */}
            {stage === 'picker' && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col mt-5 overflow-hidden"
              >
                <h2
                  className="text-[26px] font-bold text-[#1a1f3d] mb-3 px-1"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  Pick tasks for your plan
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2.5 pb-32 -mx-1 px-1">
                  {tasks.map((task) => {
                    const isSelected = selectedIds.has(task.id);
                    return (
                      <button
                        key={task.id}
                        onClick={() => toggleSelect(task.id)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left active:scale-[0.99] transition-all',
                          isSelected ? 'border-black/10' : 'border-black/5 opacity-60',
                        )}
                      >
                        {/* Emoji chip */}
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(0,0,0,0.05)' }}
                        >
                          <span className="text-[22px] leading-none">{task.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-[#1a1f3d] truncate">
                            {task.label}
                          </p>
                          <p className="text-[12px] text-[#1a1f3d]/50 mt-0.5 flex items-center gap-1">
                            <span>📅</span>
                            <span>{task.kind}</span>
                          </p>
                        </div>
                        <div
                          className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all',
                            isSelected ? 'bg-[#22C55E]' : 'bg-black/10',
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Success — keep picker visually faded */}
            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1"
              />
            )}
          </AnimatePresence>

          {/* Add tasks CTA */}
          <AnimatePresence>
            {stage === 'picker' && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-white via-white to-white/0"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
              >
                <button
                  onClick={handleAddTasks}
                  disabled={selectedCount === 0}
                  className={cn(
                    'w-full h-14 rounded-full bg-black text-white flex items-center justify-between px-6 active:scale-[0.98] transition-all',
                    selectedCount === 0 && 'opacity-40',
                  )}
                >
                  <span className="text-[16px] font-bold">
                    Add task{selectedCount === 1 ? '' : 's'} ({selectedCount})
                  </span>
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── The pulsing purple orb (CSS only, matches screenshots) ──
function PulsingOrb() {
  return (
    <div className="relative h-[150px] w-[150px] flex items-center justify-center">
      {/* Outer halo */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.25, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(169,138,240,0.45) 0%, rgba(169,138,240,0) 70%)',
        }}
      />
      {/* Soft ring */}
      <div
        className="absolute h-[130px] w-[130px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(214,201,255,0.9) 0%, rgba(214,201,255,0.3) 60%, transparent 80%)',
        }}
      />
      {/* Core orb */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-[110px] w-[110px] rounded-full shadow-[0_10px_30px_-8px_rgba(120,90,200,0.5)]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #D6C9FF 0%, #B8A4F2 45%, #9C82E8 100%)',
        }}
      />
    </div>
  );
}

// ── Fake "AI" extraction (UI placeholder until real model is wired) ──
function fakeExtract(raw: string): ExtractedTask[] {
  // Split by commas / "and" / newlines / sentence terminators.
  const pieces = raw
    .split(/[,\n;]|(?:\s+and\s+)|(?:\.\s+)/i)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2);

  // If nothing parseable, fall back to a single test task so the UI still has content.
  const list = pieces.length === 0 ? [raw.trim() || 'Test Task'] : pieces;

  const EMOJIS = ['📝', '✅', '💜', '📚', '🏡', '🍳', '💪', '☕', '🛒'];
  return list.slice(0, 8).map((label, i) => ({
    id: `t-${i}-${label.slice(0, 8)}`,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    emoji: EMOJIS[i % EMOJIS.length],
    kind: 'To-do',
  }));
}
