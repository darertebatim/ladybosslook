import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';
import beforeAfter from '@/assets/paywall-before-after.png';


interface PaywallVIPProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

const features = [
  { emoji: '📅', title: 'Smart ritual tracking', subtitle: 'for consistent, lasting results.' },
  { emoji: '🏅', title: 'Streak motivation system', subtitle: 'designed for your goals.' },
  { emoji: '📊', title: 'Self-Care Tools', subtitle: 'like trackers, journals, meditation & more.' },
  { emoji: '🤗', title: 'Quality growth community', subtitle: 'support you every step of the way.' },
  { emoji: '💡', title: 'Customized contents', subtitle: 'on routines, wellness, and life hacks.' },
  { emoji: '🚫', title: 'No Ads', subtitle: '' },
];

const comparisonRows = [
  { label: 'Growth driven habits', vip: true, free: true },
  { label: 'Motivation system', vip: true, free: false },
  { label: 'Growth community', vip: true, free: false },
  { label: 'Smart reminders', vip: true, free: false },
  { label: 'No ads', vip: true, free: false },
];

// Page 1: Features
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
    <div className="flex flex-col min-h-full">
      {/* Purple hero header */}
      <div
        className="relative flex flex-col items-center px-6 pt-10 pb-10"
        style={{ background: 'linear-gradient(160deg, #4b1fa8 0%, #7c3aed 50%, #9333ea 100%)' }}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-white/70 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-white font-bold text-base tracking-wide">Simora+</span>
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase">
            VIP
          </span>
        </div>

        {/* Headline — 3 lines */}
        <h1 className="text-white text-[1.6rem] font-black text-center leading-snug">
          Simora+ users are{' '}
          <span className="text-yellow-400">4.2x</span> more likely to stay consistent and see real change!
        </h1>
      </div>

      {/* White body — scrollable */}
      <div className="flex-1 bg-white px-6 py-6 flex flex-col">
        <h2 className="text-2xl font-black text-foreground mb-5 text-center">What you get</h2>

        <div className="space-y-5">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">
                {f.emoji}
              </div>
              <div className="pt-1.5">
                <p className="font-bold text-foreground text-[17px] leading-tight">{f.title}</p>
                {f.subtitle && <p className="text-muted-foreground text-sm mt-0.5">{f.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xl font-black text-foreground mt-8 mb-6">
          Cancel anytime, no penalties or fees
        </p>

        {/* CTA — scrolls with content */}
        <button
          onClick={onNext}
          className="w-full h-14 rounded-full font-bold text-white text-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)' }}
        >
          Try for ${trialDays && trialDays > 0 ? '0.00' : 'free'}
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center gap-4 mt-4 mb-4 text-xs text-muted-foreground">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}

// Page 2: Comparison
function Page2({ onNext, onClose }: { onNext: () => void; onClose?: () => void }) {
  return (
    <div
      className="flex flex-col min-h-full"
      style={{
        background:
          'radial-gradient(ellipse at top left, #fef3c7 0%, #fdf4ff 30%, #eff6ff 60%, #fce7f3 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
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

      {/* Headline */}
      <div className="px-6 pt-2 pb-4">
        <h2 className="text-2xl font-black text-foreground leading-tight">
          Simora+ is the fastest way to your best routine yet.
        </h2>
      </div>

      {/* Comparison table area */}
      <div className="relative px-4 flex-1">
        {/* Spacer for badge positioning */}
        <div className="w-20" />

        {/* 76% badge */}
        <div
          className="absolute left-28 -top-2 z-20 flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)' }}
        >
          <span className="text-lg font-black">76%</span>
          <span className="text-[10px] leading-tight font-medium">users'<br />choice</span>
        </div>

        {/* Table */}
        <div className="mt-10 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm border border-white">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_64px] px-4 py-3 items-center">
            <span className="font-black text-sm text-foreground">Benefits</span>
            {/* VIP column header - gradient pill */}
            <div
              className="mx-auto w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-yellow-400 font-black text-lg shadow-lg"
              style={{ background: 'linear-gradient(160deg, #ec4899 0%, #8b5cf6 100%)' }}
            >
              <span className="text-xs">✦</span>
              <span className="text-base font-black italic">PLUS</span>
            </div>
            <span className="text-center font-bold text-sm text-foreground">Free</span>
          </div>

          {/* Rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className={cn(
                'grid grid-cols-[1fr_80px_64px] px-4 py-3 items-center border-t border-gray-100',
              )}
            >
              <span className="text-sm font-semibold text-foreground">{row.label}</span>
              {/* VIP cell — gradient column */}
              <div
                className="mx-auto w-16 py-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #ec489920 0%, #8b5cf620 100%)' }}
              >
                <Check className="h-5 w-5 text-yellow-500" strokeWidth={3} />
              </div>
              {/* Free cell */}
              <div className="flex justify-center">
                {row.free ? (
                  <Check className="h-5 w-5 text-foreground" strokeWidth={3} />
                ) : (
                  <span className="text-red-400 text-lg font-black">✗</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-6 mt-auto">
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

// Page 3: Pricing
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

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const originalPrice = program.original_price ? program.original_price / 100 : null;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;
  const annualMonthly = hasAnnual ? (annualPrice / 12).toFixed(2) : '0';
  const savingsPercent =
    hasAnnual && originalPrice && originalPrice > 0
      ? Math.round((1 - annualPrice / originalPrice) * 100)
      : hasAnnual && monthlyPrice > 0
      ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
      : 0;

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    try {
      const productId =
        selectedPlan === 'annual' ? program.annual_ios_product_id! : program.ios_product_id!;
      await onPurchase?.(productId, selectedPlan);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-2 flex items-center justify-between"
        style={{ background: 'linear-gradient(180deg, #f5f0ff 0%, #ffffff 100%)' }}
      >
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

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Headline */}
        <h2 className="text-2xl font-black text-foreground text-center mt-4 mb-5 leading-tight px-2">
          Simora+ premium is the best plan for building lasting habits
        </h2>

        {/* Before / After */}
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
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                'relative w-full flex items-center justify-between rounded-2xl border-2 px-4 py-4 transition-all text-left',
                selectedPlan === 'annual'
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-gray-200 bg-white',
              )}
            >
              {savingsPercent > 0 && (
                <span
                  className="absolute -top-3 right-4 px-3 py-1 rounded-full text-white text-xs font-black"
                  style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)' }}
                >
                  {savingsPercent}% OFF
                </span>
              )}
              <div>
                {program.trial_days && program.trial_days > 0 && (
                  <p className="font-black text-base text-foreground">
                    {program.trial_days}-day free trial
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  ${annualPrice.toFixed(2)}/year
                  {originalPrice && originalPrice > annualPrice && (
                    <span className="line-through ml-1 text-muted-foreground/60">
                      (was ${originalPrice.toFixed(2)}/year)
                    </span>
                  )}
                </p>
              </div>
              <p className="font-black text-base text-foreground">${annualMonthly}/mo.</p>
            </button>
          )}

          {/* Monthly card */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              'w-full flex items-center justify-between rounded-2xl border-2 px-4 py-4 transition-all text-left',
              selectedPlan === 'monthly'
                ? 'border-violet-600 bg-violet-50'
                : 'border-gray-200 bg-white',
            )}
          >
            <p className="text-sm text-muted-foreground">${monthlyPrice.toFixed(2)}/month</p>
            <p className="font-black text-base text-foreground">${monthlyPrice.toFixed(2)}/mo.</p>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full h-14 rounded-full font-bold text-white text-lg flex items-center justify-center gap-2 bg-gray-900 disabled:opacity-60"
        >
          {isPurchasing ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5" /></>}
        </button>

        {/* Legal disclaimer */}
        <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed px-2">
          <Link to="/sms-terms" className="underline">Terms of service</Link>
          {' & '}
          <Link to="/privacy" className="underline">Privacy policy</Link>
          {' '}PLEASE NOTE: Your Free-trial Period is {program.trial_days ?? 7}-day, then cost ${annualPrice.toFixed(2)}/a year. After your introductory offer, unless you cancel online before the end of then, current subscription will auto-renew.
        </p>
      </div>
    </div>
  );
}

export function PaywallVIP({ program, onPurchase, onRestore, onClose, preview }: PaywallVIPProps) {
  const [page, setPage] = useState(0);

  return (
    <div className="flex flex-col h-full">
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

      <div className="flex-1 overflow-y-auto">
        {page === 0 && (
          <Page1
            onNext={() => setPage(1)}
            onClose={onClose}
            trialDays={program.trial_days}
          />
        )}
        {page === 1 && (
          <Page2
            onNext={() => setPage(2)}
            onClose={onClose}
          />
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
