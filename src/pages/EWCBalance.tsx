import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, CreditCard, Calendar, Sparkles, MessageCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EWCBalance = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoadingOneTime, setIsLoadingOneTime] = useState(false);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("لطفاً ایمیل خود را وارد کنید");
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError("لطفاً یک ایمیل معتبر وارد کنید");
      return false;
    }
    setEmailError("");
    return true;
  };

  const checkDuplicatePayment = async (trimmedEmail: string): Promise<boolean> => {
    try {
      // Check for recent orders for this email and program
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, status')
        .eq('email', trimmedEmail)
        .eq('program_slug', 'empowered-woman-coaching')
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

  const handlePayment = async (url: string, type: 'onetime' | 'monthly') => {
    if (!validateEmail(email)) return;
    
    // Immediate lock to prevent double-clicks
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    if (type === 'onetime') {
      setIsLoadingOneTime(true);
    } else {
      setIsLoadingMonthly(true);
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check for duplicate payment
    const isDuplicate = await checkDuplicatePayment(trimmedEmail);
    if (isDuplicate) {
      isSubmittingRef.current = false;
      setIsLoadingOneTime(false);
      setIsLoadingMonthly(false);
      return;
    }
    
    // Add email as query param for Stripe prefill
    const separator = url.includes('?') ? '&' : '?';
    const urlWithEmail = `${url}${separator}prefilled_email=${encodeURIComponent(trimmedEmail)}`;
    
    // Navigate to payment
    window.location.href = urlWithEmail;
  };

  const isProcessing = isLoadingOneTime || isLoadingMonthly;

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

        {/* Email Input */}
        <Card className="p-6 mb-6 border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-primary" />
            <label className="font-medium text-foreground">ایمیل شما</label>
          </div>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            className="text-left ltr"
            dir="ltr"
          />
          {emailError && (
            <p className="text-sm text-destructive mt-2">{emailError}</p>
          )}
        </Card>

        {/* Payment Options */}
        <div className="space-y-4">
          {/* One-time Payment - Highlighted */}
          <Card className="p-6 border-2 border-primary bg-primary/5 relative overflow-hidden">
            <div className="absolute top-3 left-3">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                پیشنهاد ویژه
              </span>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">
                  پرداخت یکجا
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  با پرداخت یکجا، ۱۵۰ دلار صرفه‌جویی کنید!
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-primary">$747</span>
                  <span className="text-lg text-muted-foreground line-through">$897</span>
                  <span className="text-sm text-green-600 font-medium">صرفه‌جویی $150</span>
                </div>
                <Button 
                  onClick={() => handlePayment('https://buy.stripe.com/14AdR84Zz5XcaVhgS59Ve06', 'onetime')}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg"
                  style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
                >
                  {isLoadingOneTime ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      در حال اتصال...
                    </>
                  ) : (
                    <>
                      <CreditCard className="ml-2 h-5 w-5" />
                      پرداخت $747
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Monthly Payment */}
          <Card className="p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">
                  پرداخت ماهیانه
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  ۳ پرداخت ماهانه
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-foreground">$299</span>
                  <span className="text-muted-foreground">× ۳ ماه</span>
                  <span className="text-sm text-muted-foreground">(مجموع: $897)</span>
                </div>
                <Button 
                  onClick={() => handlePayment('https://buy.stripe.com/28EbJ03Vv2L0fbx0T79Ve05', 'monthly')}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full py-6 text-lg font-medium font-[Vazirmatn]"
                  style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
                >
                  {isLoadingMonthly ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      در حال اتصال...
                    </>
                  ) : (
                    <>
                      <Calendar className="ml-2 h-5 w-5" />
                      پرداخت ماهیانه
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            سوالی دارید؟ با پشتیبانی تماس بگیرید
          </p>
          <a
            href="https://t.me/ladybosslook"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            @ladybosslook
          </a>
        </div>
      </div>
    </div>
  );
};

export default EWCBalance;
