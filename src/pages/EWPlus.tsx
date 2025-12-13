import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, MessageCircle, Sparkles, Calendar, Users } from "lucide-react";

const EWPlus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { program: 'ewplus' }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('خطا در اتصال به درگاه پرداخت');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegram = () => {
    window.open('https://t.me/ladybosslook', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 font-[Vazirmatn]" dir="rtl">
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

        {/* Pricing Card */}
        <Card className="p-6 mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">۹ ماه عضویت</span>
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
              مجموع: $۱,۷۹۱ برای ۹ ماه (صرفه‌جویی $۹۰۰)
            </p>

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              size="lg"
              className="w-full py-6 text-lg font-bold"
            >
              {isLoading ? (
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
