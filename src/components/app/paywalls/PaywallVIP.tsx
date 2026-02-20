import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';
import mascotHero from '@/assets/paywall-mascot-hero.png';
import beforeAfter from '@/assets/paywall-before-after.png';

interface PaywallVIPProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

const features = [
  {
    icon: '📅',
    title: 'Smart ritual tracking',
    subtitle: 'for consistent, lasting results.',
  },
  {
    icon: '🏅',
    title: 'Streak motivation system',
    subtitle: 'designed for your goals.',
  },
  {
    icon: '📊',
    title: 'Self-Care Tools',
    subtitle: 'like trackers, journals, meditation & more.',
  },
  {
    icon: '🤗',
    title: 'Quality growth community',
    subtitle: 'support you every step of the way.',
  },
  {
    icon: '💡',
    title: 'Customized contents',
    subtitle: 'on routines, wellness, and life hacks.',
  },
  {
    icon: '🚫',
    title: 'No Ads',
    subtitle: '',
  },
];

const comparisonRows = [
  { label: 'Growth driven habits', vip: true, free: true },
  { label: 'Motivation system', vip: true, free: false },
  { label: 'Growth community', vip: true, free: false },
  { label: 'Smart reminders', vip: true, free: false },
  { label: 'No ads', vip: true, free: false },
];

// ── Page 1: Features ─────────────────────────────────────────────────────────
function Page1({
  onNext,
  onClose,
  trialDays,
}: {
  onNext: () => void;
  onClose?: () => void;
  trialDays?: number | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {/* Purple hero — full bleed */}
        <div
          className="relative flex flex-col items-center px-6 pt-12 pb-0"
          style={{
            background: 'radial-gradient(ellipse at 60% 30%, #7c3aed 0%, #4b1fa8 50%, #2d0a7a 100%)',
            minHeight: 340,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 text-white/70 hover:text-white z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Brand badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white font-bold text-base tracking-wide">Simora+</span>
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase">
              PLUS
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-white text-2xl font-black text-center leading-tight mb-4 px-2">
            Simora+ users are{' '}
            <span className="text-yellow-400">4.2x</span> more likely to stay
            consistent and see real change!
          </h1>

          {/* Mascot — overflows into white section */}
          <div className="relative w-56 h-44">
            <img
              src={mascotHero}
              alt="Simora+ mascot"
              className="w-full h-full object-contain object-bottom"
            />
          </div>
        </div>

        {/* White body */}
        <div className="bg-white px-6 pt-6 pb-4">
          <h2 className="text-2xl font-black text-foreground mb-5 text-center">What you get</h2>

          <div className="space-y-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div className="pt-1.5">
                  <p className="font-bold text-foreground text-base leading-tight">{f.title}</p>
                  {f.subtitle && (
                    <p className="text-muted-foreground text-sm mt-0.5">{f.subtitle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-black text-foreground mt-8 mb-4 px-4">
            Cancel anytime, no penalties or fees
          </p>

          {/* spacer so content doesn't hide behind fixed button */}
          <div className="h-20" />
        </div>
      </div>

      {/* Fixed CTA at bottom */}
      <div className="shrink-0 bg-white px-6 pb-6 pt-3 border-t border-gray-100">
        <button
          onClick={onNext}
          className="w-full h-14 rounded-full font-bold text-white text-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)' }}
        >
          Try for ${trialDays && trialDays > 0 ? '0.00' : 'free'}
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}

// ── Page 2: Comparison ───────────────────────────────────────────────────────
function Page2({ onNext, onClose }: { onNext: () => void; onClose?: () => void }) {
  const ROW_H = 56; // px per row
  const HEADER_H = 80; // px for VIP header cell
  const totalGradientH = HEADER_H + comparisonRows.length * ROW_H;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background:
          'radial-gradient(ellipse at 0% 0%, #fef9c3 0%, #fdf4ff 35%, #eff6ff 65%, #fce7f3 100%)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-800">Simora+</span>
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase">
            PLUS
          </span>
        </div>
        <div className="w-5" />
      </div>

      {/* Main area — mascot + table */}
      <div className="flex-1 flex flex-col justify-center px-5 py-2">
        {/* Row: mascot left + badge centered-right */}
        <div className="relative flex items-end mb-[-2px]">
          {/* Mascot */}
          <div className="w-28 shrink-0 z-10">
            <img src={mascotHero} alt="mascot" className="w-full object-contain" />
          </div>

          {/* 76% badge — sits above the VIP column (~center of table minus label col) */}
          <div className="flex-1 flex justify-center pr-8">
            <div
              className="flex items-baseline gap-1 px-4 py-2 rounded-2xl text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
              }}
            >
              <span className="text-2xl font-black leading-none">76%</span>
              <span className="text-[12px] leading-tight font-medium">
                users'<br />choice
              </span>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="relative rounded-3xl bg-white shadow-lg overflow-visible">
          {/* Continuous gradient VIP strip — absolute, behind cells */}
          <div
            className="absolute z-0 rounded-3xl"
            style={{
              background: 'linear-gradient(180deg, #f472b6 0%, #a855f7 50%, #7c3aed 100%)',
              width: 72,
              height: totalGradientH,
              top: 0,
              // position it over the VIP column (after the label col)
              left: '50%',
              transform: 'translateX(-50%) translateX(-16px)',
            }}
          />

          {/* Header row */}
          <div
            className="relative z-10 grid items-center px-5"
            style={{
              gridTemplateColumns: '1fr 72px 64px',
              height: HEADER_H,
            }}
          >
            <span className="font-black text-lg text-foreground">Benefits</span>

            {/* VIP header */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-white text-sm font-black">✦</span>
              <span
                className="font-black italic text-xl leading-none"
                style={{ color: '#fde68a' }}
              >
                VIP
              </span>
            </div>

            <span className="text-center font-bold text-base text-foreground">Free</span>
          </div>

          {/* Rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className="relative z-10 grid items-center px-5 border-t border-gray-100"
              style={{
                gridTemplateColumns: '1fr 72px 64px',
                height: ROW_H,
              }}
            >
              <span className="text-base font-semibold text-foreground">{row.label}</span>

              {/* VIP cell */}
              <div className="flex justify-center">
                <Check className="h-5 w-5" style={{ color: '#fcd34d' }} strokeWidth={3} />
              </div>

              {/* Free cell */}
              <div className="flex justify-center">
                {row.free ? (
                  <Check className="h-5 w-5 text-gray-900" strokeWidth={3} />
                ) : (
                  <X className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-6 pb-6 pt-3">
        <button
          onClick={onNext}
          className="w-full h-14 rounded-full font-bold text-white text-lg flex items-center justify-center gap-2 bg-gray-900"
        >
          Start my free week
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}

// ── Page 3: Pricing ──────────────────────────────────────────────────────────
function Page3({
  program,
  onPurchase,
  onRestore,
  onClose,
  preview,
}: {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Hard-coded prices as per user spec
  const monthlyPrice = 13.99;
  const monthlyOriginal = 19.99;
  const annualPrice = 99.99;
  const annualOriginal = 240;
  const annualMonthly = (annualPrice / 12).toFixed(2);
  const annualSavings = Math.round((1 - annualPrice / annualOriginal) * 100); // 58% ≈ 60%
  const monthlySavings = Math.round((1 - monthlyPrice / monthlyOriginal) * 100); // 30% ≈ 40%

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    try {
      const productId =
        selectedPlan === 'annual'
          ? program.annual_ios_product_id!
          : program.ios_product_id!;
      await onPurchase?.(productId, selectedPlan);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #f0ebff 0%, #ffffff 120px)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-800">Simora+</span>
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase">
            PLUS
          </span>
        </div>
        <button onClick={onRestore} className="text-sm text-gray-400 hover:text-gray-600">
          Restore
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5">
        {/* Headline */}
        <h2 className="text-2xl font-black text-foreground text-center mt-3 mb-5 leading-tight px-2">
          Simora+ premium is the best plan for building lasting habits
        </h2>

        {/* Before / After — two side-by-side cards */}
        <div className="w-full mb-6">
          <img
            src={beforeAfter}
            alt="Before and After Simora+"
            className="w-full h-auto rounded-2xl object-cover"
          />
        </div>

        {/* Plan cards */}
        <div className="space-y-3 mb-4">
          {/* Annual card */}
          <button
            onClick={() => setSelectedPlan('annual')}
            className={cn(
              'relative w-full flex items-center justify-between rounded-2xl border-2 px-4 py-4 transition-all text-left',
              selectedPlan === 'annual'
                ? 'border-violet-600 bg-violet-50'
                : 'border-gray-200 bg-white',
            )}
          >
            {/* savings badge */}
            <span
              className="absolute -top-3 right-4 px-3 py-1 rounded-full text-white text-xs font-black"
              style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)' }}
            >
              {annualSavings}% OFF
            </span>

            <div>
              {program.trial_days && program.trial_days > 0 && (
                <p className="font-black text-base text-foreground">
                  {program.trial_days}-day free trial
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                ${annualPrice.toFixed(2)}/year
                <span className="line-through ml-1 text-muted-foreground/60">
                  (was ${annualOriginal.toFixed(2)}/year)
                </span>
              </p>
            </div>
            <p className="font-black text-base text-foreground">${annualMonthly}/mo.</p>
          </button>

          {/* Monthly card */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              'relative w-full flex items-center justify-between rounded-2xl border-2 px-4 py-4 transition-all text-left',
              selectedPlan === 'monthly'
                ? 'border-violet-600 bg-violet-50'
                : 'border-gray-200 bg-white',
            )}
          >
            <p className="text-sm text-muted-foreground">
              ${monthlyPrice.toFixed(2)}/month
              <span className="line-through ml-1 text-muted-foreground/60">
                (was ${monthlyOriginal.toFixed(2)}/mo)
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-600">{monthlySavings}% OFF</span>
              <p className="font-black text-base text-foreground">${monthlyPrice.toFixed(2)}/mo.</p>
            </div>
          </button>
        </div>

        {/* Legal disclaimer */}
        <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed px-2 pb-4">
          <Link to="/sms-terms" className="underline">Terms of service</Link>
          {' & '}
          <Link to="/privacy" className="underline">Privacy policy</Link>
          {' '}PLEASE NOTE: Your Free-trial Period is {program.trial_days ?? 7}-day, then cost ${annualPrice.toFixed(2)}/a year. After your introductory offer, unless you cancel online before the end of then, current subscription will auto-renew.
        </p>

        <div className="h-4" />
      </div>

      {/* Fixed CTA */}
      <div className="shrink-0 px-5 pb-6 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full h-14 rounded-full font-bold text-white text-lg flex items-center justify-center gap-2 bg-gray-900 disabled:opacity-60"
        >
          {isPurchasing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>Continue <ArrowRight className="h-5 w-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export function PaywallVIP({ program, onPurchase, onRestore, onClose, preview }: PaywallVIPProps) {
  const [page, setPage] = useState(0);

  return (
    <div className="flex flex-col h-full relative">
      {/* Page dots */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-50 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === page ? 'w-6 bg-violet-600' : 'w-1.5 bg-gray-300',
            )}
          />
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {page === 0 && (
          <Page1 onNext={() => setPage(1)} onClose={onClose} trialDays={program.trial_days} />
        )}
        {page === 1 && (
          <Page2 onNext={() => setPage(2)} onClose={onClose} />
        )}
        {page === 2 && (
          <Page3
            program={program}
            onPurchase={onPurchase}
            onRestore={onRestore}
            onClose={onClose}
            preview={preview}
          />
        )}
      </div>
    </div>
  );
}
