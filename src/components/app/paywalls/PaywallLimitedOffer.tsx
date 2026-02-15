import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';

interface PaywallLimitedOfferProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

function CountdownTimer() {
  const [time, setTime] = useState({ hours: 2, minutes: 50, seconds: 32 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) return { hours: 0, minutes: 0, seconds: 0 };
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-1.5">
      {[pad(0), pad(time.hours), pad(time.minutes), pad(time.seconds)].map((val, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-foreground/60 font-bold text-lg">:</span>}
          <span className="bg-foreground text-background font-bold text-sm px-2.5 py-1.5 rounded-lg min-w-[36px] text-center">
            {val}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PaywallLimitedOffer({ program, onPurchase, onRestore, onClose, preview }: PaywallLimitedOfferProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual-offer' | 'annual-original'>('annual-offer');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;

  // 50% off annual = half the annual price
  const offerAnnualPrice = annualPrice / 2;
  const offerMonthly = (offerAnnualPrice / 12).toFixed(2);
  const originalMonthly = (annualPrice / 12).toFixed(2);

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    const productId = selectedPlan === 'monthly'
      ? program.ios_product_id!
      : program.annual_ios_product_id!;
    const plan = selectedPlan === 'monthly' ? 'monthly' : 'annual';
    onPurchase?.(productId, plan);
    setIsPurchasing(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
        <button onClick={onRestore} className="text-sm text-muted-foreground hover:underline">
          Restore
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-4 pb-3">
        <h2 className="text-2xl font-bold text-center text-foreground leading-tight">
          Make your life organized and meet your best self
        </h2>
      </div>

      {/* Before/After Image Area */}
      {program.cover_image_url && (
        <div className="px-6">
          <div className="relative h-56 rounded-2xl overflow-hidden">
            <img
              src={program.cover_image_url}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* 3-column plan cards */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              "relative rounded-xl border-2 p-3 pt-6 transition-all text-center",
              selectedPlan === 'monthly'
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <p className="font-bold text-foreground text-sm">1 month</p>
            <p className="text-xs text-muted-foreground mt-1">${monthlyPrice.toFixed(2)}/mo.</p>
            <div className="border-t border-border mt-2 pt-2">
              <p className="font-bold text-foreground text-sm">${monthlyPrice.toFixed(2)}/mo</p>
            </div>
          </button>

          {/* Annual 50% OFF */}
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual-offer')}
              className={cn(
                "relative rounded-xl border-2 p-3 pt-6 transition-all text-center",
                selectedPlan === 'annual-offer'
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {/* Badge */}
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                50% OFF
              </span>
              <p className="font-bold text-foreground text-sm">12 months</p>
              <p className="text-xs text-muted-foreground mt-1">${offerMonthly}/mo.</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="font-bold text-foreground text-sm">${offerAnnualPrice.toFixed(2)}/yr</p>
              </div>
            </button>
          )}

          {/* Annual Original */}
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual-original')}
              className={cn(
                "relative rounded-xl border-2 p-3 pt-6 transition-all text-center",
                selectedPlan === 'annual-original'
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                Original Price
              </span>
              <p className="font-bold text-foreground text-sm">12 months</p>
              <p className="text-xs text-muted-foreground mt-1">${originalMonthly}/mo.</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="font-bold text-foreground text-sm">${annualPrice.toFixed(2)}/yr</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Countdown */}
      <div className="px-6 mt-4">
        <CountdownTimer />
      </div>

      {/* Special offer note */}
      <p className="text-center text-xs text-muted-foreground mt-2 px-6">
        🎁 Special offer, charge now & no free trial
      </p>

      {/* CTA */}
      <div className="px-6 mt-3 pb-2">
        <Button
          size="lg"
          className="w-full rounded-full h-14 text-base font-bold gap-2"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <>
              Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Legal */}
      <p className="text-[10px] text-muted-foreground text-center px-6 pb-3 leading-tight">
        Your Apple ID payment method will be automatically charged ${selectedPlan === 'monthly' ? `${monthlyPrice.toFixed(2)}/month` : `${(selectedPlan === 'annual-offer' ? offerAnnualPrice : annualPrice).toFixed(2)} for a year`}. Cancel the subscription at least 24 hours before the current subscription period.
      </p>
    </div>
  );
}
