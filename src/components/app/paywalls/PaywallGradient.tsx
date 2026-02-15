import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';
import appIcon from '@/assets/app-icon.png';

interface PaywallGradientProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

export function PaywallGradient({ program, onPurchase, onRestore, onClose, preview }: PaywallGradientProps) {
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
    const productId = selectedPlan === 'annual'
      ? program.annual_ios_product_id!
      : program.ios_product_id!;
    onPurchase?.(productId, selectedPlan);
    setIsPurchasing(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary/20 via-background to-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        <button onClick={onRestore} className="text-sm text-muted-foreground hover:underline">Restore</button>
      </div>
      {/* Hero */}
      <div className="relative px-6 pt-4 pb-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden mb-4">
          <img src={appIcon} alt="App icon" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {program.title}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Unlock your full potential
        </p>
      </div>

      {/* Toggle */}
      {hasAnnual && (
        <div className="flex justify-center mt-2">
          <div className="inline-flex bg-muted rounded-full p-1">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedPlan === 'monthly'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedPlan === 'annual'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Annual
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="flex-1 px-6 mt-6">
        {program.features && program.features.length > 0 && (
          <div className="space-y-3">
            {program.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className="px-6 pb-4">
        <div className="text-center mb-4">
          {selectedPlan === 'annual' && hasAnnual ? (
            <>
              <p className="text-3xl font-bold text-foreground">${annualPrice.toFixed(2)}<span className="text-lg font-normal text-muted-foreground">/year</span></p>
              <p className="text-sm text-muted-foreground">That's just ${annualMonthly}/month</p>
              {savingsPercent > 0 && (
                <Badge variant="secondary" className="mt-1 bg-success/15 text-success border-0">
                  Save {savingsPercent}% vs monthly
                </Badge>
              )}
            </>
          ) : (
            <>
              {originalPrice && originalPrice > monthlyPrice && (
                <p className="text-lg text-muted-foreground line-through">${originalPrice.toFixed(2)}/month</p>
              )}
              <p className="text-3xl font-bold text-foreground">${monthlyPrice.toFixed(2)}<span className="text-lg font-normal text-muted-foreground">/month</span></p>
            </>
          )}
        </div>

        {program.trial_days && program.trial_days > 0 && (
          <p className="text-center text-xs text-muted-foreground mb-3">
            {program.trial_days}-day free trial, then auto-renews
          </p>
        )}

        <Button
          size="lg"
          className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
        </Button>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>Terms</span>
          <span>Privacy</span>
        </div>
      </div>
    </div>
  );
}
