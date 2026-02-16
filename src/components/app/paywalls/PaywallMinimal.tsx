import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';

interface PaywallMinimalProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

export function PaywallMinimal({ program, onPurchase, onRestore, onClose, preview }: PaywallMinimalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const originalPrice = program.original_price ? program.original_price / 100 : null;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;
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

  // Testimonial
  const testimonial = {
    text: "This app changed my daily routine completely. I feel more empowered and focused every day!",
    author: "Happy Member",
    rating: 5,
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        <button onClick={onRestore} className="text-sm text-muted-foreground hover:underline">Restore</button>
      </div>
      {/* Decorative top */}
      <div className="h-24 bg-gradient-to-b from-accent/40 to-transparent" />

      <div className="flex-1 px-6 flex flex-col -mt-4">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Start your journey today
        </h2>

        {/* Stars */}
        <div className="flex justify-center gap-0.5 mt-3">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
          ))}
        </div>

        {/* Testimonial */}
        <blockquote className="text-center text-sm text-muted-foreground italic mt-2 px-4">
          "{testimonial.text}"
        </blockquote>
        <p className="text-center text-xs text-muted-foreground mt-1">{testimonial.author}</p>

        {/* Trial toggle */}
        {program.trial_days && program.trial_days > 0 && (
          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3 mt-6">
            <span className="text-sm text-foreground">Not sure yet? Enable free trial</span>
            <div className="h-6 w-10 bg-primary rounded-full relative">
              <div className="absolute right-0.5 top-0.5 h-5 w-5 bg-primary-foreground rounded-full" />
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Plans */}
        <div className="space-y-2 mt-6">
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border-2 p-4 transition-all",
                selectedPlan === 'annual'
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
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
              <p className="font-semibold text-foreground">${annualMonthly}/mo</p>
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

        <div className="flex items-center justify-center gap-4 mt-3 pb-4 text-xs text-muted-foreground">
          <Link to="/sms-terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
