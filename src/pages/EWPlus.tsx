import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase, browserTimezone } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Loader2, Check, MessageCircle, Sparkles, Calendar, Users, Gift, Mail } from "lucide-react";

const EWPlus = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'monthly' | 'full'>('monthly');
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

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue.trim()) {
      setEmailError("لطفاً ایمیل خود را وارد کنید");
      return false;
    }
    if (!emailRegex.test(emailValue.trim())) {
      setEmailError("لطفاً یک ایمیل معتبر وارد کنید");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handlePaymentClick = (type: 'monthly' | 'full') => {
    setSelectedPaymentType(type);
    setEmailError("");
    setShowEmailModal(true);
  };

  const handleModalSubmit = async () => {
    if (!validateEmail(email)) return;
    
    // Immediate lock to prevent double-clicks
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    if (selectedPaymentType === 'monthly') {
      setIsLoadingMonthly(true);
    } else {
      setIsLoadingFull(true);
    }
    
    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Save lead BEFORE payment - enables abandoned cart follow-up
      const { error: leadError } = await supabase
        .from('form_submissions')
        .insert({
          name: '',
          email: trimmedEmail,
          phone: '',
          city: '',
          source: 'ewplus_registration'
        });
      
      if (leadError) {
        console.error('Lead capture error:', leadError);
        // Don't block payment - just log the error
      }
      
      // Include timestamp rounded to 5-minute window for idempotency (prevents double-clicks but allows retries after failures)
      const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000));
      const idempotencyKey = `ewplus-${selectedPaymentType}-${trimmedEmail}-${timeWindow}`;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          timezone: browserTimezone,
          program: 'ewpluscoaching',
          email: trimmedEmail,
          ...(selectedPaymentType === 'full' && { paymentOption: 'full' }),
          idempotencyKey 
        }
      });

      if (error) throw error;
      
      if (data?.error === 'duplicate_detected') {
        toast.error('شما یک پرداخت در حال انتظار دارید. لطفاً چند دقیقه صبر کنید.');
        isSubmittingRef.current = false;
        setIsLoadingMonthly(false);
        setIsLoadingFull(false);
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('خطا در اتصال به درگاه پرداخت');
      isSubmittingRef.current = false;
      setIsLoadingMonthly(false);
      setIsLoadingFull(false);
    }
  };

  const handleSupport = () => {
    window.open('https://ladybosslook.com/dashboard/chat', '_blank');
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

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium mb-2">
            <Sparkles className="h-3 w-3" />
            ویژه فارغ‌التحصیلان EWC
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            EWPLUS Coaching
          </h1>
          <p className="text-sm text-muted-foreground">
            ۹ ماه کوچینگ پیشرفته برای رشد مستمر
          </p>
        </div>

        {/* Payment Cards - Side by side on desktop */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Monthly Payment Card (Primary) */}
          <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm font-medium">پرداخت ماهانه</span>
              </div>
              
              {/* Savings highlight */}
              <div className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-medium mb-3">
                $۱۰۰ تخفیف ماهانه
              </div>

              {/* Price comparison */}
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-lg text-muted-foreground line-through">$299</span>
                <span className="text-3xl font-bold text-primary">$199</span>
                <span className="text-muted-foreground text-sm">/ماه</span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4">
                ۹ ماه × $۱۹۹ = $۱,۷۹۱
              </p>

              <Button
                onClick={() => handlePaymentClick('monthly')}
                disabled={isProcessing}
                size="lg"
                className="w-full py-5 text-base font-bold"
                style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
              >
                شروع عضویت ماهانه
              </Button>
              
              <p className="text-[10px] text-muted-foreground mt-2">
                پس از ۹ ماه خودکار متوقف می‌شود
              </p>
            </div>
          </Card>

          {/* One-Time Full Payment Card */}
          <Card className="p-4 border border-border/50 bg-card/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground text-sm font-medium">پرداخت یکجا</span>
              </div>
              
              {/* Free months highlight */}
              <div className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-xs font-medium mb-3">
                🎁 ۳ ماه رایگان!
              </div>

              {/* Price comparison */}
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-lg text-muted-foreground line-through">$1,791</span>
                <span className="text-3xl font-bold text-orange-600">$1,194</span>
              </div>
              
              <p className="text-xs text-green-600 font-medium mb-4">
                صرفه‌جویی $۵۹۷
              </p>

              <Button
                onClick={() => handlePaymentClick('full')}
                disabled={isProcessing}
                variant="outline"
                size="lg"
                className="w-full py-5 text-base font-bold border-orange-500/30 hover:bg-orange-500/10"
                style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
              >
                پرداخت یکجا
              </Button>
            </div>
          </Card>
        </div>

        {/* Benefits - Compact */}
        <Card className="p-4 mb-4 bg-card/50 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground text-sm">مزایای عضویت</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              "جلسات گروهی هفتگی",
              "پشتیبانی تلگرام",
              "محتوای آموزشی جدید",
              "شبکه‌سازی با دیگران"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-1.5 text-foreground">
                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Support */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSupport}
            className="font-[Vazirmatn] text-muted-foreground"
          >
            <MessageCircle className="ml-2 h-4 w-4" />
            سوالی دارید؟ چت پشتیبانی
          </Button>
        </div>
      </div>

      {/* Email Collection Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="font-[Vazirmatn] max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                ایمیل خود را وارد کنید
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className="text-left ltr text-lg py-6"
              dir="ltr"
              disabled={isProcessing}
            />
            {emailError && (
              <p className="text-sm text-destructive text-center">{emailError}</p>
            )}
            
            <Button
              onClick={handleModalSubmit}
              disabled={isProcessing}
              size="lg"
              className="w-full py-6 text-lg font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  در حال اتصال...
                </>
              ) : (
                "ادامه به پرداخت"
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              {selectedPaymentType === 'monthly' 
                ? 'پرداخت ماهانه $۱۹۹' 
                : 'پرداخت یکجا $۱,۱۹۴'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EWPlus;
