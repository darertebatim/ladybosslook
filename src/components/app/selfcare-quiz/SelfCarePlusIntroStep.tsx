import { motion } from 'framer-motion';
import { Sparkles, Gift, Lock } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';
import riloAppIcon from '@/assets/rilo-app-icon.png';

interface Props {
  step: OnboardingStep;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Finch-inspired soft Plus intro shown at the very end of the Self-Care Quiz.
 * Frames Rilo as free first, Plus as an optional gift — never a wall.
 * Accept → 3-step paywall. Decline → straight to Home (free routine).
 */
export function SelfCarePlusIntroStep({ step, onAccept, onDecline }: Props) {
  const accept = () => { haptic.light(); onAccept(); };
  const decline = () => { haptic.light(); onDecline(); };

  const perks = [
    { icon: '🌿', label: 'Unlimited self-care tools' },
    { icon: '🎧', label: 'Full audio & guided sessions' },
    { icon: '🪄', label: 'Personalized AI coaching' },
  ];

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF6E8] via-[#FFE9F1] to-[#EFE4FF]">
      {/* Ambient warmth */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 -right-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #E5D6FF 0%, transparent 70%)' }}
      />

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 relative z-10">
        {/* Mascot / icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
          className="relative mx-auto w-24 h-24 rounded-[26px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(138,92,240,0.5)]"
        >
          <img src={riloAppIcon} alt="Rilo" className="w-full h-full object-cover" draggable={false} />
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <Gift className="w-4 h-4 text-[#EC4899]" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E]"
        >
          ✨ A small gift from us
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="mt-2 text-[24px] leading-[1.2] font-extrabold text-[#1a1f3d] text-center whitespace-pre-line"
        >
          {step.title || "Rilo is free to use —\nbut we'd love for you to try Rilo Plus for 7 days free too!"}
        </motion.h1>
        {step.subtitle ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.36 }}
            className="mt-3 text-center text-[14px] text-[#1a1f3d]/70 leading-snug"
          >
            {step.subtitle}
          </motion.p>
        ) : null}

        {/* Perks card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-6 max-w-[360px] mx-auto rounded-3xl bg-white/70 backdrop-blur-sm border border-white shadow-[0_18px_45px_-18px_rgba(138,92,240,0.35)] p-4"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[12px] font-bold text-[#1a1f3d] uppercase tracking-wider">Plus includes</span>
            <span className="text-[11px] font-bold text-[#8A5CF0] bg-[#8A5CF0]/10 px-2 py-1 rounded-full">7 days free</span>
          </div>
          <ul className="space-y-2.5">
            {perks.map((p, i) => (
              <motion.li
                key={p.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.55 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[18px]">
                  {p.icon}
                </div>
                <span className="text-[14px] font-semibold text-[#1a1f3d]">{p.label}</span>
              </motion.li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] text-[#1a1f3d]/55">
            Cancel anytime. No charge during your trial.
          </p>
        </motion.div>
      </div>

      {/* CTAs */}
      <div
        className="shrink-0 px-6 pt-2 pb-6 relative z-10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
      >
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          onClick={accept}
          className="w-full h-[56px] rounded-2xl text-white font-bold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)]"
        >
          {step.buttonLabel || 'See my free offer →'}
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          onClick={decline}
          className="mt-3 w-full h-[44px] rounded-xl text-[#1a1f3d]/70 font-semibold text-[14px] active:opacity-60 transition-opacity"
        >
          {step.secondaryButtonLabel || 'Maybe later'}
        </motion.button>
      </div>
    </div>
  );
}