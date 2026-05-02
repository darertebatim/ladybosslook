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
          className="mt-2 text-[24px] leading-[1.2] font-extrabold text-[#1a1f3d] text-center"
        >
          {(() => {
            const raw = step.title || "Rilo is free to use —\nbut we'd love for you to try Rilo Plus for 7 days free too!";
            const [first, ...rest] = raw.split('\n');
            const renderHighlight = (line: string) => {
              const parts = line.split(/(7 days free)/i);
              return parts.map((part, i) =>
                /^7 days free$/i.test(part) ? (
                  <span
                    key={i}
                    className="font-extrabold bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] bg-clip-text text-transparent"
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              );
            };
            return (
              <>
                <span className="block">{renderHighlight(first)}</span>
                {rest.length > 0 && <span className="block mt-3">{renderHighlight(rest.join(' '))}</span>}
              </>
            );
          })()}
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

        {/* Creative animated gift box */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-8 mx-auto relative w-[260px] h-[260px] flex items-center justify-center"
        >
          {/* Sparkles around */}
          {[
            { top: '8%', left: '12%', size: 18, delay: 0.9 },
            { top: '14%', right: '10%', size: 14, delay: 1.05 },
            { bottom: '18%', left: '6%', size: 12, delay: 1.2 },
            { bottom: '10%', right: '14%', size: 20, delay: 1.35 },
            { top: '40%', right: '2%', size: 10, delay: 1.5 },
            { top: '42%', left: '0%', size: 10, delay: 1.6 },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1], scale: [0, 1.2, 0.9, 1] }}
              transition={{ duration: 2.4, delay: s.delay, repeat: Infinity, repeatDelay: 1.2 }}
              className="absolute"
              style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom }}
            >
              <Sparkles className="text-[#F59E0B]" style={{ width: s.size, height: s.size }} strokeWidth={2.5} />
            </motion.div>
          ))}

          {/* Glow halo */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-70"
            style={{ background: 'radial-gradient(circle, rgba(255,200,120,0.6) 0%, rgba(236,72,153,0.25) 40%, transparent 70%)' }}
          />

          {/* Gift box */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <svg width="200" height="210" viewBox="0 0 200 210" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Lid bow shadow */}
              <ellipse cx="100" cy="200" rx="70" ry="6" fill="#000" opacity="0.12" />

              {/* Box base */}
              <defs>
                <linearGradient id="boxBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F08A3E" />
                  <stop offset="55%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#8A5CF0" />
                </linearGradient>
                <linearGradient id="boxLid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB066" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
                <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF4D6" />
                  <stop offset="100%" stopColor="#FFD27A" />
                </linearGradient>
              </defs>

              {/* Body */}
              <rect x="30" y="90" width="140" height="100" rx="14" fill="url(#boxBase)" />
              {/* Vertical ribbon body */}
              <rect x="86" y="90" width="28" height="100" fill="url(#ribbon)" />

              {/* Lid */}
              <rect x="22" y="68" width="156" height="34" rx="10" fill="url(#boxLid)" />
              {/* Vertical ribbon on lid */}
              <rect x="86" y="68" width="28" height="34" fill="url(#ribbon)" />

              {/* Bow left loop */}
              <path
                d="M100 68 C 70 30, 30 40, 50 60 C 65 75, 90 70, 100 68 Z"
                fill="url(#ribbon)"
                stroke="#E8A53A"
                strokeWidth="1.2"
              />
              {/* Bow right loop */}
              <path
                d="M100 68 C 130 30, 170 40, 150 60 C 135 75, 110 70, 100 68 Z"
                fill="url(#ribbon)"
                stroke="#E8A53A"
                strokeWidth="1.2"
              />
              {/* Bow knot */}
              <ellipse cx="100" cy="66" rx="14" ry="11" fill="#FFD27A" stroke="#E8A53A" strokeWidth="1.2" />
              <ellipse cx="100" cy="64" rx="6" ry="4" fill="#FFF4D6" opacity="0.8" />

              {/* Bow tails */}
              <path d="M92 76 C 80 92, 78 100, 70 104 L 84 104 C 92 96, 96 90, 100 82 Z" fill="url(#ribbon)" stroke="#E8A53A" strokeWidth="1" />
              <path d="M108 76 C 120 92, 122 100, 130 104 L 116 104 C 108 96, 104 90, 100 82 Z" fill="url(#ribbon)" stroke="#E8A53A" strokeWidth="1" />

              {/* Highlights */}
              <rect x="38" y="96" width="6" height="80" rx="3" fill="white" opacity="0.18" />
              <rect x="30" y="74" width="6" height="22" rx="3" fill="white" opacity="0.25" />
            </svg>

            {/* "7 days free" floating tag */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ duration: 0.5, delay: 0.95, type: 'spring', stiffness: 220, damping: 14 }}
              className="absolute -top-2 -right-6 px-3 py-1.5 rounded-full shadow-[0_10px_24px_-8px_rgba(236,72,153,0.6)] bg-gradient-to-r from-[#FFB347] via-[#EC4899] to-[#8A5CF0] ring-2 ring-white"
            >
              <span className="text-[11px] font-extrabold text-white tracking-wide drop-shadow-sm">7 DAYS FREE</span>
            </motion.div>
          </motion.div>
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