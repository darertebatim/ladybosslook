import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Calendar, Sparkles, MessageCircle, Loader2, Check } from "lucide-react";
import { supabase, browserTimezone } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";

type Plan = 'onetime' | 'monthly';

const EWCBalance = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Plan>('onetime');
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const checkDuplicatePayment = async (trimmedEmail: string): Promise<boolean> => {
    try {
      // Recent balance orders only — a $50 deposit must never block the balance payment
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, status')
        .eq('email', trimmedEmail)
        .eq('program_slug', 'empowered-woman-coaching')
        .neq('amount', 5000)
        .gte('created_at', tenMinutesAgo)
        .in('status', ['pending', 'paid']);

      if (recentOrders && recentOrders.length > 0) {
        toast.error('شما یک پرداخت در حال انتظار دارید. لطفاً چند دقیقه صبر کنید.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const handlePayment = async () => {
    // Immediate lock to prevent double-clicks
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    const type = selected;

    // Signed-in buyers: forward their email so Stripe pre-fills it. Guests type it once on Stripe.
    const trimmedEmail = (user?.email || '').trim().toLowerCase();

    if (trimmedEmail && await checkDuplicatePayment(trimmedEmail)) {
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    try {
      // Go through our checkout so the payment is linked to the account and program
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          timezone: browserTimezone,
          program: 'empowered-woman-coaching',
          ...(trimmedEmail ? { email: trimmedEmail } : {}),
          paymentOption: type === 'onetime' ? 'balance_full' : 'balance_monthly',
          idempotencyKey: `ewcbalance-${type}-${trimmedEmail || 'guest'}-${Math.floor(Date.now() / (5 * 60 * 1000))}`,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error === 'duplicate_detected'
          ? 'شما یک پرداخت در حال انتظار دارید. لطفاً چند دقیقه صبر کنید.'
          : data.error);
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید.');
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const isProcessing = isLoading;
  const ctaLabel = selected === 'onetime' ? 'پرداخت یکجا $747' : 'پرداخت ماهیانه $299';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 font-[Vazirmatn]" dir="rtl">
      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">در حال اتصال به درگاه پرداخت...</p>
            <p className="text-sm text-muted-foreground mt-2">لطفاً صفحه را نبندید</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            تبریک! شما در مصاحبه قبول شدید 🎉
          </h1>
          <p className="text-muted-foreground text-lg">
            برای شروع دوره، مبلغ باقیمانده را پرداخت کنید
          </p>
        </div>

        {/* Step label */}
        <p className="text-sm font-bold text-foreground mb-3">
          ۱. روش پرداخت را انتخاب کنید
        </p>

        {/* Payment Options */}
        <div className="space-y-3" role="radiogroup" aria-label="روش پرداخت">
          {/* One-time Payment - Highlighted */}
          <button
            type="button"
            role="radio"
            aria-checked={selected === 'onetime'}
            onClick={() => setSelected('onetime')}
            disabled={isProcessing}
            className={`relative w-full text-right overflow-hidden rounded-2xl border-2 bg-card p-5 transition-all duration-200 active:scale-[0.99] touch-manipulation ${
              selected === 'onetime'
                ? 'border-primary bg-primary/5 shadow-ios'
                : 'border-border'
            }`}
          >
            <div className="absolute top-3 left-3">
              <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full">
                پیشنهاد ویژه
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === 'onetime' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                }`}
                aria-hidden="true"
              >
                {selected === 'onetime' && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>

              <div className="flex-shrink-0 w-11 h-11 bg-primary/15 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground mb-0.5">
                  پرداخت یکجا
                </h3>
                <p className="text-muted-foreground text-[13px] mb-2">
                  با پرداخت یکجا، ۱۵۰ دلار صرفه‌جویی کنید!
                </p>
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-2xl font-bold text-primary">$747</span>
                  <span className="text-base text-muted-foreground line-through">$897</span>
                  <span className="text-xs font-medium text-green-600">صرفه‌جویی $150</span>
                </div>
              </div>
            </div>
          </button>

          {/* Monthly Payment */}
          <button
            type="button"
            role="radio"
            aria-checked={selected === 'monthly'}
            onClick={() => setSelected('monthly')}
            disabled={isProcessing}
            className={`relative w-full text-right overflow-hidden rounded-2xl border-2 bg-card p-5 transition-all duration-200 active:scale-[0.99] touch-manipulation ${
              selected === 'monthly'
                ? 'border-primary bg-primary/5 shadow-ios'
                : 'border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === 'monthly' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                }`}
                aria-hidden="true"
              >
                {selected === 'monthly' && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>

              <div className="flex-shrink-0 w-11 h-11 bg-secondary rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground mb-0.5">
                  پرداخت ماهیانه
                </h3>
                <p className="text-muted-foreground text-[13px] mb-2">
                  ۳ پرداخت ماهانه
                </p>
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-2xl font-bold text-foreground">$299</span>
                  <span className="text-base text-muted-foreground">× ۳ ماه</span>
                  <span className="text-xs text-muted-foreground">(مجموع: $897)</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Step 2: single pay button */}
        <p className="text-sm font-bold text-foreground mt-6 mb-3">
          ۲. پرداخت را انجام دهید
        </p>
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg rounded-2xl shadow-ios touch-manipulation"
          style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              در حال اتصال...
            </>
          ) : (
            <>
              <CreditCard className="ml-2 h-5 w-5" />
              {ctaLabel}
            </>
          )}
        </Button>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            سوالی دارید؟ با پشتیبانی تماس بگیرید
          </p>
          <a
            href="https://ladybosslook.com/dashboard/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            چت پشتیبانی
          </a>
        </div>
      </div>
    </div>
  );
};

export default EWCBalance;
