import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PaywallProgramData } from './PaywallClassic';
import { usePaywallTracking } from '@/hooks/usePaywallTracking';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import riloAppIcon from '@/assets/rilo-app-icon.png';

interface PaywallRiloV2Props {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

// Focused Rilo+ promise — matches the rest of the Rilo DNA paywalls.
const FEATURES = [
  { emoji: '🧠', title: 'AI Planner',          desc: 'Builds your day around real life.' },
  { emoji: '🔔', title: 'Smart Reminders',     desc: 'Nudges that actually land.' },
  { emoji: '🌿', title: 'All Routines',        desc: 'Every template, unlocked.' },
  { emoji: '🧘', title: 'All Self-Care Tools', desc: 'Breathwork, mood, fasting & more.' },
  { emoji: '🤗', title: 'Quality growth community', desc: 'Support you every step of the way.' },
  { emoji: '💡', title: 'Customized contents',  desc: 'On routines, wellness, and life hacks.' },
  { emoji: '✨', title: 'Early access',        desc: 'New features before everyone else.' },
  { emoji: '🚫', title: 'No Ads',              desc: '' },
];

// Rilo brand DNA
const NAVY = '#1a1f3d';
const SUNRISE_AMBER = '#B8590E';
const SUNRISE_BG = 'linear-gradient(to bottom, #FFF4DC 0%, #FFE0E6 50%, #FBD4E2 100%)';
const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';

// Pricing — derived from program data (live from RC / catalog) with safe fallbacks.
function usePricing(program: PaywallProgramData) {
  const monthly = (program.price_amount ?? 799) / 100;
  const annual = ((program.annual_price_amount ?? 5999)) / 100;
  const annualOriginal = ((program.original_price ?? Math.round(monthly * 12 * 100))) / 100;
  const annualMonthly = (annual / 12).toFixed(2);
  const annualDiscount = annualOriginal > annual
    ? Math.round((1 - annual / annualOriginal) * 100)
    : 0;
  return { monthly, annual, annualOriginal, annualMonthly, annualDiscount };
}

function Emoji3D({ char, size = 28 }: { char: string; size?: number }) {
  return (
    <img
      src={getFluentEmojiUrl(char)}
      alt=""
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      className="inline-block object-contain select-none"
      style={{ width: size, height: size }}
    />
  );
}

/* Ambient sunrise glow + sparkles — same DNA as Sunrise/Personalized paywalls. */
function AmbientGlow() {
  const sparkles = Array.from({ length: 12 });
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
            animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1, 0.4] }}
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
 * PaywallRiloV2 — 3-page Rilo DNA paywall.
 *
 * Mirrors the structure of PaywallMascotV2 (Hero → Comparison → Pricing)
 * but rebuilt with Rilo's sunrise gradient, navy CTA, ambient glow,
 * Rilo app icon, and the focused 4-feature Plus story.
 */
export function PaywallRiloV2({ program, onPurchase, onRestore, onClose, preview }: PaywallRiloV2Props) {
  usePaywallTracking('rilo_v2');
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trialDays = program.trial_days ?? 7;
  const { monthly, annual, annualOriginal, annualMonthly, annualDiscount } = usePricing(program);
  const hasAnnual = !!program.annual_ios_product_id;

  // Scroll to top on page change
  useEffect(() => {
    containerRef.current?.closest('[class*="overflow-y-auto"]')?.scrollTo(0, 0);
  }, [page]);

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    try {
      const productId = selectedPlan === 'annual'
        ? (program.annual_ios_product_id || program.ios_product_id!)
        : program.ios_product_id!;
      await onPurchase?.(productId, selectedPlan);
    } finally {
      setIsPurchasing(false);
    }
  };

  /* ─────────────────── SHARED HEADER ─────────────────── */
  const Header = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '12px 0 14px' }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', left: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(26,31,61,0.55)', display: 'flex' }}
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={riloAppIcon} alt="" style={{ width: 22, height: 22, borderRadius: 6 }} />
        <span style={{ color: NAVY, fontSize: 17, fontWeight: 700, letterSpacing: -0.3, fontFamily: SF }}>
          Rilo<span style={{ color: SUNRISE_AMBER }}>+</span>
        </span>
      </div>
      <button
        onClick={onRestore}
        style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,31,61,0.55)', fontSize: 13, fontFamily: SF }}
      >
        Restore
      </button>
    </div>
  );

  /* ═══════════════════ PAGE 1 — Hero + Features ═══════════════════ */
  if (page === 1) return (
    <div ref={containerRef} className="relative" style={{ minHeight: '100%', background: SUNRISE_BG, fontFamily: SF }}>
      <AmbientGlow />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Header />

        {/* Hero */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 28, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-block', marginBottom: 14 }}
          >
            <img
              src={riloAppIcon}
              alt="Rilo"
              style={{
                width: 64, height: 64, borderRadius: 18,
                boxShadow: '0 18px 48px -12px rgba(232,74,111,0.45)',
              }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ color: SUNRISE_AMBER, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2.4, margin: '0 0 12px' }}
          >
            ✨ Rilo Plus
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            style={{ color: NAVY, fontSize: 30, fontWeight: 800, lineHeight: 1.18, margin: 0, letterSpacing: -0.6 }}
          >
            Rilo Plus users are{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FFB347 0%, #E84A6F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 900,
            }}>4.2×</span>{' '}
            more likely to stay consistent and see real change.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            style={{ color: 'rgba(26,31,61,0.7)', fontSize: 15, fontWeight: 500, margin: '14px 0 0', lineHeight: 1.45 }}
          >
            Self-care that sticks — backed by a community and content tailored to you.
          </motion.p>
        </div>

        {/* Floating white sheet with features */}
        <div style={{
          position: 'relative', zIndex: 2,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          paddingTop: 28, paddingBottom: 16,
          boxShadow: '0 -10px 30px rgba(26,31,61,0.08)',
          minHeight: 'calc(100vh - 380px)',
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e8e8ec', margin: '0 auto 22px' }} />

          <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 22px', letterSpacing: -0.3 }}>
            What you get
          </p>

          <div style={{ paddingLeft: 22, paddingRight: 22 }}>
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.09, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}
              >
                <div style={{
                  position: 'relative',
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFEFC2 0%, #FFD9E5 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Emoji3D char={feature.emoji} size={28} />
                  <span style={{
                    position: 'absolute', top: -4, right: -8,
                    background: 'linear-gradient(135deg, #FFB347 0%, #E84A6F 100%)',
                    color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 999,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 6px rgba(232,74,111,0.35)',
                    lineHeight: 1,
                  }}>
                    Plus
                  </span>
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: NAVY, lineHeight: 1.2, letterSpacing: -0.2 }}>
                    {feature.title}
                  </p>
                  {feature.desc && (
                    <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 400, color: 'rgba(26,31,61,0.55)', lineHeight: 1.4 }}>
                      {feature.desc}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: NAVY, lineHeight: 1.35, margin: '20px 24px 28px', letterSpacing: -0.3 }}>
            Cancel anytime, no<br />penalties or fees.
          </p>
        </div>
      </div>

      {/* Sticky CTA → page 2 */}
      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #fff 80%, transparent)', paddingTop: 16, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, zIndex: 10 }}>
        <button
          onClick={() => setPage(2)}
          style={{
            width: '100%', height: 56, borderRadius: 28,
            background: NAVY, border: 'none',
            cursor: preview ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 12px 28px rgba(26,31,61,0.35)',
          }}
          className="active:opacity-80 transition-opacity"
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
            {trialDays > 0 ? `Try ${trialDays} days for $0.00` : 'Continue'}
          </span>
          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ PAGE 2 — Free vs Plus comparison ═══════════════════ */
  if (page === 2) return (
    <div ref={containerRef} className="relative" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: SF,
      background: SUNRISE_BG,
    }}>
      <AmbientGlow />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />

        {/* Headline */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 8, paddingBottom: 22, textAlign: 'center' }}>
          <p style={{ color: SUNRISE_AMBER, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2.4, margin: '0 0 8px' }}>
            Free vs Plus
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1.25, margin: 0, letterSpacing: -0.5 }}>
            The fastest way to your<br />best routine yet.
          </p>
        </div>

        {/* Comparison card */}
        <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 24 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '20px 18px',
              boxShadow: '0 18px 50px -16px rgba(26,31,61,0.22)',
              border: '1px solid rgba(255,255,255,0.9)',
            }}
          >
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #f0f0f3' }}>
              <span />
              <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(26,31,61,0.55)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Free</span>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: NAVY, color: '#fff',
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, letterSpacing: 0.4,
                }}>
                  <Sparkles size={11} /> PLUS
                </span>
              </div>
            </div>

            {[
              { label: 'AI Planner',          free: false, plus: true },
              { label: 'Smart Reminders',     free: 'limit' as const, plus: true },
              { label: 'All Routine templates', free: 'limit' as const, plus: true },
              { label: 'All Self-Care Tools',  free: 'limit' as const, plus: true },
              { label: 'Unlimited daily actions', free: false, plus: true },
              { label: 'Streak shields',       free: false, plus: true },
              { label: 'Early access to new features', free: false, plus: true },
              { label: 'Ad-free',              free: true, plus: true },
            ].map((row, i) => (
              <div key={row.label} style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i === 7 ? 'none' : '1px solid #f6f6f8',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{row.label}</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {row.free === true ? (
                    <Check size={18} color="rgba(26,31,61,0.45)" strokeWidth={2.5} />
                  ) : row.free === 'limit' ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,31,61,0.45)' }}>Limited</span>
                  ) : (
                    <span style={{ fontSize: 18, color: 'rgba(26,31,61,0.25)', fontWeight: 600 }}>—</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD36E 0%, #E84A6F 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 10px -2px rgba(232,74,111,0.4)',
                  }}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Sticky CTA → page 3 */}
      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, rgba(251,212,226,1) 60%, transparent)', paddingTop: 20, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, zIndex: 10 }}>
        <button
          onClick={() => setPage(3)}
          style={{
            width: '100%', height: 56, borderRadius: 28,
            background: NAVY, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 12px 28px rgba(26,31,61,0.35)',
          }}
          className="active:opacity-80 transition-opacity"
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
            {trialDays > 0 ? 'Start my free trial' : 'Get Rilo+'}
          </span>
          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ PAGE 3 — Pricing ═══════════════════ */
  return (
    <div ref={containerRef} className="relative" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: SF,
      background: SUNRISE_BG,
    }}>
      <AmbientGlow />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />

        {/* Headline */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 6, paddingBottom: 18, textAlign: 'center' }}>
          <p style={{ color: SUNRISE_AMBER, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2.4, margin: '0 0 8px' }}>
            Pick your plan
          </p>
          <p style={{ fontSize: 24, fontWeight: 800, color: NAVY, lineHeight: 1.25, margin: 0, letterSpacing: -0.5 }}>
            Start free. Stay if<br />you love it.
          </p>
        </div>

        {/* Pricing cards */}
        <div style={{ paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Annual */}
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              <div style={{
                position: 'relative', borderRadius: 20, padding: '18px 18px',
                border: selectedPlan === 'annual' ? `2px solid ${NAVY}` : '2px solid rgba(255,255,255,0.95)',
                background: selectedPlan === 'annual' ? '#fff' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
                boxShadow: selectedPlan === 'annual' ? '0 12px 32px -10px rgba(26,31,61,0.25)' : '0 4px 12px -4px rgba(26,31,61,0.08)',
                transition: 'all 0.18s',
              }}>
                {annualDiscount > 0 && (
                  <div style={{
                    position: 'absolute', top: -12, right: 14,
                    background: 'linear-gradient(135deg, #FFD36E, #E84A6F)',
                    color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 999, letterSpacing: 0.5,
                    boxShadow: '0 6px 16px -4px rgba(232,74,111,0.4)',
                  }}>
                    SAVE {annualDiscount}%
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: selectedPlan === 'annual' ? `7px solid ${NAVY}` : '2px solid #d4d4d8',
                      background: '#fff', flexShrink: 0, transition: 'all 0.15s',
                    }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: NAVY }}>
                        {trialDays > 0 ? `${trialDays}-day free trial` : 'Annual plan'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(26,31,61,0.55)' }}>
                        ${annual.toFixed(2)}/year{' '}
                        {annualOriginal > annual && (
                          <span style={{ textDecoration: 'line-through', color: 'rgba(26,31,61,0.35)' }}>
                            (was ${annualOriginal.toFixed(0)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: NAVY }}>
                    ${annualMonthly}<span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(26,31,61,0.55)' }}>/mo</span>
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          >
            <div style={{
              position: 'relative', borderRadius: 20, padding: '18px 18px',
              border: selectedPlan === 'monthly' ? `2px solid ${NAVY}` : '2px solid rgba(255,255,255,0.95)',
              background: selectedPlan === 'monthly' ? '#fff' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              boxShadow: selectedPlan === 'monthly' ? '0 12px 32px -10px rgba(26,31,61,0.25)' : '0 4px 12px -4px rgba(26,31,61,0.08)',
              transition: 'all 0.18s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: selectedPlan === 'monthly' ? `7px solid ${NAVY}` : '2px solid #d4d4d8',
                    background: '#fff', flexShrink: 0, transition: 'all 0.15s',
                  }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: NAVY }}>Monthly</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(26,31,61,0.55)' }}>
                      ${monthly.toFixed(2)}/month
                    </p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: NAVY }}>
                  ${monthly.toFixed(2)}<span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(26,31,61,0.55)' }}>/mo</span>
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Fine print */}
        <p style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textAlign: 'center', margin: '16px 24px 8px', lineHeight: 1.5 }}>
          {trialDays > 0 && selectedPlan === 'annual'
            ? `Your ${trialDays}-day free trial then $${annual.toFixed(2)}/year. Cancel anytime.`
            : selectedPlan === 'annual'
            ? `$${annual.toFixed(2)}/year. Cancel anytime.`
            : `$${monthly.toFixed(2)}/month. Cancel anytime.`}
        </p>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, rgba(251,212,226,1) 60%, transparent)', paddingTop: 14, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, zIndex: 10 }}>
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          style={{
            width: '100%', height: 56, borderRadius: 28,
            background: isPurchasing ? '#555' : NAVY, border: 'none',
            cursor: preview ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 12px 28px rgba(26,31,61,0.35)',
          }}
          className="active:opacity-80 transition-opacity"
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
            {isPurchasing ? 'Processing…' : 'Continue'}
          </span>
          {!isPurchasing && <ArrowRight size={20} color="#fff" strokeWidth={2.5} />}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: 'rgba(26,31,61,0.5)', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}