import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultPaywall, PaywallVariantId } from '@/hooks/useDefaultPaywall';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallMascot, PaywallComparison, PaywallLimitedOffer, PaywallVIP, PaywallOnboarding, PaywallMascotV2, PaywallSunriseCard, PaywallPersonalized, PaywallRiloV2, type PaywallProgramData } from '@/components/app/paywalls';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { PurchaseCelebration } from '@/components/app/PurchaseCelebration';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const VARIANT_MAP: Record<PaywallVariantId, React.ComponentType<any>> = {
  classic: PaywallClassic,
  gradient: PaywallGradient,
  minimal: PaywallMinimal,
  bold: PaywallBold,
  mascot: PaywallMascot,
  comparison: PaywallComparison,
  'limited-offer': PaywallLimitedOffer,
  vip: PaywallVIP,
  onboarding: PaywallOnboarding,
  'mascot-v2': PaywallMascotV2,
  'sunrise-card': PaywallSunriseCard,
  personalized: PaywallPersonalized,
  'rilo-v2': PaywallRiloV2,
};

const SIMORA_PLUS_SLUG = 'simora-plus';
const SIMORA_PLUS_ANNUAL_SLUG = 'simora-plus-annual';

interface PaywallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallSheet({ open, onOpenChange }: PaywallSheetProps) {
  const { variant: defaultVariant } = useDefaultPaywall();
  const { handlePurchase: handleIAPPurchase, handleRestore, showCelebration, purchasedPlan, dismissCelebration } = useRevenueCat();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const queryClient = useQueryClient();
  const isNative = Capacitor.isNativePlatform();

  // First-time users see 'mascot-v2', then the default variant on subsequent views
  const PAYWALL_SEEN_KEY = 'paywall_seen_once';
  const hasSeenBefore = localStorage.getItem(PAYWALL_SEEN_KEY) === 'true';
  const variant = hasSeenBefore ? defaultVariant : ('mascot-v2' as PaywallVariantId);

  // Mark as seen when paywall opens
  if (open && !hasSeenBefore) {
    localStorage.setItem(PAYWALL_SEEN_KEY, 'true');
  }

  const { data: programData } = useQuery({
    queryKey: ['paywall-program', SIMORA_PLUS_SLUG],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('program_catalog')
        .select('*')
        .eq('slug', SIMORA_PLUS_SLUG)
        .maybeSingle() as any);
      if (error || !data) return null;
      // Use Android product IDs when on Android (Play Store uses different ID format)
      const isAndroid = Capacitor.getPlatform() === 'android';
      const monthlyId = isAndroid && data.android_product_id ? data.android_product_id : data.ios_product_id;
      const annualId = isAndroid && data.annual_android_product_id ? data.annual_android_product_id : data.annual_ios_product_id;
      return {
        title: data.title,
        cover_image_url: data.cover_image_url,
        price_amount: data.price_amount,
        annual_price_amount: data.annual_price_amount,
        original_price: data.original_price,
        ios_product_id: monthlyId,
        annual_ios_product_id: annualId,
        features: Array.isArray(data.features) ? data.features : [],
        trial_days: data.trial_days,
      } as PaywallProgramData;
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  // Web Stripe checkout handler
  const handleWebPurchase = useCallback(async (_productId: string, plan: 'monthly' | 'annual') => {
    if (isRedirecting) return;
    setIsRedirecting(true);

    try {
      const programSlug = plan === 'annual' ? SIMORA_PLUS_ANNUAL_SLUG : SIMORA_PLUS_SLUG;
      console.log('[Paywall] Web purchase:', programSlug, plan);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { program: programSlug },
      });

      if (error) {
        console.error('[Paywall] Stripe checkout error:', error);
        toast.error('Failed to start checkout. Please try again.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to create checkout session.');
      }
    } catch (err) {
      console.error('[Paywall] Checkout error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsRedirecting(false);
    }
  }, [isRedirecting]);

  const onPurchaseComplete = async (productId: string, plan: 'monthly' | 'annual') => {
    if (isNative) {
      await handleIAPPurchase(productId, plan);
    } else {
      await handleWebPurchase(productId, plan);
    }
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
    <OverlayPortal>
      {open && !showCelebration && (
        <div className="fixed inset-0 z-[200] bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-full overflow-y-auto">
            <Component
              program={programData}
              onPurchase={onPurchaseComplete}
              onRestore={onRestoreComplete}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </div>
      )}

      <PurchaseCelebration
        open={showCelebration}
        onClose={handleDismissCelebration}
        plan={purchasedPlan}
      />
    </OverlayPortal>
  );
}
