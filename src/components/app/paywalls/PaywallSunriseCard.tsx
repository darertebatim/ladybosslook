import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, X, Sparkles } from 'lucide-react';
import { usePaywallTracking } from '@/hooks/usePaywallTracking';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import riloAppIcon from '@/assets/rilo-app-icon.png';
import type { PaywallProgramData } from './PaywallClassic';

interface PaywallProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

/** Today label in the user's local TZ (matches RiloTeachScreen). */
function formatTodayLabel(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: tz,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles',
    }).format(new Date());
  }
}

function Emoji3D({ char, size = 22 }: { char: string; size?: number }) {
  return (
    <img
      src={getFluentEmojiUrl(char)}
      alt={char}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      className="inline-block object-contain select-none"
      style={{ width: size, height: size }}
    />
  );
}

/* Ambient blurred glow + sparkles — same DNA as the "Meet Rilo" intro. */
function PlannerAmbientGlow() {
  const sparkles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #FFD36E 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-20 w-[260px] h-[260px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #F8B4C6 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #E84A6F 0%, transparent 70%)' }}
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
            style={{ left: `${left}%`, top: `${top}%`, color: '#A0123F', opacity: 0.6 }}
          >
            ✨
          </motion.span>
        );
      })}
    </div>
  );
}

/**
 * PaywallSunriseCard — "Today, but with Plus"
 *
 * Continuation of the Meet-Rilo onboarding visual story:
 *   • Same warm sunrise gradient (#FFF4DC → #FFE0E6 → #FBD4E2)
 *   • Floating white planner card rising from below
 *   • R-mark blooms from center, settles into the card header
 *   • Tasks slide in pastel-pill style; premium ones light up with a gold halo
 *   • Gold uppercase "✨ RILO PLUS" eyebrow + bold black headline
 *   • Solid navy CTA + free-trial subline + "Maybe later" ghost
 */
export function PaywallSunriseCard({ program, onPurchase, onRestore, onClose, preview }: PaywallProps) {
  usePaywallTracking('sunrise-card');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;
  const trialDays = program.trial_days ?? 7;

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    try {
      const plan: 'monthly' | 'annual' = hasAnnual ? 'annual' : 'monthly';
      const productId = plan === 'annual'
        ? program.annual_ios_product_id!
        : program.ios_product_id!;
      await onPurchase?.(productId, plan);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Tasks shown in the floating card. The `plus` ones get a gold halo.
  const blocks = [
    { time: '7:30',  emoji: '🍵', title: 'Iced matcha + journal', color: '#E0FBB8', plus: false },
    { time: '12:30', emoji: '👟', title: 'Hot girl walk',          color: '#FFD9E5', plus: false },
    { time: '15:00', emoji: '🧠', title: 'AI coach check-in',      color: '#FFEFC2', plus: true  },
    { time: '21:00', emoji: '🛁', title: 'Skincare + slow read',   color: '#E5D6FF', plus: true  },
  ];

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-[#FFF4DC] via-[#FFE0E6] to-[#FBD4E2]">
      <PlannerAmbientGlow />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-[#1a1f3d]/60 active:opacity-60" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <button onClick={onRestore} className="text-sm text-[#1a1f3d]/60 active:opacity-60">
          Restore
        </button>
      </div>

      {/* Hero card area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pt-2 pb-3">
        <div className="relative w-full max-w-[320px] mx-auto">
          {/* R-mark blooming + landing into card header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: [0, 1, 1, 1],
              scale: [0.2, 1.6, 1.6, 0.36],
              x: [0, 0, 0, 120],
              y: [0, 0, 0, -20],
            }}
            transition={{
              duration: 1.1,
              times: [0, 0.4, 0.55, 1],
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-[18px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(138,92,240,0.55)]"
          >
            <img src={riloAppIcon} alt="Rilo" className="w-full h-full object-cover select-none" draggable={false} />
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

          {/* Floating planner card */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full bg-white rounded-3xl shadow-[0_24px_70px_-20px_rgba(26,31,61,0.3)] p-5 border border-white/80"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.1 }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Today</p>
                <p className="text-[18px] font-bold text-[#1a1f3d]">{formatTodayLabel()}</p>
              </motion.div>
              <div className="w-9 h-9 rounded-full bg-transparent" />
            </div>

            <div className="space-y-2.5">
              {blocks.map((b, i) => {
                const taskDelay = 1.3 + i * 0.18;
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: taskDelay, duration: 0.35, ease: 'easeOut' }}
                    className="relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 overflow-hidden"
                    style={{ background: b.color }}
                  >
                    {/* Sweep highlight */}
                    <motion.span
                      initial={{ x: '-110%', opacity: 0.55 }}
                      animate={{ x: '110%', opacity: 0 }}
                      transition={{ delay: taskDelay + 0.05, duration: 0.55, ease: 'easeOut' }}
                      className="absolute inset-y-0 w-1/2 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}
                    />

                    {/* Time + emoji */}
                    <div className="relative">
                      {/* Gold halo for premium tasks */}
                      {b.plus && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: [0, 0.85, 0.55], scale: [0.9, 1.25, 1.1] }}
                          transition={{ delay: taskDelay + 0.2, duration: 1.4, repeat: Infinity, repeatType: 'reverse' }}
                          className="absolute inset-0 -m-2 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(255,196,77,0.8) 0%, rgba(255,196,77,0) 70%)',
                            filter: 'blur(6px)',
                          }}
                        />
                      )}
                      <div className="relative w-9 h-9 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                        <Emoji3D char={b.emoji} size={22} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 relative">
                      <p className="text-[11px] font-bold text-[#1a1f3d]/70 leading-tight">{b.time}</p>
                      <p className="text-[14px] font-bold text-[#1a1f3d] leading-tight truncate">{b.title}</p>
                    </div>

                    {b.plus && (
                      <span className="relative shrink-0 inline-flex items-center gap-1 rounded-full bg-[#1a1f3d] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                        <Sparkles className="w-2.5 h-2.5" /> Plus
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Text + CTA */}
      <div className="relative z-10 shrink-0 px-6 pb-8">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.1 }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] mb-2"
        >
          ✨ Rilo Plus
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 2.2 }}
          className="text-[26px] leading-[1.2] font-bold text-[#1a1f3d] text-center"
        >
          Your day, unlocked.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.35 }}
          className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 max-w-[320px] mx-auto"
        >
          {[
            { emoji: '🧠', label: 'AI Planner' },
            { emoji: '🔔', label: 'Smart Reminders' },
            { emoji: '🌿', label: 'All Routines' },
            { emoji: '🧘', label: 'All Self-Care Tools' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <Emoji3D char={f.emoji} size={18} />
              <span className="text-[13px] font-bold text-[#1a1f3d] leading-tight">{f.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.55 }}
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="mt-6 w-full h-[56px] rounded-2xl bg-[#1a1f3d] text-white font-semibold text-[16px] active:opacity-80 transition-opacity flex items-center justify-center"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {isPurchasing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>Start {trialDays}-day free trial</>
          )}
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.7 }}
          className="mt-2 text-center text-[12px] font-semibold text-[#1a1f3d]/60"
        >
          Then ${hasAnnual ? annualPrice.toFixed(2) + '/yr' : monthlyPrice.toFixed(2) + '/mo'} · cancel anytime
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.85 }}
          className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#1a1f3d]/50"
        >
          <button onClick={onClose} className="active:opacity-60">Maybe later</button>
          <span>·</span>
          <Link to="/sms-terms" className="active:opacity-60">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="active:opacity-60">Privacy</Link>
        </motion.div>
      </div>
    </div>
  );
}