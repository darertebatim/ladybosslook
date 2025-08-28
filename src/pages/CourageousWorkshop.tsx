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
  Globe
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
      <div className="min-h-screen bg-background font-farsi rtl">
        {/* Navigation Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-primary">آکادمی لیدی‌باس</h1>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <span className="hidden sm:inline">بازگشت به خانه</span>
                  <span className="sm:hidden">بازگشت</span>
                  <ArrowLeft size={16} className="rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Urgency Banner */}
          <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-red-600 font-semibold">
              <Timer className="w-5 h-5" />
              <span>پیشنهاد محدود زمان!</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-2xl font-bold text-red-700 farsi-nums">
              <div className="bg-red-100 rounded px-2 py-1">{timeLeft.hours.toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-red-100 rounded px-2 py-1">{timeLeft.minutes.toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-red-100 rounded px-2 py-1">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            </div>
            <p className="text-sm text-red-600 mt-1">ساعت : دقیقه : ثانیه</p>
          </div>

          {/* Hero Section */}
          <section className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Calendar className="w-4 h-4 ml-2" />
              کارگاه زنده آنلاین
            </div>
            
            {/* Workshop Poster Space */}
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-dashed border-primary/30">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium">فضای تصویر یا پوستر کارگاه</p>
                    <p className="text-sm">Workshop poster placeholder</p>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
              <span className="block text-4xl sm:text-5xl lg:text-7xl mt-2 text-primary">کاراکتر پرجرات</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
              ورکشاپ ۳ هفته‌ای (۳ جلسه دو ساعته) برای یادگیری مرزبندی، ابراز وجود و قدرت ارتباطی
            </p>

            {/* Pricing Section */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 mb-8 max-w-md mx-auto border-2 border-primary/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">قیمت عادی</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-3xl font-bold text-red-500 line-through farsi-nums">$۴۹۷</span>
                  <span className="text-5xl font-bold text-primary farsi-nums">$۹۷</span>
                </div>
                <div className="bg-green-100 text-green-800 rounded-full px-4 py-1 text-sm font-semibold">
                  ۶۰% تخفیف - فقط ۱۰۰ نفر!
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 pulse-glow"
                onClick={() => handleRegisterClick('hero')}
              >
                <Zap className="w-6 h-6 ml-2" />
                همین حالا ثبت‌نام کنید - $۹۷
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="px-8 py-6 text-lg font-semibold"
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                سوال دارید؟
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span>ضمانت ۳۰ روزه</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span>ظرفیت محدود ۲۵ نفر</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-600" />
                <span>۴.۹/۵ امتیاز</span>
              </div>
            </div>
          </section>

          {/* Problem Section */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-red-800">آیا این احساسات برایتان آشنا است؟</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>نمی‌توانم «نه» بگویم و همیشه خودم را فدا می‌کنم</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>از قضاوت دیگران می‌ترسم و اعتماد به نفس ندارم</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>رویاهایم را کنار گذاشته‌ام چون نمی‌دانم چطور شروع کنم</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>همیشه در موقعیت‌های دشوار تسلیم می‌شوم</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>احساس می‌کنم صدایم شنیده نمی‌شود</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>نمی‌توانم برای خودم دفاع کنم</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-white/30 rounded-xl p-4 text-center">
                    <img 
                      src="/assets/hero-businesswoman.jpg" 
                      alt="زن موفق و با اعتماد به نفس" 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <p className="text-sm text-red-700 font-medium">
                      شما هم می‌توانید متحول شوید
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Solution Section */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-100 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-green-800">راه‌حل: متحول شدن در ۳ هفته!</h2>
                  <p className="text-lg mb-8 text-green-700">
                    در کارگاه «کاراکتر پرجرات» یاد می‌گیرید چطور از یک زن تردیدآمیز به یک لیدر مطمئن و شجاع تبدیل شوید
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 text-xl font-bold"
                    onClick={() => handleRegisterClick('solution')}
                  >
                    می‌خواهم متحول شوم!
                  </Button>
                </div>
                <div className="flex justify-center">
                  <img 
                    src="/assets/business-coaching-program.jpg" 
                    alt="کارگاه تغییر زندگی" 
                    className="w-full max-w-sm rounded-xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Workshop Details */}
          <section className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  جزئیات کارگاه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدت زمان:</span>
                  <span className="font-medium">۳ هفته (۳ جلسه دو ساعته)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شیوه برگزاری:</span>
                  <span className="font-medium">آنلاین از طریق زوم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">حداکثر شرکت‌کنندگان:</span>
                  <span className="font-medium">۲۵ خانم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">دسترسی به ضبط:</span>
                  <span className="font-medium">۷ روز</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مواد جانبی:</span>
                  <span className="font-medium">شامل می‌شود</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  چه چیزی دریافت می‌کنید؟
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>ورکشاپ ۳ هفته‌ای زنده و تعاملی</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>تمرین‌ها و ابزارهای شجاعت‌سازی</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>چارچوب حدودگذاری سالم</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>پرسش و پاسخ با راضیه میرزایی</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>کتاب کار دیجیتال و قالب‌ها</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>دسترسی به انجمن خصوصی</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* What You'll Learn */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">چه چیزهایی یاد خواهید گرفت؟</h2>
              <img 
                src="/assets/money-literacy-program.jpg" 
                alt="یادگیری مهارت های زندگی" 
                className="w-full max-w-md mx-auto rounded-lg shadow-md mb-6"
              />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Award className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">اعتماد به نفس تزلزل‌ناپذیر</h3>
                  <p className="text-muted-foreground">بر تردید غلبه کنید و اعتماد به نفس لازم برای دنبال کردن بزرگ‌ترین اهدافتان را توسعه دهید.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Shield className="w-12 h-12 text-secondary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">مرزگذاری سالم</h3>
                  <p className="text-muted-foreground">یاد بگیرید بدون احساس گناه «نه» بگویید و از انرژی و زمانتان محافظت کنید.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Zap className="w-12 h-12 text-accent mb-4" />
                  <h3 className="text-lg font-semibold mb-2">شجاعت در عمل</h3>
                  <p className="text-muted-foreground">ترس را به سوخت تبدیل کنید و اقدام جسورانه به سمت رویاهایتان بردارید.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Target className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">هدف‌گذاری قدرتمند</h3>
                  <p className="text-muted-foreground">اهداف واضح و قابل دستیابی تعیین کنید و راه‌های عملی برای رسیدن به آنها بیاموزید.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Heart className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">مراقبت از خود</h3>
                  <p className="text-muted-foreground">اولویت‌بندی نیازهای خود بدون احساس خودخواهی و ایجاد تعادل سالم در زندگی.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">رشد مداوم</h3>
                  <p className="text-muted-foreground">ایجاد عادت‌های مثبت و ذهنیت رشد برای پیشرفت مداوم در تمام زمینه‌های زندگی.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Instructor Section */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8">مربی شما: راضیه میرزایی</h2>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <img 
                    src="/assets/hero-businesswoman.jpg" 
                    alt="راضیه میرزایی" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-800">مدرس اعتمادبنفس و مربی کسب و کارهای خانمانه</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-500" />
                      <span>نویسنده کتاب پرفروش "کاراکتر پرجرات" به زبان فارسی و انگلیسی</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span>متخصص توسعه شخصیت و اعتماد به نفس</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>مربی کسب و کارهای خانمانه</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-500" />
                      <span>بنیان‌گذار آکادمی لیدی‌باس</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    راضیه با تسلط بر زبان فارسی و انگلیسی، تجربیات منحصر به فردی را برای توسعه اعتماد به نفس و قدرت درونی زنان ایرانی ارائه می‌دهد.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">نظرات شرکت‌کنندگان قبلی</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "این کارگاه زندگی من را کاملاً تغییر داد. حالا می‌توانم با اعتماد به نفس کامل برای خودم صحبت کنم."
                  </p>
                  <div className="flex items-center gap-3">
                    <img src="/assets/testimonial-1.jpg" alt="مریم احمدی" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold">مریم احمدی</p>
                      <p className="text-sm text-muted-foreground">کارآفرین</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "یاد گرفتم چطور بدون احساس گناه 'نه' بگویم. این مهارت زندگی‌ام را متحول کرد."
                  </p>
                  <div className="flex items-center gap-3">
                    <img src="/assets/testimonial-2.jpg" alt="سارا کریمی" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold">سارا کریمی</p>
                      <p className="text-sm text-muted-foreground">مدیر فروش</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-accent">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "از یک زن ترسو به یک لیدر مطمئن تبدیل شدم. همه می‌گویند تغییر کرده‌ام!"
                  </p>
                  <div className="flex items-center gap-3">
                    <img src="/assets/testimonial-3.jpg" alt="نازنین موسوی" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold">نازنین موسوی</p>
                      <p className="text-sm text-muted-foreground">معلم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Value Stack */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
              <h2 className="text-3xl font-bold text-center mb-8 text-purple-800">ارزش کل پکیج: $۱۲۹۷</h2>
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
                  <span>ورکشاپ ۳ هفته‌ای (۳ جلسه دو ساعته)</span>
                  <span className="font-semibold text-purple-600 farsi-nums">$۴۹۷</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
                  <span>کتاب کار دیجیتال اختصاصی</span>
                  <span className="font-semibold text-purple-600 farsi-nums">$۱۹۷</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
                  <span>۷ روز دسترسی به ضبط</span>
                  <span className="font-semibold text-purple-600 farsi-nums">$۲۹۷</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
                  <span>دسترسی به انجمن خصوصی</span>
                  <span className="font-semibold text-purple-600 farsi-nums">$۱۹۷</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
                  <span>پشتیبانی ایمیلی ۳۰ روزه</span>
                  <span className="font-semibold text-purple-600 farsi-nums">$۱۰۹</span>
                </div>
                <div className="border-t-2 border-purple-300 pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>مجموع ارزش:</span>
                    <span className="text-purple-800 farsi-nums">$۱۲۹۷</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-bold text-green-600 mt-2">
                    <span>قیمت امروز:</span>
                    <span className="farsi-nums">$۹۷</span>
                  </div>
                  <p className="text-center text-green-600 font-semibold mt-2">
                    ۹۲% صرفه‌جویی - تنها امروز!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">سوالات متداول</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">آیا این کارگاه برای مبتدی‌ها مناسب است؟</h3>
                  <p className="text-muted-foreground">بله، این کارگاه برای تمام سطوح طراحی شده و نیازی به تجربه قبلی ندارید.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">اگر نتوانم در زمان مقرر شرکت کنم چه؟</h3>
                  <p className="text-muted-foreground">شما ۷ روز دسترسی به ضبط کامل کارگاه خواهید داشت.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">آیا ضمانت بازگشت وجه دارید؟</h3>
                  <p className="text-muted-foreground">بله، ۳۰ روز ضمانت کامل بازگشت وجه داریم. اگر راضی نباشید، پول شما برگردانده می‌شود.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">آماده هستید شجاعت خود را بسازید؟</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              به ۲۵ زن جاه‌طلب در این کارگاه تحول‌آفرین بپیوندید. جاهای محدود موجود است.
            </p>
            
            {/* Scarcity Indicators */}
            <div className="flex justify-center items-center gap-8 mb-6 text-sm">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                🔥 تنها ۷ جا باقی مانده
              </div>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                ⏰ پیشنهاد تا ۲۴ ساعت
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => handleRegisterClick('final_cta')}
              >
                <Zap className="w-6 h-6 ml-2" />
                همین الان ثبت‌نام کنید - $۹۷
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="px-8 py-6 text-lg font-semibold"
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                سوال دارید؟
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>💰 ضمانت ۳۰ روزه بازگشت وجه</p>
              <p>🎁 مواد جانبی شامل می‌شود</p>
              <p>📧 دسترسی فوری پس از پرداخت</p>
            </div>
          </section>

          {/* Contact Info */}
          <section className="text-center">
            <h3 className="text-xl font-semibold mb-4">برای سوالات بیشتر:</h3>
            <div className="flex justify-center items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span dir="ltr">+1 (949) 572-3730</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@ladybossacademy.com</span>
              </div>
            </div>
          </section>
        </main>

        {/* Sticky CTA Button */}
        {showStickyBtn && (
          <div className="sticky-cta">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-bold shadow-2xl"
              onClick={() => handleRegisterClick('sticky')}
            >
              ثبت‌نام $۹۷
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CourageousWorkshop;