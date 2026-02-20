import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Check } from 'lucide-react';
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

interface PaywallVIPProps {
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
const ANNUAL_PRICE = 99.99;
const ANNUAL_ORIGINAL = 240;
const ANNUAL_MONTHLY = (ANNUAL_PRICE / 12).toFixed(2);
const ANNUAL_DISCOUNT = Math.round((1 - ANNUAL_PRICE / ANNUAL_ORIGINAL) * 100);

const MONTHLY_PRICE = 13.99;
const MONTHLY_ORIGINAL = 19.99;
const MONTHLY_DISCOUNT = Math.round((1 - MONTHLY_PRICE / MONTHLY_ORIGINAL) * 100);

export function PaywallVIP({ program, onPurchase, onRestore, onClose, preview }: PaywallVIPProps) {
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const trialDays = program.trial_days || 7;

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
        <span style={{ background: '#f59e0b', color: '#1a1a1a', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase' as const, fontFamily: SF }}>Plus</span>
      </div>
      <button onClick={onRestore} style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)', fontSize: 13, fontFamily: SF }}>
        Restore
      </button>
    </div>
  );

  /* ═══════════════════ PAGE 1 ═══════════════════ */
  if (page === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#fff', fontFamily: SF }}>
      <div style={{ flex: 1 }}>

        {/* Purple hero */}
        <div style={{
          position: 'relative', paddingTop: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%, #f59e0b22 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 60%, #a855f7 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 15% 60%, #7e22ce 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 20%, #4c1d95 0%, #1e0851 100%)
          `,
        }}>
          <Header dark />

          <div style={{ paddingLeft: 20, paddingRight: 20, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.28, margin: 0, letterSpacing: -0.3 }}>
              Plus users are{' '}
              <span style={{ color: '#f59e0b', fontSize: 28, fontWeight: 900 }}>4.2x</span>
              {' '}more likely to stay consistent and see real change!
            </p>
          </div>

          {/* Mascot hero */}
          <div style={{ position: 'relative', marginTop: 20 }}>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '150%', height: 80, background: '#fff', borderRadius: '50% 50% 0 0' }} />
            <img src={mascotHero} alt="" style={{ display: 'block', width: '100%', height: 200, objectFit: 'cover', objectPosition: 'center bottom', position: 'relative', zIndex: 2 }} />
          </div>
        </div>

        {/* Features */}
        <div style={{ background: '#fff', paddingTop: 24, paddingBottom: 16 }}>
          <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: '0 0 20px', letterSpacing: -0.3 }}>What you get</p>
          <div style={{ paddingLeft: 20, paddingRight: 20 }}>
            {FEATURES.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
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
              </div>
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
    <div style={{
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
            simora+ Plus is the fastest<br />way to your best routine yet.
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#fff', fontFamily: SF }}>
      <div style={{ flex: 1 }}>
        <Header />

        {/* Headline */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 4, paddingBottom: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.25, margin: 0, letterSpacing: -0.5 }}>
            simora+ Plus is the best plan<br />for building lasting habits
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
