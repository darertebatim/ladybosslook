import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CCPayDirect = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            program: 'courageous-character'
          }
        });

        if (error) {
          console.error('Payment creation error:', error);
          setError('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
          return;
        }

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
      }
    };

    initiatePayment();
  }, []);

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div className="text-white">
            <p className="text-xl mb-4">{error}</p>
            <a href="/cc" className="text-luxury-accent hover:underline">
              بازگشت به صفحه ورکشاپ
            </a>
          </div>
        ) : (
          <div className="text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-luxury-accent" />
            <p className="text-xl">در حال انتقال به صفحه پرداخت...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CCPayDirect;
