import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const EWCPayDirect = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            program: 'empowered-woman-coaching'
          }
        });

        if (error) {
          console.error('Payment creation error:', error);
          setError('Error creating payment. Please try again.');
          return;
        }

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError('Error creating payment. Please try again.');
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError('Error creating payment. Please try again.');
      }
    };

    initiatePayment();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <p className="text-xl mb-4 text-destructive">{error}</p>
            <a href="/ewcnow" className="text-primary hover:underline font-semibold">
              Return to program page
            </a>
          </div>
        ) : (
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xl font-semibold">Redirecting to secure checkout...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EWCPayDirect;
