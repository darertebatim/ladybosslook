import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';

interface PaywallBoldProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

export function PaywallBold({ program, onPurchase, onRestore, onClose, preview }: PaywallBoldProps) {
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
    <div className="flex flex-col h-full bg-foreground text-primary-foreground">
      {/* Hero */}
      {program.cover_image_url && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={program.cover_image_url}
            alt={program.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground to-transparent" />
        </div>
      )}

      <div className="flex-1 px-6 pt-6 pb-4 flex flex-col">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          <span className="text-xs font-semibold tracking-widest uppercase text-secondary">Premium</span>
        </div>
        <h2 className="text-3xl font-bold text-center">
          {program.title}
        </h2>
        <p className="text-center text-sm opacity-70 mt-1">
          Short guided practices to fit your busy day
        </p>

        <div className="flex-1" />

        {/* Plan Cards */}
        <div className="space-y-3 mt-6">
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                "relative w-full flex items-center justify-between rounded-xl border p-4 transition-all",
                selectedPlan === 'annual'
                  ? "border-secondary bg-secondary/10"
                  : "border-primary-foreground/20"
              )}
            >
              {savingsPercent > 0 && (
                <Badge className="absolute -top-2.5 right-4 bg-secondary text-secondary-foreground text-[10px] px-2 border-0">
                  {savingsPercent}% OFF
                </Badge>
              )}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                  selectedPlan === 'annual' ? "border-secondary bg-secondary" : "border-primary-foreground/40"
                )}>
                  {selectedPlan === 'annual' && <div className="h-2 w-2 rounded-full bg-secondary-foreground" />}
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
                ? "border-secondary bg-secondary/10"
                : "border-primary-foreground/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                selectedPlan === 'monthly' ? "border-secondary bg-secondary" : "border-primary-foreground/40"
              )}>
                {selectedPlan === 'monthly' && <div className="h-2 w-2 rounded-full bg-secondary-foreground" />}
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
          className="w-full mt-4 rounded-xl h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
        </Button>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs opacity-50">
          <button onClick={onRestore} className="hover:underline">Restore Purchases</button>
          <span>Terms</span>
          <span>Privacy</span>
        </div>
      </div>
    </div>
  );
}
