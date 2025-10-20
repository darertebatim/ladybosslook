import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/CountdownTimer";
import SpotCounter from "@/components/SpotCounter";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import InstructorBio from "@/components/InstructorBio";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import BonusMaterialsSection from "@/components/BonusMaterialsSection";
import RecentRegistrations from "@/components/RecentRegistrations";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { simpleSubscriptionSchema } from '@/lib/validation';
import { z } from 'zod';
import { Video, Shield, Zap } from 'lucide-react';

const One = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set countdown target date (you can adjust this)
  const countdownTarget = new Date();
  countdownTarget.setDate(countdownTarget.getDate() + 3); // 3 days from now

  // Meta Pixel tracking - Page view and content tracking
  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
      
      // Track content view with page-specific data
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'paid_class',
        content_name: 'Bilingual Power Class',
        content_category: 'online_class',
        value: 100, // Original value
        currency: 'USD'
      });

      // Track custom event for landing page visit
      (window as any).fbq('trackCustom', 'BilingualClassPageVisit', {
        page_type: 'paid_class_landing',
        event_type: 'bilingual_class_registration',
        target_audience: 'persian_immigrant_women',
        offer_price: 1,
        original_price: 100
      });
    }
  }, []);

  // Track modal interactions
  const handleModalOpen = () => {
    setShowModal(true);
    
    // Track modal open event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'RegistrationModalOpen', {
        source: 'one_bilingual',
        modal_type: 'paid_class_registration'
      });
    }
  };

  // Track form start
  const handleFormStart = (fieldName: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'FormStart', {
        form_type: 'paid_class_registration',
        first_field: fieldName,
        source: 'one_bilingual'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod (removed city field)
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
      // First, subscribe to mailchimp
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

      // Create Stripe payment session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          amount: 100, // $1.00 in cents
          programTitle: 'قدرت دوزبانه - Bilingual Power Class',
          successUrl: `${window.location.origin}/thankone`,
          cancelUrl: `${window.location.origin}/one`
        }
      });

      if (paymentError) throw paymentError;

      // Track registration attempt
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'BilingualClassRegistration', {
          content_name: 'Bilingual Power Class',
          content_category: 'paid_class',
          value: 1,
          currency: 'USD'
        });
      }

      // Redirect to Stripe checkout
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

  return (
    <>
      <SEOHead
        title="قدرت دوزبانه - Online Class for Persian Women"
        description="Master bilingual power as an immigrant woman. $1 for first 100 registrants!"
      />
      
      {/* Event Banner with Countdown */}
      <div className="bg-secondary text-luxury-black py-6 text-center">
        <p className="font-bold text-lg md:text-xl mb-2">
          🎯 کلاس آنلاین قدرت دوزبانه
        </p>
        <p className="text-sm md:text-base mb-3">
          فقط ۱۰۰ نفر اول | ۱ دلار به جای ۱۰۰ دلار
        </p>
        <div className="max-w-md mx-auto">
          <p className="text-xs font-bold mb-2 font-farsi">⏰ زمان باقی‌مانده تا افزایش قیمت:</p>
          <CountdownTimer targetDate={countdownTarget} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-luxury relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-accent opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Logo Area */}
          <div className="text-center mb-8">
            <div className="text-lg md:text-xl text-luxury-silver/90 font-persian">
              مخصوص خانم‌های مهاجرت کرده به خارج
            </div>
            <div className="text-base md:text-lg text-luxury-silver/80 mt-2">
              Free Live Training for Persian Women
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Hero Text */}
              <div className="text-center lg:text-right space-y-8">
                <div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-luxury-white leading-tight mb-6 font-persian">
                    <span className="text-secondary block text-5xl md:text-7xl lg:text-8xl">قدرت دوزبانه</span>
                    <span className="text-luxury-white block text-3xl md:text-5xl lg:text-6xl">کلاس آنلاین</span>
                  </h1>
                  
                  <div className="text-luxury-silver/90 text-base md:text-lg leading-relaxed space-y-4 mb-6 font-farsi text-center lg:text-right">
                    <p>
                      «قدرت دو زبانه» در ظاهر درباره‌ی زبان است،<br/>
                      ولی در عمق، درباره‌ی دو جهان درون یک زن مهاجر است:
                    </p>
                    <p>
                      زبانی برای ارتباط بیرونی (جامعه‌ی جدید، فرهنگ جدید)
                    </p>
                    <p>
                      و زبانی برای قدرت درونی (هویت، احساس، ارزش‌ها)
                    </p>
                    <p className="text-secondary font-bold">
                      یعنی زنی که یاد گرفته نه فقط دو زبان حرف بزند، بلکه<br/>
                      «در دو دنیا، با اعتمادبه‌نفس حضور داشته باشد.»
                    </p>
                  </div>
                  
                  {/* Location Restriction */}
                  <div className="text-center mb-4">
                    <p className="text-luxury-silver/90 font-medium text-lg md:text-xl font-persian">
                      فقط ساکن امریکا | کانادا | اروپا | استرالیا | دبی
                    </p>
                    {/* Arrows pointing down */}
                    <div className="flex justify-center gap-2 mt-3">
                      <div className="text-secondary text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>⬇️</div>
                      <div className="text-secondary text-2xl animate-bounce" style={{ animationDelay: '200ms' }}>⬇️</div>
                      <div className="text-secondary text-2xl animate-bounce" style={{ animationDelay: '400ms' }}>⬇️</div>
                    </div>
                  </div>
                  
                  {/* Signup Button - Mobile centered, Desktop right-aligned */}
                  <div className="flex justify-center lg:justify-end mb-8">
                  <Button
                    onClick={handleModalOpen}
                    className="w-full max-w-sm h-16 text-lg md:text-xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black font-persian transition-all duration-300 transform hover:scale-105 shadow-glow pulse-glow rounded-2xl"
                  >
                    🚀 کلیک کنید و جای خود را رزرو کنید
                  </Button>
                  </div>
                </div>

                <div className="bg-luxury-white/5 backdrop-blur-sm border border-secondary/20 rounded-xl p-6 mb-8">
                  <p className="text-luxury-white font-bold text-lg mb-2 font-farsi">
                    💰 پیشنهاد ویژه
                  </p>
                  <p className="text-secondary font-medium text-2xl font-farsi">
                    فقط ۱ دلار برای ۱۰۰ نفر اول
                  </p>
                  <p className="text-luxury-silver/80 text-sm mt-2 font-farsi line-through">
                    قیمت اصلی: ۱۰۰ دلار
                  </p>
                  <p className="text-red-400 font-bold text-sm mt-1 font-farsi">
                    ۹۹٪ تخفیف!
                  </p>
                </div>
              </div>

              {/* Right Side - Additional Info with Spot Counter */}
              <div className="lg:sticky lg:top-8 text-center space-y-6">
                {/* Spot Counter */}
                <SpotCounter totalSpots={100} />

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl p-3">
                    <Shield className="w-6 h-6 text-secondary mx-auto mb-1" />
                    <p className="text-luxury-silver/90 text-xs font-farsi">پرداخت امن</p>
                  </div>
                  <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl p-3">
                    <Video className="w-6 h-6 text-secondary mx-auto mb-1" />
                    <p className="text-luxury-silver/90 text-xs font-farsi">دسترسی مادام‌العمر</p>
                  </div>
                  <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl p-3">
                    <Zap className="w-6 h-6 text-secondary mx-auto mb-1" />
                    <p className="text-luxury-silver/90 text-xs font-farsi">شروع فوری</p>
                  </div>
                </div>

                {/* Money Back Guarantee */}
                <div className="bg-green-500/20 border-2 border-green-500/50 rounded-xl p-4">
                  <p className="text-green-400 font-bold text-lg font-farsi">✅ ضمانت بازگشت پول</p>
                  <p className="text-luxury-silver/90 text-sm mt-1 font-farsi">تا ۷ روز بعد از خرید</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits of Being an Assertive Woman */}
      <div className="bg-luxury-white/95 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs md:text-sm text-luxury-accent/80 font-farsi">
              <span>• مرزبندی قدرتمند</span>
              <span>• اعتماد به نفس پایدار</span>
              <span>• ابراز وجود بدون گناه</span>
              <span>• مدیریت تعارضات</span>
              <span>• ارتباط مؤثر</span>
              <span>• استقلال از تأیید دیگران</span>
              <span>• نه گفتن با اعتماد</span>
              <span>• بیان اَسِرتیو</span>
              <span>• حق گرفتن</span>
              <span>• پاسخ به انتقاد</span>
              <span>• جلوگیری از بی‌انصافی</span>
              <span>• مذاکرهٔ روزمره</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Intro Section */}
      <div className="bg-luxury-charcoal py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-luxury-white mb-6 font-farsi">
              📹 نگاهی به کلاس قدرت دوزبانه
            </h3>
            <p className="text-luxury-silver/90 mb-8 font-farsi">
              ببینید این کلاس چگونه زندگی شما را تغییر می‌دهد
            </p>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl mb-6">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/qQalgp5Sg0w?rel=0&modestbranding=1"
                title="Bilingual Power Class Preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <Button 
              onClick={handleModalOpen}
              className="bg-secondary hover:bg-secondary-dark text-luxury-black font-bold text-xl px-12 py-4 h-auto rounded-2xl shadow-luxury transition-all duration-300 transform hover:scale-105 font-farsi"
            >
              🚀 همین الان با ۱ دلار شروع کنید
            </Button>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-gradient-luxury py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-luxury-white mb-12 font-farsi">
              چرا این کلاس را از دست ندهید؟
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h4 className="text-xl font-bold text-secondary mb-4 font-farsi">تخصصی و هدفمند</h4>
                <p className="text-luxury-silver/90 font-farsi">
                  مخصوص چالش‌های واقعی زنان مهاجر طراحی شده
                </p>
              </div>
              
              <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💡</span>
                </div>
                <h4 className="text-xl font-bold text-secondary mb-4 font-farsi">راهکارهای عملی</h4>
                <p className="text-luxury-silver/90 font-farsi">
                  استراتژی‌هایی که می‌توانید همین امروز شروع کنید
                </p>
              </div>
              
              <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🚀</span>
                </div>
                <h4 className="text-xl font-bold text-secondary mb-4 font-farsi">تحول سریع</h4>
                <p className="text-luxury-silver/90 font-farsi">
                  نتایج قابل مشاهده در کمترین زمان ممکن
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Bio */}
      <InstructorBio />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Bonus Materials */}
      <BonusMaterialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <div className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-luxury-black mb-8 font-farsi">
              آماده برای تسلط بر قدرت دوزبانه هستید؟
            </h3>
            <p className="text-xl text-luxury-black/80 mb-8 font-farsi">
              فقط ۱ دلار برای ۱۰۰ نفر اول - قیمت اصلی ۱۰۰ دلار
            </p>
            <Button 
              onClick={handleModalOpen}
              className="bg-luxury-black hover:bg-luxury-charcoal text-secondary font-bold text-xl px-12 py-4 h-auto rounded-2xl shadow-luxury transition-all duration-300 transform hover:scale-105 font-farsi"
            >
              ⬆️ همین الان ثبت نام کنید
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-luxury-white border-2 border-secondary/20 shadow-luxury">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-luxury-black mb-2 font-farsi">
              💎 ثبت نام در کلاس قدرت دوزبانه
            </DialogTitle>
            <p className="text-green-600 font-farsi mb-2 font-bold text-xl">
              فقط ۱ دلار برای ۱۰۰ نفر اول
            </p>
            <p className="text-luxury-accent/70 font-farsi text-base font-medium">
              مخصوص ایرانیان مهاجر به خارج
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-left block text-luxury-black font-medium">
                Your Name
              </Label>
              <Input
                id="modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => handleFormStart('name')}
                placeholder="Your Name"
                required
                className="text-left h-12 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-left block text-luxury-black font-medium">
                Your Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="text-left h-12 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
            </div>


            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary-dark text-luxury-black font-farsi transition-all duration-300 transform hover:scale-105 shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'در حال ارسال...' : '✅ ادامه به پرداخت ۱ دلار'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-luxury-accent font-farsi">
            <p>🔒 پرداخت امن</p>
            <p className="mt-1">💳 قیمت: فقط ۱ دلار برای ۱۰۰ نفر اول</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Bottom Button - Enhanced with Pulse */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-secondary/95 backdrop-blur-sm border-t border-luxury-white/10 shadow-2xl">
        <Button
          onClick={handleModalOpen}
          className="w-full h-14 text-base md:text-lg font-bold bg-luxury-black hover:bg-luxury-charcoal text-secondary font-farsi transition-all duration-300 rounded-lg animate-pulse hover:animate-none shadow-glow"
        >
          💎 ثبت نام با ۱ دلار (۱۰۰ نفر اول)
        </Button>
      </div>

      {/* Exit Intent Popup */}
      <ExitIntentPopup onRegisterClick={handleModalOpen} />

      {/* Recent Registrations Notification */}
      <RecentRegistrations />

      {/* Performance Monitor - Enable during high traffic testing */}
      <PerformanceMonitor 
        enabled={window.location.search.includes('monitor=true')} 
        monitoringInterval={15000} 
      />
    </>
  );
};

export default One;
