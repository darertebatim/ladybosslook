import { useEffect, useState } from 'react';
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
    label: "I'm feeling something heavy",
    blurb: 'Anxiety, sadness, anger — let Rilo help you breathe through it.',
    tint: 'rgba(244,114,182,0.55)',
    ring: 'from-pink-300 via-pink-400 to-rose-300',
    bubble: 'bg-pink-100/80',
  },
  {
    key: 'selfcare',
    emoji: '🧩',
    label: 'I want self-care that fits me',
    blurb: 'Find the kind of care you keep skipping — and the why behind it.',
    tint: 'rgba(110,231,183,0.55)',
    ring: 'from-emerald-300 via-teal-300 to-emerald-200',
    bubble: 'bg-emerald-100/80',
  },
  {
    key: 'immigrant',
    emoji: '🌍',
    label: "I'm looking for guidance as an immigrant",
    blurb: 'Belong in two languages — for homesickness, identity, starting over.',
    tint: 'rgba(167,139,250,0.55)',
    ring: 'from-violet-300 via-purple-300 to-fuchsia-300',
    bubble: 'bg-violet-100/80',
  },
  {
    key: 'productivity',
    emoji: '⚡',
    label: 'I want to be more productive',
    blurb: 'Tiny routines that actually finish — focus, follow-through, calm pace.',
    tint: 'rgba(253,224,71,0.55)',
    ring: 'from-yellow-300 via-amber-300 to-orange-300',
    bubble: 'bg-yellow-100/80',
  },
  {
    key: 'exploring',
    emoji: '👀',
    label: 'Just exploring',
    blurb: "Not sure yet — show me what Rilo can do.",
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

/* ─── 1. Door Cards ────────────────────────────────────────────── */

export function DoorCardsGlassScreen({
  step,
  onNext,
  onAnswer,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (id: string, val: string | string[]) => void;
}) {
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
        <h1 className="text-[28px] leading-[1.15] font-bold text-[#2A1810]">
          {step.title || 'Which door is yours\nright now?'}
        </h1>
        {step.subtitle && (
          <p className="mt-2 text-[15px] text-[#5a4a3a] leading-snug">{step.subtitle}</p>
        )}
      </motion.div>

      <div className="flex-1 space-y-3">
        {DOORS.map((d, i) => {
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
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
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

      <div className="flex-1 grid grid-cols-2 gap-2.5 content-start auto-rows-min">
        {EMOTION_TOP5.map((e, i) => (
          <EmotionTile key={e.key} {...e} picked={picked.includes(e.key)} onClick={() => toggle(e.key)} delay={i * 0.04} />
        ))}

        <AnimatePresence>
          {expanded &&
            EMOTION_REST.map((e, i) => (
              <EmotionTile key={e.key} {...e} picked={picked.includes(e.key)} onClick={() => toggle(e.key)} delay={i * 0.03} />
            ))}
        </AnimatePresence>

        {!expanded ? (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => { haptic.selection(); setExpanded(true); }}
            className="py-4 rounded-2xl bg-white border border-[#E8DCC9] text-[14px] font-semibold text-[#6b5a4a] active:scale-[0.97] transition-all"
          >
            Show more
          </motion.button>
        ) : null}

        <motion.button
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            haptic.selection();
            setDontKnow((v) => !v);
            if (!dontKnow) setPicked([]);
          }}
          className={cn(
            'py-4 rounded-2xl font-semibold text-[14px] transition-all active:scale-[0.97] border',
            dontKnow
              ? 'bg-[#2A1810] text-white border-transparent'
              : 'bg-white text-[#6b5a4a] border-[#E8DCC9]'
          )}
        >
          I'm not sure
        </motion.button>
      </div>

      <div className="pt-5">
        <GlassCTA onClick={handleNext} disabled={!canContinue}>
          Continue
        </GlassCTA>
      </div>
    </GlassShell>
  );
}

function EmotionTile({
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
        'flex items-center gap-2.5 px-4 py-4 rounded-2xl border transition-all active:scale-[0.97]',
        picked
          ? 'bg-gradient-to-br from-[#EB5E33] to-[#F5A623] text-white border-transparent shadow-[0_8px_20px_-8px_rgba(235,94,51,0.5)]'
          : 'bg-white text-[#2A1810] border-[#E8DCC9]'
      )}
    >
      <FluentEmoji emoji={emoji} size={22} />
      <span className="text-[15px] font-semibold">{label}</span>
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

  const toggle = (k: string) => {
    haptic.selection();
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  };

  const handleContinue = () => {
    onAnswer?.(step.id, picked.length ? picked : ['unknown']);
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
          <EmotionTile
            key={t.key}
            emoji={t.emoji}
            label={t.label}
            picked={picked.includes(t.key)}
            onClick={() => toggle(t.key)}
            delay={i * 0.04}
          />
        ))}
      </div>

      <div className="pt-5">
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
  // Page 1 — "A whole library, ready for you"
  // Show a fanned stack of content cards so the user feels the breadth of Rilo's library.
  const LIBRARY = [
    {
      emoji: '🎧',
      kind: 'Sleep stories',
      line: 'Drift off in 10 min',
      bg: 'from-violet-200 to-indigo-200',
      rotate: -10,
      x: -90,
      y: 30,
      z: 1,
    },
    {
      emoji: '🧘',
      kind: 'Meditations',
      line: 'Calm in 5',
      bg: 'from-emerald-200 to-teal-200',
      rotate: -3,
      x: -32,
      y: 6,
      z: 2,
    },
    {
      emoji: '📚',
      kind: 'Mini-courses',
      line: 'Self-care, rebuilt',
      bg: 'from-amber-200 to-orange-200',
      rotate: 5,
      x: 30,
      y: 0,
      z: 3,
    },
    {
      emoji: '🌬️',
      kind: 'Breathwork',
      line: 'Reset anytime',
      bg: 'from-sky-200 to-cyan-200',
      rotate: 12,
      x: 90,
      y: 28,
      z: 2,
    },
  ];

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-2 mb-5 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EB5E33]">
          Welcome to Rilo
        </p>
        <h1 className="mt-2 text-[28px] leading-[1.1] font-bold text-[#2A1810]">
          {step.title || 'A whole library,\nready for you.'}
        </h1>
        <p className="mt-2 text-[14.5px] text-[#5a4a3a] leading-snug max-w-[320px] mx-auto">
          {step.subtitle ||
            'Hundreds of sessions — meditations, sleep stories, courses, breathwork. All in one calm place.'}
        </p>
      </motion.div>

      {/* Fanned content cards */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[300px] h-[280px]">
          {LIBRARY.map((c, i) => (
            <motion.div
              key={c.kind}
              initial={{ opacity: 0, y: 40, rotate: 0, scale: 0.9 }}
              animate={{ opacity: 1, y: c.y, rotate: c.rotate, scale: 1 }}
              transition={{
                delay: 0.2 + i * 0.12,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                left: '50%',
                top: 0,
                transform: `translateX(calc(-50% + ${c.x}px))`,
                zIndex: c.z,
              }}
              className={cn(
                'absolute w-[150px] h-[200px] rounded-[26px] border border-white/80 shadow-ios p-4 flex flex-col justify-between',
                'bg-gradient-to-br',
                c.bg,
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-xl flex items-center justify-center shadow-ios">
                <FluentEmoji emoji={c.emoji} size={28} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2A1810]/70">
                  {c.kind}
                </p>
                <p className="mt-1 text-[14px] font-bold text-[#2A1810] leading-tight">
                  {c.line}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Count chip floating below the fan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.4 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xl border border-white/80 shadow-ios"
          >
            <p className="text-[12px] font-semibold text-[#2A1810]">
              <span className="text-[#EB5E33]">+ 200 sessions</span> in your language
            </p>
          </motion.div>
        </div>
      </div>

      <div className="pt-4">
        <GlassCTA onClick={onNext}>{step.buttonLabel || 'Next'}</GlassCTA>
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
  // Page 2 — "Built around what you carry"
  // Three soft pillars showing Rilo recognizes the user's reality, not just tasks.
  const PILLARS = [
    {
      emoji: '💛',
      tag: 'When emotions hit',
      line: 'Rilo meets the feeling, not just the task.',
      bg: 'from-pink-100 to-rose-100',
      ring: 'bg-pink-200/70',
    },
    {
      emoji: '🌱',
      tag: 'When self-care slips',
      line: 'We rebuild it, one small step at a time.',
      bg: 'from-emerald-100 to-teal-100',
      ring: 'bg-emerald-200/70',
    },
    {
      emoji: '🌍',
      tag: 'Living between two worlds',
      line: 'For the immigrant heart — in your language.',
      bg: 'from-violet-100 to-fuchsia-100',
      ring: 'bg-violet-200/70',
    },
  ];

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-2 mb-5 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EB5E33]">
          Built for you
        </p>
        <h1 className="mt-2 text-[28px] leading-[1.1] font-bold text-[#2A1810]">
          {step.title || 'Made for the parts\napps usually skip.'}
        </h1>
        <p className="mt-2 text-[14.5px] text-[#5a4a3a] leading-snug max-w-[320px] mx-auto">
          {step.subtitle ||
            'Three quiet things Rilo is really good at — pick the one that sounds like you.'}
        </p>
      </motion.div>

      {/* Stacked recognition pillars */}
      <div className="flex-1 flex flex-col justify-center gap-3.5">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.tag}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.2 + i * 0.18,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              'relative rounded-[24px] p-4 pl-[72px] border border-white/80 shadow-ios',
              'bg-gradient-to-br',
              p.bg,
            )}
          >
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center shadow-ios border border-white/80',
                p.ring,
              )}
            >
              <FluentEmoji emoji={p.emoji} size={28} />
            </div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#2A1810]/70">
              {p.tag}
            </p>
            <p className="mt-1 text-[14.5px] font-bold text-[#2A1810] leading-snug">
              {p.line}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="pt-4">
        <GlassCTA onClick={onNext}>{step.buttonLabel || "Let's pick yours"}</GlassCTA>
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
    <div className="relative h-full w-full overflow-hidden">
      <MeshBg />
      {/* dim layer to suggest a sheet over the prior screen */}
      <div className="absolute inset-0 bg-black/30 z-[5]" />

      {/* half-page bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className="absolute inset-x-0 bottom-0 z-10 rounded-t-[28px] bg-[#FFF8F2] shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
        }}
      >
        {/* grabber */}
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-black/15" />
        </div>

        <div className="px-5 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EB5E33]">
            Quick check
          </p>
          <h1 className="mt-2 text-[24px] leading-[1.15] font-bold text-[#2A1810]">
            Switch the app to {pretty} too?
          </h1>
          <p className="mt-2 text-[14px] text-[#5a4a3a] leading-snug">
            {step.subtitle || 'Or keep the interface in English — your choice.'}
          </p>

          <p className="mt-4 text-[12px] text-[#8a7866] italic">
            * You can always change the language in Settings.
          </p>
        </div>

        <div className="px-5 pt-6 pb-2 flex gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            onClick={() => pick('no')}
            className="flex-1 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#EB5E33] to-[#F5A623] shadow-ios active:scale-[0.98] transition-all"
          >
            {step.secondaryButtonLabel || 'Keep English'}
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={() => pick('yes')}
            className="flex-1 py-4 rounded-2xl font-semibold text-base text-[#2A1810] bg-white border border-black/5 shadow-ios active:scale-[0.98] transition-all"
          >
            {step.buttonLabel || `Switch to ${pretty}`}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── 9. Rilo Doors Loader — final building screen ─────────────── */

const LOADER_LIBRARY = [
  { emoji: '🎧', kind: 'Sleep stories', bg: 'from-violet-200 to-indigo-200', rotate: -10, x: -90, y: 30, z: 1 },
  { emoji: '🧘', kind: 'Meditations', bg: 'from-emerald-200 to-teal-200', rotate: -3, x: -32, y: 6, z: 2 },
  { emoji: '📚', kind: 'Mini-courses', bg: 'from-amber-200 to-orange-200', rotate: 5, x: 30, y: 0, z: 3 },
  { emoji: '🌬️', kind: 'Breathwork', bg: 'from-sky-200 to-cyan-200', rotate: 12, x: 90, y: 28, z: 2 },
];

const LOADER_PILLARS = [
  { emoji: '💛', tag: 'When emotions hit', line: 'Rilo meets the feeling, not just the task.', bg: 'from-pink-100 to-rose-100', ring: 'bg-pink-200/70' },
  { emoji: '🌱', tag: 'When self-care slips', line: 'We rebuild it, one small step at a time.', bg: 'from-emerald-100 to-teal-100', ring: 'bg-emerald-200/70' },
  { emoji: '🌍', tag: 'Living between two worlds', line: 'For the immigrant heart — in your language.', bg: 'from-violet-100 to-fuchsia-100', ring: 'bg-violet-200/70' },
];

const LOADER_PATH = [
  { emoji: '🌅', label: 'Morning calm' },
  { emoji: '🎧', label: 'A playlist for you' },
  { emoji: '🌿', label: 'A small reset' },
  { emoji: '🌙', label: 'Wind down' },
];

const LOADER_PHASES = [
  { caption: 'Opening your library…', sub: 'Hundreds of sessions in one calm place.' },
  { caption: 'Reading what you carry…', sub: 'Made for the parts apps usually skip.' },
  { caption: 'Laying your path…', sub: 'A few small steps, lined up just for you.' },
  { caption: 'Almost ready…', sub: 'Picking your playlists.' },
];

const PHASE_MS = 1900;

export function RiloDoorsLoaderScreen({
  step,
  onNext,
}: {
  step: OnboardingStep;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const total = LOADER_PHASES.length;
    const timers: number[] = [];
    for (let i = 1; i < total; i++) {
      timers.push(window.setTimeout(() => setPhase(i), PHASE_MS * i));
    }
    timers.push(window.setTimeout(() => { haptic.light(); onNext(); }, PHASE_MS * total + 400));
    return () => { timers.forEach((t) => window.clearTimeout(t)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = LOADER_PHASES[phase];
  const progress = ((phase + 1) / LOADER_PHASES.length) * 100;

  return (
    <GlassShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-2 mb-4 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EB5E33]">
          ✨ Building your Rilo
        </p>
        <h1 className="mt-2 text-[26px] leading-[1.15] font-bold text-[#2A1810]">
          {step.title || 'Building your path…'}
        </h1>
      </motion.div>

      {/* Stage that swaps between phase visuals */}
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div
              key="library"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45 }}
              className="relative w-[300px] h-[260px]"
            >
              {LOADER_LIBRARY.map((c, i) => (
                <motion.div
                  key={c.kind}
                  initial={{ opacity: 0, y: 40, rotate: 0 }}
                  animate={{ opacity: 1, y: c.y, rotate: c.rotate }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ left: '50%', top: 0, transform: `translateX(calc(-50% + ${c.x}px))`, zIndex: c.z }}
                  className={cn(
                    'absolute w-[140px] h-[190px] rounded-[26px] border border-white/80 shadow-ios p-4 flex flex-col justify-between',
                    'bg-gradient-to-br', c.bg,
                  )}
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-xl flex items-center justify-center shadow-ios">
                    <FluentEmoji emoji={c.emoji} size={26} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2A1810]/80">
                    {c.kind}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div
              key="pillars"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="w-full flex flex-col gap-3"
            >
              {LOADER_PILLARS.map((p, i) => (
                <motion.div
                  key={p.tag}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
                  className={cn(
                    'relative rounded-[22px] p-3.5 pl-[64px] border border-white/80 shadow-ios',
                    'bg-gradient-to-br', p.bg,
                  )}
                >
                  <div className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center shadow-ios border border-white/80',
                    p.ring,
                  )}>
                    <FluentEmoji emoji={p.emoji} size={24} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2A1810]/70">
                    {p.tag}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-bold text-[#2A1810] leading-snug">
                    {p.line}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {(phase === 2 || phase === 3) && (
            <motion.div
              key="path"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="w-full flex flex-col gap-3 items-center"
            >
              {LOADER_PATH.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.18, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex items-center gap-3 w-[260px]"
                  style={{ transform: `translateX(${i % 2 === 0 ? -20 : 20}px)` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/85 backdrop-blur-xl flex items-center justify-center shadow-ios border border-white/80">
                    <FluentEmoji emoji={s.emoji} size={26} />
                  </div>
                  <div className="flex-1 px-4 py-2.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/70 shadow-ios">
                    <p className="text-[13.5px] font-bold text-[#2A1810]">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption + progress */}
      <div className="pt-3 pb-2 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.caption}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[15px] font-bold text-[#2A1810]">{current.caption}</p>
            <p className="mt-1 text-[13px] text-[#5a4a3a]">{current.sub}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 mx-auto w-[220px] h-1.5 rounded-full bg-black/8 overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#EB5E33] to-[#F5A623]"
          />
        </div>
      </div>
    </GlassShell>
  );
}