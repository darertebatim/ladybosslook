import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, CheckCircle2, Clock, Users, Star, Sparkles, Brain, MessageCircle, Globe, Heart, Target } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import SpotCounter from "@/components/SpotCounter";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import InstructorBio from "@/components/InstructorBio";
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
        content_name: 'Five Languages of Power',
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
          program: 'five-languages-power',
          email: email.trim().toLowerCase(),
          name: name.trim()
        }
      });

      if (paymentError) throw paymentError;

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'FiveLanguagesRegistration', {
          content_name: 'Five Languages of Power',
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
    { icon: Brain, title: "زبان چشم‌انداز", desc: "بیان آینده‌ای قانع‌کننده که الهام‌بخش و هم‌راستاساز است" },
    { icon: MessageCircle, title: "زبان تأثیر", desc: "ارتباط استراتژیک که افراد را به عمل هدایت می‌کند" },
    { icon: Globe, title: "زبان مرزها", desc: "ارتباط واضح که زمان و انرژی شما را محافظت می‌کند" },
    { icon: Heart, title: "زبان قدردانی", desc: "شناخت اصیل که روابط را تقویت می‌کند" },
    { icon: Target, title: "زبان پاسخگویی", desc: "صحبت با شفافیت در مورد انتظارات و پیامدها" }
  ];

  return (
    <>
      <style>{`
        .five-page-simple {
          --green: 142 76% 36%;
          --green-light: 142 76% 96%;
          --red: 0 84% 60%;
          --red-light: 0 84% 96%;
        }
      `}</style>
      <SEOHead 
        title="Five Languages of Power - $1 کلاس آنلاین | LadyBoss Academy"
        description="تسلط بر 5 زبان قدرت که توسط رهبران تأثیرگذار استفاده می‌شود - فقط $1"
      />
      <RecentRegistrations />
      
      <div className="five-page-simple min-h-screen bg-white font-farsi">
        {/* Hero Section */}
        <div className="py-8">
          <div className="container mx-auto px-4">
            {/* Urgency Banner - Red */}
            <div className="bg-[hsl(var(--red-light))] border-2 border-[hsl(var(--red))] rounded-lg p-4 mb-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                {/* First Row: PST Time */}
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[hsl(var(--red))]" />
                  <span className="text-black font-bold text-base" dir="ltr">
                    Nov 22 • 9:30 AM PST
                  </span>
                </div>
                {/* Second Row: Local Time */}
                <div className="text-sm text-black/70" dir="ltr">
                  Your time: {new Date('2025-11-22T09:30:00-08:00').toLocaleString('en-US', {
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

            {/* Hero Content */}
            <div className="max-w-4xl mx-auto text-center">
              {/* Pre-headline - Green */}
              <div className="inline-block bg-[hsl(var(--green-light))] border-2 border-[hsl(var(--green))] rounded-full px-4 py-2 mb-4">
                <span className="text-[hsl(var(--green))] font-bold text-sm md:text-base">💎 تسلط بر ارتباطات رهبری</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-3 leading-tight">
                Five Languages of Power
              </h1>
              
              {/* Persian Title */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[hsl(var(--green))] mb-6 leading-tight">
                پنج زبان قدرت
              </h2>

              {/* Video */}
              <div className="mb-4 max-w-2xl mx-auto">
                <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                  <iframe 
                    src="https://player.vimeo.com/video/1136585470?badge=0&autopause=0&muted=0&player_id=0&app_id=58479" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    title="Five Languages of Power Class"
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <script src="https://player.vimeo.com/api/player.js"></script>
              </div>

              {/* Value Prop - One Line */}
              <p className="text-xs md:text-sm text-[#94A3B8] mb-4 max-w-2xl mx-auto">
                یاد بگیر <span className="text-secondary font-semibold">مثل رهبران تأثیرگذار</span> ارتباط برقرار کنی و 
                با <span className="text-secondary font-semibold">5 زبان قدرت</span> دیگران را الهام ببخشی
              </p>

              {/* Compact Price Box - Side by Side */}
              <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur-md border-2 border-secondary rounded-xl p-3 md:p-4 mb-3 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-4 mb-1.5">
                  <span className="text-4xl md:text-5xl font-bold text-secondary">$1</span>
                  <div className="text-right">
                    <div className="text-[#94A3B8] line-through text-base md:text-lg">$100</div>
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
                className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 text-base md:text-lg font-bold bg-gradient-to-r from-secondary to-secondary-light hover:brightness-110 text-white rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transform hover:scale-105 transition-all duration-300 mb-2.5 animate-pulse"
              >
                🚀 ثبت نام فوری با $1
              </Button>

              {/* Trust Indicators - Inline */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-[#94A3B8] text-[10px]">
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

        {/* Compact Problem Section */}
        <div className="bg-white/5 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 text-center">
                آیا این چالش‌ها را تجربه می‌کنی؟
              </h2>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  "😔 ایده‌هایت نادیده گرفته می‌شود",
                  "😰 مردم متقاعد نمی‌شوند",
                  "🤐 نمی‌توانی مرزهایی ایجاد کنی",
                  "😞 دیگران احساس ارزشمندی نمی‌کنند"
                ].map((problem, index) => (
                  <div 
                    key={index}
                    className="bg-white/5 border border-[#334155] rounded-lg p-2.5 text-[#E2E8F0] text-xs text-right"
                  >
                    {problem}
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-secondary/20 via-secondary/25 to-secondary/20 border border-secondary rounded-lg p-4 text-center">
                <p className="text-white font-bold text-sm md:text-base mb-1">
                  🌟 تغییر شگفت‌انگیز
                </p>
                <p className="text-[#E2E8F0] text-xs md:text-sm mb-3">
                  با «5 زبان قدرت»، ارتباط را به <span className="text-secondary font-bold">ابزار رهبری</span> تبدیل کن
                </p>
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-6 py-2.5 text-sm font-bold bg-secondary hover:brightness-110 text-white rounded-lg transform hover:scale-105 transition-all"
                >
                  ✅ می‌خواهم این مهارت‌ها را یاد بگیرم
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact 5 Modules - Tight Grid Layout */}
        <div className="py-6 bg-gradient-to-b from-transparent to-white/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1.5">
                  🌿 در این کلاس چه یاد می‌گیری؟
                </h2>
                <p className="text-[#94A3B8] text-xs">
                  5 زبان قدرت که توسط رهبران موفق استفاده می‌شود
                </p>
              </div>

              {/* Ultra-Compact 2x3 Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {modules.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-white/5 backdrop-blur-sm border border-secondary/20 rounded-lg p-2.5 hover:border-secondary transition-all group text-right"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="bg-secondary rounded p-1.5 group-hover:scale-110 transition-transform flex-shrink-0">
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-secondary mb-0.5 leading-tight">
                            {module.title}
                          </h3>
                          <p className="text-[#94A3B8] text-[10px] leading-snug">
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
                  <p className="text-white/90 text-[10px]">
                    فقط $1
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof - Compact */}
        <div className="py-6">
          <TestimonialsSection />
        </div>

        {/* Instructor - Compact */}
        <InstructorBio />

        {/* FAQ - Compact */}
        <FAQSection />

        {/* Final CTA - Compact & Powerful */}
        <div className="bg-gradient-to-br from-secondary/20 via-secondary/15 to-transparent py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                🎯 آیا آماده هستی ارتباطات قدرتمندی داشته باشی؟
              </h2>
              
              <div className="grid md:grid-cols-2 gap-2.5 mb-3">
                {/* Take Action */}
                <div className="bg-secondary/15 border border-secondary rounded-lg p-3">
                  <div className="text-3xl mb-1">✅</div>
                  <h3 className="text-base font-bold text-secondary mb-1">عمل کن</h3>
                  <ul className="space-y-0.5 text-right text-[#E2E8F0] text-xs mb-1.5">
                    <li>✨ 5 زبان قدرت</li>
                    <li>💪 مهارت‌های رهبری</li>
                    <li>💰 فقط $1</li>
                  </ul>
                  <p className="text-secondary font-bold text-xs">
                    = تأثیر واقعی
                  </p>
                </div>

                {/* Do Nothing */}
                <div className="bg-white/5 border border-[#334155] rounded-lg p-3 opacity-70">
                  <div className="text-3xl mb-1">❌</div>
                  <h3 className="text-base font-bold text-white/70 mb-1">هیچ کاری نکن</h3>
                  <ul className="space-y-0.5 text-right text-white/60 text-xs mb-1.5">
                    <li>😔 نادیده گرفته شوی</li>
                    <li>😰 تأثیر نداشته باشی</li>
                    <li>💸 بعداً $100</li>
                  </ul>
                  <p className="text-white/50 font-bold text-xs">
                    = همان محدودیت‌ها
                  </p>
                </div>
              </div>

              <div className="bg-[#FF6B6B]/20 border border-[#FF6B6B] rounded-lg p-2.5 mb-3">
                <p className="text-[#FF6B6B] font-bold text-sm mb-1.5">
                  ⚠️ فقط چند جای خالی باقی!
                </p>
                <SpotCounter />
              </div>

              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 text-lg md:text-xl font-bold bg-gradient-to-r from-secondary to-secondary-light hover:brightness-110 text-white rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.5)] transform hover:scale-105 transition-all mb-2.5"
              >
                🚀 بله! ثبت نام با $1
              </Button>

              <p className="text-[#94A3B8] text-xs">
                ✓ پرداخت امن | ✓ ضمانت بازگشت وجه | ✓ دسترسی فوری
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Bottom CTA - Green */}
        <div className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--green))] border-t-2 border-black/10 p-3 z-50 shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-3">
              <div className="text-right flex-1">
                <p className="text-white font-bold text-sm md:text-base leading-tight">
                  فقط $1 • 73 جا باقی
                </p>
                <p className="text-white/90 text-xs md:text-sm leading-tight">
                  بعدش $100 می‌شود
                </p>
              </div>
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold bg-white hover:bg-white/90 text-[hsl(var(--green))] rounded-lg shadow-lg transform active:scale-95 transition-all flex-shrink-0"
              >
                🚀 ثبت نام
              </Button>
            </div>
          </div>
        </div>

        {/* Add padding at bottom to prevent content being hidden by sticky CTA */}
        <div className="h-16"></div>
      </div>

      {/* Enhanced Registration Modal */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="sm:max-w-md bg-luxury-white border-4 border-secondary shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl md:text-2xl font-bold text-secondary font-farsi text-center">
              💎 ثبت نام Five Languages of Power!
            </DialogTitle>
            <DialogDescription className="sr-only">
              Register for the Five Languages of Power for only $1
            </DialogDescription>
            <div className="bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 border-2 border-secondary rounded-xl p-3 mb-2">
              <p className="text-secondary font-bold text-xl md:text-2xl">
                فقط $1
              </p>
              <p className="text-luxury-accent/70 font-farsi text-xs">
                1000 نفر اول • قیمت اصلی: $100
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-left block text-luxury-black font-medium text-sm">
                Your Name
              </Label>
              <Input
                id="modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="text-left h-11 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-left block text-luxury-black font-medium text-sm">
                Your Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="text-left h-11 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs">{validationErrors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-luxury-white font-farsi transition-all duration-300 transform hover:scale-105 shadow-glow border-2 border-secondary-light"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'در حال ارسال...' : '✅ پرداخت $1'}
            </Button>
          </form>

          <div className="mt-3">
            <div className="flex items-center justify-center gap-4 text-luxury-accent/70 text-[10px]">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-secondary" />
                <span>امن</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-secondary" />
                <span>SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-secondary" />
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
