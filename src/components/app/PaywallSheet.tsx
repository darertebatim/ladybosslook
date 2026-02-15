import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultPaywall, PaywallVariantId } from '@/hooks/useDefaultPaywall';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallComparison, PaywallLimitedOffer, type PaywallProgramData } from '@/components/app/paywalls';

const VARIANT_MAP: Record<PaywallVariantId, React.ComponentType<any>> = {
  classic: PaywallClassic,
  gradient: PaywallGradient,
  minimal: PaywallMinimal,
  bold: PaywallBold,
  comparison: PaywallComparison,
  'limited-offer': PaywallLimitedOffer,
};

const SIMORA_PLUS_SLUG = 'simora-plus';

interface PaywallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase?: (productId: string, plan: 'monthly' | 'annual') => void;
  onRestore?: () => void;
}

export function PaywallSheet({ open, onOpenChange, onPurchase, onRestore }: PaywallSheetProps) {
  const { variant } = useDefaultPaywall();

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

  const Component = VARIANT_MAP[variant] || PaywallClassic;

  if (!programData) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0" hideCloseButton>
        <div className="h-full overflow-y-auto">
          <Component
            program={programData}
            onPurchase={onPurchase}
            onRestore={onRestore}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
