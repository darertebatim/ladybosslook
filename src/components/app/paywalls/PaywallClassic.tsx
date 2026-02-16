import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaywallProgramData {
  title: string;
  cover_image_url?: string | null;
  price_amount: number;
  annual_price_amount?: number | null;
  original_price?: number | null;
  ios_product_id?: string | null;
  annual_ios_product_id?: string | null;
  features?: string[];
  trial_days?: number | null;
}

interface PaywallProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

export function PaywallClassic({ program, onPurchase, onRestore, onClose, preview }: PaywallProps) {
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        <button onClick={onRestore} className="text-sm text-muted-foreground hover:underline">Restore</button>
      </div>
      {/* Hero Image */}
      {program.cover_image_url && (
        <div className="relative h-48 overflow-hidden rounded-b-3xl">
          <img
            src={program.cover_image_url}
            alt={program.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-4 flex flex-col">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Unlock {program.title}
        </h2>
        {program.trial_days && program.trial_days > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-1">
            Start with a {program.trial_days}-day free trial
          </p>
        )}

        {/* Features */}
        {program.features && program.features.length > 0 && (
          <div className="mt-6 space-y-3">
            {program.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Plan Selector */}
        <div className="space-y-3 mt-6">
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                "relative w-full flex items-center justify-between rounded-xl border-2 p-4 transition-all",
                selectedPlan === 'annual'
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {savingsPercent > 0 && (
                <Badge className="absolute -top-2.5 left-4 bg-success text-success-foreground text-[10px] px-2 border-0">
                  SAVE {savingsPercent}%
                </Badge>
              )}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                  selectedPlan === 'annual' ? "border-primary bg-primary" : "border-muted-foreground"
                )}>
                  {selectedPlan === 'annual' && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Yearly</p>
                  <p className="text-xs text-muted-foreground">Only ${annualMonthly}/mo</p>
                </div>
              </div>
              <p className="font-semibold text-foreground">${annualPrice.toFixed(2)}/yr</p>
            </button>
          )}

          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border-2 p-4 transition-all",
              selectedPlan === 'monthly'
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                selectedPlan === 'monthly' ? "border-primary bg-primary" : "border-muted-foreground"
              )}>
                {selectedPlan === 'monthly' && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </div>
              <p className="font-semibold text-foreground">Monthly</p>
            </div>
            <div className="text-right">
              {originalPrice && originalPrice > monthlyPrice && (
                <p className="text-xs text-muted-foreground line-through">${originalPrice.toFixed(2)}/mo</p>
              )}
              <p className="font-semibold text-foreground">${monthlyPrice.toFixed(2)}/mo</p>
            </div>
          </button>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full mt-4 rounded-xl h-12"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
        </Button>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
