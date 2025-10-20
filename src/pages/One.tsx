import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, CheckCircle2, Clock, Users, Star, Sparkles, Brain, MessageCircle, Globe, Mic, Zap, Heart } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import SpotCounter from "@/components/SpotCounter";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import InstructorBio from "@/components/InstructorBio";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import RecentRegistrations from "@/components/RecentRegistrations";
import { SEOHead } from "@/components/SEOHead";
import { simpleSubscriptionSchema } from '@/lib/validation';
import { z } from 'zod';

const One = () => {
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
      const { error: mailchimpError } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          city: '',
          phone: '',
          source: 'one_bilingual',
          tags: ['one_bilingual', 'paid_class']
        }
      });

      if (mailchimpError) throw mailchimpError;

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          amount: 100,
          programTitle: 'قدرت دوزبانه - Bilingual Power Class',
          successUrl: `${window.location.origin}/thankone`,
          cancelUrl: `${window.location.origin}/one`
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
    { icon: Brain, title: "زبان درونی قدرت", desc: "طرز فکر، گفت‌وگو با خودت و بازنویسی روایت‌های منفی" },
    { icon: MessageCircle, title: "زبان بیرونی قدرت", desc: "ساختار جملات قاطع، نه گفتن بدون گناه، حرف زدن با اعتماد‌به‌نفس" },
    { icon: Globe, title: "زبان فرهنگی", desc: "تفاوت دو فرهنگ، آداب گفت‌وگو و assertiveness در محیط چندفرهنگی" },
    { icon: Mic, title: "زبان حضور", desc: "تن صدای محکم و آرام، زبان بدن قدرتمند، حضور فیزیکی و ذهنی" },
    { icon: Zap, title: "زبان تأثیر", desc: "storytelling، گفت‌وگوهای اعتمادساز، ساختن رابطه و فرصت با زبان" }
  ];

  return (
    <>
      <SEOHead 
        title="قدرت دو زبانه Class - کلاس آنلاین $1 | LadyBoss Academy"
        description="یاد بگیرید چطور در هر زبانی با قدرت حرف بزنید. کلاس ویژه زنان ایرانی مهاجر - فقط $1"
      />
      <RecentRegistrations />
      <ExitIntentPopup onRegisterClick={() => setShowRegistrationForm(true)} />
      
      <div className="min-h-screen bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-black font-farsi">
        {/* Compact Hero Section */}
        <div className="relative overflow-hidden pb-12">
          {/* Animated Purple Glow */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/60 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="container mx-auto px-4 pt-4 pb-4 relative z-10">
            {/* Compact Urgency Banner - Mobile Optimized */}
            <div className="bg-gradient-to-r from-red-500/20 via-red-500/30 to-red-500/20 border-2 border-red-500 rounded-xl p-2 md:p-3 mb-4 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
                  <span className="text-luxury-white font-bold text-xs md:text-sm">⏰ پیشنهاد محدود:</span>
                </div>
                <div className="text-xs md:text-sm">
                  <CountdownTimer targetDate={new Date('2025-12-31T23:59:59')} />
                </div>
              </div>
              <div className="mt-2">
                <SpotCounter />
              </div>
            </div>

            {/* Hero Content - Proper Title Hierarchy */}
            <div className="max-w-4xl mx-auto text-center">
              {/* Pre-headline - Smaller */}
              <div className="inline-block bg-secondary/20 border border-secondary rounded-full px-3 py-1 mb-3">
                <span className="text-secondary font-bold text-xs md:text-sm">💎 ویژه زنان ایرانی مهاجر</span>
              </div>

              {/* Main Headline - LARGER */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-luxury-white mb-2 leading-tight">
                Bilingual Power Class !
              </h1>
              
              {/* Persian Title - Smaller than main */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-2 leading-tight">
                قدرت دو زبانه
              </h2>

              {/* Tagline - Smallest */}
              <p className="text-base md:text-lg text-luxury-silver/90 mb-4 leading-relaxed">
                زبان تو، پل قدرتت است • نه دیوار ترسش
              </p>

              {/* Compact Subheadline */}
              <p className="text-sm md:text-base text-luxury-silver/80 mb-4 max-w-2xl mx-auto">
                یاد بگیر <span className="text-secondary font-bold">در هر زبانی خودت باشی</span> و 
                با <span className="text-secondary font-bold">اعتماد‌به‌نفس کامل</span> در جامعه‌ی جدید بدرخشی
              </p>

              {/* Compact Price Box */}
              <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur-md border-2 border-secondary rounded-2xl p-4 md:p-6 mb-4 max-w-md mx-auto shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-bold text-secondary drop-shadow-lg">$1</span>
                  <div className="text-right">
                    <div className="text-luxury-silver/60 line-through text-lg md:text-xl">$100</div>
                    <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                      ۹۹٪ تخفیف
                    </div>
                  </div>
                </div>
                <p className="text-red-400 font-bold text-xs md:text-sm">
                  ⚠️ فقط ۱۰۰۰ نفر اول • بعدش $100
                </p>
              </div>

              {/* Large Primary CTA */}
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full md:w-auto px-6 md:px-12 py-5 md:py-6 text-lg md:text-xl font-bold bg-gradient-to-r from-secondary via-secondary-light to-secondary hover:from-secondary-light hover:via-secondary hover:to-secondary-light text-luxury-white rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] transform hover:scale-105 transition-all duration-300 mb-3 animate-pulse border-2 border-secondary-light"
              >
                🚀 ثبت نام فوری با $1
              </Button>

              {/* Compact Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-luxury-silver/70 text-xs">
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
        <div className="bg-luxury-white/5 backdrop-blur-sm py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-luxury-white mb-5 text-center">
                آیا این چالش‌ها را تجربه می‌کنی؟
              </h2>
              
              <div className="grid md:grid-cols-2 gap-3 text-right mb-5">
                {[
                  "😔 شنیده نمی‌شوی",
                  "😰 از لهجه‌ات خجالت می‌کشی",
                  "🤐 نمی‌دانی چطور «نه» بگویی",
                  "😞 در محیط کار دیده نمی‌شوی"
                ].map((problem, index) => (
                  <div 
                    key={index}
                    className="bg-luxury-white/10 border border-luxury-accent/20 rounded-xl p-3 text-luxury-white/90 text-sm hover:border-secondary/50 transition-all"
                  >
                    {problem}
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 border-2 border-secondary rounded-2xl p-5 text-center">
                <p className="text-xl md:text-2xl font-bold text-secondary mb-2">
                  ✨ خبر خوب: قابل تغییر است!
                </p>
                <p className="text-luxury-white/90 text-sm md:text-base mb-3">
                  با «قدرت دو زبانه»، زبان را به <span className="text-secondary font-bold">ابزار قدرت</span> تبدیل کن
                </p>
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-6 py-3 text-base font-bold bg-secondary hover:bg-secondary-light text-luxury-white rounded-xl shadow-glow transform hover:scale-105 transition-all"
                >
                  ✅ می‌خواهم این تغییر را تجربه کنم
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact 5 Modules - Grid Layout */}
        <div className="py-10 bg-gradient-to-b from-transparent to-luxury-white/5">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-luxury-white mb-2">
                  🌿 در قدرت دو زبانه چه یاد می‌گیری؟
                </h2>
                <p className="text-luxury-silver/80 text-sm">
                  5 زبان قدرت که زندگی‌ات را متحول می‌کند
                </p>
              </div>

              {/* Compact Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {modules.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-xl p-3 hover:border-secondary transition-all group text-right"
                    >
                      <div className="flex items-start gap-2">
                        <div className="bg-secondary rounded-lg p-2 group-hover:scale-110 transition-transform flex-shrink-0">
                          <Icon className="w-4 h-4 text-luxury-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-secondary mb-1">
                            {module.title}
                          </h3>
                          <p className="text-luxury-silver/80 text-xs leading-relaxed">
                            {module.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* CTA Card in Grid */}
                <div className="bg-gradient-to-br from-secondary/30 to-secondary/20 border-3 border-secondary rounded-xl p-3 flex flex-col items-center justify-center text-center hover:scale-105 transition-all cursor-pointer"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  <Sparkles className="w-8 h-8 text-secondary mb-1 animate-pulse" />
                  <p className="text-secondary font-bold text-base mb-0.5">
                    همین الان شروع کن
                  </p>
                  <p className="text-luxury-white/90 text-xs">
                    فقط $1 برای 1000 نفر اول
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Results */}
        <div className="bg-luxury-white/5 py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-luxury-white mb-5 text-center">
                💫 نتیجه‌ای که تجربه می‌کنی
              </h2>

              <div className="grid md:grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Heart, title: "لهجه‌ات، امضای توست", desc: "دیگر محدودیت نیست" },
                  { icon: CheckCircle2, title: "حضور با قدرت", desc: "در هر گفت‌وگو با قاطعیت" },
                  { icon: Sparkles, title: "بدون ترس", desc: "از قضاوت نمی‌ترسی" }
                ].map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-luxury-white/10 border-2 border-secondary/30 rounded-xl p-4 text-center hover:border-secondary hover:scale-105 transition-all"
                    >
                      <Icon className="w-7 h-7 text-secondary mx-auto mb-2" />
                      <h3 className="text-base font-bold text-secondary mb-1">
                        {result.title}
                      </h3>
                      <p className="text-luxury-white/80 text-xs">
                        {result.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 border-2 border-secondary rounded-2xl p-6 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-2">
                  زبانت، پل قدرتت می‌شود ✨
                </h3>
                <p className="text-luxury-white/90 text-base mb-3">
                  نه دیوار ترسش
                </p>
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-8 py-4 text-lg font-bold bg-secondary hover:bg-secondary-light text-luxury-white rounded-xl shadow-glow transform hover:scale-105 transition-all"
                >
                  🚀 من آماده‌ی این تحول هستم
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Social Proof */}
        <TestimonialsSection />

        {/* Instructor - Compact */}
        <InstructorBio />

        {/* FAQ - Compact */}
        <FAQSection />

        {/* Final CTA - Compact & Powerful */}
        <div className="bg-gradient-to-br from-secondary/30 via-secondary/20 to-transparent py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-luxury-white mb-3">
                ⏰ زمان تصمیم‌گیری رسیده
              </h2>
              
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {/* Take Action */}
                <div className="bg-secondary/20 border-2 border-secondary rounded-xl p-4">
                  <div className="text-4xl mb-1">✅</div>
                  <h3 className="text-lg font-bold text-secondary mb-1">عمل کن</h3>
                  <ul className="space-y-1 text-right text-luxury-white/90 text-xs mb-2">
                    <li>✨ 5 زبان قدرت</li>
                    <li>💪 اعتماد‌به‌نفس کامل</li>
                    <li>💰 فقط $1</li>
                  </ul>
                  <p className="text-secondary font-bold text-xs">
                    = زندگی قدرتمندتر
                  </p>
                </div>

                {/* Do Nothing */}
                <div className="bg-luxury-white/5 border border-luxury-accent/20 rounded-xl p-4 opacity-60">
                  <div className="text-4xl mb-1">❌</div>
                  <h3 className="text-lg font-bold text-luxury-white/70 mb-1">هیچ کاری نکن</h3>
                  <ul className="space-y-1 text-right text-luxury-white/60 text-xs mb-2">
                    <li>😔 شنیده نشوی</li>
                    <li>😰 خجالت بکشی</li>
                    <li>💸 بعداً $100</li>
                  </ul>
                  <p className="text-luxury-white/50 font-bold text-xs">
                    = همان مشکلات
                  </p>
                </div>
              </div>

              <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-3 mb-4 animate-pulse">
                <p className="text-red-400 font-bold text-base mb-2">
                  ⚠️ فقط چند جای خالی باقی!
                </p>
                <SpotCounter />
              </div>

              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full md:w-auto px-10 py-6 text-xl font-bold bg-gradient-to-r from-secondary via-secondary-light to-secondary hover:from-secondary-light hover:to-secondary text-luxury-white rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.6)] transform hover:scale-110 transition-all animate-pulse mb-3 border-2 border-secondary-light"
              >
                🚀 بله! ثبت نام با $1
              </Button>

              <p className="text-luxury-silver/60 text-xs">
                ✓ پرداخت امن | ✓ ضمانت بازگشت وجه | ✓ دسترسی فوری
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Sticky Bottom CTA - Always Visible */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-secondary via-secondary-light to-secondary border-t-2 border-secondary-light p-2 z-50 shadow-[0_-10px_40px_rgba(168,85,247,0.4)]">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-2">
              <div className="text-right flex-1">
                <p className="text-luxury-white font-bold text-xs md:text-sm leading-tight">
                  فقط $1 • 73 جا باقی
                </p>
                <p className="text-luxury-white/80 text-[10px] md:text-xs leading-tight">
                  بعدش $100 می‌شود
                </p>
              </div>
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="px-4 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold bg-luxury-black hover:bg-luxury-charcoal text-secondary rounded-xl shadow-lg transform active:scale-95 transition-all border border-luxury-black flex-shrink-0"
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
            <DialogTitle className="text-2xl md:text-3xl font-bold text-luxury-black mb-2 font-farsi">
              💎 ثبت نام Bilingual Power Class !
            </DialogTitle>
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

export default One;
