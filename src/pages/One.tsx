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
        {/* Hero Section - Above Fold Focus */}
        <div className="relative overflow-hidden pb-8 md:pb-12">
          {/* Animated Teal Glow */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="container mx-auto px-4 pt-3 pb-3 relative z-10">
            {/* Ultra Compact Urgency Bar */}
            <div className="bg-gradient-to-r from-accent/20 via-accent/30 to-accent/20 border border-accent/40 rounded-lg p-2 mb-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-1">
                  <Clock className="w-3.5 h-3.5 text-accent animate-pulse flex-shrink-0" />
                  <span className="text-luxury-white font-bold">محدود:</span>
                  <CountdownTimer targetDate={new Date('2025-12-31T23:59:59')} />
                </div>
                <div className="flex-shrink-0">
                  <SpotCounter />
                </div>
              </div>
            </div>

            {/* Hero Content - Above Fold Optimization */}
            <div className="max-w-4xl mx-auto text-center">
              {/* Pre-headline */}
              <div className="inline-block bg-secondary/15 border border-secondary/40 rounded-full px-3 py-1 mb-2">
                <span className="text-secondary font-bold text-xs">💎 ویژه زنان ایرانی مهاجر</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-luxury-white mb-1.5 leading-tight">
                Bilingual Power Class !
              </h1>
              
              {/* Persian Title */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary mb-2 leading-tight">
                قدرت دو زبانه
              </h2>

              {/* Tagline */}
              <p className="text-sm md:text-base text-luxury-silver/90 mb-3 leading-relaxed">
                زبان تو، پل قدرتت است • نه دیوار ترسش
              </p>

              {/* Compact Price + CTA Combined */}
              <div className="bg-gradient-to-br from-secondary/15 to-secondary/5 backdrop-blur-md border border-secondary/30 rounded-2xl p-3 md:p-4 mb-3 max-w-lg mx-auto">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl md:text-5xl font-bold text-secondary">$1</span>
                  <div className="text-right">
                    <div className="text-luxury-silver/60 line-through text-base">$100</div>
                    <div className="bg-accent/90 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      ۹۹٪ تخفیف
                    </div>
                  </div>
                </div>
                
                {/* Large Primary CTA */}
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="w-full px-6 py-4 text-base md:text-lg font-bold bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.4)] hover:shadow-[0_0_35px_rgba(20,184,166,0.6)] transform hover:scale-[1.02] transition-all duration-300 border border-secondary-light"
                >
                  🚀 ثبت نام فوری
                </Button>
                
                <p className="text-accent font-bold text-xs mt-2">
                  ⚠️ فقط ۱۰۰۰ نفر اول
                </p>
              </div>

              {/* Compact Trust Row */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-luxury-silver/60 text-[11px]">
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

        {/* Compact Problem + Solution */}
        <div className="bg-luxury-white/5 backdrop-blur-sm py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-luxury-white mb-3 text-center">
                آیا این چالش‌ها را داری؟
              </h2>
              
              <div className="grid grid-cols-2 gap-2 text-right mb-4">
                {[
                  "😔 شنیده نمی‌شوی",
                  "😰 خجالت از لهجه",
                  "🤐 نمی‌دانی «نه» بگویی",
                  "😞 دیده نمی‌شوی"
                ].map((problem, index) => (
                  <div 
                    key={index}
                    className="bg-luxury-white/10 border border-luxury-accent/20 rounded-lg p-2 text-luxury-white/90 text-xs"
                  >
                    {problem}
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-secondary/15 via-secondary/20 to-secondary/15 border border-secondary/40 rounded-xl p-3 text-center">
                <p className="text-base md:text-lg font-bold text-secondary mb-1">
                  ✨ خبر خوب: قابل تغییر است!
                </p>
                <p className="text-luxury-white/90 text-xs mb-2">
                  با «قدرت دو زبانه»، زبان را به <span className="text-secondary font-bold">ابزار قدرت</span> تبدیل کن
                </p>
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-4 py-2 text-sm font-bold bg-secondary hover:bg-secondary-light text-white rounded-lg transform hover:scale-105 transition-all"
                >
                  ✅ می‌خواهم این تغییر
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Compact 5 Modules */}
        <div className="py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-luxury-white mb-3 text-center">
                🌿 چه یاد می‌گیری؟
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {modules.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-luxury-white/10 border border-secondary/30 rounded-lg p-2.5 hover:border-secondary transition-all text-right"
                    >
                      <div className="flex items-start gap-2">
                        <div className="bg-secondary rounded-lg p-1.5 flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-secondary mb-0.5 leading-tight">
                            {module.title}
                          </h3>
                          <p className="text-luxury-silver/80 text-[11px] leading-snug">
                            {module.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full px-6 py-3 text-sm md:text-base font-bold bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white rounded-xl shadow-lg transform hover:scale-[1.02] transition-all"
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                همین الان شروع کن - $1
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Instructor + Testimonials Combined */}
        <InstructorBio />
        <TestimonialsSection />
        {/* FAQ - Compact */}
        <FAQSection />

        {/* Final CTA - Compact */}
        <div className="bg-gradient-to-br from-secondary/15 to-transparent py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-luxury-white mb-3">
                ⏰ آماده‌ای؟
              </h2>
              
              <div className="bg-accent/20 border border-accent/40 rounded-xl p-2.5 mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-accent animate-pulse" />
                  <span className="text-accent font-bold text-sm">فقط چند جا باقی!</span>
                </div>
                <SpotCounter />
              </div>

              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full px-8 py-4 text-lg font-bold bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white rounded-xl shadow-[0_0_30px_rgba(20,184,166,0.5)] transform hover:scale-105 transition-all mb-2"
              >
                🚀 ثبت نام با $1
              </Button>

              <p className="text-luxury-silver/60 text-xs">
                ✓ پرداخت امن | ✓ ضمانت بازگشت | ✓ دسترسی فوری
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-secondary to-secondary-light border-t border-secondary-light/30 p-2 z-50 shadow-[0_-5px_20px_rgba(20,184,166,0.3)]">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-2">
              <div className="text-right flex-1">
                <p className="text-white font-bold text-xs md:text-sm leading-tight">
                  $1 فقط • <SpotCounter totalSpots={1000} className="inline-flex scale-75 origin-right" />
                </p>
                <p className="text-white/80 text-[10px] leading-tight">
                  بعدش $100
                </p>
              </div>
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold bg-white hover:bg-luxury-white text-secondary rounded-lg shadow-lg transform active:scale-95 transition-all flex-shrink-0"
              >
                🚀 ثبت نام
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom padding for sticky CTA */}
        <div className="h-14"></div>
      </div>

      {/* Registration Modal */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="sm:max-w-md bg-luxury-white border-2 border-secondary shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl md:text-2xl font-bold text-luxury-black mb-2 font-farsi">
              💎 ثبت نام Bilingual Power Class !
            </DialogTitle>
            <div className="bg-gradient-to-r from-secondary/15 to-secondary/10 border border-secondary/40 rounded-lg p-2.5 mb-2">
              <p className="text-secondary font-bold text-lg">
                فقط $1
              </p>
              <p className="text-luxury-accent/70 font-farsi text-xs">
                ۱۰۰۰ نفر اول • قیمت اصلی: $100
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
              className="w-full h-11 text-base font-bold bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white font-farsi transition-all duration-300 transform hover:scale-105 shadow-lg"
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
