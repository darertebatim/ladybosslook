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
import { TestMailchimp } from '@/components/TestMailchimp';


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

    const message = encodeURIComponent('سلام! من به کارگاه آنلاین کاراکتر پرجرات علاقه‌مند هستم. ممکن است اطلاعات بیشتری بدهید؟');
    const url = `https://wa.me/16265028538?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <SEOHead />
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
          {/* Urgency Banner - Compact Timer */}
          <div className="relative bg-gradient-to-r from-luxury-charcoal via-luxury-accent to-luxury-charcoal border border-luxury-silver/30 rounded-lg p-3 mb-6 text-center shadow-luxury-glow">
            <div className="absolute inset-0 bg-luxury-black/50 rounded-lg"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-1 text-luxury-white font-bold text-xs mb-2">
                <Timer className="w-4 h-4 text-luxury-silver" />
                <span>پیشنهاد محدود زمان برای زنان قدرتمند</span>
                <Sparkles className="w-4 h-4 text-luxury-silver" />
              </div>
              <div className="flex items-center justify-center gap-1 farsi-nums">
                <div className="bg-luxury-white text-luxury-black rounded-md px-3 py-2 text-2xl font-bold shadow-lg min-w-[50px]">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <span className="text-luxury-silver text-lg font-bold">:</span>
                <div className="bg-luxury-white text-luxury-black rounded-md px-3 py-2 text-2xl font-bold shadow-lg min-w-[50px]">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <span className="text-luxury-silver text-lg font-bold">:</span>
                <div className="bg-luxury-white text-luxury-black rounded-md px-3 py-2 text-2xl font-bold shadow-lg min-w-[50px]">{timeLeft.seconds.toString().padStart(2, '0')}</div>
              </div>
              <p className="text-xs text-luxury-silver mt-1 font-medium">ساعت : دقیقه : ثانیه</p>
            </div>
          </div>

          {/* Hero Section - Mobile First Luxury Design */}
          <section className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-luxury-white/10 text-luxury-white text-sm font-bold mb-6 border border-luxury-white/20 backdrop-blur-sm">
              <Diamond className="w-5 h-5 ml-2" />
              کارگاه زنده آنلاین - تجربه‌ای لوکس
            </div>
            
            {/* Mobile-First Hero Title */}
            <div className="mb-6 px-2">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 text-luxury-white leading-tight font-display">
                <span className="bg-gradient-luxury-text bg-clip-text text-transparent">کاراکتر پرجرات</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-luxury-white to-transparent mx-auto mb-4"></div>
            </div>

            {/* Mobile Optimized Description */}
            <p className="text-sm sm:text-base lg:text-xl text-luxury-silver mb-8 max-w-2xl mx-auto leading-relaxed px-6 text-center">
              <span className="block whitespace-nowrap">Join the Courageous Character Workshop</span>
              <span className="block whitespace-nowrap">and Behave like a confident Ladyboss</span>
            </p>

            {/* Pricing Section - Mobile Optimized */}
            <div className="relative bg-gradient-to-br from-luxury-white/5 to-luxury-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 mx-4 border border-luxury-white/20 shadow-luxury">
              <div className="absolute top-3 right-3">
                <Crown className="w-5 h-5 text-luxury-silver" />
              </div>
              <div className="text-center">
                <p className="text-xs text-luxury-silver mb-3 font-medium">سرمایه‌گذاری در خودتان</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-xl font-bold text-luxury-silver/60 line-through farsi-nums">$۴۹۷</span>
                  <span className="text-4xl font-bold text-luxury-white farsi-nums">$۹۷</span>
                </div>
                <div className="bg-luxury-white text-luxury-black rounded-full px-4 py-2 text-xs font-bold inline-block">
                  ۸۰% تخفیف ویژه - فقط ۱۰۰ نفر
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 justify-center items-center mb-12 px-4">
              <Button 
                size="lg" 
                className="w-full max-w-xs bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-5 text-lg font-bold rounded-xl shadow-luxury"
                onClick={() => handleRegisterClick('main_cta')}
                asChild
              >
                <Link to="/checkout?program=courageous-character">
                  <Target className="w-5 h-5 ml-2" />
                  خرید کارگاه - $97
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="w-full max-w-xs border-luxury-white/50 bg-luxury-black/50 text-luxury-white hover:bg-luxury-white/10 hover:text-luxury-white hover:border-luxury-white px-6 py-4 text-base font-semibold rounded-xl backdrop-blur-sm"
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                سوال دارید؟
              </Button>
            </div>

            {/* Trust Indicators - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-2 text-center max-w-sm mx-auto px-4">
              <div className="flex flex-col items-center gap-1 p-3 bg-luxury-white/5 rounded-lg border border-luxury-white/10">
                <Shield className="w-5 h-5 text-luxury-white" />
                <span className="text-luxury-silver text-xs font-medium">ضمانت ۳۰ روزه</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-luxury-white/5 rounded-lg border border-luxury-white/10">
                <Users className="w-5 h-5 text-luxury-white" />
                <span className="text-luxury-silver text-xs font-medium">محدود ۱۰۰ نفر</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-luxury-white/5 rounded-lg border border-luxury-white/10">
                <Star className="w-5 h-5 text-luxury-white" />
                <span className="text-luxury-silver text-xs font-medium">۴.۹/۵ امتیاز</span>
              </div>
            </div>
          </section>

          {/* Problem Section - Mobile Optimized */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-charcoal to-luxury-accent rounded-xl p-5 border border-luxury-white/10 shadow-luxury">
              <h2 className="text-lg sm:text-xl font-bold text-center mb-4 text-luxury-white font-display leading-tight">
                آیا شما هم این احساسات را داشته‌اید؟
              </h2>
              <div className="space-y-3 max-w-lg mx-auto">
                {[
                  'نمی‌توانم «نه» بگویم',
                  'از قضاوت دیگران می‌ترسم',
                  'رویاهایم را کنار گذاشته‌ام',
                  'در موقعیت‌های دشوار تسلیم می‌شوم',
                  'صدایم شنیده نمی‌شود',
                  'نمی‌توانم دفاع کنم'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-luxury-black/30 rounded-lg border border-luxury-white/5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 bg-luxury-white rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-luxury-silver text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Solution Section - Mobile Optimized */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-xl p-6 border border-luxury-white/20 shadow-luxury">
              <div className="text-center max-w-lg mx-auto">
                <Crown className="w-10 h-10 text-luxury-white mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-luxury-white font-display leading-tight">
                  تحول شما در ۳ هفته
                </h2>
                <p className="text-sm text-luxury-silver mb-5 leading-relaxed">
                  از زنی تردیدآمیز به رهبری مطمئن تبدیل شوید
                </p>
                <Button 
                  size="lg" 
                  className="w-full max-w-xs bg-luxury-white hover:bg-luxury-silver text-luxury-black px-8 py-5 text-lg font-bold rounded-xl shadow-luxury"
                  onClick={() => handleRegisterClick('solution')}
                  asChild
                >
                  <a 
                    href="https://buy.stripe.com/8wM9D04FQ8hAb4sbIO?success_url=https://boldadventurous.lovable.app/payment-success&cancel_url=https://boldadventurous.lovable.app/ccw"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-5 h-5" />
                        <span>میخواهم پرجرات بشم!</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-luxury-black/60 farsi-nums">$۴۹۷</span>
                        <span className="farsi-nums">$۹۷ فقط برای ۱۰۰ نفر اول</span>
                      </div>
                    </div>
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* Pricing & Bonuses Section - Mobile Optimized */}
          <section className="mb-12 px-4">
            <div className="bg-gradient-to-br from-luxury-white/15 to-luxury-white/5 backdrop-blur-sm rounded-xl p-6 border border-luxury-white/30 shadow-luxury">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-luxury-white font-display leading-tight">
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
                  <div className="text-2xl font-bold text-luxury-silver line-through farsi-nums">$۵۰۰</div>
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
            {/* Workshop Curriculum Section - Moved Up */}
            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-luxury-white text-lg">
                  <TrendingUp className="w-5 h-5 text-luxury-silver" />
                  ۱۲ تکنیک کاراکتر پرجرأت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {[
                    { title: "نه گفتن", subtitle: "Say No" },
                    { title: "بله گفتنِ هوشمند", subtitle: "Wise Yes" },
                    { title: "بیان اَسِرتیو", subtitle: "Assertive Expression" },
                    { title: "ارائه کردن", subtitle: "Presenting" },
                    { title: "اظهار نظر کردن", subtitle: "Voicing Opinions" },
                    { title: "بله گرفتن", subtitle: "Getting a Yes" },
                    { title: "حق گرفتن", subtitle: "Claiming Rights" },
                    { title: "پاسخ به انتقاد", subtitle: "Handling Feedback" },
                    { title: "جلوگیری از بی‌انصافی", subtitle: "Preventing Injustice" },
                    { title: "مدیریت تعارض‌ها", subtitle: "Conflict Management" },
                    { title: "مرزبندی حریم", subtitle: "Boundaries" },
                    { title: "مذاکرهٔ روزمره", subtitle: "Everyday Negotiation" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-luxury-black/30 rounded-lg border border-luxury-white/5 hover:bg-luxury-black/50 transition-colors">
                      <div className="flex items-center justify-center w-6 h-6 bg-luxury-white/10 rounded-full text-xs font-bold text-luxury-white flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-luxury-white text-sm font-medium leading-tight mb-1">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-luxury-silver/70 text-xs">{item.subtitle}</div>
                        )}
                      </div>
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
                  <span className="font-bold text-luxury-white text-sm">۱۰۰ خانم</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-luxury-black/30 rounded-lg">
                  <span className="text-sm">ضبط:</span>
                  <span className="font-bold text-luxury-white text-sm">۷ روز دسترسی</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-luxury-charcoal/50 border-luxury-white/20 backdrop-blur-sm shadow-luxury rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-luxury-white text-lg">
                  <Award className="w-5 h-5 text-luxury-silver" />
                  یادگیری‌های کارگاه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {[
                    'مرزبندی قدرتمند',
                    'اعتماد به نفس پایدار',
                    'ابراز وجود بدون گناه',
                    'مدیریت تعارضات',
                    'ارتباط مؤثر',
                    'استقلال از تأیید دیگران'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2.5 bg-luxury-white/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-luxury-white flex-shrink-0" />
                      <span className="text-luxury-silver text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact Section - Mobile Optimized */}
          <section className="text-center bg-gradient-luxury rounded-xl p-6 shadow-luxury mx-4">
            <div className="max-w-sm mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-luxury-white font-display leading-tight">
                آماده برای تحول هستید؟
              </h2>
              <p className="text-luxury-silver mb-6 text-sm leading-relaxed">
                امروز اولین قدم را بردارید
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full bg-luxury-white hover:bg-luxury-silver text-luxury-black px-6 py-5 text-lg font-bold rounded-xl shadow-luxury"
                  onClick={() => handleRegisterClick('final')}
                  asChild
                >
                  <Link to="/checkout?program=courageous-character">
                    <Sparkles className="w-5 h-5 ml-2" />
                    <span className="farsi-nums">ثبت‌نام فوری - $۹۷</span>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg" 
                  onClick={handleWhatsAppClick}
                  className="w-full border-luxury-white/50 bg-luxury-black/50 text-luxury-white hover:bg-luxury-white/10 hover:text-luxury-white hover:border-luxury-white px-6 py-4 text-base font-semibold rounded-xl backdrop-blur-sm"
                >
                  <Phone className="w-4 h-4 ml-2" />
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
              className="bg-luxury-white hover:bg-luxury-silver text-luxury-black px-6 py-4 text-base font-bold rounded-xl shadow-luxury w-72 max-w-[85vw]"
              onClick={() => handleRegisterClick('sticky')}
              asChild
            >
              <Link to="/checkout?program=courageous-character">
                <Crown className="w-4 h-4 ml-2" />
                <span className="farsi-nums text-sm">ثبت نام فوری - $۹۷</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      <TestMailchimp />
    </>
  );
};

export default CourageousWorkshop;