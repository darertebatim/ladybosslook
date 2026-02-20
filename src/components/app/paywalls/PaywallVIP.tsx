import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import type { PaywallProgramData } from './PaywallClassic';
import mascotHero from '@/assets/paywall-plus-mascot-hero.png';
import mascotBottom from '@/assets/paywall-plus-mascot-bottom.png';

interface PaywallVIPProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

// 3D Noto emoji via Google Fonts CDN
const emoji3D = (codepoint: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/512.webp`;

const FEATURES = [
  {
    img: emoji3D('1f4c5'),
    title: 'Smart habit tracking',
    desc: 'for consistent, lasting results.',
  },
  {
    img: emoji3D('1f3c5'),
    title: 'Streak motivation system',
    desc: 'designed for your goals.',
  },
  {
    img: emoji3D('1f4da'),
    title: 'Self-Care Tools',
    desc: 'like trackers, journals, meditation & more.',
  },
  {
    img: emoji3D('1f917'),
    title: 'Quality growth community',
    desc: 'support you every step of the way.',
  },
  {
    img: emoji3D('1f4a1'),
    title: 'Customized contents',
    desc: 'on routines, wellness, and life hacks.',
  },
  {
    noAds: true,
    title: 'No Ads',
    desc: '',
  },
];

export function PaywallVIP({ program, onPurchase, onRestore, onClose, preview }: PaywallVIPProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const trialDays = program.trial_days || 7;
  const ctaLabel = trialDays > 0 ? `Try for $0.00` : `Get simora+`;

  const handleCTA = async () => {
    if (preview) return;
    setIsPurchasing(true);
    try {
      const productId = program.annual_ios_product_id || program.ios_product_id!;
      const plan = program.annual_ios_product_id ? 'annual' : 'monthly';
      await onPurchase?.(productId, plan);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* ═══════════════ SCROLLABLE CONTENT ═══════════════ */}
      <div style={{ flex: 1 }}>

        {/* ── HERO SECTION (purple gradient) ── */}
        <div style={{
          position: 'relative',
          paddingTop: 12,
          paddingBottom: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%, #f59e0b22 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 60%, #a855f7 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 15% 60%, #7e22ce 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 20%, #4c1d95 0%, #1e0851 100%)
          `,
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingBottom: 16 }}>
            <button
              onClick={onClose}
              style={{ position: 'absolute', left: 14, top: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.7)' }}
            >
              <X size={20} />
            </button>

            {/* "simora+ Plus" badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#fff', fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>simora+</span>
              <span style={{
                background: '#f59e0b',
                color: '#1a1a1a',
                fontSize: 11,
                fontWeight: 800,
                paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
                borderRadius: 6,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>Plus</span>
            </div>

            <button
              onClick={onRestore}
              style={{ position: 'absolute', right: 14, top: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}
            >
              Restore
            </button>
          </div>

          {/* Headline */}
          <div style={{ paddingLeft: 24, paddingRight: 24, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1.25, margin: 0, letterSpacing: -0.5 }}>
              Plus users are{' '}
              <span style={{ color: '#f59e0b', fontSize: 34, fontWeight: 900 }}>4.2x</span>
              {' '}more likely to stay consistent and see real change!
            </p>
          </div>

          {/* Mascot hero — overlapping gradient-to-white */}
          <div style={{ position: 'relative', marginTop: 24, height: 200 }}>
            {/* White hill behind mascot */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '140%', height: 100,
              background: '#fff',
              borderRadius: '50% 50% 0 0',
            }} />
            {/* Mascot image */}
            <img
              src={mascotHero}
              alt="simora+ mascot"
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: 210,
                width: 'auto',
                objectFit: 'contain',
                zIndex: 2,
              }}
            />
          </div>
        </div>

        {/* ── FEATURES SECTION ── */}
        <div style={{ background: '#fff', paddingTop: 28, paddingBottom: 16 }}>
          <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: '0 0 20px', letterSpacing: -0.3 }}>
            What you get
          </p>

          <div style={{ paddingLeft: 20, paddingRight: 20 }}>
            {FEATURES.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {/* Icon circle */}
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: '#f3f3f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {feature.noAds ? (
                    <div style={{ position: 'relative', width: 34, height: 34 }}>
                      {/* Red prohibition circle */}
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        border: '3px solid #ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: '#ef4444', letterSpacing: 0.5 }}>ADS</span>
                        {/* Diagonal line */}
                        <div style={{
                          position: 'absolute', top: '50%', left: -2, right: -2, height: 3,
                          background: '#ef4444', transform: 'rotate(-45deg)',
                          transformOrigin: 'center',
                        }} />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={feature.img}
                      alt={feature.title}
                      style={{ width: 36, height: 36, objectFit: 'contain' }}
                    />
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0a0a0a', lineHeight: 1.3 }}>
                    {feature.title}
                  </p>
                  {feature.desc && (
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 400, color: '#8e8e93', lineHeight: 1.4 }}>
                      {feature.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── BOTTOM MASCOT ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
            <img
              src={mascotBottom}
              alt="simora+ mascot"
              style={{ width: '70%', maxWidth: 280, height: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Cancel anytime */}
          <p style={{
            textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#0a0a0a',
            lineHeight: 1.3, margin: '8px 24px 32px', letterSpacing: -0.3,
          }}>
            Cancel anytime, no<br />penalties or fees
          </p>
        </div>
      </div>

      {/* ═══════════════ STICKY CTA BUTTON ═══════════════ */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'linear-gradient(to top, #fff 85%, transparent)',
        paddingTop: 16, paddingBottom: 28, paddingLeft: 20, paddingRight: 20,
        zIndex: 10,
      }}>
        <button
          onClick={handleCTA}
          disabled={isPurchasing}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 28,
            background: isPurchasing ? '#9b86f0' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            border: 'none',
            cursor: preview ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(109,40,217,0.35)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
            {ctaLabel}
          </span>
          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
        </button>

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <Link to="/sms-terms" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 11, color: '#8e8e93', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}
