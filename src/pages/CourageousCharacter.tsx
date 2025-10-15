import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  CheckCircle, 
  MessageCircle, 
  Timer, 
  Shield, 
  Star,
  Play,
  Gift,
  TrendingUp,
  Heart,
  Target,
  Zap,
  Phone,
  Mail,
  Globe,
  Crown,
  Diamond,
  Sparkles,
  Loader2
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
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 23, seconds: 45 });
  const [showStickyBtn, setShowStickyBtn] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchParams] = useSearchParams();
  const [spotsRemaining, setSpotsRemaining] = useState(97);
  const [viewersCount, setViewersCount] = useState(47);
  const [showExitIntent, setShowExitIntent] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Sticky button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBtn(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Exit intent popup
  useEffect(() => {
    let hasShown = false;
    const handleMouseLeave = (e: MouseEvent) => {
      if (!hasShown && e.clientY <= 0) {
        setShowExitIntent(true);
        hasShown = true;
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  // Meta Pixel tracking
  useEffect(() => {
    // Track PageView
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      
      // Track ViewContent with workshop-specific parameters
      window.fbq('track', 'ViewContent', {
        content_type: 'workshop',
        content_name: 'کارگاه آنلاین شخصیت شجاع',
        content_category: 'Live Training',
        value: 97,
        currency: 'USD'
      });
      
      // Custom event for CCW page visit
      window.fbq('trackCustom', 'CCWPageVisit', {
        workshop_title: 'کارگاه آنلاین شخصیت شجاع',
        workshop_type: 'live_online',
        user_type: 'workshop_prospect',
        language: 'farsi'
      });
    }

    // Track scroll depth for engagement
    let maxScroll = 0;
    const trackScrollDepth = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track engagement milestones
        if (scrollPercent >= 25 && maxScroll < 25) {
          window.fbq && window.fbq('trackCustom', 'WorkshopEngagement', {
            engagement_level: '25_percent_scroll',
            content_name: 'کارگاه شخصیت شجاع'
          });
        } else if (scrollPercent >= 50 && maxScroll < 50) {
          window.fbq && window.fbq('trackCustom', 'WorkshopEngagement', {
            engagement_level: '50_percent_scroll',
            content_name: 'کارگاه شخصیت شجاع'
          });
        } else if (scrollPercent >= 75 && maxScroll < 75) {
          window.fbq && window.fbq('trackCustom', 'WorkshopEngagement', {
            engagement_level: '75_percent_scroll',
            content_name: 'کارگاه شخصیت شجاع'
          });
        }
      }
    };

    window.addEventListener('scroll', trackScrollDepth);
    return () => window.removeEventListener('scroll', trackScrollDepth);
  }, []);

  const handleRegisterClick = (source: string = 'main_cta') => {
    // Track workshop registration interest
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'کارگاه آنلاین شخصیت شجاع',
        content_category: 'Workshop Registration',
        value: 97,
        currency: 'USD'
      });
      
      // Custom event for CCW registration
      window.fbq('trackCustom', 'CCWSignUp', {
        source: source,
        workshop_name: 'شخصیت شجاع',
        user_intent: 'high_conversion',
        language: 'farsi'
      });
    }
  };

  const handleWhatsAppClick = () => {
    // Track WhatsApp contact
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact', {
        content_name: 'Workshop Inquiry',
        content_category: 'WhatsApp Contact',
        value: 1,
        currency: 'USD'
      });
      
      // Custom event for WhatsApp interaction
      window.fbq('trackCustom', 'WorkshopInquiry', {
        source: 'workshop_page',
        contact_method: 'whatsapp',
        user_intent: 'needs_info',
        language: 'farsi'
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
      // Call the create-payment edge function
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
        // Redirect to Stripe checkout
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
        {/* Navigation Header - Mobile Optimized */}
        <header className="border-b border-luxury-accent/20 bg-luxury-black/95 backdrop-blur-md sticky top-0 z-50 shadow-luxury">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-luxury-text bg-clip-text text-transparent">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 inline-block ml-2 text-luxury-white" />
                آکادمی لیدی‌باس
              </h1>
              <Button variant="ghost" size="sm" asChild className="text-luxury-silver hover:text-luxury-white hover:bg-luxury-charcoal min-h-[44px] px-3">
                <Link to="/" className="flex items-center gap-2">
                  <span className="text-sm">بازگشت</span>
                  <ArrowLeft size={18} className="rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Video Section moved here - will come first */}

          {/* Video Section - Emphasized - First Thing on Page */}
          <div className="mb-8 px-4">
            <div className="bg-gradient-to-br from-urgency/20 to-urgency-dark/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-urgency/40 shadow-urgency">
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 bg-urgency text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-xs sm:text-sm mb-3 sm:mb-4 shadow-cta">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">ویدیو معرفی دوره آموزشی را حتماً تماشا کنید</span>
                </div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight whitespace-nowrap">
                  ویدیو معرفی دوره آموزشی کارکتر پرجرات
                </h2>
                <p className="text-white/90 text-sm sm:text-base max-w-2xl mx-auto">
                  در این ویدیو با جزئیات کامل دوره آموزشی و روش‌های تحول آفرین آشنا می‌شوید
                </p>
              </div>
              <div className="relative bg-gradient-to-r from-luxury-charcoal via-luxury-accent to-luxury-charcoal border border-luxury-silver/30 rounded-lg p-2 sm:p-3 shadow-luxury-glow">
                <div className="relative">
                  <div className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/kJeq6T9swJs"
                      title="کاراکتر پرجرات"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-white/90 text-xs sm:text-sm font-medium mb-4">
                  ⏱️ مدت زمان: 15 دقیقه | 🎯 این ویدیو می‌تواند نقطه عطف زندگی شما باشد
                </p>
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl font-extrabold rounded-xl sm:rounded-2xl shadow-lg min-h-[56px] sm:min-h-[64px] active:scale-95 transition-transform"
                  onClick={() => handleDirectPayment('video_cta')}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      در حال انتقال...
                    </>
                  ) : (
                    <>
                      <Zap className="ml-2 h-6 w-6" />
                      همین الان شروع کنید - فقط $۹۷
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Section - Workshop Title Prominent */}
          <section className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-luxury-white/10 text-luxury-white text-xs sm:text-sm font-bold mb-4 sm:mb-6 border border-luxury-white/20 backdrop-blur-sm">
              <Diamond className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              <span className="whitespace-nowrap">دوره آموزشی مخصوص خانم‌های مهاجر</span>
            </div>

            {/* Pricing Section - Mobile Optimized */}
            <div className="relative bg-gradient-to-br from-urgency/20 to-urgency-dark/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10 mx-2 sm:mx-4 border-2 border-urgency/40 shadow-urgency">
              <div className="absolute -top-3 right-4 sm:right-6 bg-urgency text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-cta">
                🔥 پیشنهاد ویژه!
              </div>
              <div className="text-center pt-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 text-white font-farsi leading-tight">
                  دوره آموزشی کارکتر پرجرات
                </h1>
                <p className="text-sm sm:text-base text-luxury-white mb-3 sm:mb-4 font-bold font-farsi">سرمایه‌گذاری در آینده خودتان</p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <span className="text-xl sm:text-2xl font-bold text-luxury-silver/50 line-through farsi-nums">$۴۹۷</span>
                  <span className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white farsi-nums drop-shadow-2xl">$۹۷</span>
                </div>
                <div className="bg-white text-urgency-dark rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-extrabold inline-block shadow-bold mb-3">
                  ۸۰% تخفیف - فقط امروز!
                </div>
                <div className="mt-4 p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <p className="text-white text-xs sm:text-sm font-medium">
                    💰 ارزش واقعی: <span className="font-bold farsi-nums">$497</span>
                  </p>
                  <p className="text-urgency-light text-xs mt-1 farsi-nums">
                    بعد از پر شدن ظرفیت، قیمت به $297 افزایش می‌یابد
                  </p>
                </div>
              </div>
            </div>

            {/* What You Get Section */}
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10 mx-2 sm:mx-4 border-2 border-green-500/40 shadow-lg">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center font-farsi">
                دقیقا چیا دریافت می‌کنی وقتی بلیط ۹۷ دلاری دوره آموزشی کارکترپرجرات رو می‌گیری؟
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">1</div>
                  <p className="text-white/90 text-sm sm:text-base">مجموعا ساعت آموزش آنلاین کارگاهی + ‌۶ ساعت آموزش ضبط شده آفلاین</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">2</div>
                  <p className="text-white/90 text-sm sm:text-base">سه تا جلسه دوساعته کارگاهی آنلاین (در گوگل میت)</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">3</div>
                  <p className="text-white/90 text-sm sm:text-base">همه جلسات آنلاین برای شما ضبط می‌شه و فیلم‌ش رو در اختیارت می‌داریم تا چندین بار مرور کنی.</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">4</div>
                  <p className="text-white/90 text-sm sm:text-base">یک ماه پشتیبانی (با ایمیل / واتسپ جدا مخصوص ورکشاپ) می‌تونی همه سوالاتو درباره کارکتر پرجرات بپرسی.</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">5</div>
                  <p className="text-white/90 text-sm sm:text-base">بیشتر از ۶ ساعت فایل صوتی و ویدیوی اضافه دریافت می‌کنی (جزییات تکنیک‌ها و نمونه دیالوگ‌های آماده ۲ زبانه)</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">6</div>
                  <p className="text-white/90 text-sm sm:text-base">جزوه ورک‌بوک ورکشاپ ۲ زبانه (شامل مثال+دیالوگ) بصورت PDF برای شما ارسال میشه و می‌تونی پرینت بگیری.</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">7</div>
                  <p className="text-white/90 text-sm sm:text-base">هدیه: بلیط وبینار (ذهن آگاهی و حفظ خونسردی) به همراه مدیتیشن مخصوص رو👇دریافت می‌کنی</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">8</div>
                  <p className="text-white/90 text-sm sm:text-base">عضو کانال تلگرامی مخصوص اعضای کاراکتر پرجرات میشی که به اطلاع‌رسانی‌ها و آپدیت‌های آینده ورکشاپ دسترسی داری</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">9</div>
                  <p className="text-white/90 text-sm sm:text-base">کتاب کاراکتر پرجرات رو بصورت صوتی (Audio Book) با صدای استاد راضیه لیدی‌باس هدیه دریافت می‌کنی.</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">10</div>
                  <p className="text-white/90 text-sm sm:text-base">ضمانت بازگشت ۱۰۰٪ وجه بدون سوال تا پایان ورکشاپ (به مدت یک ماه)</p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">11</div>
                  <p className="text-white/90 text-sm sm:text-base">عضو رسمی آکادمی بین المللی لیدی‌باس میشی و از این به بعد بالاترین تخفیف‌ها و اشانتیون‌ها اول به شما اطلاع‌رسانی میشه.</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-white text-2xl sm:text-3xl font-bold">👇👇👇👇</p>
              </div>
            </div>
            
            {/* CTA Buttons - Mobile Optimized */}
            <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center mb-10 sm:mb-12 px-4">
              <Button 
                size="lg" 
                className="cta-button w-full max-w-md text-white px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl font-extrabold rounded-xl sm:rounded-2xl shadow-cta min-h-[56px] sm:min-h-[64px] active:scale-95 transition-transform"
                onClick={() => handleDirectPayment('main_cta')}
                disabled={isProcessingPayment}
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                {isProcessingPayment ? 'در حال پردازش...' : 'ثبت‌نام فوری - فقط $97'}
              </Button>
              <p className="text-urgency-light text-xs sm:text-sm font-bold farsi-nums">
                ⚡ فقط {spotsRemaining} جای خالی باقی مانده!
              </p>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="w-full max-w-md border-2 border-luxury-white/60 bg-luxury-black/60 text-luxury-white hover:bg-luxury-white hover:text-luxury-black px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl backdrop-blur-sm min-h-[56px] active:scale-95 transition-transform"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                سوالی دارید? با ما صحبت کنید
              </Button>
            </div>

            {/* Trust Indicators - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center max-w-2xl mx-auto px-2 sm:px-4">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-5 bg-success/10 rounded-lg sm:rounded-xl border-2 border-success/30 backdrop-blur-sm">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
                <span className="text-white text-xs sm:text-sm font-bold leading-tight">گارانتی 100%</span>
                <span className="text-success text-[10px] sm:text-xs">بدون سوال</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-5 bg-urgency/10 rounded-lg sm:rounded-xl border-2 border-urgency/30 backdrop-blur-sm">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-urgency" />
                <span className="text-white text-xs sm:text-sm font-bold farsi-nums leading-tight">{spotsRemaining} جای خالی</span>
                <span className="text-urgency-light text-[10px] sm:text-xs">تقاضا بالا!</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-5 bg-warning/10 rounded-lg sm:rounded-xl border-2 border-warning/30 backdrop-blur-sm">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-warning fill-warning" />
                <span className="text-white text-xs sm:text-sm font-bold leading-tight">۴.۹/۵ امتیاز</span>
                <span className="text-warning-light text-[10px] sm:text-xs farsi-nums">2,847 نظر</span>
              </div>
            </div>
          </section>

          {/* Success Story Box - Moved to Middle & Compact */}
          <section className="mb-10 px-4 animate-fade-in-up">
            <div className="bg-gradient-success rounded-xl p-5 sm:p-6 border border-success/30 shadow-glow max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight">
                  "از فردی خجالتی که حتی نمی‌توانستم در جمع حرف بزنم، به مدیری شدم که با اعتماد به نفس تیمی 12 نفره را رهبری می‌کنم"
                </h3>
                <p className="text-white/90 text-xs sm:text-sm">- ساناز م.، مدیر محصول در شرکت تکنولوژی، تورنتو</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white/20 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 farsi-nums">89%</div>
                  <div className="text-[10px] sm:text-xs font-medium text-white">افزایش اعتماد به نفس</div>
                </div>
                <div className="text-center p-3 bg-white/20 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 farsi-nums">2,847</div>
                  <div className="text-[10px] sm:text-xs font-medium text-white">زن ایرانی تحول یافته</div>
                </div>
                <div className="text-center p-3 bg-white/20 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 farsi-nums">94%</div>
                  <div className="text-[10px] sm:text-xs font-medium text-white">رضایت دانشجویان</div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section - Mobile Optimized */}
          <section className="mb-10 sm:mb-12 px-4">
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-block bg-success/20 text-success px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm mb-3 sm:mb-4 border border-success/40 font-farsi">
                ✨ موفقیت‌های واقعی
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4 font-farsi">
                داستان‌های تحول واقعی
              </h2>
              <p className="text-luxury-silver text-sm sm:text-base lg:text-lg px-2 font-farsi whitespace-nowrap">زنانی که با کاراکتر پرجرات زندگی‌شان را متحول کردند</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {[
                {
                  name: "مریم ک.",
                  title: "مهندس نرم‌افزار، ونکوور",
                  result: "افزایش حقوق 40%",
                  quote: "قبلاً در مذاکره حقوق خجالت می‌کشیدم. بعد از کارگاه، با اعتماد به نفس توانستم 40% افزایش حقوق بگیرم!"
                },
                {
                  name: "پریسا ج.",
                  title: "صاحب کسب‌وکار، لس‌آنجلس",
                  result: "درآمد 3 برابر",
                  quote: "نمی‌توانستم نه بگویم و پروژه‌های بی‌سود قبول می‌کردم. حالا درآمدم 3 برابر شده و فقط با مشتریان ایده‌آل کار می‌کنم."
                },
                {
                  name: "نگار ا.",
                  title: "مدیر بازاریابی، تورنتو",
                  result: "ارتقای شغلی",
                  quote: "در جلسات سکوت می‌کردم و ایده‌هایم را مطرح نمی‌کردم. بعد از 3 ماه، مدیر تیم بازاریابی شدم!"
                },
                {
                  name: "شیدا م.",
                  title: "معلم، نیویورک",
                  result: "روابط بهتر",
                  quote: "با خانواده همسرم مشکل داشتم و حرفم را نمی‌زدم. حالا مرزهایم را مشخص می‌کنم و روابطم بهتر شده."
                },
                {
                  name: "لیلا ر.",
                  title: "کارآفرین، سیدنی",
                  result: "کسب‌وکار راه‌اندازی",
                  quote: "سال‌ها ایده داشتم اما ترس از قضاوت مانع می‌شد. الان کسب‌وکار خودم را دارم و مشتریان زیادی دارم!"
                },
                {
                  name: "آیدا س.",
                  title: "پرستار، دوبی",
                  result: "اضطراب کاهش یافت",
                  quote: "اضطراب اجتماعی داشتم و از رفتن به مهمانی‌ها می‌ترسیدم. الان با راحتی ارتباط می‌گیرم و دوستان جدید پیدا کرده‌ام."
                }
              ].map((testimonial, index) => (
                <Card key={index} className="bg-luxury-charcoal/60 border-2 border-luxury-white/30 backdrop-blur-sm hover:border-success transition-all">
                  <CardContent className="p-5 sm:p-7">
                    <div className="flex items-center gap-1 mb-3 sm:mb-4">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-luxury-white text-sm sm:text-base leading-relaxed mb-4 sm:mb-5 italic font-medium">
                      "{testimonial.quote}"
                    </p>
                    <div className="border-t border-luxury-white/20 pt-3 sm:pt-4">
                      <div className="font-bold text-white text-sm sm:text-base mb-1">{testimonial.name}</div>
                      <div className="text-luxury-silver text-xs sm:text-sm mb-2 sm:mb-3">{testimonial.title}</div>
                      <div className="bg-success/30 text-success border border-success/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold inline-block">
                        ✓ {testimonial.result}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Problem Section - Mobile Optimized */}
          <section className="mb-10 sm:mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-charcoal to-luxury-accent rounded-xl p-5 sm:p-6 border border-luxury-white/10 shadow-luxury">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-center mb-5 sm:mb-6 text-luxury-white font-farsi leading-tight px-2 whitespace-nowrap">
                خودتان را در موقعیت‌های زیر تصور کنید:
              </h2>
              <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto mb-5 sm:mb-6">
                {[
                  'در یک صف طولانی ایستادید و فردی مسن از شما خواهش می‌کند نوبت خود را به او بدهید.',
                  'در جلسه مصاحبه شغلی، توانمندی‌های خود را دست کم می‌گیرید و رد صلاحیت می‌شوید.',
                  'پولی به کسی قرض داده‌اید و با اینکه خودتان نیاز مالی دارید، خجالت می‌کشید پیگیری کنید.',
                  'فرد مهمی را می‌بینید اما اعتماد به نفس ارتباط گرفتن با او را ندارید و دور می‌شوید.'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-luxury-black/30 rounded-lg border border-luxury-white/5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-luxury-white rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-luxury-silver text-xs sm:text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-center space-y-4 bg-luxury-white/5 rounded-lg p-5 border border-luxury-white/10">
                <p className="text-luxury-white font-bold text-base sm:text-lg font-farsi leading-relaxed">شما خجالتی و کمرو هستید و فرصت‌ها یکی یکی از جلوی چشمتان رد می‌شوند.</p>
                <p className="text-luxury-silver text-sm sm:text-base leading-relaxed font-farsi">برای از بین بردن چالش‌هایی که با آن دست و پنجه نرم می‌کنید، یک راه حل قطعی و تضمینی با کمترین تلاش وجود دارد:</p>
                <p className="text-luxury-white font-bold text-xl sm:text-2xl bg-gradient-luxury-text bg-clip-text text-transparent font-farsi">دوره آموزشی کارکتر پرجرات</p>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-xl p-6 border border-luxury-white/20 shadow-luxury">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-luxury-white font-farsi">
                با تقویت کاراکتر پرجرات:
              </h2>
              <div className="grid gap-3 max-w-2xl mx-auto">
                {[
                  'اعتماد به نفس شما تقویت می‌شود',
                  'با ترس‌های همیشگی خود خداحافظی می‌کنید',
                  'توانمندی‌های خود را بهتر بروز می‌دهید',
                  'تصمیم‌های مهم را بدون نگرانی از قضاوت دیگران می‌گیرید',
                  'با سطح بالایی از استرس برای همیشه خلاص می‌شوید',
                  'مطالبات خود را به راحتی از دیگران درخواست می‌کنید'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-luxury-black/30 rounded-lg border border-luxury-white/5">
                    <CheckCircle className="w-5 h-5 text-luxury-white flex-shrink-0" />
                    <span className="text-luxury-silver text-sm leading-relaxed font-farsi">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Cost of Inaction Section */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl p-6 border border-red-500/30 shadow-luxury">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-center mb-6 text-luxury-white font-farsi whitespace-nowrap">
                هزینه واقعی تغییر نکردن چیست؟
              </h2>
              <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                <div className="bg-luxury-black/40 rounded-lg p-5 border border-red-500/20">
                  <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 font-farsi">
                    <span className="text-2xl">💸</span>
                    هزینه مالی
                  </h3>
                  <ul className="space-y-2 text-luxury-silver text-sm font-farsi">
                    <li>• از دست دادن فرصت‌های شغلی با حقوق بالاتر</li>
                    <li>• عدم توانایی در مذاکره برای افزایش حقوق</li>
                    <li>• قبول کردن پروژه‌های کم‌درآمد چون نمی‌توانید نه بگویید</li>
                    <li>• پرداخت بیشتر برای خدمات چون قیمت‌ها را چالش نمی‌کنید</li>
                  </ul>
                </div>
                <div className="bg-luxury-black/40 rounded-lg p-5 border border-red-500/20">
                  <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 font-farsi">
                    <span className="text-2xl">💔</span>
                    هزینه عاطفی
                  </h3>
                  <ul className="space-y-2 text-luxury-silver text-sm font-farsi">
                    <li>• احساس پشیمانی از فرصت‌های از دست رفته</li>
                    <li>• استرس و اضطراب مداوم در موقعیت‌های اجتماعی</li>
                    <li>• کاهش عزت نفس و اعتماد به نفس</li>
                    <li>• تنهایی و عدم توانایی در ایجاد روابط معنادار</li>
                  </ul>
                </div>
                <div className="bg-luxury-black/40 rounded-lg p-5 border border-red-500/20">
                  <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 font-farsi">
                    <span className="text-2xl">⏰</span>
                    هزینه زمانی
                  </h3>
                  <ul className="space-y-2 text-luxury-silver text-sm font-farsi">
                    <li>• سال‌ها انتظار برای "زمان مناسب" که هرگز نمی‌رسد</li>
                    <li>• اتلاف وقت در روابط یک‌طرفه و ناسالم</li>
                    <li>• ماندن در شغل‌های نامناسب سال‌ها بیشتر از حد معمول</li>
                    <li>• عدم پیشرفت در مسیر شغلی به دلیل ترس از درخواست</li>
                  </ul>
                </div>
                <div className="bg-luxury-black/40 rounded-lg p-5 border border-red-500/20">
                  <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 font-farsi">
                    <span className="text-2xl">🚫</span>
                    هزینه فرصت
                  </h3>
                  <ul className="space-y-2 text-luxury-silver text-sm font-farsi">
                    <li>• از دست دادن فرصت‌های شبکه‌سازی و ارتباطات</li>
                    <li>• عدم توانایی در راه‌اندازی کسب‌وکار دلخواه</li>
                    <li>• نتوانستن در مذاکرات مهم شرکت کنید</li>
                    <li>• محروم شدن از رهبری و تاثیرگذاری در جامعه</li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-6 p-5 bg-gradient-to-r from-luxury-white/10 to-luxury-white/5 rounded-lg border border-luxury-white/20">
                <p className="text-luxury-white font-bold text-base sm:text-lg mb-2 font-farsi">
                  هزینه تغییر نکردن بسیار بیشتر از سرمایه‌گذاری $97 است
                </p>
                <p className="text-luxury-silver text-sm font-farsi">
                  یک تصمیم امروز می‌تواند مسیر 10 سال آینده شما را تغییر دهد
                </p>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 rounded-xl p-6 border border-luxury-white/20 backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-luxury-white font-farsi">
                چرا کاراکتر پرجرات متفاوت است؟
              </h2>
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-luxury-white/20">
                      <th className="text-right p-4 text-luxury-white font-bold"></th>
                      <th className="text-center p-4 text-luxury-white font-bold bg-green-500/10">کاراکتر پرجرات</th>
                      <th className="text-center p-4 text-luxury-silver">دوره‌های سنتی</th>
                    </tr>
                  </thead>
                  <tbody className="text-luxury-silver">
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">متناسب با فرهنگ ایرانی</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-red-500">✗</td>
                    </tr>
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">مخصوص زنان مهاجر</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-red-500">✗</td>
                    </tr>
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">آموزش دو زبانه (فارسی-انگلیسی)</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-red-500">✗</td>
                    </tr>
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">12 تکنیک عملی قابل اجرا</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-luxury-silver">تئوری عمومی</td>
                    </tr>
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">ضبط دائمی جلسات</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-red-500">محدود</td>
                    </tr>
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">بونس‌های ارزشمند ($300)</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-red-500">✗</td>
                    </tr>
                    <tr className="border-b border-luxury-white/10">
                      <td className="p-4 font-medium">گارانتی بازگشت وجه</td>
                      <td className="text-center p-4 bg-green-500/5"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 text-red-500">✗</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-luxury-white">قیمت</td>
                      <td className="text-center p-4 bg-green-500/10 font-bold text-green-400 farsi-nums">$97</td>
                      <td className="text-center p-4 text-luxury-silver farsi-nums">$300-$500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Target Audience Section */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-charcoal to-luxury-accent rounded-xl p-6 border border-luxury-white/10 shadow-luxury">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-luxury-white font-farsi">
                دوره کاراکتر پرجرات برای شما مناسب است اگر:
              </h2>
              <div className="grid gap-3 max-w-2xl mx-auto">
                {[
                  'موقع صحبت در جمع، تپش قلب و لرزش صدا می‌گیرید',
                  'خجالت بارها و بارها مانع پیشرفت شما در زندگی شخصی و حرفه‌ای‌تان شده است',
                  'می‌خواهید با تقویت خودباوری و عزت نفس، ارتباطات بین فردی را تقویت کنید',
                  'در موقعیت‌های اجتماعی اضطراب دارید و می‌خواهید با این احساسات مقابله کنید',
                  'به دنبال یادگیری تکنیک‌ها و راهکارهایی هستید تا در برابر چالش‌ها شجاعت نشان دهید'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-luxury-black/30 rounded-lg border border-luxury-white/5">
                    <Target className="w-5 h-5 text-luxury-white flex-shrink-0 mt-1" />
                    <span className="text-luxury-silver text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6 p-5 bg-luxury-white/10 rounded-lg border border-luxury-white/20">
                <p className="text-luxury-white font-bold text-lg">شما لایق یک زندگی پر از اعتماد به نفس هستید؛</p>
                <p className="text-luxury-white font-bold text-lg">کاراکتر پرجرات را تجربه کنید و کمرویی را شکست دهید!</p>
              </div>
            </div>
          </section>

          {/* Solution Section - Mobile Optimized */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-xl p-6 border border-luxury-white/20 shadow-luxury">
              <div className="text-center max-w-lg mx-auto">
                <Crown className="w-10 h-10 text-luxury-white mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-luxury-white font-farsi leading-tight">
                  تحول شما در ۳ هفته
                </h2>
                <p className="text-sm text-luxury-silver mb-5 leading-relaxed">
                  از زنی تردیدآمیز به رهبری مطمئن تبدیل شوید
                </p>
                <Button 
                  size="lg" 
                  className="w-full max-w-xs bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-5 text-lg font-bold rounded-xl shadow-luxury"
                  onClick={() => handleDirectPayment('solution')}
                  disabled={isProcessingPayment}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-5 h-5" />
                      <span>{isProcessingPayment ? 'در حال پردازش...' : 'میخواهم پرجرات بشم!'}</span>
                    </div>
                    {!isProcessingPayment && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-luxury-black/60 farsi-nums">$۴۹۷</span>
                        <span className="farsi-nums">$۹۷ فقط برای ۱۰۰ نفر اول</span>
                      </div>
                    )}
                  </div>
                </Button>
              </div>
            </div>
          </section>

          {/* Pricing & Bonuses Section - Mobile Optimized */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/15 to-luxury-white/5 backdrop-blur-sm rounded-xl p-6 border border-luxury-white/30 shadow-luxury">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-luxury-white font-farsi leading-tight">
                  بونس ویژه ایرانیان خارج از کشور
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-luxury-white to-transparent mx-auto mb-4"></div>
              </div>
              
              {/* Original Price Display */}
              <div className="text-center mb-6">
                <p className="text-luxury-silver text-sm mb-2">قیمت اصلی بلیط کارگاه:</p>
                <div className="text-3xl font-bold text-luxury-white farsi-nums mb-4">$۴۹۷</div>
              </div>

              {/* Bonuses List */}
              <div className="space-y-4 mb-6">
                <div className="bg-luxury-black/30 rounded-lg p-4 border border-luxury-white/10">
                  <div className="flex items-start gap-3">
                    <div className="bg-luxury-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-luxury-white font-bold text-sm">۱</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-luxury-white font-bold text-sm mb-2">ورک‌بوک ۱۲ دیالوگ جرأت‌مندانه با دیالوگهای ۲ زبانه</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-luxury-silver text-lg font-bold line-through farsi-nums">$۲۰۰</span>
                        <span className="bg-luxury-white text-luxury-black px-2 py-1 rounded-full text-xs font-bold">رایگان</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-luxury-black/30 rounded-lg p-4 border border-luxury-white/10">
                  <div className="flex items-start gap-3">
                    <div className="bg-luxury-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-luxury-white font-bold text-sm">۲</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-luxury-white font-bold text-sm mb-2">کتاب صوتی کاراکتر پرجرأت با صدای راضیه لیدی‌باس</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-luxury-silver text-lg font-bold line-through farsi-nums">$۵۰</span>
                        <span className="bg-luxury-white text-luxury-black px-2 py-1 rounded-full text-xs font-bold">رایگان</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-luxury-black/30 rounded-lg p-4 border border-luxury-white/10">
                  <div className="flex items-start gap-3">
                    <div className="bg-luxury-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-luxury-white font-bold text-sm">۳</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-luxury-white font-bold text-sm mb-2">وبینار ذهن آگاهی و حفظ خونسردی (برای رفع اضطراب)</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-luxury-silver text-lg font-bold line-through farsi-nums">$۵۰</span>
                        <span className="bg-luxury-white text-luxury-black px-2 py-1 rounded-full text-xs font-bold">رایگان</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Value vs Special Price */}
              <div className="bg-gradient-to-r from-luxury-white/10 to-luxury-white/5 rounded-lg p-4 border border-luxury-white/20 text-center">
                <div className="mb-3">
                  <p className="text-luxury-silver text-sm mb-1">مجموع ارزش:</p>
                  <div className="text-2xl font-bold text-luxury-silver line-through farsi-nums">$۷۹۸</div>
                </div>
                <div className="bg-gradient-to-r from-luxury-white/20 to-luxury-white/10 rounded-lg p-3 border border-luxury-white/30">
                  <p className="text-luxury-white text-sm font-bold mb-2">قیمت ویژه برای ۱۰۰ نفر اول:</p>
                  <div className="text-4xl font-bold text-luxury-white farsi-nums mb-2">$۹۷</div>
                  <div className="bg-luxury-white text-luxury-black rounded-full px-4 py-2 text-xs font-bold inline-block">
                    صرفه‌جویی ۸۰٪ - فقط امروز!
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workshop Details - Mobile Optimized */}
          <section className="grid gap-4 mb-12 px-4">
            {/* Workshop Curriculum Section - Detailed */}
            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-luxury-white text-lg sm:text-xl">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-luxury-silver" />
                  ۱۲ تکنیک کاراکتر پرجرأت
                </CardTitle>
                <p className="text-luxury-silver text-xs sm:text-sm mt-2">
                  هر تکنیک با مثال‌های واقعی و قابل اجرا در زندگی روزمره
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid gap-3 sm:gap-4">
                  {[
                    { 
                      title: "نه گفتن", 
                      subtitle: "Say No",
                      description: "یاد بگیرید چگونه بدون احساس گناه و با اعتماد به نفس به درخواست‌های نامناسب «نه» بگویید. این تکنیک به شما کمک می‌کند مرزهای خود را حفظ کنید و از سواستفاده دیگران جلوگیری کنید."
                    },
                    { 
                      title: "بله گفتنِ هوشمند", 
                      subtitle: "Wise Yes",
                      description: "تشخیص دهید چه زمانی باید «بله» بگویید و چگونه شرایط خود را مطرح کنید. این مهارت به شما کمک می‌کند فرصت‌های مناسب را از دست ندهید اما در عین حال حقوق خود را حفظ کنید."
                    },
                    { 
                      title: "بیان اَسِرتیو", 
                      subtitle: "Assertive Expression",
                      description: "نظرات و احساسات خود را با قاطعیت و احترام بیان کنید. این تکنیک به شما کمک می‌کند صدایتان شنیده شود بدون اینکه تهاجمی یا منفعل باشید."
                    },
                    { 
                      title: "ارائه کردن", 
                      subtitle: "Presenting",
                      description: "با اعتماد به نفس در جمع صحبت کنید و ایده‌های خود را به شکل حرفه‌ای ارائه دهید. این مهارت در محیط کار، جلسات خانوادگی و موقعیت‌های اجتماعی بسیار کلیدی است."
                    },
                    { 
                      title: "اظهار نظر کردن", 
                      subtitle: "Voicing Opinions",
                      description: "یاد بگیرید دیدگاه‌های خود را در گفتگوها و بحث‌ها مطرح کنید. دیگر در جلسات سکوت نکنید و از فرصت‌های شغلی به دلیل عدم اظهار نظر محروم نشوید."
                    },
                    { 
                      title: "بله گرفتن", 
                      subtitle: "Getting a Yes",
                      description: "تکنیک‌های مذاکره و متقاعدسازی را یاد بگیرید تا بتوانید از دیگران «بله» بگیرید. این مهارت در مذاکرات حقوق، فروش، و درخواست‌های شخصی بسیار مفید است."
                    },
                    { 
                      title: "حق گرفتن", 
                      subtitle: "Claiming Rights",
                      description: "مطالبات و حقوق قانونی خود را پیگیری کنید. یاد بگیرید چگونه پول قرض داده شده را مطالبه کنید یا در مورد حقوق و شرایط کاری خود مذاکره کنید."
                    },
                    { 
                      title: "پاسخ به انتقاد", 
                      subtitle: "Handling Feedback",
                      description: "به انتقادها و نظرات منفی به شکل سازنده و بدون احساس حمله شخصی پاسخ دهید. این تکنیک به شما کمک می‌کند از انتقادها برای رشد استفاده کنید نه برای شکستن."
                    },
                    { 
                      title: "جلوگیری از حق خوری", 
                      subtitle: "Preventing Exploitation",
                      description: "رفتارهای سواستفاده‌گرانه را شناسایی کنید و از خود در برابر افراد زورگو محافظت کنید. دیگر اجازه ندهید دیگران از مهربانی شما سواستفاده کنند."
                    },
                    { 
                      title: "مدیریت تعارض‌ها", 
                      subtitle: "Conflict Management",
                      description: "درگیری‌ها و اختلافات را به شکل سازنده و بدون ترس مدیریت کنید. این مهارت در روابط خانوادگی، دوستانه و شغلی بسیار حیاتی است."
                    },
                    { 
                      title: "مرزبندی حریم", 
                      subtitle: "Boundaries",
                      description: "مرزهای شخصی، عاطفی و حرفه‌ای خود را مشخص و حفظ کنید. یاد بگیرید چگونه با افرادی که مرزها را نقض می‌کنند برخورد کنید."
                    },
                    { 
                      title: "مذاکرهٔ روزمره", 
                      subtitle: "Everyday Negotiation",
                      description: "در موقعیت‌های روزمره مثل خرید، استخدام، و درخواست از همکاران مذاکره کنید. این مهارت می‌تواند هزینه‌های شما را کاهش و درآمدتان را افزایش دهد."
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-luxury-black/30 rounded-lg sm:rounded-xl border border-luxury-white/10 hover:border-luxury-white/20 transition-all p-4 sm:p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-luxury-white/15 rounded-full text-xs sm:text-sm font-bold text-luxury-white flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-luxury-white text-base sm:text-lg font-bold leading-tight mb-1">{item.title}</div>
                          <div className="text-luxury-silver/70 text-xs sm:text-sm mb-2">{item.subtitle}</div>
                        </div>
                      </div>
                      <p className="text-luxury-silver text-xs sm:text-sm leading-relaxed mr-10">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Program Updates Section */}
            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury rounded-xl mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-luxury-white text-lg">
                  <Sparkles className="w-5 h-5 text-luxury-silver" />
                  برنامه‌های آپدیت شده کاراکتر پرجرأت ۲۰۲۶
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {[
                    'دوستیابی و ساختن ارتباطات',
                    'حفظ خونسردی در لحظات پراضطراب',
                    'نشتی‌گیری احساسی و ارتباطی',
                    'اعتمادبه‌نفس کلامی دو‌زبانه'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-luxury-black/30 rounded-lg border border-luxury-white/5 hover:bg-luxury-black/50 transition-colors">
                      <Crown className="w-5 h-5 text-luxury-white mt-0.5 flex-shrink-0" />
                      <span className="text-luxury-silver text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-luxury-white text-lg">
                  <Clock className="w-5 h-5 text-luxury-silver" />
                  جزئیات کارگاه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-luxury-silver">
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span className="text-sm">مدت:</span>
                  <span className="font-bold text-luxury-white text-sm">۳ هفته</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span className="text-sm">پلتفرم:</span>
                  <span className="font-bold text-luxury-white text-sm">Google Meets</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span className="text-sm">ظرفیت:</span>
                  <span className="font-bold text-luxury-white text-sm">۱۰۰۰ خانم</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span className="text-sm">ضبط:</span>
                  <span className="font-bold text-luxury-white text-sm">همیشگی</span>
                </div>
              </CardContent>
            </Card>

            {/* Advantages Section - Comprehensive */}
            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-luxury-white text-xl">
                  <Award className="w-6 h-6 text-luxury-silver" />
                  مزایای شرکت در دوره آموزشی کارکتر پرجرات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advantage 1 */}
                <div className="bg-luxury-white/5 rounded-lg p-5 border border-luxury-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-luxury-white/20 rounded-full p-2 flex-shrink-0">
                      <Globe className="w-5 h-5 text-luxury-white" />
                    </div>
                    <h3 className="text-luxury-white font-bold text-base">➕ دوره ای منطبق با فرهنگ کشورمان</h3>
                  </div>
                  <p className="text-luxury-silver text-sm leading-relaxed">
                    شاید وقتی صحبت از آموزش درباره کاراکتر پرجرات می‌شود، به کتاب‌های ترجمه شده و مقالات خارجی می‌رسید. یا دوره‌هایی که تلاش می‌کنند با تقلید آموزش‌ از مدرس‌های اروپایی و آمریکایی، حرفی بزنند. اما باید بپذیریم که «خجالت» مفهومی بیگانه با «فرهنگ» نیست. آموزش‌های دوره کاراکتر پرجرات، منطبق با فرهنگ ایرانی طراحی شده و شما مثال‌ها و موارد آموزشی را کاملا درک می‌کنید و برایتان ملموس است.
                  </p>
                </div>

                {/* Advantage 2 */}
                <div className="bg-luxury-white/5 rounded-lg p-5 border border-luxury-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-luxury-white/20 rounded-full p-2 flex-shrink-0">
                      <Shield className="w-5 h-5 text-luxury-white" />
                    </div>
                    <h3 className="text-luxury-white font-bold text-base">➕ دوره سازش به پایان رسیده…</h3>
                  </div>
                  <p className="text-luxury-silver text-sm leading-relaxed">
                    تعداد افرادی که از خجالتی بودن دیگران سواستفاده می‌کنند کم نیست؛ در محیط کار، اداره‌ها، مدرسه و دانشگاه و جامعه آن‌ها را می‌بینیم. کسانی که بی مسئولیتی خود را گردن افراد کمرو می‌اندازند تا موفقیت‌ها به نام خودشان ثبت شود. اما «سازش» اصلا راهکار مناسبی برای مقابله با این افراد نیست. وقت آن رسیده که آموزش ببینید و قوی شوید.
                  </p>
                </div>

                {/* Advantage 3 */}
                <div className="bg-luxury-white/5 rounded-lg p-5 border border-luxury-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-luxury-white/20 rounded-full p-2 flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-luxury-white" />
                    </div>
                    <h3 className="text-luxury-white font-bold text-base">➕ «کاراکتر پرجرات» یک صرفه جویی تمام عیار است!</h3>
                  </div>
                  <p className="text-luxury-silver text-sm leading-relaxed mb-3">
                    تماشای دوره کاراکتر پرجرات، برای شما صرفه جویی محسوب می‌شود:
                  </p>
                  <div className="space-y-2 mr-4">
                    {[
                      'صرفه جویی در زمان: وقت خود را به زورگوها اختصاص نمی‌دهید',
                      'در انرژی: به جای تن دادن اجباری به خواسته‌های دیگران، برای خودتان انرژی نگه می‌دارید',
                      'در احساسات منفی: مدام خودتان را بابت خورده شدن حقتان سرزنش نمی‌کنید',
                      'در پول: مطالبات خود را زنده می‌کنید و مجبور نیستید برخلاف میلتان به کسی پول قرض دهید'
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-luxury-white flex-shrink-0 mt-0.5" />
                        <span className="text-luxury-silver text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advantage 4 */}
                <div className="bg-luxury-white/5 rounded-lg p-5 border border-luxury-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-luxury-white/20 rounded-full p-2 flex-shrink-0">
                      <Crown className="w-5 h-5 text-luxury-white" />
                    </div>
                    <h3 className="text-luxury-white font-bold text-base">چرا رفع خجولی و کم حرفی مهارتی ضروری در مهاجرت است؟</h3>
                  </div>
                  <p className="text-luxury-silver text-sm leading-relaxed mb-3">
                    در غرب که نحوه معرفی و نمایش توانمندی بسیار مهم‌تر از تخصص است، شما برای رسیدن به جایگاه‌های اجتماعی و شغلی نیاز به اعتماد به نفس و کاراکتر پرجرات دارید. از طرفی، افراد خجالتی معمولا فرصت خوبی را برای افراد زورگو فراهم می‌کنند؛ گویا دیوارهای کوتاهی هستند که دیگران را به پایمال شدن حقوق خود تشویق می‌کنند!
                  </p>
                  <p className="text-luxury-silver text-sm leading-relaxed">
                    بنابراین یک بار برای همیشه با غول بی رحم خجالت مبارزه کنید و به تماشای تغییرات مثبتی که بعد از آن در زندگی‌تان رخ می‌دهد بنشینید.
                  </p>
                </div>

                {/* Final CTA in advantages */}
                <div className="bg-gradient-luxury rounded-lg p-5 border border-luxury-white/20 text-center">
                  <p className="text-luxury-white font-bold text-lg mb-2">
                    خجالت، سد سیمانی بین شما و رویاهایتان است؛
                  </p>
                  <p className="text-luxury-white font-bold text-lg">
                    با ابزار «کاراکتر پرجرات» آن را بشکنید!
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Enhanced Guarantee Section */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-xl p-6 border border-green-500/30 shadow-luxury">
              <div className="text-center max-w-2xl mx-auto">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-luxury-white font-farsi">
                  3 ضمانت قدرتمند برای آرامش خاطر شما
                </h2>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-luxury-black/30 rounded-lg p-5 border border-green-500/20">
                    <div className="text-3xl mb-2">💯</div>
                    <h3 className="text-luxury-white font-bold mb-2">ضمانت رضایت</h3>
                    <p className="text-luxury-silver text-sm">اگر تا پایان اولین جلسه راضی نبودید، کل پول شما برگشت داده می‌شود</p>
                  </div>
                  <div className="bg-luxury-black/30 rounded-lg p-5 border border-green-500/20">
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className="text-luxury-white font-bold mb-2">ضمانت نتیجه</h3>
                    <p className="text-luxury-silver text-sm">اگر تکنیک‌ها را اجرا کنید و تغییری نبینید، پول شما برمی‌گردد</p>
                  </div>
                  <div className="bg-luxury-black/30 rounded-lg p-5 border border-green-500/20">
                    <div className="text-3xl mb-2">⏱️</div>
                    <h3 className="text-luxury-white font-bold mb-2">ضمانت زمانی</h3>
                    <p className="text-luxury-silver text-sm">تا پایان دوره آموزشی وقت دارید تصمیم بگیرید - بدون هیچ سوالی</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-luxury-white/10 rounded-lg">
                  <p className="text-luxury-white font-bold">
                    چرا این ضمانت‌ها را می‌دهیم؟ چون 94% دانشجویان ما کاملاً راضی هستند!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Investment Cost Section */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-luxury-white/20 shadow-luxury">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-luxury-white font-farsi">
                  مبلغ سرمایه‌گذاری شما برای دوره آموزشی کارکتر پرجرات
                </h2>
                <div className="inline-block bg-urgency/20 text-urgency px-6 py-3 rounded-full font-bold text-sm sm:text-base border border-urgency/40">
                  یک درخواست جدی! لطفاً این مبالغ را یادداشت کنید
                </div>
              </div>

              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 mb-8">
                {[
                  {
                    icon: "💸",
                    text: "دوستی از شما پول خواسته و شما نتوانسته‌اید به او «نه» بگویید. ماه‌ها و سال‌ها پس از قرض دادن، پول به دست شما نرسیده. لطفا این مبلغ را یادداشت کنید."
                  },
                  {
                    icon: "💼",
                    text: "در مصاحبۀ کاری دوست داشته‌اید از حقوق و شرایط مورد درخواست خود بگویید اما نتوانسته‌اید. حالا دستمزد شما خیلی پایین‌تر از رقمی است که دوست داشتید دریافت کنید. لطفا این تفاوت مبلغ را هم یادداشت کنید."
                  },
                  {
                    icon: "📈",
                    text: "می‌خواهید به مدیر خود بگویید که حقوق شما را اضافه کند، اما هنوز نتوانسته‌اید حرف خود را بزنید. لطفا تفاوت این مبلغ‌ها را یادداشت کنید."
                  },
                  {
                    icon: "🏠",
                    text: "می‌خواهید خانه‌تان را رهن و اجاره بدهید اما خجالت می‌کشید درست و حسابی چانه بزنید. چند دلار این وسط از جیب‌تان رفته؟ لطفا آن را یادداشت کنید."
                  },
                  {
                    icon: "🚗",
                    text: "همکارتان ماشین شما را قرض می‌خواهد، اصلا دلتان نمی‌خواهد ماشین‌تان را دست او بدهید، ولی نمی‌دانید چطور «نه» بگویید و در رودربایستی گیر می‌کنید. حساب کنید اگر قرار بود آن ماشین را کرایه کند، چه مبلغی می‌شد؟ لطفا این مبلغ را یادداشت کنید."
                  },
                  {
                    icon: "🎤",
                    text: "در دوران تحصیل، موقع کنفرانس دادن، یا پاسخ به سوالات دست و پایتان می‌لرزد. حاضر بودید چقدر بدهید تا بتوانید مثل یک سخنران حرفه‌ای و با اعتماد به نفس، جلوی جمع بایستید و با آرامش و لبخند صحبت کنید؟ لطفا این مبلغ را یادداشت کنید."
                  },
                  {
                    icon: "🍽️",
                    text: "دوستی که با او رودربایستی دارید تماس گرفته که می‌خواهد امروز به شما سر بزند، اما شما قول داده بودید که با همسرتان بیرون شام بخورید و قدم بزنید. اما خجالت می‌کشید درخواست دوستتان را رد کنید و به‌جایش برنامۀ خودتان را کنسل می‌کنید. هزینه پذیرایی از دوستتان را با هزینۀ بیرون رفتن خودتان جمع کنید و 2 برابر کنید؛ و این رقم را هم یادداشت کنید."
                  },
                  {
                    icon: "🎯",
                    text: "مدیر شرکتی هستید و هر از گاهی لازم است برای همکاران خود یا در جمع‌های کاری صحبت کنید، اما مدام از این کار فرار می‌کنید و این موضوع برایتان بسیار آزاردهنده است. این موضوع چقدر انگیزه‌های همکاران شما را کم کرده؟ چند موقعیت عالی را از شما گرفته است؟ احتمالا رقمی چند هزار دلاری یا حتی بیشتر را می‌توانید یادداشت کنید."
                  },
                  {
                    icon: "💍",
                    text: "در مراسم «بله‌برون»، طرفِ عروس تعداد سکه‌هایی را به‌عنوان مهریه مطرح می‌کند که بیشتر از توافق خصوصی‌تان است، اما چون بزرگ‌ترهایی از فامیلِ هر دو طرف در جمع نشسته‌اند فکر می‌کنید زشت است این نکته را بیان کنید. تفاوتِ تعداد سکه‌ها را به نرخ روز حساب کنید و این رقم را یادداشت کنید."
                  },
                  {
                    icon: "🥤",
                    text: "در فروشگاهی دستگاه اتوماتیک فروش آبمیوه گذاشته‌اند، اما خجالت می‌کشید جلو بروید و آبمیوۀ مورد علاقه‌تان را که به شما چشمک می‌زند بخرید، چون می‌ترسید اشتباه کنید و دیگران به شما بخندند. قیمت آن خوراکی را یادداشت کنید."
                  },
                  {
                    icon: "🚕",
                    text: "رانندۀ تاکسی صدای ضبط را بلند کرده و شما که سردرد هم دارید، حسابی اذیت می‌شوید؛ اما خجالت می‌کشید از او بخواهید صدای ضبط را کم یا آن را خاموش کند. سردرد، چند ساعت شما را از کار و زندگی می‌اندازد. حساب کنید در آن چند ساعت چقدر می‌توانستید کار مفید انجام بدهید، و مبلغِ معادلِ آن را یادداشت کنید."
                  },
                  {
                    icon: "💯",
                    text: "از خواروبارفروشی خرید کرده‌اید و الباقی پول شما $1 است، فروشنده $1 را نمی‌دهد یا به‌جایش شکلاتی می‌دهد که نمی‌خواهید و دوست ندارید؛ اما فکر می‌کنید زشت است درخواست کنید که $1 را به شما بدهد. ده برابر این مبلغ را یادداشت کنید."
                  },
                  {
                    icon: "🍎",
                    text: "میوه‌فروشی محله‌تان یک کیلو انار را دو برابرِ جاهای دیگر حساب کرده، اما چون آشناست و با او چشم در چشم می‌شوید رویتان نمی‌شود این موضوع را تذکر بدهید یا فکر می‌کنید اگر انارها را پس بدهید خیلی زشت است. اضافه قیمتی را که پرداخته‌اید، یادداشت کنید."
                  },
                  {
                    icon: "👔",
                    text: "لباس‌هایتان را به اتوشویی داده‌اید و بیشتر از رقمی که فکر می‌کردید، می‌خواهد از شما پول بگیرد؛ اما رویتان نمی‌شود از او فاکتور بخواهید. اضافه رقمی را که تصور می‌کنید پرداخت کرده‌اید، یادداشت کنید."
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-luxury-black/30 rounded-lg p-4 sm:p-5 border border-luxury-white/10 hover:border-luxury-white/20 transition-all">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="text-2xl sm:text-3xl flex-shrink-0">{item.icon}</div>
                      <p className="text-luxury-silver text-sm sm:text-base leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-urgency/20 to-urgency-dark/20 rounded-xl p-6 sm:p-8 border-2 border-urgency/40 mb-8">
                <div className="text-center space-y-4">
                  <p className="text-luxury-white text-lg sm:text-xl font-bold">
                    ما چه نمونه‌های دیگری را سراغ دارید؟ آنها را هم بنویسید و مبلغشان را حساب کرده و یادداشت کنید.
                  </p>
                  <div className="bg-luxury-black/40 rounded-lg p-6 border border-urgency/30">
                    <p className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold mb-3">
                      حالا، تمام مبلغ‌هایی را که نوشته‌اید، با هم جمع بزنید.
                    </p>
                    <p className="text-urgency-light text-lg sm:text-xl font-bold">
                      چقدر شد؟
                    </p>
                  </div>
                  <p className="text-luxury-white text-base sm:text-lg font-medium">
                    فکرش را می‌کردید که به‌خاطر رفتارهایی که به دور از کاراکتر پرجرات هستند، این‌قدر ضرر مالی کرده باشید؟
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 rounded-xl p-6 sm:p-8 border border-luxury-white/20 mb-8">
                <p className="text-luxury-white text-base sm:text-lg leading-relaxed mb-6">
                  مطمئنم شما حاضرید صدها یا هزاران دلار پرداخت کنید تا از معضل خجالت کشیدن و کم حرفی رهایی پیدا کنید و فردی با اعتماد به نفس باشید! به‌خصوص به‌عنوان یک ایرانی مهاجر که در جامعه جدید نیاز به قاطعیت بیشتری دارید.
                </p>
                
                <div className="bg-luxury-black/40 rounded-lg p-5 sm:p-6 border border-luxury-white/10 mb-6">
                  <h3 className="text-luxury-white font-bold text-lg sm:text-xl mb-4">
                    به‌عنوان یک ایرانی مهاجر، کسی که از خجولی آسیب دیده می‌دانید که:
                  </h3>
                  <div className="space-y-3">
                    {[
                      "فرصت‌های شغلی زیادی را در کشور جدید از دست داده",
                      "به کسانی که پول را پس نمی‌دهند پول قرض داده",
                      "احتمالاً از روابط عاطفی خود رضایت زیادی نخواهد داشت",
                      "در محیط کاری جدید نتوانسته حقوق مناسب درخواست کند"
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-urgency flex-shrink-0 mt-0.5" />
                        <span className="text-luxury-silver text-sm sm:text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-urgency rounded-xl p-6 sm:p-8 border-2 border-urgency/40 text-center mb-6">
                  <p className="text-white text-lg sm:text-xl font-bold mb-4">
                    اما نگران نباشید، این دوره فقط با $97 در اختیار شماست.
                  </p>
                  <p className="text-white/90 text-base sm:text-lg mb-4">
                    یعنی اگر بخواهیم حساب کنیم انگار که روزانه کمتر از 30 سنت به مدت یک سال کنار گذاشته باشیم!
                  </p>
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-white font-bold text-xl sm:text-2xl farsi-nums">
                      $97
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-luxury-silver text-sm sm:text-base leading-relaxed">
                  <p>
                    برای این 15 ساعت آموزش، انگار که برای هر ساعت فقط و فقط کمتر از $7 می‌پردازید! مطمئنم که در هر ساعت این محصول نکات بسیار زیادی را فرا می‌گیرید که با انجام دادن آنها این مبلغ اصلاً به چشم نمی‌آید!
                  </p>
                  
                  <div className="bg-luxury-black/30 rounded-lg p-4 sm:p-5 border border-luxury-white/10">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-luxury-white font-medium">
                        افرادی که محصول را خریداری نمایند، فایل‌های به‌روزرسانی شده را به صورت رایگان دریافت می‌نمایند و نیازی به هزینه بیشتر نمی‌باشد.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-luxury-white font-medium">
                        دسترسی به تمام فایل‌های آموزشی مادام‌العمر بوده و همیشه به آن دسترسی خواهید داشت. (چه بر روی کامپیوتر و چه بر روی موبایل)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-luxury-charcoal to-luxury-accent rounded-xl p-6 sm:p-8 border border-luxury-white/20">
                <h3 className="text-luxury-white font-bold text-xl sm:text-2xl mb-6 text-center">
                  یک مقایسه برای ایرانیان مهاجر
                </h3>
                <div className="space-y-4 text-luxury-silver text-sm sm:text-base leading-relaxed mb-6">
                  <p>
                    در دوره‌های خجولی از شرکت‌کنندگان می‌پرسم که چند نفر برای درمان خجولی به روانشناس مراجعه کرده‌اند؟ تعداد قابل توجهی از شرکت‌کنندگان دستشان را بالا می‌برند.
                  </p>
                  <p>
                    وقتی می‌پرسم که آیا نتیجه مطلوب را گرفته‌اید، اغلب می‌گویند نه! (چون اگر نتیجه مطلوب را گرفته بودند اینجا نمی‌آمدند)
                  </p>
                  <p className="text-luxury-white font-medium">
                    متأسفانه بسیاری از روانشناسان، حتی اصول اولیه رفع خجولی را بلد نیستند و جالب است بدانید روانشناسان زیادی خودشان خجالتی هستند!
                  </p>
                </div>

                <div className="bg-luxury-black/40 rounded-lg p-5 sm:p-6 border border-red-500/20 mb-6">
                  <p className="text-luxury-white text-base sm:text-lg leading-relaxed">
                    حالا فرض کنید اگر بخواهید برای درمان خجولی به یک روانشناس در کانادا مراجعه کنید (که معلوم نیست آیا بتواند برای شما کاری بکند یا خیر؟) احتمالاً باید <span className="font-bold text-urgency-light">10 جلسه</span> مراجعه کنید که هزینه شما <span className="font-bold text-urgency-light">حداقل $1,000</span> خواهد بود (تازه این با لحاظ کردن نرخ متوسط است و روانشناسان حرفه‌ای، عموماً دریافتی بیشتری دارند)
                  </p>
                </div>

                <div className="bg-gradient-to-r from-success/20 to-success/10 rounded-xl p-6 sm:p-8 border-2 border-success/40 text-center">
                  <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-success mx-auto mb-4" />
                  <h3 className="text-luxury-white font-bold text-xl sm:text-2xl mb-4">
                    بر روی خودت سرمایه‌گذاری کن
                  </h3>
                  <p className="text-luxury-white text-lg sm:text-xl mb-2">
                    بهترین سرمایه‌گذاری نه خریدن سکه و طلا است و نه...
                  </p>
                  <p className="text-success font-bold text-xl sm:text-2xl">
                    بهترین سرمایه‌گذاری، سرمایه‌گذاری روی خودتان است.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12 px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-luxury-white font-farsi">
                سوالات متداول
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: "اگر انگلیسی‌ام ضعیف باشد چطور؟",
                    a: "نگران نباشید! کل کارگاه به زبان فارسی برگزار می‌شود و تکنیک‌ها را با دیالوگ‌های دو زبانه (فارسی و انگلیسی) یاد می‌گیرید تا بتوانید در هر دو زبان اعتماد به نفس داشته باشید."
                  },
                  {
                    q: "اگر نتوانم در جلسات زنده شرکت کنم؟",
                    a: "همه جلسات ضبط می‌شوند و به صورت دائمی در اختیار شما قرار می‌گیرند. می‌توانید در زمان دلخواه خود تماشا کنید و بارها به آن‌ها مراجعه کنید."
                  },
                  {
                    q: "آیا این دوره برای من که خیلی خجالتی هستم کار می‌کند؟",
                    a: "بله! در واقع این دوره دقیقاً برای افرادی مثل شما طراحی شده است. ما با هزاران زن خجالتی کار کرده‌ایم و تکنیک‌های اثبات شده‌ای داریم که حتی برای خجالتی‌ترین افراد جواب داده است."
                  },
                  {
                    q: "چقدر زمان می‌برد تا نتیجه ببینم؟",
                    a: "بسیاری از دانشجویان ما از همان هفته اول تغییرات قابل توجهی را تجربه می‌کنند. البته هرکس در سرعت متفاوتی پیشرفت می‌کند، اما اکثر افراد ظرف 3 هفته تفاوت چشمگیری را در زندگی روزمره خود می‌بینند."
                  },
                  {
                    q: "آیا باید در جلسات صحبت کنم یا دوربین را روشن کنم؟",
                    a: "خیر، الزامی نیست. می‌توانید فقط گوش دهید و یاد بگیرید. اما اگر بخواهید، می‌توانید سوال بپرسید یا در تمرینات شرکت کنید - این به خودتان بستگی دارد."
                  },
                  {
                    q: "اگر بعد از خرید پشیمان شدم چطور؟",
                    a: "هیچ مشکلی نیست! تا پایان دوره آموزشی می‌توانید بدون هیچ سوال و دلیلی درخواست بازگشت پول دهید و کل مبلغ شما برگشت داده می‌شود."
                  },
                  {
                    q: "چرا قیمت این‌قدر کم است؟",
                    a: "این قیمت ویژه فقط برای 1000 نفر اول است و به زودی به قیمت اصلی $497 برمی‌گردد. ما می‌خواهیم این دوره آموزشی برای هر زن ایرانی قابل دسترس باشد، به همین دلیل این تخفیف محدود را ارائه می‌دهیم."
                  },
                  {
                    q: "من تازه به کانادا/آمریکا آمده‌ام، آیا این دوره آموزشی به من کمک می‌کند؟",
                    a: "بله! در واقع همین الان بهترین زمان برای شروع است. خیلی از زنان مهاجر آرزو می‌کنند کاش از همان ابتدا این مهارت‌ها را یاد گرفته بودند. این دوره آموزشی به شما کمک می‌کند سریع‌تر در جامعه جدید جا بیفتید و فرصت‌های شغلی بهتری پیدا کنید."
                  },
                  {
                    q: "من سال‌هاست که مهاجر هستم، آیا دیر نشده؟",
                    a: "هرگز دیر نیست! خیلی از دانشجویان ما 10-20 سال است که مهاجرند و می‌گویند کاش زودتر این دوره را می‌دیدند. شما همین حالا هم می‌توانید تغییرات شگفت‌انگیزی در زندگی شخصی و حرفه‌ای خود ایجاد کنید."
                  },
                  {
                    q: "بعد از دوره آموزشی چه اتفاقی می‌افتد؟",
                    a: "شما برای همیشه به ضبط جلسات، ورک‌بوک‌ها، و کتاب صوتی دسترسی خواهید داشت. می‌توانید بارها و بارها به مطالب مراجعه کنید و از آن‌ها استفاده کنید."
                  },
                  {
                    q: "چگونه می‌توانم با شما تماس بگیرم؟",
                    a: "شما می‌توانید از طریق واتساپ یا ایمیل با ما در تماس باشید. ما معمولاً ظرف 24 ساعت به پیام‌ها پاسخ می‌دهیم و خوشحال می‌شویم به سوالات شما کمک کنیم."
                  }
                ].map((faq, index) => (
                  <Card key={index} className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h3 className="text-luxury-white font-bold mb-3 flex items-start gap-3">
                        <span className="text-green-500 flex-shrink-0">❓</span>
                        {faq.q}
                      </h3>
                      <p className="text-luxury-silver text-sm leading-relaxed mr-8">
                        {faq.a}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Final Strong CTA */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-luxury rounded-xl p-8 shadow-luxury border border-luxury-white/30">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-luxury-white font-farsi">
                  زندگی کوتاه است - دیگر منتظر نمانید
                </h2>
                <p className="text-luxury-silver mb-6 leading-relaxed">
                  در این لحظه دو راه پیش رویتان است:<br/>
                  <span className="text-luxury-white font-bold">راه اول:</span> همین‌طور که هستید بمانید و امیدوار باشید که روزی همه چیز خودش درست شود<br/>
                  <span className="text-luxury-white font-bold">راه دوم:</span> امروز تصمیم بگیرید و با ابزارهای اثبات شده زندگی خود را تغییر دهید
                </p>
                <div className="bg-luxury-black/40 rounded-lg p-6 mb-6 border border-luxury-white/20">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-luxury-white font-bold farsi-nums">فقط {spotsRemaining} جای خالی باقی مانده</span>
                  </div>
                  <div className="text-luxury-silver text-sm mb-4">دوره بعدی 6 ماه دیگر - قیمت: $497</div>
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-4">
                    <div className="bg-luxury-white/10 rounded-lg p-3">
                      <div className="text-2xl font-bold text-luxury-white mb-1 farsi-nums">{timeLeft.hours}</div>
                      <div className="text-xs text-luxury-silver">ساعت</div>
                    </div>
                    <div className="bg-luxury-white/10 rounded-lg p-3">
                      <div className="text-2xl font-bold text-luxury-white mb-1 farsi-nums">{timeLeft.minutes}</div>
                      <div className="text-xs text-luxury-silver">دقیقه</div>
                    </div>
                    <div className="bg-luxury-white/10 rounded-lg p-3">
                      <div className="text-2xl font-bold text-luxury-white mb-1 farsi-nums">{timeLeft.seconds}</div>
                      <div className="text-xs text-luxury-silver">ثانیه</div>
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full max-w-md bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-6 text-xl font-bold rounded-xl shadow-luxury mb-4"
                  onClick={() => handleDirectPayment('final')}
                  disabled={isProcessingPayment}
                >
                  <Crown className="w-6 h-6 ml-2" />
                  <span className="farsi-nums">{isProcessingPayment ? 'در حال پردازش...' : 'بله، می‌خواهم پرجرات شوم - $۹۷'}</span>
                </Button>
                <p className="text-luxury-silver text-xs">
                  ✓ گارانتی بازگشت وجه بدون سوال | ✓ دسترسی دائمی | ✓ بونس‌های رایگان $300
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section - Mobile Optimized */}
          <section className="text-center bg-gradient-to-br from-luxury-charcoal to-luxury-accent rounded-xl p-6 shadow-luxury mx-4">
            <div className="max-w-sm mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-luxury-white font-farsi leading-tight">
                هنوز سوالی دارید؟
              </h2>
              <p className="text-luxury-silver mb-6 text-sm leading-relaxed">
                با ما از طریق واتساپ یا ایمیل در تماس باشید - خوشحال می‌شویم کمکتان کنیم
              </p>
              
              <div className="space-y-3">
                <Button 
                  variant="outline"
                  size="lg" 
                  onClick={handleWhatsAppClick}
                  className="w-full border-luxury-white/50 bg-luxury-black/50 text-luxury-white hover:bg-luxury-white/10 hover:text-luxury-white hover:border-luxury-white px-6 py-4 text-base font-semibold rounded-xl backdrop-blur-sm"
                >
                  <Phone className="w-4 h-4 ml-2" />
                  مشاوره رایگان از طریق واتساپ
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg" 
                  onClick={() => window.location.href = 'mailto:info@ladyboss.ca'}
                  className="w-full border-luxury-white/50 bg-luxury-black/50 text-luxury-white hover:bg-luxury-white/10 hover:text-luxury-white hover:border-luxury-white px-6 py-4 text-base font-semibold rounded-xl backdrop-blur-sm"
                >
                  <Mail className="w-4 h-4 ml-2" />
                  ارسال ایمیل به ما
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* Exit Intent Popup - Enhanced */}
        {showExitIntent && (
          <div className="fixed inset-0 bg-luxury-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-gradient-to-br from-urgency/30 to-urgency-dark/20 rounded-3xl p-10 max-w-lg w-full border-2 border-urgency shadow-cta relative animate-scale-in">
              <button 
                onClick={() => setShowExitIntent(false)}
                className="absolute top-4 left-4 text-luxury-silver hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
              >
                ✕
              </button>
              <div className="text-center">
                <div className="mb-6">
                  <div className="relative inline-block">
                    <Gift className="w-20 h-20 mx-auto text-urgency mb-4 animate-bounce" />
                    <div className="absolute -top-2 -right-2 bg-urgency text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm animate-pulse">
                      !
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 font-farsi leading-tight">
                    صبر کنید! 🎁
                  </h3>
                  <p className="text-xl text-luxury-white font-bold">
                    یک هدیه ویژه برای شما داریم
                  </p>
                </div>
                <div className="bg-gradient-success rounded-2xl p-6 mb-8 border-2 border-success shadow-glow">
                  <p className="text-white font-bold text-lg mb-3">
                    🎁 با ثبت‌نام الان دریافت کنید:
                  </p>
                  <p className="text-white font-extrabold text-2xl mb-2">
                    یک جلسه مشاوره رایگان 15 دقیقه‌ای!
                  </p>
                  <p className="text-white/90 text-base font-medium">
                    ارزش $50 - فقط برای 10 نفر اول
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-white/80 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>این پیشنهاد فقط برای 5 دقیقه معتبر است</span>
                  </div>
                </div>
                <Button 
                  className="cta-button w-full text-white px-8 py-6 text-xl font-extrabold rounded-2xl mb-4 shadow-cta transform hover:scale-105"
                  onClick={() => {
                    handleDirectPayment('exit_intent');
                    setShowExitIntent(false);
                  }}
                  disabled={isProcessingPayment}
                >
                  <Sparkles className="w-6 h-6 ml-2" />
                  <span className="farsi-nums">{isProcessingPayment ? 'پردازش...' : 'بله! می‌خواهم هدیه را دریافت کنم'}</span>
                </Button>
                <button
                  onClick={() => setShowExitIntent(false)}
                  className="text-luxury-silver text-sm hover:text-white underline transition-colors"
                >
                  نه متشکرم، ترجیح می‌دهم این فرصت را از دست بدهم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Mobile CTA - Enhanced */}
        {showStickyBtn && (
          <div className="sticky-cta">
            <Button 
              size="lg" 
              className="cta-button text-white px-8 py-5 text-lg font-extrabold rounded-2xl shadow-cta w-80 max-w-[90vw] animate-urgency-pulse"
              onClick={() => handleDirectPayment('sticky')}
              disabled={isProcessingPayment}
            >
              <Zap className="w-5 h-5 ml-2" />
              <span className="farsi-nums">{isProcessingPayment ? 'پردازش...' : 'ثبت‌نام $۹۷ - فقط ' + spotsRemaining + ' جا!'}</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CourageousWorkshop;