import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ProgramPayDirect = () => {
  const { slugpay } = useParams<{ slugpay: string }>();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const initiatePayment = async () => {
      if (!slugpay) {
        setError('Invalid payment link');
        return;
      }

      // Extract slug by removing 'pay' suffix
      if (!slugpay.endsWith('pay')) {
        setError('Invalid payment link format');
        return;
      }

      const slug = slugpay.slice(0, -3); // Remove 'pay' from end
      
      try {
        setRedirecting(true);
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            program: slug
          }
        });

        if (error) {
          console.error('Payment creation error:', error);
          setError('Error creating payment. Please try again.');
          setRedirecting(false);
          return;
        }

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError('Error creating payment. Please try again.');
          setRedirecting(false);
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError('Error creating payment. Please try again.');
        setRedirecting(false);
      }
    };

    initiatePayment();
  }, [slugpay]);

  if (error) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-xl font-semibold">Redirecting to secure checkout...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
      </div>
    </div>
  );
};

export default ProgramPayDirect;
