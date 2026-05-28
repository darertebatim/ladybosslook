import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import riloAppIcon from '@/assets/rilo-app-icon.png';

/** Today's label in the user's local timezone (fallback: America/Los_Angeles). */
function formatTodayLabel(): string {
  const tz =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles',
    }).format(new Date());
  }
}

/** Small inline 3D emoji (Fluent Emoji 3D via CDN). Falls back to native emoji if image fails. */
function Emoji3D({ char, size = 20, className = '' }: { char: string; size?: number; className?: string }) {
  return (
    <img
      src={getFluentEmojiUrl(char)}
      alt={char}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      className={`inline-block object-contain select-none ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        // Fallback to native glyph
        const target = e.currentTarget as HTMLImageElement;
        const span = document.createElement('span');
        span.textContent = char;
        span.style.fontSize = `${size}px`;
        span.style.lineHeight = '1';
        target.replaceWith(span);
      }}
    />
  );
}

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
  const isSuggest = variant === 'suggest';
  const isPlanner = variant === 'planner';
  const isToolsHub = variant === 'tools-hub';
  const [launching, setLaunching] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [inkExpanding, setInkExpanding] = useState(false);

  const handleTap = () => {
    haptic.light();
    if (isSuggest) {
      // Dramatic "we're building something" transition before moving on
      setLaunching(true);
      // Total dwell ≈ 3.6s so the rotating subtexts each get ~900ms
      // to read — the previous 1.4s flashed by before the user could
      // see them.
      setTimeout(() => onNext(), 3600);
      return;
    }
    if (isToolsHub) {
      // 3-phase transition: cards collapse → button ink floods → advance
      setCollapsing(true);
      // start ink expansion partway through the collapse
      setTimeout(() => setInkExpanding(true), 650);
      setTimeout(() => onNext(), 1500);
      return;
    }
    onNext();
  };

  return (
    <div
      className={`h-full w-full flex flex-col relative overflow-hidden ${
        isSuggest
          ? 'bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]'
          : isPlanner
          ? 'bg-gradient-to-b from-[#FFF4DC] via-[#FFE0E6] to-[#FBD4E2]'
          : 'bg-gradient-to-b from-[#FFF7F0] to-white'
      }`}
    >
      {isSuggest && <SuggestAmbientGlow />}
      {isPlanner && <PlannerAmbientGlow />}
      {/* Visual area */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-4 relative z-10">
        {variant === 'planner' && <PlannerVisual />}
        {variant === 'routine' && <RoutineVisual />}
        {variant === 'task-details' && <TaskDetailsVisual />}
        {variant === 'tools-hub' && <ToolsHubVisual collapsing={collapsing} />}
        {variant === 'suggest' && <SuggestVisual />}
      </div>

      {/* Text + CTA */}
      <div className="shrink-0 px-6 pb-10 relative z-10">
        {isSuggest && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] mb-2"
          >
            ✨ Your curated planner
          </motion.p>
        )}
        {isPlanner && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.4 }}
            className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] mb-2"
          >
            ✨ Welcome
          </motion.p>
        )}
        <motion.h1
          key={`title-${step.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: isPlanner ? 1.5 : 0.1 }}
          className="text-[26px] leading-[1.2] font-bold text-[#1a1f3d] text-center whitespace-pre-line"
        >
          {step.title}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: isPlanner ? 1.65 : 0.18 }}
            className={`mt-3 leading-snug text-center ${
              isPlanner
                ? 'text-[20px] font-bold text-black'
                : 'text-[15px] text-[#1a1f3d]/70'
            }`}
          >
            {step.subtitle}
          </motion.p>
        )}
        {isSuggest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-3 text-center text-[12px] font-semibold text-[#1a1f3d]/60"
          >
            Built from <span className="text-[#1a1f3d]">3,000+</span> routines that actually stuck.
          </motion.p>
        )}
        {isPlanner && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.85 }}
            className="mt-3 text-center text-[12px] font-semibold text-[#1a1f3d]/60"
          >
            <span className="text-[#1a1f3d]">3,000+</span> women already plan their day here.
          </motion.p>
        )}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: isPlanner ? 2.05 : 0.28 }}
          onClick={handleTap}
          disabled={launching || collapsing}
          className={`mt-7 w-full h-[56px] rounded-2xl text-white font-semibold text-[16px] active:opacity-80 transition-opacity ${
            isSuggest
              ? 'bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)]'
              : 'bg-[#1a1f3d]'
          } relative overflow-visible`}
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span className={collapsing ? 'opacity-0 transition-opacity' : 'transition-opacity'}>
            {step.buttonLabel || 'Continue'}
          </span>
          {/* Black ink that floods from the button outward */}
          {isToolsHub && inkExpanding && (
            <motion.span
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 60, opacity: 1 }}
              transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#1a1f3d] pointer-events-none"
              style={{ zIndex: 60 }}
            />
          )}
        </motion.button>
      </div>

      {/* Launch transition overlay */}
      {launching && <LaunchOverlay />}
    </div>
  );
}

/* ---------- Ambient background sparkles for the suggest screen ---------- */
function SuggestAmbientGlow() {
  return <AmbientGlowBase palette="suggest" />;
}

/* ---------- Ambient glow tinted with the Rilo app-icon palette ---------- */
function PlannerAmbientGlow() {
  return <AmbientGlowBase palette="planner" />;
}

function AmbientGlowBase({ palette }: { palette: 'suggest' | 'planner' }) {
  const colors =
    palette === 'planner'
      ? {
          a: '#FFD36E', // golden yellow from icon
          b: '#F8B4C6', // soft pink
          c: '#E84A6F', // crimson/magenta from icon
          sparkle: '#A0123F',
        }
      : {
          a: '#FFD6A5',
          b: '#CDE7FF',
          c: '#E5D6FF',
          sparkle: '#1a1f3d',
        };
  const sparkles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: `radial-gradient(circle, ${colors.a} 0%, transparent 70%)` }}
      />
      <div
        className="absolute top-1/3 -right-20 w-[260px] h-[260px] rounded-full blur-3xl opacity-50"
        style={{ background: `radial-gradient(circle, ${colors.b} 0%, transparent 70%)` }}
      />
      <div
        className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ background: `radial-gradient(circle, ${colors.c} 0%, transparent 70%)` }}
      />
      {sparkles.map((_, i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const delay = (i % 7) * 0.3;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, delay, repeat: Infinity, repeatDelay: 1.5 }}
            className="absolute text-[10px]"
            style={{ left: `${left}%`, top: `${top}%`, color: colors.sparkle, opacity: 0.6 }}
          >
            ✨
          </motion.span>
        );
      })}
    </div>
  );
}

/* ---------- Launch overlay: dramatic "building your day" loader ---------- */
function LaunchOverlay() {
  // Rotating subtexts — each gets ~900ms so the user actually reads them.
  const lines = [
    'Morning → Day → Evening',
    'Picking the right rituals…',
    'Shaping your week…',
    'Almost ready ✨',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1 < lines.length ? i + 1 : i));
    }, 850);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.97) 0%, rgba(255,247,240,0.97) 50%, rgba(240,230,255,0.97) 100%)',
      }}
    >
      {/* Pulsing rings */}
      <div className="relative w-[180px] h-[180px] flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.4, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.4, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: ['#F08A3E', '#EC4899', '#8A5CF0'][i] }}
          />
        ))}
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(138,92,240,0.6)]"
        >
          <Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-8 text-[18px] font-bold text-[#1a1f3d]"
      >
        Building your day…
      </motion.p>
      <div className="mt-1 h-5 relative w-[260px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 text-center text-[13px] text-[#1a1f3d]/60"
          >
            {lines[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------- Visual 1: Cinematic Rilo intro — R-bloom + sunrise card ---------- */
function PlannerVisual() {
  // Cravable, "main character" tasks women actually want in their day.
  const blocks = [
    { time: '7:30',  emoji: '🍵', title: 'Iced matcha + journal', color: '#E0FBB8', dot: '#3E7A1E' },
    { time: '12:30', emoji: '👟', title: 'Hot girl walk',          color: '#FFD9E5', dot: '#EC4899' },
    { time: '21:00', emoji: '🛁', title: 'Skincare + slow read',   color: '#E5D6FF', dot: '#8A5CF0' },
  ];

  // Timing baseline (seconds):
  // 0.0–0.6  R-mark blooms in
  // 0.5      R-mark eases up to header position
  // 0.7–1.1  Card rises like a sunrise
  // 1.1+     Tasks fade in one by one, dots ignite
  return (
    <div className="relative w-full max-w-[300px] mx-auto h-[360px] flex items-center justify-center">
      {/* Soft sun glow behind everything (sunrise feel) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(255,214,165,0.55) 0%, rgba(255,182,193,0.25) 45%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Phase 1: Rilo app icon blooms center, then settles into card header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{
          opacity: [0, 1, 1, 1],
          scale: [0.2, 1.6, 1.6, 0.36],
          x: [0, 0, 0, 110],
          y: [0, 0, 0, -110],
        }}
        transition={{
          duration: 1.1,
          times: [0, 0.4, 0.55, 1],
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="absolute z-20 w-16 h-16 rounded-[18px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(138,92,240,0.55)]"
      >
        <img
          src={riloAppIcon}
          alt="Rilo"
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
        {/* Outward bloom rings */}
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.0, delay: 0.15 + i * 0.25, ease: 'easeOut' }}
            className="absolute inset-0 rounded-[18px] border-2 border-[#EC4899]"
          />
        ))}
      </motion.div>

      {/* Phase 2: Planner card rises from below (sunrise) */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full bg-white rounded-3xl shadow-[0_24px_70px_-20px_rgba(26,31,61,0.3)] p-5 border border-white/80 z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">
              Today
            </p>
            <p className="text-[18px] font-bold text-[#1a1f3d]">{formatTodayLabel()}</p>
          </motion.div>
          {/* Reserved spot for the R-mark to land into (visual placeholder, real R is the floating one above) */}
          <div className="w-9 h-9 rounded-full bg-transparent" />
        </div>

        <div className="space-y-2.5">
          {blocks.map((b, i) => {
            const taskDelay = 1.3 + i * 0.22;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: taskDelay, duration: 0.35, ease: 'easeOut' }}
                className="relative flex items-center gap-3 rounded-2xl px-3.5 py-3 overflow-hidden"
                style={{ background: b.color }}
              >
                {/* Sweep highlight as the task lands */}
                <motion.span
                  initial={{ x: '-110%', opacity: 0.55 }}
                  animate={{ x: '110%', opacity: 0 }}
                  transition={{ delay: taskDelay + 0.05, duration: 0.55, ease: 'easeOut' }}
                  className="absolute inset-y-0 w-1/2 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                  }}
                />
                {/* Colored dot — ignites after the task lands */}
                <motion.span
                  initial={{ scale: 0.4, opacity: 0.4, boxShadow: '0 0 0 transparent' }}
                  animate={{
                    scale: [0.4, 1.4, 1],
                    opacity: [0.4, 1, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(0,0,0,0)',
                      `0 0 12px 2px ${b.dot}`,
                      `0 0 6px 0 ${b.dot}`,
                    ],
                  }}
                  transition={{ delay: taskDelay + 0.15, duration: 0.55, ease: 'easeOut' }}
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: b.dot }}
                />
                {/* 3D emoji badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: taskDelay + 0.2, duration: 0.4, type: 'spring' }}
                  className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0"
                >
                  <Emoji3D char={b.emoji} size={20} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#1a1f3d]/60">{b.time}</p>
                  <p className="text-[14px] font-semibold text-[#1a1f3d] truncate">{b.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Visual 2: Routine with 3 mini-tasks ticking off ---------- */
function RoutineVisual() {
  // Cravable mini-routine — the kind women save on TikTok
  const tasks = [
    { emoji: '☕', title: 'Slow morning coffee' },
    { emoji: '🌸', title: '5-step skincare' },
    { emoji: '👟', title: 'Get-ready playlist on' },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center gap-2 mb-4">
          <Emoji3D char="🌅" size={22} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Morning routine</p>
            <p className="text-[16px] font-bold text-[#1a1f3d]">Soft-girl morning</p>
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
              <Emoji3D char={t.emoji} size={20} />
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

/* ---------- Visual: 4-slot day skeleton (Morning · Day · Evening · Week) ---------- */
function SuggestVisual() {
  // Each slot maps 1:1 to one of the next 4 onboarding screens.
  const slots = [
    { label: 'Morning',   emoji: '🌅', bg: '#FFE6C9', dot: '#F08A3E', glow: 'rgba(240,138,62,0.55)' },
    { label: 'Daytime',   emoji: '☀️', bg: '#D7E9FF', dot: '#3E8AF0', glow: 'rgba(62,138,240,0.55)' },
    { label: 'Evening',   emoji: '🌙', bg: '#E5D6FF', dot: '#8A5CF0', glow: 'rgba(138,92,240,0.55)' },
  ];

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative bg-white/95 rounded-3xl shadow-[0_24px_70px_-20px_rgba(26,31,61,0.3)] p-5 border border-white/80"
      >
        {/* Card header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a1f3d]/50">
              Your day
            </p>
            <p className="text-[16px] font-bold text-[#1a1f3d]">Coming together…</p>
          </div>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </motion.div>
        </div>

        {/* 3 day slots — Morning / Daytime / Evening */}
        <div className="space-y-2.5">
          {slots.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.13, duration: 0.4 }}
              className="relative rounded-2xl overflow-hidden"
            >
              {/* Pulsing glow behind the slot */}
              <motion.div
                animate={{ opacity: [0.35, 0.75, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 blur-md"
                style={{ background: s.glow }}
              />
              <div
                className="relative flex items-center gap-3 rounded-2xl px-3.5 py-3 border border-white/60"
                style={{ background: s.bg }}
              >
                <span className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center">
                  <Emoji3D char={s.emoji} size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">
                    {s.label}
                  </p>
                  {/* Empty placeholder bars (about to be filled) */}
                  <div className="mt-1 flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: [0.25, 0.6, 0.25] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                      className="h-1.5 w-12 rounded-full"
                      style={{ background: s.dot }}
                    />
                    <motion.span
                      animate={{ opacity: [0.15, 0.4, 0.15] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 + 0.3 }}
                      className="h-1.5 w-8 rounded-full"
                      style={{ background: s.dot }}
                    />
                  </div>
                </div>
                <motion.span
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: s.dot, boxShadow: `0 0 12px ${s.dot}` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* 4th slot: This week (AI plan) — visually distinct */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          className="relative mt-3 rounded-2xl overflow-hidden"
        >
          <motion.div
            animate={{ opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 blur-md"
            style={{
              background:
                'linear-gradient(90deg, rgba(240,138,62,0.5), rgba(236,72,153,0.5), rgba(138,92,240,0.5))',
            }}
          />
          <div
            className="relative flex items-center gap-3 rounded-2xl px-3.5 py-3 border border-white/60"
            style={{
              background:
                'linear-gradient(135deg, #FFF1E0 0%, #FFE6F0 50%, #F0E6FF 100%)',
            }}
          >
            <span className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center">
              <Emoji3D char="🪄" size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">
                This week · AI
              </p>
              <p className="text-[12px] font-bold text-[#1a1f3d] truncate">
                Built from your plans
              </p>
            </div>
            <motion.span
              animate={{ rotate: [0, 15, -10, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Emoji3D char="✨" size={18} />
            </motion.span>
          </div>
        </motion.div>

        {/* "4 quick steps" floating badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4, type: 'spring' }}
          className="absolute -right-2 -top-2 px-2.5 py-1 rounded-full bg-[#1a1f3d] text-white text-[10px] font-bold shadow-lg flex items-center gap-1"
        >
          <span>⚡</span> 4 quick steps
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- Visual 3 (A): Task settings (control your routine) ---------- */
function TaskDetailsVisual() {
  const colors = ['#F08A3E', '#3E8AF0', '#8A5CF0', '#22C55E', '#EC4899'];
  const settings = [
    { icon: '🕗', label: 'Time', value: '7:30 AM', bg: '#FFE6C9' },
    { icon: '📅', label: 'Date', value: 'Today', bg: '#D7E9FF' },
    { icon: '🔁', label: 'Repeat', value: 'Weekdays', bg: '#E0FBB8' },
    { icon: '🔔', label: 'Reminder', value: '10 min before', bg: '#F0E3FF' },
  ];
  const subtasks = [
    { title: 'Cleanser',  done: true },
    { title: 'Vitamin C', done: true },
    { title: 'SPF 50',    done: false },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-4 border border-black/5">
        {/* Header: emoji + title + color dots */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.35, type: 'spring' }}
            className="w-11 h-11 rounded-2xl bg-[#FFD9E5] flex items-center justify-center"
          >
            <Emoji3D char="🌸" size={26} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1a1f3d] truncate">Skincare ritual</p>
            <div className="flex items-center gap-1 mt-1">
              {colors.map((c, i) => (
                <motion.span
                  key={c}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.25 }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: c,
                    boxShadow: i === 0 ? '0 0 0 2px white, 0 0 0 3.5px #1a1f3d' : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Settings rows */}
        <div className="space-y-1.5">
          {settings.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.28 }}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
              style={{ background: s.bg }}
            >
              <Emoji3D char={s.icon} size={16} />
              <span className="text-[11px] font-semibold text-[#1a1f3d]/70 flex-1">{s.label}</span>
              <span className="text-[12px] font-bold text-[#1a1f3d]">{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Subtasks */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.3 }}
          className="mt-3 rounded-xl bg-[#F4F2EF] px-3 py-2.5"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a1f3d]/50 mb-1.5">Subtasks</p>
          <div className="space-y-1.5">
            {subtasks.map((st, i) => (
              <div key={st.title} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: st.done ? '#22C55E' : 'transparent',
                    border: st.done ? '0' : '1.5px solid rgba(26,31,61,0.3)',
                  }}
                >
                  {st.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                </div>
                <span
                  className={`text-[12px] font-medium text-[#1a1f3d] ${st.done ? 'line-through opacity-50' : ''}`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.3 }}
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 bg-[#FFF7E6] border border-[#F0C674]/40"
        >
          <Emoji3D char="📝" size={16} />
          <span className="text-[11px] text-[#8B6914] italic truncate">Glowy skin = mood lifted ✨</span>
        </motion.div>

        {/* Floating "all yours" badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          transition={{ delay: 1.1, duration: 0.4, type: 'spring' }}
          className="absolute -right-2 -top-2 px-2.5 py-1 rounded-full bg-[#1a1f3d] text-white text-[10px] font-bold shadow-lg"
        >
          ✨ All yours
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Visual 4 (B): "8 apps in one" — outcome cascade ---------- */
function ToolsHubVisual({ collapsing = false }: { collapsing?: boolean }) {
  // Each card = a real outcome people download a separate paid app for.
  const cards = [
    { emoji: '🧘', title: 'Calmer mind',     replaces: 'Calm',         bg: '#E5D6FF', fg: '#5B2BB8' },
    { emoji: '💪', title: 'Stronger body',   replaces: 'Nike Training', bg: '#FFD9E5', fg: '#B8295C' },
    { emoji: '🌙', title: 'Better sleep',    replaces: 'Headspace',     bg: '#CDE7FF', fg: '#1E5BB8' },
    { emoji: '✏️', title: 'Clearer mind',    replaces: 'Stoic',         bg: '#E0FBB8', fg: '#3E7A1E' },
    { emoji: '📅', title: 'Synced days',     replaces: 'Apple Calendar', bg: '#FFE6C9', fg: '#B8590E' },
    { emoji: '✅', title: 'Built habits',    replaces: 'TickTick',      bg: '#D4F1F4', fg: '#0E7C8F' },
    { emoji: '💼', title: 'Career growth',   replaces: 'Notion',        bg: '#F4F2EF', fg: '#1a1f3d' },
    { emoji: '💰', title: 'Money goals',     replaces: 'YNAB',          bg: '#FFF492', fg: '#8B6914' },
  ];

  // Slight rotation per card for the "scattered polaroids" feel
  const rotations = [-5, 4, -3, 6, -6, 3, -4, 5];

  // When collapsing: each card flies down toward the CTA button (bottom-center).
  // Left column (i % 2 === 0) drifts right toward center; right column drifts left.
  // All cards push downward beyond the visual area.
  const collapseTarget = (i: number) => {
    const isLeft = i % 2 === 0;
    return {
      x: isLeft ? 80 : -80,
      y: 320 + (i % 4) * 8, // dive down toward button
      scale: 0.15,
      rotate: isLeft ? 25 : -25,
      opacity: 0,
    };
  };

  return (
    <div className="w-full max-w-[320px] mx-auto">
      {/* Soft warm halo behind everything */}
      <div className="relative">
        <div
          className="absolute -inset-4 rounded-[40px] blur-2xl opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, #FFE6C9 0%, #FFD6E8 40%, transparent 75%)',
          }}
        />

        {/* 2-column staggered grid */}
        <div className="relative grid grid-cols-2 gap-2.5">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, scale: 0.6, y: 20, rotate: 0 }}
              animate={
                collapsing
                  ? collapseTarget(i)
                  : {
                      opacity: 1,
                      scale: 1,
                      y: [0, -3, 0],
                      rotate: rotations[i],
                    }
              }
              transition={
                collapsing
                  ? {
                      duration: 0.7,
                      delay: i * 0.04,
                      ease: [0.55, 0, 0.85, 0.4], // accelerate down (gravity-ish)
                    }
                  : {
                      opacity: { delay: 0.1 + i * 0.07, duration: 0.35 },
                      scale: {
                        delay: 0.1 + i * 0.07,
                        duration: 0.4,
                        type: 'spring',
                        stiffness: 200,
                      },
                      rotate: { delay: 0.1 + i * 0.07, duration: 0.4 },
                      y: {
                        delay: 0.7 + i * 0.1,
                        duration: 3 + (i % 3) * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }
              }
              className={`relative rounded-2xl bg-white shadow-[0_10px_24px_-10px_rgba(26,31,61,0.25)] border border-black/5 p-2.5 ${
                i % 2 === 0 ? 'mt-0' : 'mt-3'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.bg }}
                >
                  <Emoji3D char={c.emoji} size={22} />
                </div>
                <p className="text-[11.5px] font-bold text-[#1a1f3d] leading-tight">
                  {c.title}
                </p>
              </div>
              <p
                className="text-[9.5px] font-semibold mt-1.5 italic truncate"
                style={{ color: c.fg }}
              >
                instead of {c.replaces}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* "Free" pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={collapsing ? { opacity: 0, scale: 0.6, y: 220 } : { opacity: 1, scale: 1 }}
        transition={collapsing ? { duration: 0.5, ease: 'easeIn' } : { delay: 1.0, duration: 0.4, type: 'spring' }}
        className="mt-3 flex items-center justify-center"
      >
        <div className="px-3.5 py-1.5 rounded-full bg-[#1a1f3d] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-lg">
          <Emoji3D char="🎁" size={14} /> 8 apps. One Rilo. Free.
        </div>
      </motion.div>
    </div>
  );
}