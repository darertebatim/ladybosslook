import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ShieldEarnedSheetProps {
  open: boolean;
  /** Streak day milestone (7 or 30) */
  milestoneDay: number;
  /** Total shields the user now has after this unlock (1, 2, or 3) */
  totalShields: number;
  onClose: () => void;
}

/**
 * Celebration sheet shown when the user newly unlocks a Recovery Shield
 * by reaching a streak milestone (Day 7 or Day 30).
 *
 * Design language matches the WhatsRilo onboarding success screen:
 * radial peach→pink→lavender wash, expanding glow rings, sparkles,
 * gradient serif headline with shimmer underline, soft confetti.
 */
export const ShieldEarnedSheet = ({
  open,
  milestoneDay,
  totalShields,
  onClose,
}: ShieldEarnedSheetProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    haptic.success();
    const t1 = setTimeout(() => {
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          startVelocity: 45,
          gravity: 0.85,
          ticks: 200,
          origin: { x: 0.5, y: 0.55 },
          colors: ['#A98AF0', '#F08AB5', '#FFB347', '#FFD86B', '#5BD0A8'],
          scalar: 0.85,
        });
      } catch {}
    }, 280);
    const t2 = setTimeout(() => haptic.medium(), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  const sparkles = useMemo(
    () => [
      { left: '14%', top: '18%', emoji: '✨', delay: 0.5 },
      { left: '82%', top: '14%', emoji: '⭐', delay: 0.65 },
      { left: '10%', top: '58%', emoji: '💫', delay: 0.8 },
      { left: '86%', top: '52%', emoji: '✨', delay: 0.95 },
      { left: '50%', top: '6%', emoji: '⭐', delay: 1.1 },
    ],
    []
  );

  if (!open) return null;

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[10100] flex items-center justify-center p-4"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Warm radial wash backdrop — replaces flat black */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 backdrop-blur-md"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 40%, rgba(255,241,230,0.96) 0%, rgba(255,228,240,0.94) 35%, rgba(241,230,255,0.92) 65%, rgba(20,16,32,0.55) 100%)',
          }}
          onClick={handleClose}
        />

        {/* Expanding glow rings behind the card */}
        <AnimatePresence>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              initial={{ scale: 0.3, opacity: 0.5 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.6, delay: 0.05 + i * 0.25, ease: 'easeOut' }}
              className="absolute pointer-events-none rounded-full"
              style={{
                width: 260,
                height: 260,
                border: '2px solid rgba(169,138,240,0.45)',
              }}
            />
          ))}
        </AnimatePresence>

        {/* Floating sparkle accents */}
        {sparkles.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
            animate={{
              opacity: [0, 1, 0.85],
              scale: [0.4, 1.2, 1],
              rotate: [-25, 8, 0],
            }}
            transition={{
              duration: 1.4,
              delay: s.delay,
              ease: 'easeOut',
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute text-[22px] pointer-events-none select-none"
            style={{ left: s.left, top: s.top }}
          >
            {s.emoji}
          </motion.div>
        ))}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.05 }}
          className="relative z-10 w-full max-w-[320px] rounded-[28px] bg-white/85 backdrop-blur-xl px-7 pt-9 pb-7 text-center shadow-[0_30px_60px_-20px_rgba(107,67,209,0.35),0_10px_25px_-10px_rgba(240,138,181,0.25)]"
          style={{ border: '1px solid rgba(255,255,255,0.7)' }}
        >
          {/* Dismiss */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-black/30 active:text-black/60 transition-colors p-2 -m-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Hero shield with halo + gradient */}
          <motion.div
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.25 }}
            className="relative mx-auto mb-5 grid place-items-center"
            style={{ width: 96, height: 96 }}
          >
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,179,71,0.55) 0%, rgba(240,138,181,0.35) 55%, transparent 75%)',
              }}
            />
            <div
              className="relative grid place-items-center w-[88px] h-[88px] rounded-[22px] shadow-[0_16px_36px_-10px_rgba(255,140,80,0.55)]"
              style={{
                background:
                  'linear-gradient(140deg, #FFD86B 0%, #FFB347 35%, #F08AB5 75%, #A98AF0 100%)',
              }}
            >
              <Shield
                className="h-11 w-11 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
                strokeWidth={2.4}
              />
            </div>
          </motion.div>

          {/* Headline — Georgia serif gradient */}
          <motion.h2
            initial={{ scale: 0.7, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.4 }}
            className="text-[28px] leading-[1.1] font-bold mb-1"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              background:
                'linear-gradient(90deg, #1a1f3d 0%, #6B43D1 50%, #1a1f3d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('shieldEarned.title')}
          </motion.h2>

          {/* Shimmer underline */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.7, ease: 'easeOut' }}
            className="mx-auto mt-2 mb-3 h-[3px] w-[88px] rounded-full origin-center"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, #A98AF0 50%, transparent 100%)',
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.85 }}
            className="text-[14px] text-[#1a1f3d]/60 font-medium mb-4"
          >
            {t('shieldEarned.subtitle', { day: milestoneDay })}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 1.0 }}
            className="text-[15px] text-[#1a1f3d]/85 leading-relaxed mb-5"
          >
            {t('shieldEarned.body', { count: totalShields })}
          </motion.p>

          {/* Shield row — gradient pills, lit ones glow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.15 }}
            className="flex justify-center gap-2.5 mb-6"
          >
            {Array.from({ length: 3 }).map((_, i) => {
              const lit = i < totalShields;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 18,
                    delay: 1.2 + i * 0.08,
                  }}
                  className={cn(
                    'grid place-items-center size-11 rounded-2xl transition-all',
                    lit
                      ? 'text-white shadow-[0_8px_20px_-6px_rgba(255,140,80,0.55)]'
                      : 'text-[#1a1f3d]/25 bg-[#1a1f3d]/[0.06]'
                  )}
                  style={
                    lit
                      ? {
                          background:
                            'linear-gradient(140deg, #FFD86B 0%, #FFB347 40%, #F08AB5 100%)',
                        }
                      : undefined
                  }
                >
                  <Shield className="h-5 w-5" strokeWidth={2.4} />
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA — gradient pill */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 1.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClose}
            className="w-full h-[52px] rounded-2xl text-white font-semibold text-[16px] shadow-[0_12px_28px_-8px_rgba(107,67,209,0.45)]"
            style={{
              background: 'linear-gradient(135deg, #1a1f3d 0%, #6B43D1 100%)',
            }}
          >
            {t('shieldEarned.cta')}
          </motion.button>
        </motion.div>
      </div>
    </OverlayPortal>
  );
};