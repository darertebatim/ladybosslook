import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import riloAppIcon from '@/assets/rilo-app-icon.png';

interface PurchaseCelebrationProps {
  open: boolean;
  onClose: () => void;
  plan?: 'monthly' | 'annual';
}

export function PurchaseCelebration({ open, onClose, plan }: PurchaseCelebrationProps) {
  const hasConfettiFired = useRef(false);

  useEffect(() => {
    if (!open || hasConfettiFired.current) return;
    hasConfettiFired.current = true;

    // Rilo-themed confetti — orange / pink / lavender
    const fireConfetti = () => {
      const colors = ['#F08A3E', '#EC4899', '#8A5CF0', '#FFD27A', '#FFFFFF'];
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.45 }, colors, zIndex: 10005 });
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors, zIndex: 10005 }), 200);
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors, zIndex: 10005 }), 400);
    };

    const timer = setTimeout(fireConfetti, 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Reset ref when closed
  useEffect(() => {
    if (!open) {
      hasConfettiFired.current = false;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ zIndex: 10004 }}
    >
      {/* Rilo sunrise gradient (matches rilo-teach 'suggest' screen) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]" />

      {/* Ambient glow blobs */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-20 w-[260px] h-[260px] rounded-full blur-3xl opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #CDE7FF 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E5D6FF 0%, transparent 70%)' }}
      />

      {/* Floating sparkles */}
      {Array.from({ length: 14 }).map((_, i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const delay = (i % 7) * 0.3;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, delay, repeat: Infinity, repeatDelay: 1.5 }}
            className="absolute text-[10px] pointer-events-none"
            style={{ left: `${left}%`, top: `${top}%`, color: '#1a1f3d', opacity: 0.6 }}
          >
            ✨
          </motion.span>
        );
      })}

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/70 backdrop-blur text-[#1a1f3d] active:bg-white"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Visual area */}
      <div className="flex-1 flex items-center justify-center px-6 pt-10 pb-2 relative z-10">
        <div className="relative w-[180px] h-[180px] flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.4, opacity: 0.7 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: ['#F08A3E', '#EC4899', '#8A5CF0'][i] }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 220, damping: 16 }}
            className="relative w-[120px] h-[120px] rounded-[28px] overflow-hidden shadow-[0_24px_60px_-12px_rgba(138,92,240,0.55)]"
          >
            <img
              src={riloAppIcon}
              alt="Rilo"
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
          </motion.div>
        </div>
      </div>

      {/* Text + CTA */}
      <div className="shrink-0 px-6 pb-10 relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] mb-2"
        >
          ✨ You're in
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="text-[26px] leading-[1.2] font-bold text-[#1a1f3d] text-center"
        >
          Welcome to Rilo Plus
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="mt-3 text-[15px] text-[#1a1f3d]/70 text-center"
        >
          All premium features are unlocked. Enjoy your{' '}
          {plan === 'annual' ? 'annual' : 'monthly'} membership.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="grid grid-cols-2 gap-2 mt-5 max-w-[320px] mx-auto"
        >
          {[
            '🧘 Premium Breathing',
            '🎵 All Soundscapes',
            '📋 Unlimited Planner',
            '💎 Exclusive Content',
          ].map((feature) => (
            <div
              key={feature}
              className="bg-white/70 backdrop-blur border border-white rounded-2xl py-2.5 px-3 text-[12px] font-semibold text-[#1a1f3d] text-center shadow-sm"
            >
              {feature}
            </div>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          onClick={onClose}
          className="mt-6 w-full max-w-[420px] mx-auto h-[56px] rounded-2xl text-white font-semibold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)] flex items-center justify-center gap-2"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Sparkles className="h-4 w-4" />
          Start exploring
        </motion.button>
      </div>
    </div>
  );
}
