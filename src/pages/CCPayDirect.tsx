import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CCPayDirect = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        // Call the create-payment edge function
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            program: 'courageous-character'
          }
        });

        if (error) {
          console.error('Payment creation error:', error);
          setError('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
          setIsProcessing(false);
          return;
        }

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
        setIsProcessing(false);
      }
    };

    initiatePayment();
  }, []);

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center font-farsi rtl">
      <div className="text-center p-8">
        {isProcessing ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-luxury-accent mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">در حال انتقال به صفحه پرداخت...</h1>
            <p className="text-luxury-silver">لطفاً صبر کنید</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">خطا</h1>
            <p className="text-luxury-silver mb-4">{error}</p>
            <a href="/cc" className="text-luxury-accent hover:underline">
              بازگشت به صفحه ورکشاپ
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default CCPayDirect;
