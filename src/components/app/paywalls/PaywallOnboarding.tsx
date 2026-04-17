import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';
import meplusPaywall1 from '@/assets/onboarding/meplus-32-beforeafter.png';
import meplusPaywall2 from '@/assets/meplus-paywall-2.png';
import meplusPaywall3 from '@/assets/meplus-paywall-3.png';
import { usePaywallTracking } from '@/hooks/usePaywallTracking';

interface PaywallProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

const images = [meplusPaywall1, meplusPaywall2, meplusPaywall3];

export function PaywallOnboarding({ program, onPurchase, onRestore, onClose, preview }: PaywallProps) {
  usePaywallTracking('onboarding');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentImg(c => (c + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || program.price_amount * 10;
  const annualMonthly = (annualPrice / 12).toFixed(2);
  const annualDiscount = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);
  const monthlyDiscount = 40;

  const handlePurchase = async () => {
    if (!onPurchase) return;
    setIsPurchasing(true);
    try {
      const productId = selectedPlan === 'annual'
        ? (program.annual_ios_product_id || 'simora_plus_annual')
        : (program.ios_product_id || 'simora_plus_monthly');
      await onPurchase(productId, selectedPlan);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-5 pt-10 pb-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onClose} className="text-gray-400 text-lg active:opacity-60">✕</button>
        <button onClick={onRestore} className="text-sm font-medium text-indigo-500 active:opacity-60">Restore</button>
      </div>

      <h1 className="text-[22px] font-extrabold text-[#1a1f3d] text-center mb-4 leading-tight">
        Make your life organized and meet your best self
      </h1>

      {/* Auto-rotating images */}
      <div className="relative flex items-center justify-center mb-5 overflow-hidden" style={{ aspectRatio: '1/1' }}>
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={cn(
              'absolute inset-0 w-full h-full object-contain transition-opacity duration-700',
              i === currentImg ? 'opacity-100' : 'opacity-0'
            )}
          />
        ))}
      </div>

      {/* Pricing cards */}
      <div className="flex justify-center gap-3 mb-4">
        {/* Monthly */}
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={cn(
            'relative rounded-2xl border-2 pt-5 pb-3 px-3 text-center transition-all active:scale-[0.97] w-[140px]',
            selectedPlan === 'monthly' ? 'border-indigo-500 bg-indigo-50/60' : 'border-gray-200 bg-white'
          )}
        >
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
            7-Day Free Trial
          </span>
          <p className="text-sm font-extrabold text-[#1a1f3d]">1 month</p>
          <p className="text-[11px] text-gray-400 mt-0.5 line-through">${monthlyPrice.toFixed(2)}/mo.</p>
          <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
            {monthlyDiscount}% OFF
          </span>
          <div className="border-t border-gray-200 mt-1.5 pt-1.5">
            <p className={cn('text-xs font-bold', selectedPlan === 'monthly' ? 'text-[#1a1f3d]' : 'text-gray-500')}>
              ${(monthlyPrice * (1 - monthlyDiscount / 100)).toFixed(2)}/mo
            </p>
          </div>
        </button>

        {/* Annual */}
        <button
          onClick={() => setSelectedPlan('annual')}
          className={cn(
            'relative rounded-2xl border-2 pt-5 pb-3 px-3 text-center transition-all active:scale-[0.97] w-[140px]',
            selectedPlan === 'annual' ? 'border-indigo-500 bg-indigo-50/60' : 'border-gray-200 bg-white'
          )}
        >
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
            7-Day Free Trial
          </span>
          <p className="text-sm font-extrabold text-[#1a1f3d]">12 months</p>
          <p className="text-[11px] text-gray-400 mt-0.5">${annualMonthly}/mo.</p>
          <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
            {annualDiscount}% OFF
          </span>
          <div className="border-t border-gray-200 mt-1.5 pt-1.5">
            <p className={cn('text-xs font-bold', selectedPlan === 'annual' ? 'text-[#1a1f3d]' : 'text-gray-500')}>
              ${annualPrice.toFixed(2)}/yr
            </p>
          </div>
        </button>
      </div>

      {/* No payment badge */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <span className="text-green-500 text-base">✅</span>
        <p className="text-sm font-semibold text-[#1a1f3d]">No Payment Now!</p>
      </div>

      <div className="mt-auto">
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full py-4 rounded-full bg-[#1a1f3d] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {isPurchasing ? 'Processing...' : 'Continue'}
          {!isPurchasing && <span className="text-lg">→</span>}
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <Link to="/sms-terms" className="text-[10px] text-gray-400 underline">Terms</Link>
        <span className="text-[10px] text-gray-300">·</span>
        <Link to="/privacy" className="text-[10px] text-gray-400 underline">Privacy</Link>
      </div>
    </div>
  );
}
