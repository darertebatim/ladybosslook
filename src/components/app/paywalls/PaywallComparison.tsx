import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Minus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaywallProgramData } from './PaywallClassic';

interface PaywallComparisonProps {
  program: PaywallProgramData;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => void;
  onRestore?: () => void;
  onClose?: () => void;
  preview?: boolean;
}

const comparisonFeatures = [
  { name: 'Daily Routines', free: true, pro: true },
  { name: 'Premium Audio Library', free: false, pro: true },
  { name: 'Guided Programs', free: false, pro: true },
  { name: 'Advanced Tracking', free: false, pro: true },
  { name: 'Community Access', free: false, pro: true },
];

export function PaywallComparison({ program, onPurchase, onRestore, onClose, preview }: PaywallComparisonProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const monthlyPrice = program.price_amount / 100;
  const annualPrice = (program.annual_price_amount || 0) / 100;
  const originalPrice = program.original_price ? program.original_price / 100 : null;
  const hasAnnual = !!program.annual_ios_product_id && annualPrice > 0;

  const handlePurchase = async () => {
    if (preview) return;
    setIsPurchasing(true);
    const productId = hasAnnual
      ? program.annual_ios_product_id!
      : program.ios_product_id!;
    onPurchase?.(productId, hasAnnual ? 'annual' : 'monthly');
    setIsPurchasing(false);
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
        <div className="relative h-44 overflow-hidden">
          <img
            src={program.cover_image_url}
            alt={program.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      <div className="flex-1 px-6 pt-4 pb-4 flex flex-col">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Unlock Your Smartest Routine
        </h2>

        {/* Comparison Table */}
        <div className="mt-5 rounded-xl border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_60px] bg-muted/50 p-3">
            <span className="text-xs font-medium text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground text-center">FREE</span>
            <span className="text-center">
              <Badge className="bg-primary text-primary-foreground text-[10px] px-2 border-0">PRO</Badge>
            </span>
          </div>
          {/* Rows */}
          {comparisonFeatures.map((feature, i) => (
            <div key={i} className={cn(
              "grid grid-cols-[1fr_60px_60px] p-3 items-center",
              i % 2 === 0 ? "bg-background" : "bg-muted/20"
            )}>
              <span className="text-sm text-foreground">{feature.name}</span>
              <div className="flex justify-center">
                {feature.free ? (
                  <Check className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* Price */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Subscribe to Pro for just{' '}
          {originalPrice && originalPrice > monthlyPrice && (
            <span className="line-through text-muted-foreground">${originalPrice.toFixed(2)}/mo</span>
          )}{' '}
          <span className="font-semibold text-foreground">
            ${hasAnnual ? annualPrice.toFixed(2) : monthlyPrice.toFixed(2)}/{hasAnnual ? 'yr' : 'mo'}
          </span>
        </p>

        <Button
          size="lg"
          className="w-full mt-3 rounded-xl h-12"
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
