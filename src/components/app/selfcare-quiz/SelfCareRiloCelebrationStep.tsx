import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';
import riloAppIcon from '@/assets/rilo-app-icon.png';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

/**
 * Celebratory page in the "What is Rilo?" design language, shown right
 * after the user commits to their self-care routine. Warm gradient,
 * sparkles, app-icon bloom, and a single tap to continue to the routine
 * reveal page.
 */
export function SelfCareRiloCelebrationStep({ step, onNext }: Props) {
  const handleTap = () => {
    haptic.light();
    onNext();
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      <AmbientGlow />

      {/* Visual area */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-4 relative z-10">
        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
          {/* Pulsing rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.4, opacity: 0.55 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.8, delay: i * 0.45, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-[180px] h-[180px] rounded-full border-2"
              style={{ borderColor: ['#F08A3E', '#EC4899', '#8A5CF0'][i] }}
            />
          ))}
          {/* App icon bloom */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 220, damping: 18 }}
            className="relative w-24 h-24 rounded-[26px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(138,92,240,0.55)]"
          >
            <img src={riloAppIcon} alt="Rilo" className="w-full h-full object-cover select-none" draggable={false} />
          </motion.div>
          {/* Floating sparkles around the icon */}
          {[
            { x: -90, y: -60, d: 0.2, c: '#F08A3E' },
            { x: 90, y: -50, d: 0.4, c: '#EC4899' },
            { x: -70, y: 70, d: 0.6, c: '#8A5CF0' },
            { x: 80, y: 80, d: 0.5, c: '#F08A3E' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0.6], scale: [0.4, 1, 1, 0.9], x: s.x, y: s.y }}
              transition={{ duration: 1.2, delay: s.d, ease: 'easeOut' }}
              className="absolute"
            >
              <Sparkles className="w-5 h-5" style={{ color: s.c }} strokeWidth={2.5} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Text + CTA */}
      <div className="shrink-0 px-6 pb-10 relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] mb-2"
        >
          ✨ Your routine is ready
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.5 }}
          className="text-[26px] leading-[1.2] font-bold text-[#1a1f3d] text-center whitespace-pre-line"
        >
          {step.title || 'You showed up\nfor yourself today.'}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-3 leading-snug text-center text-[15px] text-[#1a1f3d]/70"
          >
            {step.subtitle}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="mt-3 text-center text-[12px] font-semibold text-[#1a1f3d]/60"
        >
          <span className="text-[#1a1f3d]">3,000+</span> women restart their self-care this way.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          onClick={handleTap}
          className="mt-7 w-full h-[56px] rounded-2xl text-white font-semibold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)]"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {step.buttonLabel || 'See my routine'}
        </motion.button>
      </div>
    </div>
  );
}

function AmbientGlow() {
  const sparkles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-20 w-[260px] h-[260px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #CDE7FF 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #E5D6FF 0%, transparent 70%)' }}
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
            style={{ left: `${left}%`, top: `${top}%`, color: '#1a1f3d', opacity: 0.6 }}
          >
            ✨
          </motion.span>
        );
      })}
    </div>
  );
}