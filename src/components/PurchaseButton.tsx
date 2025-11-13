import { Button } from '@/components/ui/button';
import { isIOSApp } from '@/lib/platform';
import { useIAP } from '@/hooks/useIAP';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface PurchaseButtonProps {
  programSlug: string;
  iosProductId?: string;
  price: number;
  buttonText?: string;
  className?: string;
}

export const PurchaseButton = ({
  programSlug,
  iosProductId,
  price,
  buttonText = 'Purchase Now',
  className,
}: PurchaseButtonProps) => {
  const isNative = isIOSApp();
  const { purchase, purchasing, products } = useIAP(iosProductId ? [iosProductId] : []);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (isNative && iosProductId) {
      // iOS In-App Purchase
      const result = await purchase(iosProductId, programSlug);
      if (result.success) {
        toast.success('Purchase successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/app/courses';
        }, 1000);
      } else {
        toast.error('Purchase failed. Please contact support.');
      }
    } else {
      // Web Stripe Checkout - Create dynamic checkout session
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: { program: programSlug }
        });

        if (error) {
          console.error('Payment creation error:', error);
          toast.error('Failed to create payment session. Please try again.');
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
        } else {
          toast.error('Failed to create payment session. Please try again.');
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Failed to create payment session. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // On iOS native, hide button if no product ID or products couldn't load
  if (isNative && (!iosProductId || (products.length === 0 && !purchasing && !loading))) {
    return (
      <Button
        disabled
        className={className}
        size="lg"
      >
        Not Available
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePurchase}
      disabled={purchasing || loading}
      className={className}
      size="lg"
    >
      {(purchasing || loading) ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {buttonText} ${price}
        </>
      )}
    </Button>
  );
};
