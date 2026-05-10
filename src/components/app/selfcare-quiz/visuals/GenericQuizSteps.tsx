import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import type { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { computeTopCluster } from '@/utils/selfcare-scoring';
import { QuizShell, QuizHead, PrimaryButton } from './QuizShell';
import { FloatingChip } from './FloatingChip';
import type { GlowPalette } from './AmbientGlow';

interface BaseProps {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

/* ───────────────────────── sc-intro ─────────────────────────── */

export function ScIntroScreen({ step, onNext }: BaseProps) {
  const handle = () => { haptic.light(); onNext(); };
  return (
    <QuizShell
      glow="warm"
      gradient="bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]"
      visual={<IntroOrb />}
      footer={
        <>
          <QuizHead
            eyebrow="✨ AI-powered diagnosis"
            title={step.title || "What's Missing?"}
            subtitle={(step.subtitle || '').replace(/\*\*/g, '')}
            delay={0.15}
          />
          <div className="mt-6">
            <PrimaryButton onClick={handle} delay={0.4}>{step.buttonLabel || 'Begin'}</PrimaryButton>
          </div>
        </>
      }
    >{null}</QuizShell>
  );
}

function IntroOrb() {
  const orbitChips = [
    { emoji: '🧘‍♀️', x: -130, y: -40, d: 0.2 },
    { emoji: '💧', x: 130, y: -60, d: 0.35 },
    { emoji: '🌿', x: -110, y: 90, d: 0.5 },
    { emoji: '😴', x: 120, y: 80, d: 0.6 },
    { emoji: '🍎', x: 0, y: -130, d: 0.7 },
    { emoji: '💗', x: 0, y: 140, d: 0.8 },
  ];
  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      {/* Pulsing rings */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.4, opacity: 0.6 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 2.6, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-[180px] h-[180px] rounded-full border-2"
          style={{ borderColor: ['#F08A3E', '#EC4899', '#8A5CF0', '#FFB6D1'][i] }}
        />
      ))}
      {/* Orbiting dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[260px] h-[260px] rounded-full border border-dashed border-[#1a1f3d]/15"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[200px] h-[200px] rounded-full border border-[#1a1f3d]/10"
      />
      {/* Floating self-care chips around the orb */}
      {orbitChips.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: c.d },
            scale: { duration: 0.5, delay: c.d, type: 'spring', stiffness: 200, damping: 14 },
            y: { duration: 3 + i * 0.3, delay: c.d, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute"
          style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
        >
          <div className="w-[44px] h-[44px] rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(138,92,240,0.4)] text-[22px]">
            {c.emoji}
          </div>
        </motion.div>
      ))}
      {/* Sparkle particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 95;
        return (
          <motion.span
            key={`sp-${i}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4] }}
            transition={{ duration: 1.8, delay: 0.3 + i * 0.18, repeat: Infinity, repeatDelay: 0.6 }}
            className="absolute text-[14px]"
            style={{ transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)`, color: '#F08A3E' }}
          >
            ✦
          </motion.span>
        );
      })}
      {/* Core orb */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [1, 1.06, 1], opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 220, damping: 18 }}
        className="relative w-[140px] h-[140px] rounded-full bg-gradient-to-br from-[#FFB347] via-[#EC4899] to-[#8A5CF0] shadow-[0_28px_70px_-12px_rgba(236,72,153,0.6)] flex items-center justify-center"
      >
        {/* Inner gloss */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-12px] rounded-full border-2 border-dashed border-white/60"
        />
        <motion.span
          animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[56px] relative z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
        >
          ✨
        </motion.span>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── sc-hook ─────────────────────────── */

export function ScHookScreen({ step, onNext }: BaseProps) {
  const handle = () => { haptic.light(); onNext(); };
  const badges = (step as any).badges as { emoji: string; label: string }[] | undefined;
  return (
    <QuizShell
      glow="rosé"
      gradient="bg-gradient-to-b from-[#FFEFE0] via-[#FFE3EE] to-[#F4E4FF]"
      visual={<OrbitingBadges badges={badges || []} />}
      footer={
        <>
          <QuizHead
            title={step.title || ''}
            subtitle={step.subtitle}
            delay={0.15}
          />
          <div className="mt-6">
            <PrimaryButton onClick={handle} delay={0.4}>{step.buttonLabel || 'Continue'}</PrimaryButton>
          </div>
        </>
      }
    >{null}</QuizShell>
  );
}

function OrbitingBadges({ badges }: { badges: { emoji: string; label: string }[] }) {
  const COLORS = ['#F08A3E', '#EC4899', '#8A5CF0', '#FFB347', '#FF6B9D', '#A78BFA', '#FBBF24'];
  // Place badges around an oval orbit
  const positions = useMemo(() => {
    const list = badges.slice(0, 13);
    const W = 300, H = 280;
    return list.map((b, i) => {
      const t = i / Math.max(list.length, 1);
      const angle = t * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? 1 : 0.78;
      const x = Math.cos(angle) * (W / 2 - 30) * radius;
      const y = Math.sin(angle) * (H / 2 - 26) * radius;
      return { ...b, x, y, delay: 0.1 + i * 0.05, color: COLORS[i % COLORS.length] };
    });
  }, [badges]);
  return (
    <div className="relative w-[300px] h-[300px]">
      {/* faded life-wheel rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="absolute rounded-full border border-dashed border-[#1a1f3d]/15"
            style={{ width: 80 + i * 50, height: 80 + i * 50 }}
          />
        ))}
        {/* Rotating gradient ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[230px] h-[230px] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #F08A3E33, #EC489933, #8A5CF033, #F08A3E33)',
            mask: 'radial-gradient(circle, transparent 50%, black 51%, black 60%, transparent 61%)',
            WebkitMask: 'radial-gradient(circle, transparent 50%, black 51%, black 60%, transparent 61%)',
          }}
        />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [1, 1.06, 1], opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 220, damping: 18 }}
          className="relative w-[90px] h-[90px] rounded-full bg-gradient-to-br from-[#FFB347] via-[#EC4899] to-[#8A5CF0] flex items-center justify-center text-white text-[20px] font-extrabold shadow-[0_16px_36px_-8px_rgba(236,72,153,0.55)]"
        >
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          <span className="relative z-10">You</span>
        </motion.div>
      </div>
      {positions.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
          transition={{ duration: 0.4, delay: p.delay, type: 'spring', stiffness: 200, damping: 16 }}
          className="absolute"
          style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))` }}
        >
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${p.color}33, white)`,
              boxShadow: `0 8px 20px -6px ${p.color}66`,
              border: `1.5px solid ${p.color}55`,
            }}
          >
            <FluentEmoji emoji={p.emoji} size={22} />
          </div>
        </motion.div>
      ))}
      {/* Floating sparkles */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = 70 + (i % 3) * 18;
        return (
          <motion.span
            key={`sp-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 0.8 }}
            className="absolute left-1/2 top-1/2 text-[10px]"
            style={{ transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)`, color: COLORS[i % COLORS.length] }}
          >
            ✦
          </motion.span>
        );
      })}
    </div>
  );
}

/* ─────────────────── single-select & multi-select ─────────────────── */

const STEP_PALETTES: Record<string, { glow: GlowPalette; gradient: string }> = {
  'sc-weighing': { glow: 'rosé', gradient: 'bg-gradient-to-b from-[#FFE6E2] via-[#FFE1EE] to-[#F1E1FF]' },
  'sc-neglecting': { glow: 'lavender', gradient: 'bg-gradient-to-b from-[#F5EAFF] via-[#FFE3F0] to-[#FFEDD9]' },
  'sc-win': { glow: 'sunrise', gradient: 'bg-gradient-to-b from-[#FFEFC5] via-[#FFE0CB] to-[#FFD2D8]' },
};

export function ScSingleSelectScreen({ step, onNext, onAnswer }: BaseProps) {
  const palette = STEP_PALETTES[step.id] || { glow: 'warm' as GlowPalette, gradient: 'bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]' };
  const [picked, setPicked] = useState<string | null>(null);

  const handlePick = (label: string) => {
    if (picked) return;
    haptic.light();
    setPicked(label);
    onAnswer?.(step.id, label);
    setTimeout(onNext, 380);
  };

  return (
    <QuizShell glow={palette.glow} gradient={palette.gradient} scrollable>
      <div className="flex flex-col h-full">
        <QuizHead title={step.title || ''} subtitle={step.subtitle} delay={0} />
        <div className="mt-6 space-y-3">
          {step.options?.map((opt, i) => {
            const isPicked = picked === opt.label;
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                onClick={() => handlePick(opt.label)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left active:scale-[0.98] transition-all backdrop-blur-sm ${
                  isPicked
                    ? 'border-[#1a1f3d] bg-white shadow-[0_12px_30px_-8px_rgba(138,92,240,0.35)]'
                    : 'border-white bg-white/80'
                }`}
              >
                {opt.emoji && <FluentEmoji emoji={opt.emoji} size={26} />}
                <span className="flex-1 text-[15px] font-semibold text-[#1a1f3d]">{opt.label}</span>
                {isPicked && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F08A3E] to-[#8A5CF0] flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </QuizShell>
  );
}

export function ScMultiSelectScreen({ step, onNext, onAnswer }: BaseProps) {
  const palette = STEP_PALETTES[step.id] || { glow: 'lavender' as GlowPalette, gradient: 'bg-gradient-to-b from-[#F5EAFF] via-[#FFE3F0] to-[#FFEDD9]' };
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    haptic.light();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      const labels = Array.from(next).map((idx) => step.options?.[idx]?.label || '');
      onAnswer?.(step.id, labels);
      return next;
    });
  };

  const handleContinue = () => {
    haptic.light();
    onNext();
  };

  return (
    <QuizShell glow={palette.glow} gradient={palette.gradient} scrollable>
      <div className="flex flex-col min-h-full">
        <QuizHead title={step.title || ''} subtitle={step.subtitle} delay={0} />
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {step.options?.map((opt, i) => {
            const isSel = selected.has(i);
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
                onClick={() => toggle(i)}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center active:scale-[0.96] transition-all ${
                  isSel
                    ? 'border-[#1a1f3d] bg-white shadow-[0_12px_30px_-8px_rgba(138,92,240,0.35)]'
                    : 'border-white bg-white/70 opacity-90'
                }`}
              >
                <FluentEmoji emoji={opt.emoji || '✨'} size={32} />
                <span className="text-[13px] font-semibold text-[#1a1f3d] leading-tight">{opt.label}</span>
                {isSel && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-[#F08A3E] to-[#8A5CF0] flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="mt-6 pb-2">
          <PrimaryButton onClick={handleContinue} disabled={selected.size === 0} delay={0.1}>
            {selected.size === 0 ? 'Pick at least one' : `Continue (${selected.size})`}
          </PrimaryButton>
        </div>
      </div>
    </QuizShell>
  );
}

/* ───────────────────────── sc-deeper ─────────────────────────── */

const CLUSTER_PALETTES: Record<string, { glow: GlowPalette; gradient: string }> = {
  body: { glow: 'peach', gradient: 'bg-gradient-to-b from-[#FFE7CC] via-[#FFE0DC] to-[#F8DEEC]' },
  mind: { glow: 'lavender', gradient: 'bg-gradient-to-b from-[#EDE0FF] via-[#FCE0EE] to-[#FFE6CC]' },
  environment: { glow: 'mint', gradient: 'bg-gradient-to-b from-[#DCF5E8] via-[#E6F0FF] to-[#FFE8E0]' },
  people: { glow: 'pink', gradient: 'bg-gradient-to-b from-[#FFE0EC] via-[#FFE2D6] to-[#F4E0FF]' },
};

export function ScDeeperScreen({ step, onNext, onAnswer, answers }: BaseProps) {
  const cluster = useMemo(() => computeTopCluster(answers || {}), [answers]);
  const variant = step.variants?.find((v) => v.cluster === cluster) || step.variants?.[0];
  const palette = CLUSTER_PALETTES[cluster] || { glow: 'warm' as GlowPalette, gradient: 'bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]' };
  const [picked, setPicked] = useState<string | null>(null);

  if (!variant) return null;

  const handlePick = (label: string) => {
    if (picked) return;
    haptic.light();
    setPicked(label);
    onAnswer?.(step.id, label);
    setTimeout(onNext, 380);
  };

  return (
    <QuizShell glow={palette.glow} gradient={palette.gradient} scrollable>
      <div className="flex flex-col">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] text-center"
        >
          Going deeper · {cluster}
        </motion.p>
        <QuizHead title={variant.title} subtitle="Choose the one that resonates most" delay={0.05} />
        <div className="mt-6 space-y-3">
          {variant.options.map((opt, i) => {
            const isPicked = picked === opt.label;
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                onClick={() => handlePick(opt.label)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left active:scale-[0.98] transition-all backdrop-blur-sm ${
                  isPicked
                    ? 'border-[#1a1f3d] bg-white shadow-[0_12px_30px_-8px_rgba(138,92,240,0.35)]'
                    : 'border-white bg-white/80'
                }`}
              >
                {opt.emoji && <FluentEmoji emoji={opt.emoji} size={26} />}
                <span className="flex-1 text-[15px] font-semibold text-[#1a1f3d]">{opt.label}</span>
                {isPicked && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F08A3E] to-[#8A5CF0] flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </QuizShell>
  );
}