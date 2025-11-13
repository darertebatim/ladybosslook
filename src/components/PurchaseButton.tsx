import { Button } from '@/components/ui/button';
import { isIOSApp } from '@/lib/platform';
import { useIAP } from '@/hooks/useIAP';
import { getStripePaymentLink } from '@/lib/stripeLinks';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const { purchase, purchasing } = useIAP(iosProductId ? [iosProductId] : []);

  const handlePurchase = async () => {
    if (isNative && iosProductId) {
      // iOS In-App Purchase
      const result = await purchase(iosProductId, programSlug);
      if (result.success) {
        // Redirect to success page or refresh enrollment
        window.location.href = '/app/courses';
      }
    } else {
      // Web Stripe Checkout - Direct to Stripe
      const stripeLink = getStripePaymentLink(programSlug);
      
      if (!stripeLink) {
        toast.error('Payment link not available for this program');
        return;
      }
      
      window.location.href = stripeLink;
    }
  };

  if (isNative && !iosProductId) {
    return null; // Hide button if no iOS product ID on mobile
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
