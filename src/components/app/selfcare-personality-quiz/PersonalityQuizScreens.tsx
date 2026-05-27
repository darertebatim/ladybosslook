import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import type { OnboardingStep, OnboardingAnswers, OnboardingOptionVariant } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import {
  branchFor,
  aspirationClusterFor,
  resolveFinalResult,
  scorePersonality,
  applySurvivorGate,
  type Personality,
  type FinalResult,
  type Cluster,
} from '@/utils/selfcare-personality-scoring';
import { SelfCareSuggestionsStep } from '@/components/app/selfcare-quiz/SelfCareSuggestionsStep';
import { SelfCareRiloCelebrationStep } from '@/components/app/selfcare-quiz/SelfCareRiloCelebrationStep';
import { SelfCarePushPermissionStep } from '@/components/app/selfcare-quiz/SelfCarePushPermissionStep';
import { AmbientGlow } from '@/components/app/selfcare-quiz/visuals/AmbientGlow';

/* ──────────────────────────────────────────────────────────────
 * Self-Care Personality Quiz (v2.1) — minimal, mobile-first screens.
 * Reuses simple styling — no clustered jargon shown to the user.
 * ────────────────────────────────────────────────────────────── */

interface BaseProps {
  step: OnboardingStep & { variants?: OnboardingOptionVariant[] };
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

const PERSONALITY_COPY: Record<Personality, { name: string; emoji: string; tagline: string; body: string }> = {
  giver: {
    name: 'The Giver',
    emoji: '💗',
    tagline: "You pour into everyone — let's pour back into you.",
    body: "You're the one people lean on. You feel love through giving. But the well runs dry when no one fills it back. Your next step is letting yourself receive — without earning it first.",
  },
  achiever: {
    name: 'The Achiever',
    emoji: '🎯',
    tagline: 'You move mountains — your body is asking for a pause.',
    body: "You don't stop until you crash. Productivity feels safer than rest. But rest isn't a reward you earn — it's the soil your wins grow from. Your next step is giving yourself permission to slow down before your body forces it.",
  },
  survivor: {
    name: 'The Survivor',
    emoji: '🌱',
    tagline: "You're holding so much — let's make this gentle.",
    body: "You're in a hard season. Big goals aren't what you need right now. What you need is one small, kind thing today — and that's enough. We'll keep this tiny on purpose.",
  },
  ghost: {
    name: 'The Ghost',
    emoji: '🌙',
    tagline: "You've drifted from yourself — let's come back home.",
    body: "You're going through the motions but not really here. The numbness is a signal, not a flaw. Your next step is one small thing that makes you feel present in your own life again.",
  },
  perfectionist: {
    name: 'The Perfectionist',
    emoji: '✨',
    tagline: "You hold a standard nobody else could — let's soften it.",
    body: "You miss one day and quit the whole thing. The rules you've built are punishing you. Your next step is letting good enough be enough — and showing up imperfectly on purpose.",
  },
  ruminator: {
    name: 'The Ruminator',
    emoji: '🌊',
    tagline: "Your mind doesn't stop — let's help it land.",
    body: "The noise is loudest at night, before bed, in the in-between. You replay, anticipate, rehearse. Your next step is something physical and present — to give your body and breath a place to land.",
  },
};

/* ── intro ──────────────────────────────────────────────────── */

export function ScpIntroScreen({ step, onNext }: BaseProps) {
  // Six personalities, each a floating chip that blooms in.
  // Positions are tuned to fan out around the central sparkle bloom.
  const chips: Array<{ name: string; emoji: string; x: number; y: number; rot: number; tint: string }> = [
    { name: 'Giver',         emoji: '💗', x: -118, y: -84, rot: -8, tint: '#FFE0EC' },
    { name: 'Achiever',      emoji: '🎯', x:  118, y: -96, rot:  9, tint: '#FFE7C9' },
    { name: 'Survivor',      emoji: '🌱', x: -134, y:  18, rot: -4, tint: '#E1F4D6' },
    { name: 'Ghost',         emoji: '🌙', x:  134, y:  30, rot:  6, tint: '#E5D6FF' },
    { name: 'Perfectionist', emoji: '✨', x:  -90, y: 118, rot: -7, tint: '#FFE3D1' },
    { name: 'Ruminator',     emoji: '🌊', x:  100, y: 132, rot:  5, tint: '#D6ECFF' },
  ];
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#FFF4DC] via-[#FFE0E6] to-[#F0E6FF]">
      {/* Ambient sunrise glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full blur-3xl opacity-70"
          style={{ background: 'radial-gradient(circle, #FFD49A 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-24 w-[280px] h-[280px] rounded-full blur-3xl opacity-55"
          style={{ background: 'radial-gradient(circle, #FFB4C8 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 -left-20 w-[320px] h-[320px] rounded-full blur-3xl opacity-55"
          style={{ background: 'radial-gradient(circle, #D9C6FF 0%, transparent 70%)' }}
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const left = (i * 41 + 7) % 100;
          const top = (i * 59 + 11) % 100;
          const delay = (i % 6) * 0.35;
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, delay, repeat: Infinity, repeatDelay: 1.6 }}
              className="absolute text-[10px]"
              style={{ left: `${left}%`, top: `${top}%`, color: '#A0123F', opacity: 0.55 }}
            >
              ✨
            </motion.span>
          );
        })}
      </div>

      {/* Visual stage */}
      <div className="relative flex-1 flex items-center justify-center px-6">
        <div className="relative w-full max-w-[320px] h-[320px] flex items-center justify-center">
          {/* Central sparkle bloom */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 w-24 h-24 rounded-[28px] flex items-center justify-center shadow-[0_22px_50px_-12px_rgba(236,72,153,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #F08A3E 0%, #EC4899 55%, #8A5CF0 100%)',
            }}
          >
            <Sparkles className="w-11 h-11 text-white" strokeWidth={2.4} />
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.6, opacity: 0.65 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.6, delay: 0.3 + i * 0.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-[28px] border-2 border-white/70"
              />
            ))}
          </motion.div>

          {/* Floating personality chips */}
          {chips.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: c.x, y: c.y }}
              transition={{
                delay: 0.5 + i * 0.09,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute z-10"
              style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
            >
              <motion.div
                animate={{ y: [0, -4, 0], rotate: [c.rot, c.rot + 1.5, c.rot] }}
                transition={{
                  duration: 4 + (i % 3) * 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
                className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full backdrop-blur-md shadow-ios border border-white/70"
                style={{ background: `${c.tint}EE` }}
              >
                <span className="w-6 h-6 rounded-full bg-white/85 flex items-center justify-center">
                  <FluentEmoji emoji={c.emoji} size={16} />
                </span>
                <span className="text-[11px] font-semibold text-[#1a1f3d] whitespace-nowrap">
                  {c.name}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Copy + CTA */}
      <div className="relative shrink-0 px-6 pb-10">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8590E] mb-2"
        >
          ✨ Self-Care Personality
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-[28px] leading-[1.18] font-bold text-[#1a1f3d] text-center whitespace-pre-line"
        >
          {step.title}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-3 text-center text-[14px] leading-snug text-[#1a1f3d]/70 max-w-md mx-auto"
          >
            {step.subtitle}
          </motion.p>
        )}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          onClick={() => { haptic.light(); onNext(); }}
          className="mt-6 w-full h-[56px] rounded-2xl text-white font-semibold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)]"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {step.buttonLabel || 'Begin'}
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-3 text-center text-[12px] font-semibold text-[#1a1f3d]/55"
        >
          9 questions · ~2 minutes · honest answers welcome
        </motion.p>
      </div>
    </div>
  );
}

/* legacy intro kept for reference — replaced above */
function ScpIntroScreenLegacy({ step, onNext }: BaseProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between px-6 pt-20 pb-8 bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-28 h-28 rounded-full bg-white/70 backdrop-blur shadow-ios flex items-center justify-center mb-8"
        >
          <FluentEmoji emoji="✨" size={64} />
        </motion.div>
        <h1 className="text-3xl font-bold text-[#1a1f3d] mb-4 leading-tight">{step.title}</h1>
        <p className="text-base text-[#1a1f3d]/70 leading-relaxed">{step.subtitle}</p>
      </div>
      <button
        onClick={() => { haptic.light(); onNext(); }}
        className="w-full max-w-md py-4 rounded-full bg-[#1a1f3d] text-white font-semibold text-base active:opacity-80"
      >
        {step.buttonLabel || 'Begin'}
      </button>
    </div>
  );
}

/* ── single-select (used for plain + resolved branching) ────── */

function SingleSelectInner({
  step,
  onNext,
  onAnswer,
  answers,
  title,
  options,
}: BaseProps & { title: string; options: { label: string; emoji?: string }[] }) {
  const selected = (answers?.[step.id] as string) || '';
  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-4 pb-6 overflow-y-auto bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      {/* ambient blobs to echo the brand gradient */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#FFD49A]/45 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-[#FFB4C8]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-[#D9C6FF]/45 blur-3xl" />
      <div className="relative max-w-md mx-auto w-full flex-1 flex flex-col">
        <h2 className="text-[22px] leading-[1.25] font-semibold text-[#1a1f3d] mb-5 mt-2">{title}</h2>
        <div className="space-y-2.5 flex-1">
          {options.map((opt) => {
            const isSel = selected === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  haptic.light();
                  onAnswer?.(step.id, opt.label);
                  setTimeout(() => onNext(), 180);
                }}
                className={`w-full text-left px-4 py-4 rounded-2xl border transition-all active:scale-[0.98] backdrop-blur-md shadow-ios ${
                  isSel
                    ? 'border-[#1a1f3d]/70 bg-white/90'
                    : 'border-white/60 bg-white/65'
                }`}
              >
                <div className="flex items-center gap-3">
                  {opt.emoji ? <FluentEmoji emoji={opt.emoji} size={28} /> : null}
                  <span className="text-[15px] text-[#1a1f3d] leading-snug">{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── branching Q6/Q7 ────────────────────────────────────────── */

export function ScpBranchingScreen(props: BaseProps) {
  const { step, answers } = props;
  const variant = useMemo(() => {
    const p = applySurvivorGate(scorePersonality(answers || {}), answers || {});
    const branch = branchFor(p);
    const list = step.variants || [];
    return list.find((v) => v.cluster === branch) || list.find((v) => v.cluster === 'shared') || list[0];
  }, [answers, step.variants]);

  if (!variant) return null;
  return <SingleSelectInner {...props} title={variant.title} options={variant.options} />;
}

/* ── dynamic Q8 (aspiration by cluster) ─────────────────────── */

export function ScpDynamicAspirationScreen(props: BaseProps) {
  const { step, answers } = props;
  const variant = useMemo(() => {
    const cluster = aspirationClusterFor(answers || {});
    const list = step.variants || [];
    return list.find((v) => v.cluster === cluster) || list[0];
  }, [answers, step.variants]);
  if (!variant) return null;
  return <SingleSelectInner {...props} title={variant.title} options={variant.options} />;
}

/* ── loader (auto-advance) ──────────────────────────────────── */

export function ScpLoaderScreen({ step, onNext }: BaseProps) {
  useEffect(() => {
    const t = setTimeout(() => onNext(), 1800);
    return () => clearTimeout(t);
  }, [onNext]);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF1E0] to-[#F0E6FF] px-6">
      <Loader2 className="w-10 h-10 text-[#1a1f3d] animate-spin mb-6" />
      <p className="text-[17px] font-medium text-[#1a1f3d] text-center">{step.title || 'A few more questions…'}</p>
    </div>
  );
}

/* ── diagnosis (rich scanning loader, mirrors Self-Care Quiz) ─ */

const SCAN_CATEGORIES: { key: string; emoji: string; label: string }[] = [
  { key: 'calm', emoji: '🧘', label: 'Calm' },
  { key: 'sleep', emoji: '😴', label: 'Sleep' },
  { key: 'nutrition', emoji: '🥗', label: 'Nutrition' },
  { key: 'movement', emoji: '🏃', label: 'Movement' },
  { key: 'hygiene', emoji: '🧴', label: 'Hygiene' },
  { key: 'Presence', emoji: '🧠', label: 'Presence' },
  { key: 'connection', emoji: '💬', label: 'Connection' },
  { key: 'self-kindness', emoji: '💚', label: 'Self-Kindness' },
  { key: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { key: 'productivity', emoji: '📋', label: 'Productivity' },
  { key: 'TidyUp', emoji: '🧹', label: 'Tidy Up' },
  { key: 'Evening', emoji: '🌙', label: 'Evening' },
  { key: 'LovedOnes', emoji: '🥰', label: 'Loved Ones' },
  { key: 'easy-win', emoji: '✨', label: 'Easy Win' },
];

const SCAN_STATUS_MESSAGES = [
  { title: 'Reading your personality…', sub: 'Looking at how you take care of yourself' },
  { title: 'Mapping your gaps…', sub: `Comparing across ${SCAN_CATEGORIES.length} areas` },
  { title: 'Finding what to focus on…', sub: 'Where the smallest shift will matter most' },
  { title: 'Shaping your plan…', sub: 'Picking goals that fit where you are' },
  { title: 'Almost there…', sub: 'Preparing your starter goals' },
];

/** Normalize personality-quiz category keys to the keys the
 *  SelfCareSuggestionsStep uses for labels/emojis/grouping. */
const normalizeCategoryKey = (key: string): string =>
  key === 'selfkind' ? 'self-kindness' : key;

export function ScpDiagnosisScreen({ step, onNext, onAnswer, answers }: BaseProps) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [scanIdx, setScanIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scannedResults, setScannedResults] = useState<Record<string, 'good' | 'gap' | null>>({});
  const [done, setDone] = useState(false);

  // Rotating status copy
  useEffect(() => {
    const t = window.setInterval(
      () => setStatusIdx((i) => (i + 1) % SCAN_STATUS_MESSAGES.length),
      2000,
    );
    return () => window.clearInterval(t);
  }, []);

  // Smooth progress bar
  useEffect(() => {
    const t = window.setInterval(
      () => setProgress((p) => Math.min(p + 1.4, done ? 100 : 95)),
      100,
    );
    return () => window.clearInterval(t);
  }, [done]);

  // Scanning animation across the category chips
  useEffect(() => {
    let idx = 0;
    const t = window.setInterval(() => {
      idx = (idx + 1) % SCAN_CATEGORIES.length;
      setScanIdx(idx);
      setScannedResults((prev) => {
        const next = { ...prev };
        const cat = SCAN_CATEGORIES[idx].key;
        if (!next[cat]) next[cat] = Math.random() > 0.55 ? 'good' : null;
        return next;
      });
    }, 320);
    return () => window.clearInterval(t);
  }, []);

  // Call edge fn, persist result, then auto-advance
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let merged: any;
      try {
        const { data, error } = await supabase.functions.invoke(
          'selfcare-personality-diagnosis',
          { body: { answers } },
        );
        if (error) throw error;
        const local = resolveFinalResult(answers || {});
        merged = { ...local, ...(data || {}) };
      } catch {
        const local = resolveFinalResult(answers || {});
        merged = { ...local, suggested_tasks: [] };
      }
      if (cancelled) return;

      // Persist personality-shaped result (used by reveal/focus screens).
      onAnswer?.(step.id, JSON.stringify(merged));

      // Bridge: write the same shape SelfCareSuggestionsStep expects so we
      // can reuse it for the tasks screen — with normalized category keys.
      const gap = [
        normalizeCategoryKey(merged.primary_category),
        normalizeCategoryKey(merged.secondary_category),
      ].filter(Boolean);
      const normalizedTasks = (merged.suggested_tasks || []).map((t: any) => ({
        ...t,
        category: normalizeCategoryKey(t.category || ''),
      }));
      onAnswer?.(
        'sc-diagnosis-data',
        JSON.stringify({
          gap_categories: gap,
          suggested_tasks: normalizedTasks,
          top_cluster: merged.primary_cluster,
        }),
      );

      // Light up the gap chips, finish the bar, then move on.
      setScannedResults((prev) => {
        const next = { ...prev };
        SCAN_CATEGORIES.forEach((c) => {
          next[c.key] = gap.includes(c.key) ? 'gap' : (next[c.key] ?? 'good');
        });
        return next;
      });
      setDone(true);
      window.setTimeout(() => onNext(), 1100);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStatus = SCAN_STATUS_MESSAGES[statusIdx];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      <AmbientGlow palette="warm" />

      {/* Hero */}
      <div className="shrink-0 relative z-10 pt-10 pb-3 flex justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative w-[110px] h-[110px] rounded-full bg-gradient-to-br from-[#FFD49A] via-[#F08A3E] to-[#EC4899] shadow-[0_18px_38px_-12px_rgba(236,72,153,0.55)] flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-12px] rounded-full border-2 border-dashed border-[#F08A3E]/40"
          />
          <FluentEmoji emoji={done ? '✨' : '🔍'} size={56} />
        </motion.div>
      </div>

      <div className="flex-1 relative z-10 px-5 pt-5 overflow-y-auto">
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={statusIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-lg font-bold text-foreground">
                {done ? 'Your plan is ready ✨' : currentStatus.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {done ? 'Bringing you to your starter goals' : currentStatus.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {SCAN_CATEGORIES.map((cat, i) => {
            const isActive = i === scanIdx && !done;
            const result = scannedResults[cat.key];
            return (
              <motion.div
                key={cat.key}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-sm scale-[1.03]'
                    : result === 'gap'
                      ? 'border-accent/40 bg-accent/10'
                      : result === 'good'
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-border bg-muted/30'
                }`}
              >
                <span className="text-sm">{cat.emoji}</span>
                <span className={`truncate ${result ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {cat.label}
                </span>
                {result === 'good' && !isActive && <span className="ml-auto text-primary text-[10px]">✓</span>}
                {result === 'gap' && !isActive && <span className="ml-auto text-accent text-[10px]">!</span>}
                {isActive && (
                  <motion.div
                    className="ml-auto h-3 w-3 rounded-full border-2 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {done
            ? 'Done scanning'
            : `Checking ${Math.min(scanIdx + 1, SCAN_CATEGORIES.length)} of ${SCAN_CATEGORIES.length} categories`}
        </p>
        <div className="h-10" />
      </div>
    </div>
  );
}

/* ── helpers to read result ─────────────────────────────────── */

function useResult(answers?: OnboardingAnswers): FinalResult & { suggested_tasks?: any[] } {
  return useMemo(() => {
    const raw = answers?.['scp-diagnosis'];
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { /* noop */ }
    }
    return { ...resolveFinalResult(answers || {}), suggested_tasks: [] } as any;
  }, [answers]);
}

/* ── reveal ─────────────────────────────────────────────────── */

export function ScpRevealScreen({ step, onNext, answers }: BaseProps) {
  const result = useResult(answers);
  const copy = PERSONALITY_COPY[result.personality] || PERSONALITY_COPY.ghost;
  return (
    <div className="absolute inset-0 flex flex-col px-6 pt-16 pb-8 bg-gradient-to-b from-[#FFF1E0] via-white to-[#F0E6FF] overflow-y-auto">
      <div className="flex-1 flex flex-col items-center text-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-28 h-28 rounded-full bg-white shadow-ios flex items-center justify-center mb-6"
        >
          <FluentEmoji emoji={copy.emoji} size={64} />
        </motion.div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#1a1f3d]/50 mb-2">You are</p>
        <h1 className="text-[28px] font-bold text-[#1a1f3d] mb-3">{copy.name}</h1>
        <p className="text-[16px] text-[#1a1f3d]/80 leading-relaxed italic mb-5">{copy.tagline}</p>
        <p className="text-[15px] text-[#1a1f3d]/70 leading-relaxed text-left">{copy.body}</p>
      </div>
      <button
        onClick={() => { haptic.light(); onNext(); }}
        className="w-full max-w-md mx-auto mt-6 py-4 rounded-full bg-[#1a1f3d] text-white font-semibold text-base active:opacity-80"
      >
        {step.buttonLabel || 'See where to focus'}
      </button>
    </div>
  );
}

/* ── focus (cluster + category) ─────────────────────────────── */

const CLUSTER_COPY: Record<Cluster, { label: string; emoji: string; blurb: string }> = {
  body:        { label: 'Body',        emoji: '🌿', blurb: 'How you sleep, move, eat, and feel in your skin.' },
  mind:        { label: 'Mind',        emoji: '🧠', blurb: 'How quiet, present, and kind your inner world feels.' },
  environment: { label: 'Environment', emoji: '🏡', blurb: 'How your days, mornings, evenings, and space hold you.' },
  people:      { label: 'People',      emoji: '💞', blurb: 'How connected you feel to the people who matter.' },
};

const CATEGORY_COPY: Record<string, { label: string; emoji: string; line: string }> = {
  sleep:        { label: 'Sleep',              emoji: '😴', line: 'Rest that actually restores you.' },
  movement:     { label: 'Movement',           emoji: '🚶‍♀️', line: 'Gentle motion to come back to your body.' },
  nutrition:    { label: 'Nourishment',        emoji: '🥣', line: 'Eating in a way that feels caring.' },
  hygiene:      { label: 'Comfort in your body', emoji: '🛁', line: 'Small rituals that feel like home.' },
  calm:         { label: 'Calm',               emoji: '🌬️', line: 'Quieting the noise inside.' },
  Presence:     { label: 'Presence',           emoji: '🌅', line: 'Coming back to right now.' },
  selfkind:     { label: 'Self-Kindness',      emoji: '💗', line: 'Speaking to yourself like a friend.' },
  gratitude:    { label: 'Gratitude',          emoji: '✨', line: 'Noticing the good already here.' },
  connection:   { label: 'Connection',         emoji: '🤝', line: 'Feeling less alone, more held.' },
  LovedOnes:    { label: 'Loved Ones',         emoji: '💞', line: 'Pouring into the people closest to you.' },
  'easy-win':   { label: 'Easy Wins',          emoji: '🌱', line: 'One small, doable thing today.' },
  Evening:      { label: 'Evenings',           emoji: '🌙', line: 'Winding down with intention.' },
  productivity: { label: 'Flow of your day',   emoji: '🗓️', line: 'Feeling more in control of your time.' },
  TidyUp:       { label: 'A restoring space',  emoji: '🧹', line: 'A space that helps you breathe.' },
};

function categoryCopy(key: string) {
  return CATEGORY_COPY[key] || { label: key, emoji: '✨', line: 'A focus area shaped for you.' };
}

export function ScpFocusScreen({ step, onNext, answers }: BaseProps) {
  const result = useResult(answers);
  const copy = PERSONALITY_COPY[result.personality] || PERSONALITY_COPY.ghost;
  const primaryCluster = CLUSTER_COPY[result.primary_cluster];
  const secondaryCluster = CLUSTER_COPY[result.secondary_cluster];
  const primaryCat = categoryCopy(result.primary_category);
  const secondaryCat = categoryCopy(result.secondary_category);

  return (
    <div className="absolute inset-0 flex flex-col px-6 pt-14 pb-8 bg-gradient-to-b from-[#FFF1E0] via-white to-[#F0E6FF] overflow-y-auto">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.18em] text-[#1a1f3d]/50 text-center mb-2">For {copy.name}</p>
        <h2 className="text-[26px] font-bold text-[#1a1f3d] text-center mb-2 leading-tight">
          Here's where to focus right now
        </h2>
        <p className="text-[14px] text-[#1a1f3d]/65 text-center mb-7 leading-relaxed">
          Based on what you shared, these two areas will move you the most this week.
        </p>

        {/* Primary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl p-5 mb-3 shadow-ios"
          style={{ background: 'linear-gradient(135deg, #FFE7B3 0%, #FFD6E0 100%)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#7A2E0E] bg-white/60 backdrop-blur px-2 py-0.5 rounded-full">
              Primary focus
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
              <FluentEmoji emoji={primaryCat.emoji} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-[#1a1f3d]/60">
                {primaryCluster?.emoji} {primaryCluster?.label}
              </p>
              <p className="text-[18px] font-bold text-[#1a1f3d] leading-tight">
                {primaryCat.label}
              </p>
              <p className="text-[13px] text-[#1a1f3d]/75 mt-1 leading-snug">
                {primaryCat.line}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Secondary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-3xl p-5 bg-white border border-black/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#1a1f3d]/60 bg-[#1a1f3d]/5 px-2 py-0.5 rounded-full">
              Then this
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1f3d]/5 flex items-center justify-center shrink-0">
              <FluentEmoji emoji={secondaryCat.emoji} size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-[#1a1f3d]/55">
                {secondaryCluster?.emoji} {secondaryCluster?.label}
              </p>
              <p className="text-[17px] font-semibold text-[#1a1f3d] leading-tight">
                {secondaryCat.label}
              </p>
              <p className="text-[13px] text-[#1a1f3d]/65 mt-1 leading-snug">
                {secondaryCat.line}
              </p>
            </div>
          </div>
        </motion.div>

        <p className="text-[12px] text-[#1a1f3d]/50 text-center mt-5 leading-relaxed">
          Your starter tasks will mix from both — most from your primary focus.
        </p>
      </div>
      <button
        onClick={() => { haptic.light(); onNext(); }}
        className="w-full max-w-md mx-auto mt-6 py-4 rounded-full bg-[#1a1f3d] text-white font-semibold text-base active:opacity-80"
      >
        {step.buttonLabel || 'See my tasks'}
      </button>
    </div>
  );
}

/* ── tasks ──────────────────────────────────────────────────── */

export function ScpTasksScreen({ step, onNext, answers }: BaseProps) {
  const result = useResult(answers);
  const tasks = (result.suggested_tasks || []).slice(0, result.task_count || 3);
  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-14 pb-6 bg-white overflow-y-auto">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <h2 className="text-[24px] font-bold text-[#1a1f3d] mb-1 text-center">Your starter tasks</h2>
        <p className="text-sm text-[#1a1f3d]/60 mb-6 text-center">
          {tasks.length} small steps, chosen for where you are right now.
        </p>
        {tasks.length === 0 ? (
          <div className="rounded-2xl bg-[#1a1f3d]/5 p-6 text-center text-[#1a1f3d]/60">
            We'll suggest tasks on your home screen.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-black/10">
                <div className="w-11 h-11 rounded-xl bg-[#1a1f3d]/5 flex items-center justify-center shrink-0">
                  {t.emoji ? <FluentEmoji emoji={t.emoji} size={26} /> : <Sparkles className="w-5 h-5 text-[#1a1f3d]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#1a1f3d] leading-snug">{t.title}</p>
                  {t.description ? (
                    <p className="text-xs text-[#1a1f3d]/60 mt-0.5 line-clamp-2">{t.description}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => { haptic.light(); onNext(); }}
        className="w-full max-w-md mx-auto mt-6 py-4 rounded-full bg-[#1a1f3d] text-white font-semibold text-base active:opacity-80"
      >
        {step.buttonLabel || 'Add these to my routine'}
      </button>
    </div>
  );
}

/* ── content ────────────────────────────────────────────────── */

export function ScpContentScreen({ step, onNext, answers }: BaseProps) {
  const result = useResult(answers);
  const copy = PERSONALITY_COPY[result.personality] || PERSONALITY_COPY.ghost;
  return (
    <div className="absolute inset-0 flex flex-col px-6 pt-16 pb-8 bg-gradient-to-b from-white to-[#FFF1E0] overflow-y-auto">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h2 className="text-[26px] font-bold text-[#1a1f3d] mb-2">Your self-care library</h2>
        <p className="text-[15px] text-[#1a1f3d]/70 mb-6 leading-relaxed">
          We've shaped your Listen, Breathe and Reset library around what {copy.name} needs most.
        </p>
        <div className="space-y-3">
          {[
            { emoji: '🎧', title: 'Listen', sub: 'Audios curated for your inner world' },
            { emoji: '🌬️', title: 'Breathe', sub: 'Short resets when you need to land' },
            { emoji: '✨', title: 'Reset', sub: 'A check-in for the moments in between' },
          ].map((c) => (
            <div key={c.title} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-black/10">
              <div className="w-11 h-11 rounded-xl bg-[#1a1f3d]/5 flex items-center justify-center">
                <FluentEmoji emoji={c.emoji} size={26} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1a1f3d]">{c.title}</p>
                <p className="text-xs text-[#1a1f3d]/60">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => { haptic.light(); onNext(); }}
        className="w-full max-w-md mx-auto mt-6 py-4 rounded-full bg-[#1a1f3d] text-white font-semibold text-base active:opacity-80"
      >
        {step.buttonLabel || 'Done'}
      </button>
    </div>
  );
}

/* ── dispatcher ─────────────────────────────────────────────── */

export function SelfCarePersonalityQuizScreen(props: BaseProps) {
  switch (props.step.type) {
    case 'scp-intro':                return <ScpIntroScreen {...props} />;
    case 'scp-loader':               return <ScpLoaderScreen {...props} />;
    case 'scp-branching-single-select': return <ScpBranchingScreen {...props} />;
    case 'scp-dynamic-aspiration':   return <ScpDynamicAspirationScreen {...props} />;
    case 'scp-diagnosis':            return <ScpDiagnosisScreen {...props} />;
    case 'scp-reveal':               return <ScpRevealScreen {...props} />;
    case 'scp-focus':                return <ScpFocusScreen {...props} />;
    case 'scp-tasks':
      return (
        <SelfCareSuggestionsStep
          step={props.step}
          onNext={props.onNext}
          onAnswer={props.onAnswer}
          answers={props.answers}
        />
      );
    case 'scp-celebration':
      return (
        <SelfCareRiloCelebrationStep
          step={props.step}
          onNext={props.onNext}
          answers={props.answers}
        />
      );
    case 'scp-push-permission':
      return <SelfCarePushPermissionStep step={props.step} onNext={props.onNext} />;
    default:                         return null;
  }
}