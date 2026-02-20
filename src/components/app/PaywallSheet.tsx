import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultPaywall, PaywallVariantId } from '@/hooks/useDefaultPaywall';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallComparison, PaywallLimitedOffer, PaywallVIP, type PaywallProgramData } from '@/components/app/paywalls';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { PurchaseCelebration } from '@/components/app/PurchaseCelebration';

const VARIANT_MAP: Record<PaywallVariantId, React.ComponentType<any>> = {
  classic: PaywallClassic,
  gradient: PaywallGradient,
  minimal: PaywallMinimal,
  bold: PaywallBold,
  comparison: PaywallComparison,
  'limited-offer': PaywallLimitedOffer,
  vip: PaywallVIP,
};

const SIMORA_PLUS_SLUG = 'simora-plus';

interface PaywallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallSheet({ open, onOpenChange }: PaywallSheetProps) {
  const { variant } = useDefaultPaywall();
  const { handlePurchase, handleRestore, showCelebration, purchasedPlan, dismissCelebration } = useRevenueCat();

  const { data: programData } = useQuery({
    queryKey: ['paywall-program', SIMORA_PLUS_SLUG],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('program_catalog')
        .select('*')
        .eq('slug', SIMORA_PLUS_SLUG)
        .maybeSingle() as any);
      if (error || !data) return null;
      return {
        title: data.title,
        cover_image_url: data.cover_image_url,
        price_amount: data.price_amount,
        annual_price_amount: data.annual_price_amount,
        original_price: data.original_price,
        ios_product_id: data.ios_product_id,
        annual_ios_product_id: data.annual_ios_product_id,
        features: Array.isArray(data.features) ? data.features : [],
        trial_days: data.trial_days,
      } as PaywallProgramData;
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const onPurchaseComplete = async (productId: string, plan: 'monthly' | 'annual') => {
    await handlePurchase(productId, plan);
    // Don't close dialog immediately - celebration will show
  };

  const onRestoreComplete = async () => {
    await handleRestore();
    onOpenChange(false);
  };

  const Component = VARIANT_MAP[variant] || PaywallClassic;

  if (!programData) return null;

  const handleDismissCelebration = () => {
    dismissCelebration();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showCelebration} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] h-[85vh] p-0 rounded-2xl overflow-hidden border-0 [&>button]:hidden">
          <VisuallyHidden><DialogTitle>Upgrade to simora+</DialogTitle></VisuallyHidden>
          <div className="h-full overflow-y-auto">
            <Component
              program={programData}
              onPurchase={onPurchaseComplete}
              onRestore={onRestoreComplete}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <PurchaseCelebration
        open={showCelebration}
        onClose={handleDismissCelebration}
        plan={purchasedPlan}
      />
    </>
  );
}