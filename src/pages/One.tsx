import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/CountdownTimer";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { subscriptionFormSchema } from '@/lib/validation';
import { z } from 'zod';

const One = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Meta Pixel tracking - Page view and content tracking
  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
      
      // Track content view with page-specific data
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'webinar_landing',
        content_name: 'Free Live Courage Roadmap',
        content_category: 'webinar_registration',
        value: 97, // Value of the free gift
        currency: 'USD'
      });

      // Track custom event for landing page visit
      (window as any).fbq('trackCustom', 'FreeLivePageVisit', {
        page_type: 'webinar_landing',
        event_type: 'freelive_registration',
        target_audience: 'persian_immigrant_women',
        webinar_date: '2024-09-28',
        gift_value: 97
      });
    }
  }, []);

  // Track modal interactions
  const handleModalOpen = () => {
    setShowModal(true);
    
    // Track modal open event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'RegistrationModalOpen', {
        source: 'freelive_page',
        modal_type: 'webinar_registration'
      });
    }
  };

  // Track form start
  const handleFormStart = (fieldName: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'FormStart', {
        form_type: 'webinar_registration',
        first_field: fieldName,
        source: 'freelive_page'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod
    setValidationErrors({});
    try {
      subscriptionFormSchema.parse({ name, email, city, phone: '' });
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
      const { error } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          city: city.trim(),
          phone: '',
          source: 'freelive',
          tags: ['freelive']
        }
      });

      if (error) throw error;

      // Track successful lead generation
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'FreeLiveLead', {
          content_name: 'Free Live Webinar Registration',
          content_category: 'webinar_registration',
          value: 97,
          currency: 'USD'
        });

        (window as any).fbq('trackCustom', 'WebinarRegistration', {
          event_type: 'freelive_registration',
          user_city: city,
          registration_source: 'freelive_page',
          gift_claimed: true
        });
      }

      // Success - directly redirect without showing toast
      // Reset form and close modal
      setEmail('');
      setName('');
      setCity('');
      setShowModal(false);
      
      // Redirect to thank you page
      navigate('/thankfreelive');
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
      
      {/* Event Banner */}
      <div className="bg-secondary text-luxury-black py-4 text-center">
        <p className="font-bold text-lg md:text-xl">
          🎯 کلاس آنلاین قدرت دوزبانه
        </p>
        <p className="text-sm md:text-base mt-1">
          فقط ۱۰۰ نفر اول | ۱ دلار به جای ۱۰۰ دلار
        </p>
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

              {/* Right Side - Additional Info */}
              <div className="lg:sticky lg:top-8 text-center space-y-6">
                <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl p-6">
                  <p className="text-secondary font-bold text-xl mb-2 font-farsi">
                    ⚡ فقط ۱۰۰ نفر اول!
                  </p>
                  <p className="text-luxury-silver/90 font-farsi">با قیمت ۱ دلار ثبت نام کنید</p>
                  <p className="text-red-400 font-bold text-sm mt-2 font-farsi">
                    بعد از ۱۰۰ نفر، قیمت ۱۰۰ دلار می‌شود
                  </p>
                </div>

                <div className="text-center text-sm text-luxury-silver/80 font-farsi">
                  <p>🔒 اطلاعات شما کاملاً محفوظ است</p>
                  <p className="mt-1">💳 پرداخت امن</p>
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

            <div className="space-y-2">
              <Label htmlFor="modal-city" className="text-left block text-luxury-black font-medium">
                Your City
              </Label>
              <Input
                id="modal-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Your City"
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

      {/* Sticky Bottom Button - Optimized for Performance */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-secondary/95 backdrop-blur-sm border-t border-luxury-white/10">
        <Button
          onClick={handleModalOpen}
          className="w-full h-14 text-base md:text-lg font-bold bg-luxury-black hover:bg-luxury-charcoal text-secondary font-farsi transition-colors duration-200 rounded-lg"
        >
          💎 ثبت نام با ۱ دلار (۱۰۰ نفر اول)
        </Button>
      </div>

      {/* Performance Monitor - Enable during high traffic testing */}
      <PerformanceMonitor 
        enabled={window.location.search.includes('monitor=true')} 
        monitoringInterval={15000} 
      />
    </>
  );
};

export default One;
