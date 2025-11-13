import { Button } from '@/components/ui/button';
import { isIOSApp } from '@/lib/platform';
import { useIAP } from '@/hooks/useIAP';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseButtonProps {
  programSlug: string;
  iosProductId?: string;
  stripePaymentLink?: string;
  price: number;
  buttonText?: string;
  className?: string;
}

export const PurchaseButton = ({
  programSlug,
  iosProductId,
  stripePaymentLink,
  price,
  buttonText = 'Purchase Now',
  className,
}: PurchaseButtonProps) => {
  const isNative = isIOSApp();
  const { purchase, purchasing } = useIAP(iosProductId ? [iosProductId] : []);

  const handlePurchase = async () => {
    if (isNative && iosProductId) {
      // iOS In-App Purchase
      const result = await purchase(iosProductId, programSlug);
      if (result.success) {
        window.location.href = '/app/courses';
      }
    } else {
      // Web Stripe Checkout - Direct to Stripe
      if (!stripePaymentLink) {
        toast.error('Payment link not configured for this program. Please contact support.');
        return;
      }
      
      // Add success and cancel URLs
      const successUrl = encodeURIComponent(`${window.location.origin}/payment-success`);
      const cancelUrl = encodeURIComponent(`${window.location.origin}/app/store`);
      const fullLink = `${stripePaymentLink}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
      
      window.location.href = fullLink;
    }
  };

  if (isNative && !iosProductId) {
    return null;
  }

  return (
    <Button
      onClick={handlePurchase}
      disabled={purchasing}
      className={className}
      size="lg"
    >
      {purchasing ? (
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
