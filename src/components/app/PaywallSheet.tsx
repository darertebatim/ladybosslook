import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Sparkles, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaywallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: {
    title: string;
    ios_product_id?: string | null;
    annual_ios_product_id?: string | null;
    price_amount: number;
    annual_price_amount?: number | null;
    subscription_interval?: string | null;
    trial_days?: number | null;
    features?: string[] | any;
  };
}

const DEFAULT_FEATURES = [
  'Unlimited access to all content',
  'Exclusive audio & video lessons',
  'Community & group support',
  'New content added regularly',
];

export function PaywallSheet({ open, onOpenChange, program }: PaywallSheetProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    program.annual_ios_product_id ? 'annual' : 'monthly'
  );
  const [isPurchasing, setIsPurchasing] = useState(false);

  const hasAnnual = !!program.annual_ios_product_id && !!program.annual_price_amount;
  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || 0;
  const savingsPercent = hasAnnual && monthlyPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0;

  const hasTrial = (program.trial_days ?? 0) > 0;

  const features: string[] = Array.isArray(program.features) && program.features.length > 0
    ? program.features
    : DEFAULT_FEATURES;

  const formatPrice = (amountCents: number) => {
    const dollars = amountCents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    const productId = selectedPlan === 'annual'
      ? program.annual_ios_product_id
      : program.ios_product_id;

    try {
      console.log('[IAP] Purchase initiated:', { productId, plan: selectedPlan });
      toast.info('Purchase flow coming soon', {
        description: `Product: ${productId}`,
      });
    } catch (error) {
      console.error('[IAP] Purchase error:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="rounded-t-3xl px-6 pb-8 pt-3 max-h-[90vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1 rounded-full bg-muted/80 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <SheetTitle className="sr-only">Subscribe to {program.title}</SheetTitle>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Unlock {program.title}</h2>
          {hasTrial && (
            <p className="text-sm text-primary font-medium">
              Start your {program.trial_days}-day free trial
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-6">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Plan Cards */}
        <div className={cn("grid gap-3 mb-5", hasAnnual ? "grid-cols-2" : "grid-cols-1")}>
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all active:scale-95",
              selectedPlan === 'monthly'
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Monthly</p>
              <p className="text-xl font-bold">{formatPrice(monthlyPrice)}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
            {selectedPlan === 'monthly' && (
              <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              </div>
            )}
          </button>

          {/* Annual */}
          {hasAnnual && (
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all active:scale-95",
                selectedPlan === 'annual'
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              )}
            >
              {savingsPercent > 0 && (
                <Badge className="absolute -top-2.5 right-2 bg-emerald-600 text-primary-foreground text-[10px] px-2">
                  Save {savingsPercent}%
                </Badge>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-500" />
                  Annual
                </p>
                <p className="text-xl font-bold">{formatPrice(annualPrice)}</p>
                <p className="text-xs text-muted-foreground">/year</p>
              </div>
              {selectedPlan === 'annual' && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          )}
        </div>

        {/* Subscribe Button */}
        <Button
          size="lg"
          className="w-full text-base h-12 rounded-xl"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : hasTrial ? (
            `Start Free Trial`
          ) : (
            'Subscribe Now'
          )}
        </Button>

        {/* Fine Print */}
        <p className="text-[11px] text-center text-muted-foreground mt-3 leading-relaxed">
          {hasTrial
            ? `${program.trial_days}-day free trial, then ${formatPrice(selectedPlan === 'annual' ? annualPrice : monthlyPrice)}/${selectedPlan === 'annual' ? 'year' : 'month'}. `
            : ''}
          Cancel anytime. Managed by Apple.
        </p>
      </SheetContent>
    </Sheet>
  );
}
