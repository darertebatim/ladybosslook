import { Button } from '@/components/ui/button';
import { isIOSApp, isRealDevice } from '@/lib/platform';
import { useIAP } from '@/hooks/useIAP';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

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
  const [isReal, setIsReal] = useState(false);
  const [checkingDevice, setCheckingDevice] = useState(true);
  
  // Check if running on real device (not simulator)
  useEffect(() => {
    const checkDevice = async () => {
      const realDevice = await isRealDevice();
      setIsReal(realDevice);
      setCheckingDevice(false);
    };
    if (isNative) {
      checkDevice();
    } else {
      setCheckingDevice(false);
    }
  }, [isNative]);
  
  // Only use IAP on real iOS devices
  const shouldUseIAP = isNative && isReal && iosProductId;
  const { purchase, purchasing, products } = useIAP(shouldUseIAP ? [iosProductId!] : []);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (shouldUseIAP) {
      // iOS In-App Purchase on real device
      const result = await purchase(iosProductId!, programSlug);
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

  // On iOS simulator or when no product ID, show disabled button
  if (checkingDevice) {
    return (
      <Button
        disabled
        className={className}
        size="lg"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isNative && !isReal) {
    return (
      <Button
        disabled
        className={className}
        size="lg"
      >
        Simulator - Use Real Device
      </Button>
    );
  }

  if (isNative && !iosProductId) {
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
