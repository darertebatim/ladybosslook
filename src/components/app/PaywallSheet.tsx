import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Sparkles, Check, X, Star, Zap, Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface PaywallProgram {
  title: string;
  ios_product_id?: string | null;
  annual_ios_product_id?: string | null;
  price_amount: number;
  annual_price_amount?: number | null;
  subscription_interval?: string | null;
  trial_days?: number | null;
  features?: string[] | any;
  cover_image_url?: string | null;
}

interface PaywallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: PaywallProgram;
  variant?: 'classic' | 'gradient' | 'minimal' | 'bold' | 'image';
}

const DEFAULT_FEATURES = [
  'Unlimited access to all content',
  'Exclusive audio & video lessons',
  'Community & group support',
  'New content added regularly',
];

function getFeatures(program: PaywallProgram): string[] {
  return Array.isArray(program.features) && program.features.length > 0
    ? program.features
    : DEFAULT_FEATURES;
}

function formatPrice(amountCents: number) {
  const dollars = amountCents / 100;
  return `$${dollars.toFixed(2)}`;
}

// ─── VARIANT: Classic (original) ───
function ClassicPaywall({ program, onPurchase, isPurchasing }: VariantProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    program.annual_ios_product_id ? 'annual' : 'monthly'
  );
  const hasAnnual = !!program.annual_ios_product_id && !!program.annual_price_amount;
  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || 0;
  const savingsPercent = hasAnnual && monthlyPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0;
  const hasTrial = (program.trial_days ?? 0) > 0;
  const features = getFeatures(program);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Unlock {program.title}</h2>
        {hasTrial && (
          <p className="text-sm text-primary font-medium">
            Start your {program.trial_days}-day free trial
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm text-foreground">{f}</span>
          </div>
        ))}
      </div>

      <PlanCards
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        monthlyPrice={monthlyPrice}
        annualPrice={annualPrice}
        hasAnnual={hasAnnual}
        savingsPercent={savingsPercent}
      />

      <Button size="lg" className="w-full text-base h-12 rounded-xl" onClick={() => onPurchase(selectedPlan)} disabled={isPurchasing}>
        {isPurchasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : hasTrial ? 'Start Free Trial' : 'Subscribe Now'}
      </Button>

      <FinePrint program={program} selectedPlan={selectedPlan} annualPrice={annualPrice} monthlyPrice={monthlyPrice} />
    </div>
  );
}

// ─── VARIANT: Gradient ───
function GradientPaywall({ program, onPurchase, isPurchasing }: VariantProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    program.annual_ios_product_id ? 'annual' : 'monthly'
  );
  const hasAnnual = !!program.annual_ios_product_id && !!program.annual_price_amount;
  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || 0;
  const savingsPercent = hasAnnual && monthlyPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0;
  const hasTrial = (program.trial_days ?? 0) > 0;
  const features = getFeatures(program);

  return (
    <div className="space-y-5">
      {/* Gradient hero */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent p-6 text-center text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-90" />
          <h2 className="text-xl font-bold">{program.title}</h2>
          {hasTrial && (
            <p className="text-sm mt-1 opacity-90">{program.trial_days} days free</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
            <Zap className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>

      <PlanCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} monthlyPrice={monthlyPrice} annualPrice={annualPrice} hasAnnual={hasAnnual} savingsPercent={savingsPercent} />

      <Button size="lg" className="w-full text-base h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90" onClick={() => onPurchase(selectedPlan)} disabled={isPurchasing}>
        {isPurchasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : hasTrial ? 'Start Free Trial' : 'Subscribe Now'}
      </Button>

      <FinePrint program={program} selectedPlan={selectedPlan} annualPrice={annualPrice} monthlyPrice={monthlyPrice} />
    </div>
  );
}

// ─── VARIANT: Minimal ───
function MinimalPaywall({ program, onPurchase, isPurchasing }: VariantProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    program.annual_ios_product_id ? 'annual' : 'monthly'
  );
  const hasAnnual = !!program.annual_ios_product_id && !!program.annual_price_amount;
  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || 0;
  const hasTrial = (program.trial_days ?? 0) > 0;
  const features = getFeatures(program);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">{program.title}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {hasTrial ? `Try ${program.trial_days} days free` : 'Unlock premium access'}
        </p>
      </div>

      <div className="border rounded-xl p-4 space-y-3">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>

      {/* Simple price display */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={cn(
            "text-center px-4 py-2 rounded-lg transition-all active:scale-95",
            selectedPlan === 'monthly' ? "bg-primary/10 ring-2 ring-primary" : ""
          )}
        >
          <p className="text-lg font-bold">{formatPrice(monthlyPrice)}</p>
          <p className="text-xs text-muted-foreground">/month</p>
        </button>
        {hasAnnual && (
          <button
            onClick={() => setSelectedPlan('annual')}
            className={cn(
              "text-center px-4 py-2 rounded-lg transition-all active:scale-95",
              selectedPlan === 'annual' ? "bg-primary/10 ring-2 ring-primary" : ""
            )}
          >
            <p className="text-lg font-bold">{formatPrice(annualPrice)}</p>
            <p className="text-xs text-muted-foreground">/year</p>
          </button>
        )}
      </div>

      <Button size="lg" variant="outline" className="w-full text-base h-12 rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => onPurchase(selectedPlan)} disabled={isPurchasing}>
        {isPurchasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Continue'}
      </Button>

      <FinePrint program={program} selectedPlan={selectedPlan} annualPrice={annualPrice} monthlyPrice={monthlyPrice} />
    </div>
  );
}

// ─── VARIANT: Bold ───
function BoldPaywall({ program, onPurchase, isPurchasing }: VariantProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    program.annual_ios_product_id ? 'annual' : 'monthly'
  );
  const hasAnnual = !!program.annual_ios_product_id && !!program.annual_price_amount;
  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || 0;
  const savingsPercent = hasAnnual && monthlyPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0;
  const hasTrial = (program.trial_days ?? 0) > 0;
  const features = getFeatures(program);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <Heart className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-extrabold">Go Premium</h2>
        <p className="text-muted-foreground text-sm">{program.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {features.slice(0, 4).map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5">
            <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-medium">{f}</span>
          </div>
        ))}
      </div>

      <PlanCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} monthlyPrice={monthlyPrice} annualPrice={annualPrice} hasAnnual={hasAnnual} savingsPercent={savingsPercent} />

      <Button size="lg" className="w-full text-base h-14 rounded-2xl font-bold text-lg" onClick={() => onPurchase(selectedPlan)} disabled={isPurchasing}>
        {isPurchasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : hasTrial ? `Try ${program.trial_days} Days Free` : 'Get Premium'}
      </Button>

      <FinePrint program={program} selectedPlan={selectedPlan} annualPrice={annualPrice} monthlyPrice={monthlyPrice} />
    </div>
  );
}

// ─── VARIANT: Image ───
function ImagePaywall({ program, onPurchase, isPurchasing }: VariantProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    program.annual_ios_product_id ? 'annual' : 'monthly'
  );
  const hasAnnual = !!program.annual_ios_product_id && !!program.annual_price_amount;
  const monthlyPrice = program.price_amount;
  const annualPrice = program.annual_price_amount || 0;
  const savingsPercent = hasAnnual && monthlyPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0;
  const hasTrial = (program.trial_days ?? 0) > 0;
  const features = getFeatures(program);

  return (
    <div className="space-y-4">
      {/* Cover image or fallback */}
      {program.cover_image_url ? (
        <div className="relative rounded-2xl overflow-hidden h-40">
          <img src={program.cover_image_url} alt={program.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-lg font-bold text-foreground">{program.title}</h2>
            {hasTrial && <p className="text-xs text-primary font-medium">{program.trial_days}-day free trial</p>}
          </div>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <h2 className="text-xl font-bold">{program.title}</h2>
        </div>
      )}

      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>

      <PlanCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} monthlyPrice={monthlyPrice} annualPrice={annualPrice} hasAnnual={hasAnnual} savingsPercent={savingsPercent} />

      <Button size="lg" className="w-full text-base h-12 rounded-xl" onClick={() => onPurchase(selectedPlan)} disabled={isPurchasing}>
        {isPurchasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : hasTrial ? 'Start Free Trial' : 'Subscribe Now'}
      </Button>

      <FinePrint program={program} selectedPlan={selectedPlan} annualPrice={annualPrice} monthlyPrice={monthlyPrice} />
    </div>
  );
}

// ─── Shared Components ───

interface VariantProps {
  program: PaywallProgram;
  onPurchase: (plan: 'monthly' | 'annual') => void;
  isPurchasing: boolean;
}

function PlanCards({ selectedPlan, onSelectPlan, monthlyPrice, annualPrice, hasAnnual, savingsPercent }: {
  selectedPlan: 'monthly' | 'annual';
  onSelectPlan: (p: 'monthly' | 'annual') => void;
  monthlyPrice: number;
  annualPrice: number;
  hasAnnual: boolean;
  savingsPercent: number;
}) {
  return (
    <div className={cn("grid gap-3", hasAnnual ? "grid-cols-2" : "grid-cols-1")}>
      <button
        onClick={() => onSelectPlan('monthly')}
        className={cn(
          "relative rounded-xl border-2 p-4 text-left transition-all active:scale-95",
          selectedPlan === 'monthly' ? "border-primary bg-primary/5 shadow-sm" : "border-border"
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
      {hasAnnual && (
        <button
          onClick={() => onSelectPlan('annual')}
          className={cn(
            "relative rounded-xl border-2 p-4 text-left transition-all active:scale-95",
            selectedPlan === 'annual' ? "border-primary bg-primary/5 shadow-sm" : "border-border"
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
  );
}

function FinePrint({ program, selectedPlan, annualPrice, monthlyPrice }: {
  program: PaywallProgram;
  selectedPlan: 'monthly' | 'annual';
  annualPrice: number;
  monthlyPrice: number;
}) {
  const hasTrial = (program.trial_days ?? 0) > 0;
  return (
    <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
      {hasTrial
        ? `${program.trial_days}-day free trial, then ${formatPrice(selectedPlan === 'annual' ? annualPrice : monthlyPrice)}/${selectedPlan === 'annual' ? 'year' : 'month'}. `
        : ''}
      Cancel anytime. Managed by Apple.
    </p>
  );
}

// ─── Main Component ───

const VARIANT_MAP = {
  classic: ClassicPaywall,
  gradient: GradientPaywall,
  minimal: MinimalPaywall,
  bold: BoldPaywall,
  image: ImagePaywall,
} as const;

export function PaywallSheet({ open, onOpenChange, program, variant = 'classic' }: PaywallSheetProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (plan: 'monthly' | 'annual') => {
    setIsPurchasing(true);
    const productId = plan === 'annual'
      ? program.annual_ios_product_id
      : program.ios_product_id;

    try {
      console.log('[IAP] Purchase initiated:', { productId, plan });
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

  const VariantComponent = VARIANT_MAP[variant];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="rounded-t-3xl px-6 pb-8 pt-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1 rounded-full bg-muted/80 hover:bg-muted transition-colors z-10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <SheetTitle className="sr-only">Subscribe to {program.title}</SheetTitle>

        <VariantComponent
          program={program}
          onPurchase={handlePurchase}
          isPurchasing={isPurchasing}
        />
      </SheetContent>
    </Sheet>
  );
}

export type PaywallVariant = keyof typeof VARIANT_MAP;
export const PAYWALL_VARIANTS: PaywallVariant[] = Object.keys(VARIANT_MAP) as PaywallVariant[];
