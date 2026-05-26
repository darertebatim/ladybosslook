import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

/* ─── Label → ISO map (used by AppOnboarding too) ──────────────── */
export const LANG_LABEL_TO_ISO: Record<string, string> = {
  'English only': 'en',
  'Persian': 'fa',
  'Turkish': 'tr',
  'Spanish': 'es',
};

/* ─── Door catalog ─────────────────────────────────────────────── */

type DoorKey = 'emotion' | 'selfcare' | 'immigrant' | 'productivity' | 'exploring';

const DOORS: {
  key: DoorKey;
  emoji: string;
  label: string;
  blurb: string;
  tint: string;       // hsla glow color
  ring: string;       // ring gradient
  bubble: string;     // soft bubble bg for emoji
}[] = [
  {
    key: 'emotion',
    emoji: '💗',
    label: 'Emotion',
    blurb: 'Calm a feeling, in minutes.',
    tint: 'rgba(244,114,182,0.55)',
    ring: 'from-pink-300 via-pink-400 to-rose-300',
    bubble: 'bg-pink-100/80',
  },
  {
    key: 'selfcare',
    emoji: '🧩',
    label: 'Self-care',
    blurb: 'Find what you keep skipping.',
    tint: 'rgba(110,231,183,0.55)',
    ring: 'from-emerald-300 via-teal-300 to-emerald-200',
    bubble: 'bg-emerald-100/80',
  },
  {
    key: 'immigrant',
    emoji: '🌍',
    label: 'Immigrant',
    blurb: 'Belong, in two languages.',
    tint: 'rgba(167,139,250,0.55)',
    ring: 'from-violet-300 via-purple-300 to-fuchsia-300',
    bubble: 'bg-violet-100/80',
  },
  {
    key: 'productivity',
    emoji: '⚡',
    label: 'Productivity',
    blurb: 'Tiny routines that finish.',
    tint: 'rgba(253,224,71,0.55)',
    ring: 'from-yellow-300 via-amber-300 to-orange-300',
    bubble: 'bg-yellow-100/80',
  },
  {
    key: 'exploring',
    emoji: '👀',
    label: 'Just exploring',
    blurb: 'Show me what Rilo can do.',
    tint: 'rgba(251,146,60,0.55)',
    ring: 'from-orange-300 via-amber-300 to-orange-200',
    bubble: 'bg-orange-100/80',
  },
];

/* ─── Animated mesh background ─────────────────────────────────── */

function MeshBg() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#FFF8F2]">
      {/* Soft blurred blobs */}
      <motion.div
        className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #FFD2BA 0%, transparent 70%)' }}
        animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-40 -right-32 w-[380px] h-[380px] rounded-full blur-3xl opacity-55"
        style={{ background: 'radial-gradient(circle, #DCC7FF 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #BFEAD7 0%, transparent 70%)' }}
        animate={{ x: [-20, 20, -10, -20], y: [0, -20, 10, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/4 w-[260px] h-[260px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #FFE9A8 0%, transparent 70%)' }}
        animate={{ x: [0, 25, -15, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")',
        }}
      />
    </div>
  );
}

function GlassShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full">
      <MeshBg />
      <div className="relative z-10 h-full overflow-y-auto overscroll-contain">
        <div
          className="flex flex-col min-h-full px-5"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 56px)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Primary CTA button ───────────────────────────────────────── */

function GlassCTA({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full py-4 rounded-2xl font-bold text-base text-white',
        'bg-gradient-to-r from-[#EB5E33] to-[#F5A623]',
        'shadow-ios active:scale-[0.98] transition-all',
        disabled && 'opacity-40'
      )}
    >
      {children}
    </button>
  );
}

function GhostCTA({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 text-sm font-medium text-[#5a4a3a] active:opacity-60"
    >
      {children}
    </button>
  );
}

/* ─── 1. Door Cards (primary & secondary) ──────────────────────── */

export function DoorCardsGlassScreen({
  step,
  onNext,
  onAnswer,
  answers,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
  answers?: OnboardingAnswers;
}) {
  const slot = step.doorSlot || 'primary';
  const primary = (answers?.['rd-door-primary'] as string) || '';

  const doors = useMemo(() => {
    if (slot === 'secondary' && primary) {
      return DOORS.filter((d) => d.key !== primary);
    }
    return DOORS;
  }, [slot, primary]);

  const [picked, setPicked] = useState<DoorKey | null>(null);

  const handlePick = (k: DoorKey) => {
    haptic.selection();
    setPicked(k);
    onAnswer?.(step.id, k);
    setTimeout(onNext, 420);
  };

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
          {slot === 'primary' ? 'Step 1 of 2' : 'Step 2 of 2'}
        </p>
        <h1 className="mt-2 text-[28px] leading-[1.15] font-bold text-[#2A1810]">
          {step.title || (slot === 'primary' ? 'Which door is yours\nright now?' : 'And a second one?')}
        </h1>
        {step.subtitle && (
          <p className="mt-2 text-[15px] text-[#5a4a3a] leading-snug">{step.subtitle}</p>
        )}
      </motion.div>

      <div className="flex-1 space-y-3">
        {doors.map((d, i) => {
          const isPicked = picked === d.key;
          return (
            <motion.button
              key={d.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + i * 0.05 }}
              onClick={() => handlePick(d.key)}
              className={cn(
                'relative w-full text-left rounded-[22px] p-4 pr-5',
                'bg-white/55 backdrop-blur-2xl',
                'border border-white/70',
                'shadow-ios active:scale-[0.985] transition-all'
              )}
              style={{
                boxShadow: isPicked
                  ? `0 12px 36px -8px ${d.tint}, 0 4px 12px rgba(0,0,0,0.06)`
                  : undefined,
              }}
            >
              {/* Glow ring on selection */}
              <AnimatePresence>
                {isPicked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'absolute inset-0 rounded-[22px] pointer-events-none',
                      'bg-gradient-to-r p-[1.5px]',
                      d.ring
                    )}
                    style={{ WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center',
                    d.bubble
                  )}
                >
                  <FluentEmoji emoji={d.emoji} size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-bold text-[#2A1810] leading-tight">
                    {d.label}
                  </p>
                  <p className="text-[13px] text-[#6b5a4a] mt-0.5 leading-snug">
                    {d.blurb}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {slot === 'secondary' && (
        <div className="pt-4">
          <GhostCTA
            onClick={() => {
              onAnswer?.(step.id, 'skip');
              onNext();
            }}
          >
            Just one door is enough →
          </GhostCTA>
        </div>
      )}
    </GlassShell>
  );
}

/* ─── 2. Emotion picker (5 + not these + I don't know) ─────────── */

const EMOTION_TOP5 = [
  { key: 'stress', emoji: '😣', label: 'Stress' },
  { key: 'anger', emoji: '😠', label: 'Anger' },
  { key: 'sad', emoji: '😔', label: 'Sad' },
  { key: 'worried', emoji: '😟', label: 'Worried' },
  { key: 'overwhelmed', emoji: '😵‍💫', label: 'Overwhelmed' },
];

const EMOTION_REST = [
  { key: 'lonely', emoji: '🥺', label: 'Lonely' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'numb', emoji: '😐', label: 'Numb' },
  { key: 'guilty', emoji: '😞', label: 'Guilty' },
  { key: 'jealous', emoji: '🥴', label: 'Jealous' },
  { key: 'restless', emoji: '😬', label: 'Restless' },
  { key: 'scared', emoji: '😨', label: 'Scared' },
  { key: 'ashamed', emoji: '😶', label: 'Ashamed' },
];

export function DoorEmotionPickerScreen({
  step,
  onNext,
  onAnswer,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dontKnow, setDontKnow] = useState(false);

  const toggle = (k: string) => {
    haptic.selection();
    if (dontKnow) setDontKnow(false);
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  };

  const handleNext = () => {
    const val = dontKnow ? ['unknown'] : picked.length ? picked : ['unknown'];
    onAnswer?.(step.id, val);
    onNext();
  };

  const canContinue = picked.length > 0 || dontKnow;

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
          Tune your door
        </p>
        <h1 className="mt-2 text-[26px] leading-[1.15] font-bold text-[#2A1810]">
          What feelings come up most?
        </h1>
        <p className="mt-2 text-[14px] text-[#6b5a4a] leading-snug">
          Rilo will line up calm tools and reflections for these.
        </p>
      </motion.div>

      <div className="flex-1 flex flex-wrap gap-2.5 content-start">
        {EMOTION_TOP5.map((e, i) => (
          <EmotionChip key={e.key} {...e} picked={picked.includes(e.key)} onClick={() => toggle(e.key)} delay={i * 0.04} />
        ))}

        {!expanded && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => { haptic.selection(); setExpanded(true); }}
            className="px-4 py-2.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/70 shadow-ios text-[14px] font-medium text-[#5a4a3a] active:scale-95 transition-all"
          >
            Not these · show more
          </motion.button>
        )}

        <AnimatePresence>
          {expanded &&
            EMOTION_REST.map((e, i) => (
              <EmotionChip key={e.key} {...e} picked={picked.includes(e.key)} onClick={() => toggle(e.key)} delay={i * 0.03} />
            ))}
        </AnimatePresence>
      </div>

      <div className="pt-5 space-y-2">
        <button
          onClick={() => {
            haptic.selection();
            setDontKnow((v) => !v);
            if (!dontKnow) setPicked([]);
          }}
          className={cn(
            'w-full py-3 rounded-2xl font-medium text-[14px] transition-all active:scale-[0.98]',
            dontKnow
              ? 'bg-[#2A1810] text-white shadow-ios'
              : 'bg-white/55 backdrop-blur-xl border border-white/70 text-[#5a4a3a] shadow-ios'
          )}
        >
          I don't know — surprise me
        </button>
        <GlassCTA onClick={handleNext} disabled={!canContinue}>
          Continue
        </GlassCTA>
      </div>
    </GlassShell>
  );
}

function EmotionChip({
  emoji,
  label,
  picked,
  onClick,
  delay,
}: {
  emoji: string;
  label: string;
  picked: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, delay }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-xl border shadow-ios transition-all active:scale-95',
        picked
          ? 'bg-gradient-to-r from-[#EB5E33] to-[#F5A623] text-white border-transparent'
          : 'bg-white/60 border-white/70 text-[#2A1810]'
      )}
    >
      <FluentEmoji emoji={emoji} size={20} />
      <span className="text-[14px] font-semibold">{label}</span>
    </motion.button>
  );
}

/* ─── 3. Self-care offers (Reset playlist + Personalities) ─────── */

export function DoorSelfcareOffersScreen({
  step,
  onNext,
  onAnswer,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
}) {
  const [resetAdded, setResetAdded] = useState(false);
  const [quizChoice, setQuizChoice] = useState<'yes' | 'later' | null>(null);

  const handleAddReset = () => {
    haptic.success();
    setResetAdded(true);
  };

  const handleContinue = () => {
    const out: string[] = [];
    if (resetAdded) out.push('reset_added');
    if (quizChoice) out.push(`quiz:${quizChoice}`);
    onAnswer?.(step.id, out);
    onNext();
  };

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
          Tune your door
        </p>
        <h1 className="mt-2 text-[26px] leading-[1.15] font-bold text-[#2A1810]">
          Two soft starts for you.
        </h1>
        <p className="mt-2 text-[14px] text-[#6b5a4a] leading-snug">
          Pick one, both, or neither — your call.
        </p>
      </motion.div>

      <div className="flex-1 space-y-4">
        {/* Offer 1: Reset playlist */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[22px] bg-white/55 backdrop-blur-2xl border border-white/70 shadow-ios p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
              <FluentEmoji emoji="🌿" size={28} />
            </div>
            <div>
              <p className="text-[16px] font-bold text-[#2A1810]">Self-Care Reset</p>
              <p className="text-[12px] text-[#6b5a4a]">A 7-minute playlist</p>
            </div>
          </div>
          <p className="text-[14px] text-[#5a4a3a] mb-3 leading-snug">
            One breathe + one reflection. Use it whenever the noise gets loud.
          </p>
          <button
            onClick={resetAdded ? undefined : handleAddReset}
            disabled={resetAdded}
            className={cn(
              'w-full py-3 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.98]',
              resetAdded
                ? 'bg-emerald-500/90 text-white'
                : 'bg-[#2A1810] text-white'
            )}
          >
            {resetAdded ? '✓ Added to My Rilo' : 'Add to My Rilo'}
          </button>
        </motion.div>

        {/* Offer 2: Personalities quiz */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[22px] bg-white/55 backdrop-blur-2xl border border-white/70 shadow-ios p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100/80 flex items-center justify-center">
              <FluentEmoji emoji="🧩" size={28} />
            </div>
            <div>
              <p className="text-[16px] font-bold text-[#2A1810]">Self-Care Personalities</p>
              <p className="text-[12px] text-[#6b5a4a]">A 2-minute quiz</p>
            </div>
          </div>
          <p className="text-[14px] text-[#5a4a3a] mb-3 leading-snug">
            Find the one area you keep skipping. Rilo builds around it.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { haptic.selection(); setQuizChoice('yes'); }}
              className={cn(
                'py-3 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.97]',
                quizChoice === 'yes'
                  ? 'bg-gradient-to-r from-[#EB5E33] to-[#F5A623] text-white shadow-ios'
                  : 'bg-white/70 border border-white/70 text-[#2A1810]'
              )}
            >
              Yes, let's go
            </button>
            <button
              onClick={() => { haptic.selection(); setQuizChoice('later'); }}
              className={cn(
                'py-3 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.97]',
                quizChoice === 'later'
                  ? 'bg-[#2A1810] text-white'
                  : 'bg-white/70 border border-white/70 text-[#2A1810]'
              )}
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </div>

      <div className="pt-5">
        <GlassCTA onClick={handleContinue}>Continue</GlassCTA>
      </div>
    </GlassShell>
  );
}

/* ─── 4. Immigrant picker ──────────────────────────────────────── */

const IMMIGRANT_TAGS = [
  { key: 'homesick', emoji: '🏠', label: 'Homesick' },
  { key: 'language', emoji: '💬', label: 'Language gap' },
  { key: 'belonging', emoji: '🫶', label: 'Belonging' },
  { key: 'family', emoji: '👨‍👩‍👧', label: 'Family far away' },
  { key: 'identity', emoji: '🪞', label: 'Identity shift' },
  { key: 'career', emoji: '💼', label: 'Career restart' },
  { key: 'community', emoji: '🌐', label: 'New community' },
];

export function DoorImmigrantPickerScreen({
  step,
  onNext,
  onAnswer,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  const toggle = (k: string) => {
    haptic.selection();
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  };

  const handleContinue = () => {
    onAnswer?.(step.id, [...picked, added ? 'bilingual_strength_added' : 'no_add']);
    onNext();
  };

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
          Tune your door
        </p>
        <h1 className="mt-2 text-[26px] leading-[1.15] font-bold text-[#2A1810]">
          What weighs on you most?
        </h1>
        <p className="mt-2 text-[14px] text-[#6b5a4a] leading-snug">
          Pick anything that resonates. Rilo speaks both your languages.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-2.5 content-start mb-5">
        {IMMIGRANT_TAGS.map((t, i) => (
          <EmotionChip
            key={t.key}
            emoji={t.emoji}
            label={t.label}
            picked={picked.includes(t.key)}
            onClick={() => toggle(t.key)}
            delay={i * 0.04}
          />
        ))}
      </div>

      {/* Starter offer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-[22px] bg-white/55 backdrop-blur-2xl border border-white/70 shadow-ios p-5 mb-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-100/80 flex items-center justify-center">
            <FluentEmoji emoji="🌉" size={28} />
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#2A1810]">Bilingual Strength</p>
            <p className="text-[12px] text-[#6b5a4a]">A starter playlist for you</p>
          </div>
        </div>
        <p className="text-[14px] text-[#5a4a3a] mb-3 leading-snug">
          Voices, reflections, and breathwork made for two-language hearts.
        </p>
        <button
          onClick={added ? undefined : () => { haptic.success(); setAdded(true); }}
          disabled={added}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.98]',
            added ? 'bg-violet-500/90 text-white' : 'bg-[#2A1810] text-white'
          )}
        >
          {added ? '✓ Added to My Rilo' : 'Add to My Rilo'}
        </button>
      </motion.div>

      <div className="pt-1">
        <GlassCTA onClick={handleContinue}>Continue</GlassCTA>
      </div>
    </GlassShell>
  );
}

/* ─── 5. Meet My Rilo intro ────────────────────────────────────── */

export function MeetRiloIntroScreen({
  step,
  onNext,
}: {
  step: OnboardingStep;
  onNext: () => void;
}) {
  return (
    <GlassShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-44 h-44 rounded-[44px] bg-white/55 backdrop-blur-2xl border border-white/70 shadow-ios flex items-center justify-center mb-8"
        >
          {/* Pulsing aura */}
          <motion.div
            className="absolute inset-0 rounded-[44px] bg-gradient-to-br from-[#EB5E33]/30 to-[#F5A623]/30 blur-2xl"
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <FluentEmoji emoji="🌅" size={96} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-[30px] leading-[1.1] font-bold text-[#2A1810]"
        >
          {step.title || 'Meet My Rilo.'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-3 text-[16px] text-[#5a4a3a] leading-snug max-w-[300px]"
        >
          {step.subtitle ||
            'Your wellness home. Calm tools, gentle routines, and a path that grows with you — all in one place.'}
        </motion.p>
      </div>
      <div className="pt-2">
        <GlassCTA onClick={onNext}>{step.buttonLabel || 'Show me'}</GlassCTA>
      </div>
    </GlassShell>
  );
}

/* ─── 6. Open the Door (final celebration) ─────────────────────── */

export function OpenTheDoorScreen({
  step,
  onNext,
  answers,
}: {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}) {
  const primary = (answers?.['rd-door-primary'] as string) || 'exploring';
  const door = DOORS.find((d) => d.key === primary) || DOORS[4];
  const nickname = (answers?.['rd-nickname'] as string) || '';

  return (
    <GlassShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EB5E33] mb-3"
        >
          You're in
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-7"
        >
          <motion.div
            className="absolute inset-0 rounded-[40px] blur-3xl"
            style={{ background: door.tint }}
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className={cn('relative w-36 h-36 rounded-[40px] flex items-center justify-center', door.bubble, 'backdrop-blur-xl border border-white/70 shadow-ios')}>
            <FluentEmoji emoji={door.emoji} size={80} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-[28px] leading-[1.15] font-bold text-[#2A1810]"
        >
          {nickname ? `Open your door, ${nickname}.` : 'Open your door.'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-3 text-[15px] text-[#5a4a3a] leading-snug max-w-[300px]"
        >
          My Rilo is ready with what fits you today.
        </motion.p>
      </div>
      <div className="pt-2">
        <GlassCTA onClick={onNext}>{step.buttonLabel || 'Enter My Rilo'}</GlassCTA>
      </div>
    </GlassShell>
  );
}

/* ─── 7. Nickname (glass) ──────────────────────────────────────── */

export function DoorNicknameScreen({
  step,
  onNext,
  onAnswer,
  answers,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
  answers?: OnboardingAnswers;
}) {
  const initial = (answers?.[step.id] as string) || '';
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();

  const submit = () => {
    if (!trimmed) return;
    haptic.success();
    onAnswer?.(step.id, trimmed);
    onNext();
  };

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
          Welcome
        </p>
        <h1 className="mt-2 text-[30px] leading-[1.1] font-bold text-[#2A1810]">
          {step.title || 'Hi — what should we call you?'}
        </h1>
        {step.subtitle && (
          <p className="mt-3 text-[15px] text-[#5a4a3a] leading-snug">{step.subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="flex-1"
      >
        <div className="rounded-[22px] bg-white/55 backdrop-blur-2xl border border-white/70 shadow-ios p-4">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Your first name"
            className="w-full bg-transparent outline-none text-[20px] font-semibold text-[#2A1810] placeholder:text-[#bba99a] py-2"
          />
        </div>
      </motion.div>

      <div className="pt-4">
        <GlassCTA onClick={submit} disabled={!trimmed}>
          {step.buttonLabel || 'Continue'}
        </GlassCTA>
      </div>
    </GlassShell>
  );
}

/* ─── 8. Language switch (glass) ───────────────────────────────── */

export function DoorLanguageSwitchScreen({
  step,
  onNext,
  onAnswer,
  answers,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
  answers?: OnboardingAnswers;
}) {
  const langLabel = (answers?.['rd-language'] as string) || '';
  const pretty =
    langLabel === 'English only' ? 'English' : langLabel || 'this language';

  const pick = (val: 'yes' | 'no') => {
    haptic.selection();
    onAnswer?.(step.id, val);
    setTimeout(onNext, 250);
  };

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
          Quick check
        </p>
        <h1 className="mt-2 text-[28px] leading-[1.1] font-bold text-[#2A1810]">
          Switch the app to {pretty} too?
        </h1>
        <p className="mt-3 text-[15px] text-[#5a4a3a] leading-snug">
          {step.subtitle || 'Or keep the interface in English — your choice.'}
        </p>
      </motion.div>

      <div className="flex-1" />

      <div className="space-y-3 pb-2">
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => pick('yes')}
          className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#EB5E33] to-[#F5A623] shadow-ios active:scale-[0.98] transition-all"
        >
          {step.buttonLabel || `Switch to ${pretty}`}
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => pick('no')}
          className="w-full py-4 rounded-2xl font-semibold text-base text-[#2A1810] bg-white/65 backdrop-blur-2xl border border-white/70 shadow-ios active:scale-[0.98] transition-all"
        >
          {step.secondaryButtonLabel || 'Keep English'}
        </motion.button>
      </div>
    </GlassShell>
  );
}