import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  MessageCircle, 
  Shield, 
  Star,
  Zap,
  ChevronDown,
  Clock
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Declare Facebook Pixel function
declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, any>) => void;
  }
}

const CourageousWorkshop = () => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchParams] = useSearchParams();
  const [spotsRemaining, setSpotsRemaining] = useState(23);
  const [viewersCount, setViewersCount] = useState(47);
  const [showDetails, setShowDetails] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  // Handle payment cancellation
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again when you're ready.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  // Simulate real-time spots and viewers
  useEffect(() => {
    const spotsInterval = setInterval(() => {
      setSpotsRemaining(prev => Math.max(15, prev - Math.floor(Math.random() * 2)));
    }, 45000);

    const viewersInterval = setInterval(() => {
      setViewersCount(prev => Math.max(30, Math.min(80, prev + Math.floor(Math.random() * 5) - 2)));
    }, 8000);

    return () => {
      clearInterval(spotsInterval);
      clearInterval(viewersInterval);
    };
  }, []);

  // Meta Pixel tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      window.fbq('track', 'ViewContent', {
        content_type: 'workshop',
        content_name: 'کارگاه آنلاین شخصیت شجاع',
        content_category: 'Live Training',
        value: 97,
        currency: 'USD'
      });
    }
  }, []);

  const handleRegisterClick = (source: string = 'main_cta') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'کارگاه آنلاین شخصیت شجاع',
        content_category: 'Workshop Registration',
        value: 97,
        currency: 'USD'
      });
    }
  };

  const handleWhatsAppClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact', {
        content_name: 'Workshop Inquiry',
        content_category: 'WhatsApp Contact',
      });
    }

    const message = encodeURIComponent('سلام! من به کارگاه آنلاین کاراکتر پرجرات علاقه‌مند هستم. ممکن است اطلاعات بیشتری بدهید؟');
    const url = `https://wa.me/16265028589?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDirectPayment = async (source: string = 'main_cta') => {
    if (isProcessingPayment) return;
    
    setIsProcessingPayment(true);
    handleRegisterClick(source);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          program: 'courageous-character'
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        alert('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-luxury-black font-farsi rtl">
        {/* Minimal Mobile Header */}
        <header className="border-b border-luxury-accent/20 bg-luxury-black/95 backdrop-blur-md sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-luxury-white">
                کاراکتر پرجرات
              </h1>
              <Button variant="ghost" size="sm" asChild className="text-luxury-silver h-11 min-w-[44px]">
                <Link to="/">
                  <ArrowLeft size={20} className="rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 pb-24">
          {/* Mobile Urgency Strip - Above the Fold */}
          <div className="bg-urgency rounded-xl p-3 mb-4 text-center">
            <p className="text-white font-bold text-base mb-1 farsi-nums">
              🔥 فقط {spotsRemaining} جا باقی مانده
            </p>
            <p className="text-white/90 text-sm">شروع: 15 فوریه 2025</p>
          </div>

          {/* Immediate Above-the-Fold CTA */}
          <div className="bg-luxury-charcoal rounded-2xl p-6 mb-6 border-2 border-luxury-gold">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-luxury-white mb-3 leading-tight">
                از خجالتی به
                <br />
                <span className="text-luxury-gold">قدرتمند و مطمئن</span>
              </h2>
              <p className="text-luxury-silver text-base mb-4">
                کارگاه ویژه زنان ایرانی مهاجر
              </p>
            </div>

            {/* Price - Mobile Optimized */}
            <div className="bg-luxury-black/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-xl text-luxury-silver/50 line-through farsi-nums">$497</span>
                <span className="text-5xl font-extrabold text-luxury-gold farsi-nums">$97</span>
              </div>
              <div className="bg-urgency text-white text-sm font-bold py-2 px-4 rounded-full inline-block">
                80% تخفیف - فقط امروز
              </div>
            </div>

            {/* Large Touch-Friendly CTA */}
            <Button 
              size="lg"
              className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-extrabold text-xl py-7 rounded-xl min-h-[60px] mb-3 shadow-lg"
              onClick={() => handleDirectPayment('hero_cta')}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'در حال پردازش...' : 'ثبت‌نام الان'}
              <Zap className="w-6 h-6 mr-2" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-success text-sm">
              <Shield className="w-5 h-5" />
              <span className="font-bold">گارانتی 100% بازگشت وجه</span>
            </div>
          </div>

          {/* Video - Mobile Optimized */}
          <div className="mb-6">
            <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-luxury-white/20">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/hkWfOP5OxXE"
                title="کاراکتر پرجرات"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>

          {/* Social Proof - Simplified for Mobile */}
          <div className="bg-success/20 border-2 border-success/40 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-luxury-white text-center text-lg font-bold mb-2 leading-tight">
              "از فردی خجالتی به مدیری که تیم 12 نفره را رهبری می‌کنم"
            </p>
            <p className="text-luxury-silver text-center text-sm">- ساناز م.، تورنتو</p>
            
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white farsi-nums">2,847</div>
                <div className="text-xs text-luxury-silver">دانشجو</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white farsi-nums">4.9</div>
                <div className="text-xs text-luxury-silver">امتیاز</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white farsi-nums">94%</div>
                <div className="text-xs text-luxury-silver">رضایت</div>
              </div>
            </div>
          </div>

          {/* Quick Benefits - 3 Main Points */}
          <div className="bg-luxury-charcoal/60 rounded-xl p-5 mb-6 border border-luxury-white/20">
            <h3 className="text-xl font-bold text-luxury-white mb-4 text-center">
              چرا این کارگاه؟
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                <p className="text-luxury-silver text-base leading-relaxed">
                  <span className="text-luxury-white font-bold">12 تکنیک عملی</span> برای غلبه بر خجالت و ترس
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                <p className="text-luxury-silver text-base leading-relaxed">
                  <span className="text-luxury-white font-bold">مخصوص زنان ایرانی</span> با چالش‌های فرهنگی منحصربفرد
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                <p className="text-luxury-silver text-base leading-relaxed">
                  <span className="text-luxury-white font-bold">نتایج سریع</span> - تغییرات قابل مشاهده در عرض 2 هفته
                </p>
              </div>
            </div>
          </div>

          {/* Expandable Details Section */}
          <div className="space-y-4 mb-6">
            {/* What You'll Learn */}
            <div className="bg-luxury-charcoal/60 rounded-xl border border-luxury-white/20 overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-5 py-4 flex items-center justify-between text-right min-h-[60px]"
              >
                <span className="text-lg font-bold text-luxury-white">چه چیزی یاد می‌گیرید؟</span>
                <ChevronDown className={`w-6 h-6 text-luxury-gold transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>
              {showDetails && (
                <div className="px-5 pb-5 space-y-3">
                  {[
                    'تکنیک‌های عملی برای غلبه بر خجالت در محیط کار',
                    'نحوه مذاکره با اعتماد به نفس برای افزایش حقوق',
                    'روش‌های مشخص کردن مرزهای سالم در روابط',
                    'مهارت‌های ارتباطی قدرتمند برای موقعیت‌های اجتماعی',
                    'استراتژی‌های کاهش اضطراب و افزایش اعتماد به نفس',
                    'نحوه بیان نظرات و ایده‌های خود بدون ترس از قضاوت'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-luxury-silver text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Testimonials Expandable */}
            <div className="bg-luxury-charcoal/60 rounded-xl border border-luxury-white/20 overflow-hidden">
              <button
                onClick={() => setShowTestimonials(!showTestimonials)}
                className="w-full px-5 py-4 flex items-center justify-between text-right min-h-[60px]"
              >
                <span className="text-lg font-bold text-luxury-white">نظرات دانشجویان</span>
                <ChevronDown className={`w-6 h-6 text-luxury-gold transition-transform ${showTestimonials ? 'rotate-180' : ''}`} />
              </button>
              {showTestimonials && (
                <div className="px-5 pb-5 space-y-4">
                  {[
                    {
                      name: "مریم ک.",
                      title: "مهندس نرم‌افزار، ونکوور",
                      quote: "قبلاً در مذاکره حقوق خجالت می‌کشیدم. بعد از کارگاه، 40% افزایش حقوق گرفتم!"
                    },
                    {
                      name: "پریسا ج.",
                      title: "صاحب کسب‌وکار، لس‌آنجلس",
                      quote: "درآمدم 3 برابر شد و فقط با مشتریان ایده‌آل کار می‌کنم."
                    },
                    {
                      name: "نگار ا.",
                      title: "مدیر بازاریابی، تورنتو",
                      quote: "بعد از 3 ماه، مدیر تیم بازاریابی شدم!"
                    }
                  ].map((testimonial, index) => (
                    <Card key={index} className="bg-luxury-black/40 border border-luxury-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-luxury-white text-sm leading-relaxed mb-3 italic">
                          "{testimonial.quote}"
                        </p>
                        <div className="text-luxury-silver text-xs">
                          <div className="font-bold text-white">{testimonial.name}</div>
                          <div>{testimonial.title}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Program Details Expandable */}
            <div className="bg-luxury-charcoal/60 rounded-xl border border-luxury-white/20 overflow-hidden">
              <button
                onClick={() => setShowBenefits(!showBenefits)}
                className="w-full px-5 py-4 flex items-center justify-between text-right min-h-[60px]"
              >
                <span className="text-lg font-bold text-luxury-white">جزئیات برنامه</span>
                <ChevronDown className={`w-6 h-6 text-luxury-gold transition-transform ${showBenefits ? 'rotate-180' : ''}`} />
              </button>
              {showBenefits && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-luxury-black/30 rounded-lg">
                    <Clock className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                    <div>
                      <p className="text-luxury-white font-bold text-sm">مدت زمان</p>
                      <p className="text-luxury-silver text-sm">4 هفته - جلسات زنده آنلاین</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-luxury-black/30 rounded-lg">
                    <Users className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                    <div>
                      <p className="text-luxury-white font-bold text-sm">ظرفیت محدود</p>
                      <p className="text-luxury-silver text-sm farsi-nums">تنها {spotsRemaining} جا باقی مانده</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-luxury-black/30 rounded-lg">
                    <Shield className="w-5 h-5 text-success flex-shrink-0" />
                    <div>
                      <p className="text-luxury-white font-bold text-sm">گارانتی</p>
                      <p className="text-luxury-silver text-sm">بازگشت کامل وجه بدون سوال</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="bg-gradient-to-br from-luxury-gold/20 to-luxury-gold/10 rounded-2xl p-6 mb-6 border-2 border-luxury-gold/40">
            <div className="text-center mb-5">
              <h3 className="text-2xl font-bold text-luxury-white mb-2">
                آماده برای تحول؟
              </h3>
              <p className="text-luxury-silver text-sm mb-3">
                به 2,847 زن ایرانی موفق بپیوندید
              </p>
              <div className="inline-block bg-urgency/20 border border-urgency/40 rounded-full px-4 py-2 mb-4">
                <p className="text-urgency text-sm font-bold farsi-nums">
                  ⚡ فقط {spotsRemaining} جا باقی مانده
                </p>
              </div>
            </div>

            <Button 
              size="lg"
              className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-extrabold text-xl py-7 rounded-xl min-h-[60px] mb-3 shadow-lg"
              onClick={() => handleDirectPayment('bottom_cta')}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'در حال پردازش...' : 'ثبت‌نام با $97'}
              <Zap className="w-6 h-6 mr-2" />
            </Button>

            <div className="text-center mb-3">
              <p className="text-luxury-silver text-xs">
                یا سوالی دارید؟
              </p>
            </div>

            <Button 
              variant="outline"
              size="lg"
              onClick={handleWhatsAppClick}
              className="w-full border-2 border-luxury-white/40 bg-luxury-black/40 text-luxury-white hover:bg-luxury-white hover:text-luxury-black font-bold text-lg py-6 rounded-xl min-h-[56px]"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              پیام در واتساپ
            </Button>
          </div>

          {/* Trust Badges - Mobile */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
              <Shield className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-white text-sm font-bold">گارانتی 100%</p>
              <p className="text-success text-xs">بازگشت وجه</p>
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
              <Star className="w-8 h-8 text-warning fill-warning mx-auto mb-2" />
              <p className="text-white text-sm font-bold farsi-nums">4.9/5</p>
              <p className="text-warning text-xs farsi-nums">2,847 نظر</p>
            </div>
          </div>

        </main>

        {/* Sticky Bottom CTA - Always Visible on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-luxury-black/95 backdrop-blur-md border-t border-luxury-gold/30 p-4 z-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-luxury-gold font-extrabold text-2xl farsi-nums mb-0">$97</p>
              <p className="text-luxury-silver text-xs farsi-nums">{spotsRemaining} جا باقی</p>
            </div>
            <Button 
              size="lg"
              className="bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-extrabold text-lg px-8 py-6 rounded-xl min-h-[56px] min-w-[200px] shadow-lg"
              onClick={() => handleDirectPayment('sticky_cta')}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'پردازش...' : 'ثبت‌نام الان'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourageousWorkshop;
