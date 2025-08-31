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
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Declare Facebook Pixel function
declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, any>) => void;
  }
}

const CourageousWorkshop = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 23, seconds: 45 });
  const [showStickyBtn, setShowStickyBtn] = useState(false);

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

  // Sticky button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBtn(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      
      // Custom event for workshop page visit
      window.fbq('trackCustom', 'WorkshopPageVisit', {
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
      
      // Custom event for workshop registration
      window.fbq('trackCustom', 'WorkshopRegistration', {
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

    const message = encodeURIComponent('سلام! من به کارگاه آنلاین شخصیت شجاع علاقه‌مند هستم. ممکن است اطلاعات بیشتری بدهید؟');
    const url = `https://wa.me/19495723730?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <SEOHead 
        title="کارگاه آنلاین شخصیت شجاع - اعتماد به نفس و حدودگذاری"
        description="در کارگاه زنده آنلاین ما شرکت کنید تا شجاعت بسازید، مرزهای سالم تعیین کنید و اعتماد به نفس تزلزل‌ناپذیر توسعه دهید. تفکرتان را در عرض ۳ ساعت متحول کنید."
        image="/assets/hero-businesswoman.jpg"
      />
      <div className="min-h-screen bg-luxury-black font-farsi rtl">
        {/* Navigation Header */}
        <header className="border-b border-luxury-accent/20 bg-luxury-black/95 backdrop-blur-md sticky top-0 z-50 shadow-luxury">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-luxury-text bg-clip-text text-transparent">
                <Crown className="w-6 h-6 inline-block ml-2 text-luxury-white" />
                آکادمی لیدی‌باس
              </h1>
              <Button variant="ghost" size="sm" asChild className="text-luxury-silver hover:text-luxury-white hover:bg-luxury-charcoal">
                <Link to="/" className="flex items-center gap-2">
                  <span className="hidden sm:inline">بازگشت به خانه</span>
                  <span className="sm:hidden">بازگشت</span>
                  <ArrowLeft size={16} className="rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Urgency Banner - Luxury Style */}
          <div className="relative bg-gradient-to-r from-luxury-charcoal via-luxury-accent to-luxury-charcoal border border-luxury-silver/30 rounded-xl p-6 mb-8 text-center shadow-luxury-glow">
            <div className="absolute inset-0 bg-luxury-black/50 rounded-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-3 text-luxury-white font-bold text-lg mb-4">
                <Timer className="w-6 h-6 text-luxury-silver" />
                <span>پیشنهاد محدود زمان برای زنان قدرتمند</span>
                <Sparkles className="w-6 h-6 text-luxury-silver" />
              </div>
              <div className="flex items-center justify-center gap-4 text-3xl font-bold text-luxury-white farsi-nums">
                <div className="bg-luxury-white text-luxury-black rounded-lg px-4 py-2 shadow-lg">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <span className="text-luxury-silver">:</span>
                <div className="bg-luxury-white text-luxury-black rounded-lg px-4 py-2 shadow-lg">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <span className="text-luxury-silver">:</span>
                <div className="bg-luxury-white text-luxury-black rounded-lg px-4 py-2 shadow-lg">{timeLeft.seconds.toString().padStart(2, '0')}</div>
              </div>
              <p className="text-sm text-luxury-silver mt-3 font-medium">ساعت : دقیقه : ثانیه</p>
            </div>
          </div>

          {/* Hero Section - Mobile First Luxury Design */}
          <section className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-luxury-white/10 text-luxury-white text-sm font-bold mb-6 border border-luxury-white/20 backdrop-blur-sm">
              <Diamond className="w-5 h-5 ml-2" />
              کارگاه زنده آنلاین - تجربه‌ای لوکس
            </div>
            
            {/* Mobile-First Hero Title */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 text-luxury-white leading-tight font-display">
                شخصیت
                <span className="block bg-gradient-luxury-text bg-clip-text text-transparent text-5xl sm:text-6xl lg:text-8xl mt-2">
                  شجاع
                </span>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-luxury-white to-transparent mx-auto mb-6"></div>
            </div>

            {/* Mobile Optimized Description */}
            <p className="text-lg sm:text-xl text-luxury-silver mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              تحول ۳ هفته‌ای برای زنانی که می‌خواهند با اعتماد به نفس کامل زندگی کنند
            </p>

            {/* Pricing Section - Luxury Mobile Design */}
            <div className="relative bg-gradient-to-br from-luxury-white/5 to-luxury-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-md mx-auto border border-luxury-white/20 shadow-luxury">
              <div className="absolute top-4 right-4">
                <Crown className="w-6 h-6 text-luxury-silver" />
              </div>
              <div className="text-center">
                <p className="text-sm text-luxury-silver mb-2 font-medium">سرمایه‌گذاری در خودتان</p>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className="text-2xl font-bold text-luxury-silver/60 line-through farsi-nums">$۴۹۷</span>
                  <span className="text-5xl font-bold text-luxury-white farsi-nums">$۹۷</span>
                </div>
                <div className="bg-luxury-white text-luxury-black rounded-full px-6 py-2 text-sm font-bold inline-block">
                  ۸۰% تخفیف ویژه - فقط ۲۵ نفر
                </div>
              </div>
            </div>
            
            {/* Mobile-First CTA Buttons */}
            <div className="flex flex-col gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="w-full max-w-sm bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-6 text-xl font-bold shadow-luxury hover:shadow-luxury-glow transition-all duration-300 rounded-xl"
                onClick={() => handleRegisterClick('hero')}
              >
                <Zap className="w-6 h-6 ml-2" />
                <span className="farsi-nums">تحول خود را آغاز کنید - $۹۷</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="w-full max-w-sm border-luxury-white/30 text-luxury-white hover:bg-luxury-white/10 px-8 py-4 text-lg font-semibold rounded-xl"
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                سوال دارید؟ پاسخ فوری
              </Button>
            </div>

            {/* Trust Indicators - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 bg-luxury-white/5 rounded-lg border border-luxury-white/10">
                <Shield className="w-6 h-6 text-luxury-white" />
                <span className="text-luxury-silver text-sm font-medium">ضمانت ۳۰ روزه</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-luxury-white/5 rounded-lg border border-luxury-white/10">
                <Users className="w-6 h-6 text-luxury-white" />
                <span className="text-luxury-silver text-sm font-medium">محدود به ۲۵ نفر</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-luxury-white/5 rounded-lg border border-luxury-white/10">
                <Star className="w-6 h-6 text-luxury-white" />
                <span className="text-luxury-silver text-sm font-medium">۴.۹/۵ امتیاز</span>
              </div>
            </div>
          </section>

          {/* Problem Section - Luxury Mobile Design */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-luxury-charcoal to-luxury-accent rounded-2xl p-6 sm:p-8 border border-luxury-white/10 shadow-luxury">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-luxury-white font-display">
                آیا شما هم این احساسات را داشته‌اید؟
              </h2>
              <div className="space-y-4 max-w-2xl mx-auto">
                {[
                  'نمی‌توانم «نه» بگویم و خودم را فدا می‌کنم',
                  'از قضاوت دیگران می‌ترسم و اعتماد به نفس ندارم',
                  'رویاهایم را کنار گذاشته‌ام',
                  'در موقعیت‌های دشوار تسلیم می‌شوم',
                  'احساس می‌کنم صدایم شنیده نمی‌شود',
                  'نمی‌توانم برای خودم دفاع کنم'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-luxury-black/30 rounded-lg border border-luxury-white/5 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-luxury-white rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-luxury-silver leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Solution Section - Luxury Design */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-luxury-white/20 shadow-luxury">
              <div className="text-center max-w-4xl mx-auto">
                <Crown className="w-12 h-12 text-luxury-white mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-luxury-white font-display">
                  تحول شما در ۳ هفته
                </h2>
                <p className="text-lg sm:text-xl mb-8 text-luxury-silver leading-relaxed">
                  از زنی تردیدآمیز به رهبری مطمئن و شجاع تبدیل شوید
                </p>
                <Button 
                  size="lg" 
                  className="bg-luxury-white hover:bg-luxury-silver text-luxury-black px-10 py-6 text-xl font-bold rounded-xl shadow-luxury"
                  onClick={() => handleRegisterClick('solution')}
                >
                  <Target className="w-6 h-6 ml-2" />
                  می‌خواهم متحول شوم!
                </Button>
              </div>
            </div>
          </section>

          {/* Workshop Details - Mobile Cards */}
          <section className="grid gap-6 mb-16">
            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-luxury-white">
                  <Clock className="w-6 h-6 text-luxury-silver" />
                  جزئیات کارگاه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-luxury-silver">
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span>مدت زمان:</span>
                  <span className="font-bold text-luxury-white">۳ هفته (۳ جلسه)</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span>شیوه برگزاری:</span>
                  <span className="font-bold text-luxury-white">آنلاین زوم</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span>حداکثر شرکت‌کننده:</span>
                  <span className="font-bold text-luxury-white">۲۵ خانم</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span>دسترسی ضبط:</span>
                  <span className="font-bold text-luxury-white">۷ روز</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-luxury-white">
                  <Award className="w-6 h-6 text-luxury-silver" />
                  چه چیزی یاد می‌گیرید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {[
                    'مرزبندی قدرتمند و موثر',
                    'افزایش اعتماد به نفس پایدار',
                    'ابراز وجود بدون احساس گناه',
                    'مدیریت تعارضات با قدرت',
                    'تکنیک‌های ارتباط مؤثر',
                    'رهایی از نیاز به تأیید دیگران'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-luxury-white/5 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-luxury-white flex-shrink-0" />
                      <span className="text-luxury-silver">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact Section */}
          <section className="text-center bg-gradient-luxury rounded-2xl p-8 shadow-luxury">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-luxury-white font-display">
                آماده برای تحول هستید؟
              </h2>
              <p className="text-luxury-silver mb-8 text-lg leading-relaxed">
                امروز اولین قدم را برای تبدیل شدن به بهترین نسخه خودتان بردارید
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Button 
                  size="lg" 
                  className="w-full bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-6 text-xl font-bold rounded-xl shadow-luxury"
                  onClick={() => handleRegisterClick('final')}
                >
                  <Sparkles className="w-6 h-6 ml-2" />
                  <span className="farsi-nums">ثبت‌نام فوری - $۹۷</span>
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg" 
                  onClick={handleWhatsAppClick}
                  className="w-full border-luxury-white/30 text-luxury-white hover:bg-luxury-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
                >
                  <Phone className="w-5 h-5 ml-2" />
                  مشاوره رایگان
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* Sticky Mobile CTA */}
        {showStickyBtn && (
          <div className="sticky-cta sm:hidden">
            <Button 
              size="lg" 
              className="bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-4 text-lg font-bold rounded-xl shadow-luxury w-80 max-w-[90vw]"
              onClick={() => handleRegisterClick('sticky')}
            >
              <Crown className="w-5 h-5 ml-2" />
              <span className="farsi-nums">شروع تحول - $۹۷</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CourageousWorkshop;