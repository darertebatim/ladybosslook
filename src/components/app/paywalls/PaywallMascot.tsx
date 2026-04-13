import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';
import appIcon from '@/assets/app-icon.png';
import mascotImage from '@/assets/mascot-paywall.png';

interface PaywallMascotProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

export function PaywallMascot({ program, onPurchase, onRestore, onClose, preview }: PaywallMascotProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const originalPrice = program.original_price ? program.original_price / 100 : null;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;
  const savingsPercent = hasAnnual && monthlyPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0;
  const annualMonthly = hasAnnual ? (annualPrice / 12).toFixed(2) : '0';

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
    <div className="flex flex-col h-full bg-[hsl(230,20%,8%)] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-white/60"><X className="h-5 w-5" /></button>
        <button onClick={onRestore} className="text-sm text-white/60 hover:underline">Restore</button>
      </div>
      {/* Mascot Hero */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={mascotImage}
          alt="Rilo mascot"
          className="w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[hsl(230,20%,8%)] to-transparent" />
      </div>

      <div className="flex-1 px-6 pt-4 pb-4 flex flex-col">
        <div className="flex items-center justify-center gap-2.5">
          <img src={appIcon} alt="App icon" className="h-8 w-8 rounded-lg" />
          <h2 className="text-3xl font-bold">Simora Plus</h2>
        </div>
        <p className="text-center text-sm opacity-70 mt-1">
          Unlocks premium wellness features including:
        </p>

        {/* Features */}
        <div className="mt-6 space-y-3">
          {(() => {
            const DEFAULT_FEATURES = [
              'Unlimited daily planner actions',
              'Unlimited routines to your planner',
              'Exclusive audio playlists',
              'Emotion tracking & reflections',
              'Premium breathing exercises',
            ];
            const features = program.features && program.features.length > 0
              ? program.features
              : DEFAULT_FEATURES;
            return features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ));
          })()}
        </div>

        <div className="flex-1" />

        {/* Plan Cards */}
        <div className="space-y-3 mt-6">
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                "relative w-full flex items-center justify-between rounded-xl border p-4 transition-all",
                selectedPlan === 'annual'
                  ? "border-primary bg-primary/10"
                  : "border-white/20"
              )}
            >
              {savingsPercent > 0 && (
                <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] px-2 border-0">
                  {savingsPercent}% OFF
                </Badge>
              )}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                  selectedPlan === 'annual' ? "border-primary bg-primary" : "border-white/40"
                )}>
                  {selectedPlan === 'annual' && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold">Annual</p>
                  <p className="text-xs opacity-60">Only ${annualMonthly}/mo</p>
                </div>
              </div>
              <p className="font-semibold">${annualPrice.toFixed(2)}/year</p>
            </button>
          )}

          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border p-4 transition-all",
              selectedPlan === 'monthly'
                ? "border-primary bg-primary/10"
                : "border-white/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                selectedPlan === 'monthly' ? "border-primary bg-primary" : "border-white/40"
              )}>
                {selectedPlan === 'monthly' && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </div>
              <p className="font-semibold">Monthly</p>
            </div>
            <div className="text-right">
              {originalPrice && originalPrice > monthlyPrice && (
                <p className="text-xs opacity-50 line-through">${originalPrice.toFixed(2)}/mo</p>
              )}
              <p className="font-semibold">${monthlyPrice.toFixed(2)}/mo</p>
            </div>
          </button>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full mt-4 rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Try 7 Days Free'}
        </Button>

        <p className="text-center text-[10px] opacity-40 mt-2">
          {selectedPlan === 'annual'
            ? `7-day free trial, then $${annualPrice.toFixed(2)}/year. Cancel anytime.`
            : `7-day free trial, then $${monthlyPrice.toFixed(2)}/month. Cancel anytime.`}
        </p>

        <div className="flex items-center justify-center gap-4 mt-2 text-xs opacity-50">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
