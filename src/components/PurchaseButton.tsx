import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface PurchaseButtonProps {
  programSlug: string;
  price: number;
  buttonText?: string;
  className?: string;
}

export const PurchaseButton = ({
  programSlug,
  price,
  buttonText = 'Purchase Now',
  className,
}: PurchaseButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
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
  };

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className={className}
      size="lg"
    >
      {loading ? (
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
