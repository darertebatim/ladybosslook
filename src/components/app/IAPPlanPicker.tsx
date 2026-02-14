import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface IAPPlanPickerProps {
  program: {
    ios_product_id?: string | null;
    annual_ios_product_id?: string | null;
    price_amount: number;
    annual_price_amount?: number | null;
    title: string;
    subscription_interval?: string | null;
  };
}

export function IAPPlanPicker({ program }: IAPPlanPickerProps) {
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

  const formatPrice = (amountCents: number) => {
    // IAP prices are stored in cents (e.g. 1399 = $13.99)
    const dollars = amountCents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    const productId = selectedPlan === 'annual' 
      ? program.annual_ios_product_id 
      : program.ios_product_id;
    
    try {
      // TODO: Integrate with RevenueCat SDK
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
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-center">Choose Your Plan</h3>
      
      {/* Plan Cards */}
      <div className={cn("grid gap-3", hasAnnual ? "grid-cols-2" : "grid-cols-1")}>
        {/* Monthly Plan */}
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={cn(
            "relative rounded-xl border-2 p-4 text-left transition-all",
            selectedPlan === 'monthly'
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/40"
          )}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Monthly</p>
            <p className="text-2xl font-bold">{formatPrice(monthlyPrice)}</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </div>
          {selectedPlan === 'monthly' && (
            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
            </div>
          )}
        </button>

        {/* Annual Plan */}
        {hasAnnual && (
          <button
            onClick={() => setSelectedPlan('annual')}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all",
              selectedPlan === 'annual'
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40"
            )}
          >
            {savingsPercent > 0 && (
              <Badge className="absolute -top-2.5 right-2 bg-green-500 text-white text-[10px] px-2">
                Save {savingsPercent}%
              </Badge>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Annual
              </p>
              <p className="text-2xl font-bold">{formatPrice(annualPrice)}</p>
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
        className="w-full"
        onClick={handlePurchase}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>

      {/* Fine Print */}
      <p className="text-xs text-center text-muted-foreground">
        Cancel anytime. Managed by Apple.
      </p>
    </div>
  );
}