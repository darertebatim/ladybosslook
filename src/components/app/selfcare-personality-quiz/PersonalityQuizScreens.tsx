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
    <div className="absolute inset-0 flex flex-col px-5 pt-4 pb-6 bg-white overflow-y-auto">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
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
                className={`w-full text-left px-4 py-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  isSel ? 'border-[#1a1f3d] bg-[#1a1f3d]/5' : 'border-black/10 bg-white'
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

/* ── diagnosis (call edge fn, then advance) ─────────────────── */

export function ScpDiagnosisScreen({ step, onNext, onAnswer, answers }: BaseProps) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('selfcare-personality-diagnosis', {
          body: { answers },
        });
        if (cancelled) return;
        if (error) throw error;
        // Persist server result alongside client-resolved fallback.
        const local = resolveFinalResult(answers || {});
        const merged = { ...local, ...(data || {}) };
        onAnswer?.(step.id, JSON.stringify(merged));
        setStatus('done');
        setTimeout(() => onNext(), 900);
      } catch (e) {
        // Fall back to local result so the flow never blocks.
        const local = resolveFinalResult(answers || {});
        onAnswer?.(step.id, JSON.stringify({ ...local, suggested_tasks: [] }));
        setStatus('done');
        setTimeout(() => onNext(), 600);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF1E0] to-[#F0E6FF] px-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border-4 border-[#1a1f3d]/15 border-t-[#1a1f3d] mb-6"
      />
      <p className="text-[18px] font-semibold text-[#1a1f3d] mb-2">{step.title || 'Building your self-care plan…'}</p>
      <p className="text-sm text-[#1a1f3d]/60">Reading what you shared</p>
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
    case 'scp-tasks':                return <ScpTasksScreen {...props} />;
    case 'scp-content':              return <ScpContentScreen {...props} />;
    default:                         return null;
  }
}