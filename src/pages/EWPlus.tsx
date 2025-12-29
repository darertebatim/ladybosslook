import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, MessageCircle, Sparkles, Calendar, Users, Gift } from "lucide-react";

const EWPlus = () => {
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const isSubmittingRef = useRef(false);

  // Prevent accidental navigation during payment processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleMonthlyPayment = async () => {
    // Immediate lock to prevent double-clicks
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoadingMonthly(true);
    
    try {
      const idempotencyKey = `ewplus-monthly-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          program: 'ewpluscoaching',
          idempotencyKey 
        }
      });

      if (error) throw error;
      
      if (data?.error === 'duplicate_detected') {
        toast.error('شما یک پرداخت در حال انتظار دارید. لطفاً چند دقیقه صبر کنید.');
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
        // Keep the loading state since we're navigating away
        return;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('خطا در اتصال به درگاه پرداخت');
      isSubmittingRef.current = false;
      setIsLoadingMonthly(false);
    }
  };

  const handleFullPayment = async () => {
    // Immediate lock to prevent double-clicks
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoadingFull(true);
    
    try {
      const idempotencyKey = `ewplus-full-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          program: 'ewpluscoaching', 
          paymentOption: 'full',
          idempotencyKey 
        }
      });

      if (error) throw error;
      
      if (data?.error === 'duplicate_detected') {
        toast.error('شما یک پرداخت در حال انتظار دارید. لطفاً چند دقیقه صبر کنید.');
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
        // Keep the loading state since we're navigating away
        return;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('خطا در اتصال به درگاه پرداخت');
      isSubmittingRef.current = false;
      setIsLoadingFull(false);
    }
  };

  const handleTelegram = () => {
    window.open('https://t.me/ladybosslook', '_blank');
  };

  const isProcessing = isLoadingMonthly || isLoadingFull;

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

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            ویژه فارغ‌التحصیلان EWC
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            EWPLUS Coaching
          </h1>
          <p className="text-lg text-muted-foreground">
            ۹ ماه کوچینگ پیشرفته برای رشد مستمر
          </p>
        </div>

        {/* Benefits */}
        <Card className="p-6 mb-8 bg-card/50 backdrop-blur border-border/50">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            مزایای عضویت
          </h2>
          <ul className="space-y-3">
            {[
              "جلسات گروهی هفتگی با رازیه",
              "پشتیبانی اختصاصی در تلگرام",
              "دسترسی به محتوای آموزشی جدید",
              "شبکه‌سازی با سایر فارغ‌التحصیلان",
              "تخفیف ویژه برای دوره‌های آینده"
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-foreground">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Monthly Payment Card (Primary) */}
        <Card className="p-6 mb-4 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground font-medium">پرداخت ماهانه</span>
            </div>
            
            {/* Savings highlight */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              $۱۰۰ تخفیف ماهانه ویژه فارغ‌التحصیلان EWC
            </div>

            {/* Price comparison */}
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-2xl text-muted-foreground line-through">$299</span>
              <span className="text-4xl font-bold text-primary">$199</span>
              <span className="text-muted-foreground">/ماه</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              ۹ ماه × $۱۹۹ = مجموع $۱,۷۹۱
            </p>

            <Button
              onClick={handleMonthlyPayment}
              disabled={isProcessing}
              size="lg"
              className="w-full py-6 text-lg font-bold"
              style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
            >
              {isLoadingMonthly ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  در حال اتصال...
                </>
              ) : (
                "شروع عضویت ماهانه"
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground mt-3">
              اشتراک پس از ۹ ماه به‌صورت خودکار متوقف می‌شود
            </p>
          </div>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-muted-foreground text-sm font-medium">یا</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* One-Time Full Payment Card (Secondary) */}
        <Card className="p-6 mb-8 border border-border/50 bg-card/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-orange-500" />
              <span className="text-muted-foreground font-medium">پرداخت یکجا</span>
            </div>
            
            {/* Free months highlight */}
            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              🎁 ۳ ماه رایگان!
            </div>

            {/* Price comparison */}
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-xl text-muted-foreground line-through">$1,791</span>
              <span className="text-3xl font-bold text-orange-600">$1,194</span>
            </div>
            
            <p className="text-sm text-green-600 font-medium mb-6">
              صرفه‌جویی $۵۹۷
            </p>

            <Button
              onClick={handleFullPayment}
              disabled={isProcessing}
              variant="outline"
              size="lg"
              className="w-full py-6 text-lg font-bold border-orange-500/30 hover:bg-orange-500/10"
              style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
            >
              {isLoadingFull ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  در حال اتصال...
                </>
              ) : (
                "پرداخت یکجا"
              )}
            </Button>
          </div>
        </Card>

        {/* Telegram Support */}
        <div className="text-center">
          <p className="text-muted-foreground mb-3">سوالی دارید؟</p>
          <Button
            variant="outline"
            onClick={handleTelegram}
            className="font-[Vazirmatn]"
          >
            <MessageCircle className="ml-2 h-5 w-5" />
            پشتیبانی تلگرام
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EWPlus;
