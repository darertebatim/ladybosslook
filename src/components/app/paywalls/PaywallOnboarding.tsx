import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';

// Default before/after slides
import slide1 from '@/assets/onboarding/meplus-32-beforeafter.png';
import slide2 from '@/assets/onboarding/paywall-slide-2.png';
import slide3 from '@/assets/onboarding/paywall-slide-3.png';

interface PaywallOnboardingProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

const DEFAULT_SLIDES = [slide1, slide2, slide3];

export function PaywallOnboarding({ program, onPurchase, onRestore, onClose, preview }: PaywallOnboardingProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const originalPrice = program.original_price ? program.original_price / 100 : null;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;
  const annualMonthly = hasAnnual ? (annualPrice / 12).toFixed(2) : '0';
  const monthlySavings = originalPrice && originalPrice > monthlyPrice
    ? Math.round((1 - monthlyPrice / originalPrice) * 100)
    : 40;
  const annualSavings = hasAnnual && originalPrice
    ? Math.round((1 - annualPrice / (originalPrice * 12)) * 100)
    : 59;

  // Auto-swipe
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % DEFAULT_SLIDES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    try {
      const productId = selectedPlan === 'annual'
        ? program.annual_ios_product_id!
        : program.ios_product_id!;
      await onPurchase?.(productId, selectedPlan);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <button onClick={onClose} className="text-gray-400 text-lg">
          <X className="h-5 w-5" />
        </button>
        <button onClick={onRestore} className="text-sm font-medium text-indigo-500">Restore</button>
      </div>

      <h2 className="text-[22px] font-extrabold text-[#1a1f3d] text-center px-6 mb-4 leading-tight">
        Make your life organized and meet your best self
      </h2>

      {/* Auto-swiping carousel */}
      <div className="relative mx-4 mb-5 overflow-hidden rounded-2xl" style={{ height: 180 }}>
        <div
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {DEFAULT_SLIDES.map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-full object-contain shrink-0" />
          ))}
        </div>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {DEFAULT_SLIDES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentSlide ? 'w-4 bg-indigo-500' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="flex justify-center gap-3 px-4 mb-4">
        {/* Monthly */}
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={cn(
            "relative rounded-2xl border-2 pt-5 pb-3 px-4 text-center transition-all w-[140px]",
            selectedPlan === 'monthly' ? 'border-indigo-500 bg-indigo-50/60' : 'border-gray-200 bg-white'
          )}
        >
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
            {program.trial_days ? `${program.trial_days}-Day Free Trial` : '7-Day Free Trial'}
          </span>
          <p className="text-base font-extrabold text-[#1a1f3d]">1</p>
          <p className="text-[11px] text-[#1a1f3d] font-medium">month</p>
          {originalPrice && (
            <p className="text-[11px] text-gray-400 mt-1 line-through">${originalPrice.toFixed(2)}/mo.</p>
          )}
          <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
            {monthlySavings}% OFF
          </span>
          <div className="border-t border-gray-200 mt-2 pt-2">
            <p className={cn("text-xs font-bold", selectedPlan === 'monthly' ? 'text-[#1a1f3d]' : 'text-gray-500')}>
              ${monthlyPrice.toFixed(2)}/mo
            </p>
          </div>
        </button>

        {/* Annual */}
        {hasAnnual && (
          <button
            onClick={() => setSelectedPlan('annual')}
            className={cn(
              "relative rounded-2xl border-2 pt-5 pb-3 px-4 text-center transition-all w-[140px]",
              selectedPlan === 'annual' ? 'border-indigo-500 bg-indigo-50/60' : 'border-gray-200 bg-white'
            )}
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
              {program.trial_days ? `${program.trial_days}-Day Free Trial` : '7-Day Free Trial'}
            </span>
            <p className="text-base font-extrabold text-[#1a1f3d]">12</p>
            <p className="text-[11px] text-[#1a1f3d] font-medium">months</p>
            <p className="text-[11px] text-gray-400 mt-1">${annualMonthly}/mo.</p>
            <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
              {annualSavings}% OFF
            </span>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <p className={cn("text-xs font-bold", selectedPlan === 'annual' ? 'text-[#1a1f3d]' : 'text-gray-500')}>
                ${annualPrice.toFixed(2)}/yr
              </p>
            </div>
          </button>
        )}
      </div>

      {/* No payment badge */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <span className="text-green-500 text-base">✅</span>
        <p className="text-sm font-semibold text-[#1a1f3d]">No Payment Now!</p>
      </div>

      <div className="mt-auto px-6 pb-4">
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full py-4 rounded-full bg-[#1a1f3d] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>Continue <span className="text-lg">→</span></>
          )}
        </button>

        <p className="text-[9px] text-gray-400 text-center mt-3 leading-snug">
          After your 7-day free trial, your Apple ID payment method will be automatically charged. Cancel at least 24 hours before the current period ends.
        </p>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
