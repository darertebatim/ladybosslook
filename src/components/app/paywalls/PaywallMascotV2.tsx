import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PaywallProgramData } from './PaywallClassic';
import mascotHero from '@/assets/paywall-plus-mascot-hero.png';
import mascotBottom from '@/assets/paywall-plus-mascot-bottom.png';
import comparisonTable from '@/assets/paywall-plus-comparison-table.png';
import beforeAfter from '@/assets/paywall-before-after.png';
import emojiCalendar from '@/assets/emoji-calendar-3d.png';
import emojiMedal from '@/assets/emoji-medal-3d.png';
import emojiBooks from '@/assets/emoji-books-3d.png';
import emojiHug from '@/assets/emoji-hug-3d.png';
import emojiBulb from '@/assets/emoji-bulb-3d.png';
import { usePaywallTracking } from '@/hooks/usePaywallTracking';

interface PaywallMascotV2Props {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

const FEATURES = [
  { img: emojiCalendar, title: 'Smart habit tracking',     desc: 'for consistent, lasting results.' },
  { img: emojiMedal,    title: 'Streak motivation system', desc: 'designed for your goals.' },
  { img: emojiBooks,    title: 'Self-Care Tools',          desc: 'like trackers, journals, meditation & more.' },
  { img: emojiHug,      title: 'Quality growth community', desc: 'support you every step of the way.' },
  { img: emojiBulb,     title: 'Customized contents',      desc: 'on routines, wellness, and life hacks.' },
  { img: null,          title: 'No Ads',                   desc: '' },
];

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';

// Pricing constants
const ANNUAL_PRICE = 59.99;
const ANNUAL_ORIGINAL = 96;
const ANNUAL_MONTHLY = (ANNUAL_PRICE / 12).toFixed(2);
const ANNUAL_DISCOUNT = Math.round((1 - ANNUAL_PRICE / ANNUAL_ORIGINAL) * 100);

const MONTHLY_PRICE = 7.99;
const MONTHLY_ORIGINAL = 12.99;
const MONTHLY_DISCOUNT = Math.round((1 - MONTHLY_PRICE / MONTHLY_ORIGINAL) * 100);

export function PaywallMascotV2({ program, onPurchase, onRestore, onClose, preview }: PaywallMascotV2Props) {
  usePaywallTracking('mascot_v2');
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trialDays = program.trial_days || 7;

  // Preload images for later pages
  useEffect(() => {
    [comparisonTable, beforeAfter].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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
  const Header = ({ dark = false }: { dark?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '12px 0 14px' }}>
      <button onClick={onClose} style={{ position: 'absolute', left: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', display: 'flex' }}>
        <X size={20} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: dark ? '#fff' : '#0a0a0a', fontSize: 17, fontWeight: 600, letterSpacing: -0.3, fontFamily: SF }}>simora+</span>
      </div>
      <button onClick={onRestore} style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)', fontSize: 13, fontFamily: SF }}>
        Restore
      </button>
    </div>
  );

  /* ═══════════════════ PAGE 1 ═══════════════════ */
  if (page === 1) return (
    <div ref={containerRef} style={{ position: 'relative', minHeight: '100%', background: '#fff', fontFamily: SF }}>

      {/* Hero background + full-width mascot */}
      <div style={{
        position: preview ? 'absolute' : 'fixed', top: 0, left: 0, right: 0, zIndex: 1,
        height: 420,
        overflow: 'hidden',
      }}>
        {/* Mascot image as full background */}
        <img src={mascotHero} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }} />

        {/* Overlay gradient for text readability */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 160,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }} />

        {/* Content on top */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Header dark />
          <div style={{ paddingLeft: 16, paddingRight: 16, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.28, margin: 0, letterSpacing: -0.3, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              Plus users are{' '}
              <span style={{ color: '#f59e0b', fontSize: 34, fontWeight: 900 }}>4.2x</span>
              {' '}more likely to stay consistent and see real change!
            </p>
          </div>
        </div>
      </div>

      {/* Spacer to push scrollable content below the fixed hero */}
      <div style={{ height: 340 }} />

      {/* Scrollable sheet that overlaps the hero */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: '#fff',
        borderRadius: '28px 28px 0 0',
        paddingTop: 28, paddingBottom: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        minHeight: 'calc(100vh - 380px)',
      }}>
        {/* Drag indicator */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 20px' }} />

        <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: '0 0 20px', letterSpacing: -0.3 }}>What you get</p>
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}
            >
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#f3f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {feature.img === null ? (
                  <div style={{ position: 'relative', width: 34, height: 34 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: '#ef4444', letterSpacing: 0.5 }}>ADS</span>
                      <div style={{ position: 'absolute', top: '50%', left: -2, right: -2, height: 3, background: '#ef4444', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
                    </div>
                  </div>
                ) : (
                  <img src={feature.img} alt={feature.title} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f0f0f', lineHeight: 1.2, letterSpacing: -0.2 }}>{feature.title}</p>
                {feature.desc && <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 400, color: '#8e8e93', lineHeight: 1.4 }}>{feature.desc}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom mascot */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
          <img src={mascotBottom} alt="" style={{ width: '72%', maxWidth: 290, height: 'auto', objectFit: 'contain' }} />
        </div>
        <p style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.3, margin: '8px 24px 32px', letterSpacing: -0.3 }}>
          Cancel anytime, no<br />penalties or fees
        </p>
      </div>

      {/* Sticky CTA → goes to page 2 */}
      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #fff 80%, transparent)', paddingTop: 16, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, zIndex: 10 }}>
        <button
          onClick={() => setPage(2)}
          style={{ width: '100%', height: 56, borderRadius: 28, background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', border: 'none', cursor: preview ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(109,40,217,0.35)' }}
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>Try for $0.00</span>
          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ PAGE 2 ═══════════════════ */
  if (page === 2) return (
    <div ref={containerRef} style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: SF,
      background: `
        radial-gradient(ellipse 70% 40% at 10% 60%, #fde68a55 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 90% 40%, #c4b5fd55 0%, transparent 60%),
        radial-gradient(ellipse 50% 30% at 90% 90%, #fbcfe855 0%, transparent 60%),
        #fff
      `,
    }}>
      <div style={{ flex: 1 }}>
        <Header />

        {/* Headline */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 8, paddingBottom: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.25, margin: 0, letterSpacing: -0.5 }}>
            Simora Plus is the fastest<br />way to your best routine yet.
          </p>
        </div>

        {/* Comparison table screenshot — full width, no side padding */}
        <div style={{ paddingLeft: 0, paddingRight: 0 }}>
          <img
            src={comparisonTable}
            alt="simora+ vs Free comparison"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </div>

      {/* Sticky CTA → goes to page 3 */}
      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #fff 80%, transparent)', paddingTop: 20, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, zIndex: 10 }}>
        <button
          onClick={() => setPage(3)}
          style={{ width: '100%', height: 56, borderRadius: 28, background: '#0a0a0a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
            {trialDays > 0 ? 'Start my free week' : 'Get simora+'}
          </span>
          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ PAGE 3 ═══════════════════ */
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#fff', fontFamily: SF }}>
      <div style={{ flex: 1 }}>
        <Header />

        {/* Headline */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 4, paddingBottom: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.25, margin: 0, letterSpacing: -0.5 }}>
            Simora Plus is the best plan<br />for building lasting habits
          </p>
        </div>

        {/* Before / After image */}
        <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 24 }}>
          <img
            src={beforeAfter}
            alt="Before and after simora+"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 20 }}
          />
        </div>

        {/* Pricing cards */}
        <div style={{ paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Annual card */}
          <button
            onClick={() => setSelectedPlan('annual')}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            }}
          >
            <div style={{
              position: 'relative', borderRadius: 16, padding: '16px 16px',
              border: selectedPlan === 'annual' ? '2px solid #7c3aed' : '2px solid #e5e7eb',
              background: selectedPlan === 'annual' ? '#faf5ff' : '#fff',
              transition: 'all 0.15s',
            }}>
              {/* Badge */}
              <div style={{ position: 'absolute', top: -12, right: 14, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: 0.3 }}>
                {ANNUAL_DISCOUNT}% OFF
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: selectedPlan === 'annual' ? '6px solid #7c3aed' : '2px solid #d1d5db',
                    background: '#fff', flexShrink: 0, transition: 'all 0.15s',
                  }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>
                      {trialDays > 0 ? `${trialDays}-day free trial` : 'Annual plan'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#8e8e93' }}>
                      ${ANNUAL_PRICE}/year{' '}
                      <span style={{ textDecoration: 'line-through', color: '#c0c0c0' }}>(was ${ANNUAL_ORIGINAL}/year)</span>
                    </p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0a0a0a' }}>${ANNUAL_MONTHLY}<span style={{ fontSize: 12, fontWeight: 500, color: '#8e8e93' }}>/mo.</span></p>
              </div>
            </div>
          </button>

          {/* Monthly card */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          >
            <div style={{
              position: 'relative', borderRadius: 16, padding: '16px 16px',
              border: selectedPlan === 'monthly' ? '2px solid #7c3aed' : '2px solid #e5e7eb',
              background: selectedPlan === 'monthly' ? '#faf5ff' : '#fff',
              transition: 'all 0.15s',
            }}>
              {/* Monthly discount badge */}
              {selectedPlan === 'monthly' && (
                <div style={{ position: 'absolute', top: -12, right: 14, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: 0.3 }}>
                  {MONTHLY_DISCOUNT}% OFF
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: selectedPlan === 'monthly' ? '6px solid #7c3aed' : '2px solid #d1d5db',
                    background: '#fff', flexShrink: 0, transition: 'all 0.15s',
                  }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>Monthly</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#8e8e93' }}>
                      ${MONTHLY_PRICE}/month{' '}
                      <span style={{ textDecoration: 'line-through', color: '#c0c0c0' }}>(was ${MONTHLY_ORIGINAL}/mo)</span>
                    </p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0a0a0a' }}>${MONTHLY_PRICE}<span style={{ fontSize: 12, fontWeight: 500, color: '#8e8e93' }}>/mo.</span></p>
              </div>
            </div>
          </button>

        </div>

        {/* Fine print */}
        <p style={{ fontSize: 11, color: '#aeaeb2', textAlign: 'center', margin: '14px 20px 8px', lineHeight: 1.5 }}>
          {trialDays > 0
            ? `Your ${trialDays}-day free trial then ${selectedPlan === 'annual' ? `$${ANNUAL_PRICE}/year` : `$${MONTHLY_PRICE}/month`}. Cancel anytime.`
            : `Cancel anytime. No penalties or fees.`}
        </p>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #fff 80%, transparent)', paddingTop: 12, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, zIndex: 10 }}>
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          style={{ width: '100%', height: 56, borderRadius: 28, background: isPurchasing ? '#555' : '#0a0a0a', border: 'none', cursor: preview ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
            {isPurchasing ? 'Processing…' : 'Continue'}
          </span>
          {!isPurchasing && <ArrowRight size={20} color="#fff" strokeWidth={2.5} />}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}
