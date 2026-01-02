import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, CheckCircle2, Clock, Users, Star, Sparkles, Brain, MessageCircle, Globe, Mic, Zap } from "lucide-react";
import SpotCounter from "@/components/SpotCounter";

import RecentRegistrations from "@/components/RecentRegistrations";
import { SEOHead } from "@/components/SEOHead";
import { simpleSubscriptionSchema } from '@/lib/validation';
import { z } from 'zod';

const Five = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'paid_class',
        content_name: 'Bilingual Power Class',
        content_category: 'online_class',
        value: 100,
        currency: 'USD'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors({});
    try {
      simpleSubscriptionSchema.parse({ name, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "خطا",
          description: "لطفا فرم را با دقت کامل کنید",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create payment session - Mailchimp will be called after successful payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          program: 'Five-Language',
          email: email.trim().toLowerCase(),
          name: name.trim()
        }
      });

      if (paymentError) throw paymentError;

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'BilingualClassRegistration', {
          content_name: 'Bilingual Power Class',
          value: 1,
          currency: 'USD'
        });
      }

      if (paymentData?.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد، لطفا دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules = [
    { icon: Brain, title: "خلاء قدرت اول", desc: "مدیریت افکار" },
    { icon: MessageCircle, title: "خلاء قدرت دوم", desc: "نگرش" },
    { icon: Globe, title: "خلاء قدرت سوم", desc: "ارتباطات" },
    { icon: Mic, title: "خلاء قدرت چهارم", desc: "لایف استایل" },
    { icon: Zap, title: "خلاء قدرت پنجم", desc: "زبان پول" }
  ];

  return (
    <>
      <style>{`
        .one-page-green {
          --secondary: 142 76% 45%;
          --secondary-light: 142 70% 55%;
          --secondary-dark: 142 80% 35%;
          --cta-primary: 142 76% 45%;
          --cta-primary-hover: 142 70% 55%;
          --success: 142 76% 45%;
        }
      `}</style>
      <SEOHead 
        title="کلاس قدرت دو زبانه - کلاس آنلاین $1 | LadyBoss Academy"
        description="یاد بگیرید چطور در هر زبانی با قدرت حرف بزنید. کلاس ویژه زنان ایرانی مهاجر - فقط $1"
      />
      <RecentRegistrations />
      
      <div className="one-page-green min-h-screen bg-white font-farsi">
        {/* Compact Hero Section */}
        <div className="relative overflow-hidden pb-8">
          {/* Animated Green Glow */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/60 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="container mx-auto px-4 pt-3 relative z-10">
            {/* Ultra-Compact Urgency Banner */}
            <div className="bg-gradient-to-r from-[#FF6B6B]/20 via-[#FF6B6B]/30 to-[#FF6B6B]/20 border border-[#FF6B6B] rounded-lg p-3 mb-3 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                {/* First Row: PST Time */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-gray-900 font-bold text-sm" dir="ltr">
                    Jan 12 • 10:30 AM PST
                  </span>
                </div>
                {/* Second Row: Local Time */}
                <div className="text-xs text-gray-700" dir="ltr">
                  Your time: {new Date('2026-01-12T10:30:00-08:00').toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
            </div>

            {/* Hero Content - Optimized Hierarchy */}
            <div className="max-w-4xl mx-auto text-center">
              {/* Pre-headline */}
              <div className="inline-block bg-secondary/20 border border-secondary rounded-full px-3 py-1 mb-2">
                <span className="text-secondary font-bold text-xs md:text-sm">💎 چالش ۱۰ روزه ۵ زبان قدرت</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1.5 leading-tight whitespace-nowrap">
                Five languages of Empowered woman
              </h1>

              {/* Persian Question Above Video */}
              <p className="text-lg md:text-xl font-bold text-gray-800 mb-3" dir="rtl">
                در چالش ۱۰ روزه زن قوی چه خبره؟
              </p>

              {/* Video */}
              <div className="mb-4 max-w-sm mx-auto">
                <video 
                  src="/videos/five-promo.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-lg shadow-lg"
                  poster="/videos/five-promo-poster.jpg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Value Prop - One Line */}
              <p className="text-xs md:text-sm text-gray-600 mb-4 max-w-2xl mx-auto">
                شامل <span className="text-secondary font-semibold">۵ فایل آموزشی (۵ خلاء قدرت زنان)</span> و 
                <span className="text-secondary font-semibold"> ۵ فایل میکرواکت</span>
              </p>

              {/* Compact Price Box - Side by Side */}
              <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur-md border-2 border-secondary rounded-xl p-3 md:p-4 mb-3 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-4 mb-1.5">
                  <span className="text-4xl md:text-5xl font-bold text-secondary">$1</span>
                  <div className="text-right">
                    <div className="text-gray-500 line-through text-base md:text-lg">$100</div>
                    <div className="bg-[#FF6B6B] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                      ۹۹٪ تخفیف
                    </div>
                  </div>
                </div>
                <p className="text-[#FF6B6B] font-bold text-xs">
                  ⚠️ فقط ۱۰۰۰ نفر اول
                </p>
              </div>

              {/* Primary CTA */}
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 text-base md:text-lg font-bold bg-gradient-to-r from-secondary to-secondary-light hover:brightness-110 text-white rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transform hover:scale-105 transition-all duration-300 mb-2.5 animate-[pulse_3s_ease-in-out_infinite]"
              >
                🚀 ثبت نام فوری با $1
              </Button>

              {/* Trust Indicators - Inline */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-gray-600 text-[10px]">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-secondary" />
                  <span>پرداخت امن</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-secondary" />
                  <span>264K+ زن</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-secondary fill-secondary" />
                  <span>4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Compact 5 Modules - Tight Grid Layout */}
        <div className="py-6 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-4" dir="rtl">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">
                  🌿 ۵ خلاء قدرت زنان
                </h2>
                <p className="text-gray-600 text-xs">
                  ۵ فایل آموزشی + ۵ فایل میکرواکت
                </p>
              </div>

              {/* Ultra-Compact 2x3 Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {modules.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-gray-50 border border-secondary/20 rounded-lg p-2.5 hover:border-secondary transition-all group text-right shadow-sm"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="bg-secondary rounded p-1.5 group-hover:scale-110 transition-transform flex-shrink-0">
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-secondary mb-0.5 leading-tight">
                            {module.title}
                          </h3>
                          <p className="text-gray-600 text-[10px] leading-snug">
                            {module.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* CTA Card in 6th Grid Spot */}
                <div className="bg-gradient-to-br from-secondary/25 to-secondary/15 border border-secondary rounded-lg p-2.5 flex flex-col items-center justify-center text-center hover:scale-105 transition-all cursor-pointer"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  <Sparkles className="w-6 h-6 text-secondary mb-1 animate-pulse" />
                  <p className="text-secondary font-bold text-xs mb-0.5">
                    همین الان
                  </p>
                  <p className="text-gray-700 text-[10px]">
                    فقط $1
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Section - Moved to Bottom */}
        <div className="bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-center">
                آیا این خلاءها را احساس می‌کنی؟
              </h2>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  "😔 افکار منفی رهایت نمی‌کنند",
                  "😰 نگرش محدودکننده داری",
                  "🤐 ارتباطاتت ضعیف است",
                  "😞 سبک زندگی‌ات را دوست نداری"
                ].map((problem, index) => (
                  <div 
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-2.5 text-gray-700 text-xs text-right shadow-sm"
                  >
                    {problem}
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-secondary/20 via-secondary/25 to-secondary/20 border border-secondary rounded-lg p-4 text-center">
                <p className="text-lg md:text-xl font-bold text-secondary mb-1.5">
                  ✨ خبر خوب: قابل تغییر است!
                </p>
                <p className="text-gray-700 text-xs md:text-sm mb-3">
                  با «چالش ۵ زبان قدرت»، این خلاءها را <span className="text-secondary font-bold">پر کن</span>
                </p>
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-6 py-2.5 text-sm font-bold bg-secondary hover:brightness-110 text-white rounded-lg transform hover:scale-105 transition-all"
                >
                  ✅ می‌خواهم این تغییر را تجربه کنم
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Buy Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="container mx-auto px-4 flex items-center justify-between gap-3 max-w-lg">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-secondary">$1</span>
                <span className="text-gray-400 line-through text-sm">$100</span>
              </div>
              <p className="text-[10px] text-gray-600">فقط ۱۰۰۰ نفر اول</p>
            </div>
            <Button
              onClick={() => setShowRegistrationForm(true)}
              className="flex-1 py-3 text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light hover:brightness-110 text-white rounded-lg shadow-lg animate-pulse"
            >
              🚀 ثبت نام فوری
            </Button>
          </div>
        </div>

        {/* Spacer for sticky button */}
        <div className="h-20"></div>
      </div>

      {/* Enhanced Registration Modal */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-emerald-500 shadow-2xl rounded-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 mb-2 font-farsi">
              💎 ثبت نام چالش ۵ زبان قدرت
            </DialogTitle>
            <DialogDescription className="sr-only">
              Register for the Five language of Empowered woman program
            </DialogDescription>
            <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-emerald-500/15 border border-emerald-500 rounded-lg p-3 mb-2" dir="rtl">
              <p className="text-emerald-600 font-bold text-xl md:text-2xl">
                فقط <span dir="ltr">$1</span>
              </p>
              <p className="text-gray-600 font-farsi text-xs">
                ۱۰۰۰ نفر اول • قیمت اصلی: <span dir="ltr">$100</span>
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-left block text-gray-700 font-medium text-sm">
                Your Name
              </Label>
              <Input
                id="modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="text-left h-11 border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 bg-white rounded-lg"
                dir="ltr"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-left block text-gray-700 font-medium text-sm">
                Your Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="text-left h-11 border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 bg-white rounded-lg"
                dir="ltr"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs">{validationErrors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:brightness-110 text-white font-farsi transition-all duration-300 transform hover:scale-105 shadow-lg rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'در حال ارسال...' : '✅ پرداخت $1'}
            </Button>
          </form>

          <div className="mt-3">
            <div className="flex items-center justify-center gap-4 text-gray-500 text-[10px]">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>امن</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>ضمانت</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Five;
