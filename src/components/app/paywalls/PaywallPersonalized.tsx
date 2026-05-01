import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, X, Sparkles } from 'lucide-react';
import { usePaywallTracking } from '@/hooks/usePaywallTracking';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import type { PaywallProgramData } from './PaywallClassic';

interface PaywallProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
  /** Optional: real picks from onboarding (label + emoji). Falls back to demo picks. */
  userPicks?: Array<{ label: string; emoji: string; time?: string; color?: string }>;
}

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

function AmbientGlow() {
  const sparkles = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #FFD36E 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 -right-20 w-[260px] h-[260px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #F8B4C6 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #E5D6FF 0%, transparent 70%)' }}
      />
      {sparkles.map((_, i) => {
        const left = (i * 41) % 100;
        const top = (i * 53) % 100;
        const delay = (i % 6) * 0.3;
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

const DEMO_PICKS = [
  { label: 'Iced matcha + journal', emoji: '🍵', time: '7:30',  color: '#E0FBB8' },
  { label: 'Hot girl walk',          emoji: '👟', time: '12:30', color: '#FFD9E5' },
  { label: 'Skincare + slow read',   emoji: '🛁', time: '21:00', color: '#E5D6FF' },
];

const PLUS_ADDITIONS = [
  { label: 'AI Planner',         emoji: '🧠', sub: 'Builds your day around you' },
  { label: 'Smart Reminders',    emoji: '🔔', sub: 'Nudges that actually land' },
  { label: 'All Routines',       emoji: '🌿', sub: 'Every template, unlocked' },
  { label: 'All Self-Care Tools', emoji: '🧘', sub: 'Breathwork, mood, fasting & more' },
];

/**
 * PaywallPersonalized — "Your routine + Plus"
 *
 * Shows the user's actual routine picks in a floating sunrise card,
 * then layers 3 gold-haloed Plus additions below it.
 * Same Meet-Rilo visual DNA: warm gradient, ambient glow, navy CTA.
 */
export function PaywallPersonalized({
  program, onPurchase, onRestore, onClose, preview, userPicks,
}: PaywallProps) {
  usePaywallTracking('personalized');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;
  const trialDays = program.trial_days ?? 7;

  const picks = (userPicks && userPicks.length > 0)
    ? userPicks.slice(0, 3).map((p, i) => ({
        label: p.label,
        emoji: p.emoji,
        time: p.time ?? DEMO_PICKS[i]?.time ?? '',
        color: p.color ?? DEMO_PICKS[i]?.color ?? '#FFEFC2',
      }))
    : DEMO_PICKS;

  const firstTask = picks[0]?.label ?? 'your routine';

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

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
      <AmbientGlow />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-[#1a1f3d]/60 active:opacity-60" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <button onClick={onRestore} className="text-sm text-[#1a1f3d]/60 active:opacity-60">
          Restore
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-4 pb-3">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E] mb-2"
        >
          ✨ Your routine, leveled up
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-[24px] leading-[1.2] font-bold text-[#1a1f3d] text-center"
        >
          Make <span className="italic">{firstTask}</span> actually happen.
        </motion.h1>

        {/* Floating user-routine card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-5 w-full bg-white rounded-3xl shadow-[0_24px_70px_-20px_rgba(26,31,61,0.3)] p-4 border border-white/80"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Your day</p>
              <p className="text-[15px] font-bold text-[#1a1f3d]">{formatTodayLabel()}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1f3d]/5 text-[#1a1f3d] text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              You picked
            </span>
          </div>

          <div className="space-y-2">
            {picks.map((b, i) => (
              <motion.div
                key={`${b.label}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.12, duration: 0.35 }}
                className="flex items-center gap-3 rounded-2xl px-3 py-2"
                style={{ background: b.color }}
              >
                <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                  <Emoji3D char={b.emoji} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  {b.time && (
                    <p className="text-[10px] font-bold text-[#1a1f3d]/70 leading-tight">{b.time}</p>
                  )}
                  <p className="text-[13px] font-bold text-[#1a1f3d] leading-tight truncate">{b.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Plus additions row */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95, duration: 0.4 }}
          className="mt-5 mb-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a1f3d]/60"
        >
          + With Plus
        </motion.p>

        <div className="space-y-2">
          {PLUS_ADDITIONS.map((add, i) => (
            <motion.div
              key={add.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + i * 0.12, duration: 0.4 }}
              className="relative flex items-center gap-3 rounded-2xl bg-white/85 backdrop-blur px-3.5 py-2.5 border border-white"
            >
              {/* Gold halo */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0, 0.7, 0.45], scale: [0.9, 1.2, 1.05] }}
                transition={{ delay: 1.2 + i * 0.12, duration: 1.6, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255,196,77,0.85) 0%, rgba(255,196,77,0) 70%)',
                  filter: 'blur(6px)',
                }}
              />
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#FFE89A] to-[#FFC44D] flex items-center justify-center shadow-sm">
                <Emoji3D char={add.emoji} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#1a1f3d] leading-tight">{add.label}</p>
                <p className="text-[12px] text-[#1a1f3d]/60 leading-tight">{add.sub}</p>
              </div>
              <Sparkles className="w-4 h-4 text-[#B8590E] shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 shrink-0 px-6 pb-8 pt-2">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.55 }}
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full h-[56px] rounded-2xl bg-[#1a1f3d] text-white font-semibold text-[16px] active:opacity-80 transition-opacity flex items-center justify-center"
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
          transition={{ duration: 0.4, delay: 1.65 }}
          className="mt-2 text-center text-[12px] font-semibold text-[#1a1f3d]/60"
        >
          Then ${hasAnnual ? annualPrice.toFixed(2) + '/yr' : monthlyPrice.toFixed(2) + '/mo'} · cancel anytime
        </motion.p>

        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#1a1f3d]/50">
          <button onClick={onClose} className="active:opacity-60">Maybe later</button>
          <span>·</span>
          <Link to="/sms-terms" className="active:opacity-60">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="active:opacity-60">Privacy</Link>
        </div>
      </div>
    </div>
  );
}