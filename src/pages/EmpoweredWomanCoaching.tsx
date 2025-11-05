import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  CheckCircle, Heart, Users, Calendar, DollarSign, TrendingUp, Sparkles, 
  Shield, Brain, Target, MessageCircle, Star, Zap, Lightbulb, Award, 
  ArrowRight, Clock, Video, Briefcase, Gift
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/sections/Footer";
import razie1 from "@/assets/razie-1.jpg";
import razie2 from "@/assets/razie-2.jpg";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EmpoweredWomanCoaching = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDepositClick = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { program: "empowered-woman-coaching" },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("خطا در ایجاد پرداخت. لطفاً دوباره تلاش کنید.");
      setIsLoading(false);
    }
  };

  const gains = [
    {
      icon: Brain,
      title: "مدیریت ذهن و احساسات",
      benefits: [
        "تصمیمات مالی دیگه از روی ترس یا عجله نیست",
        "آرامش ذهنی یعنی فرصت‌ها رو می‌فهمی",
        "سریع اقدام می‌کنی، سریع نتیجه می‌گیری"
      ]
    },
    {
      icon: Lightbulb,
      title: "اصلاح نگرش‌ها",
      benefits: [
        "صدای 'نمی‌تونی' ساکت میشه",
        "هر موقعیت سختی می‌تونه سکوی پرتاب بشه"
      ]
    },
    {
      icon: MessageCircle,
      title: "قدرت ارتباط و دیده شدن",
      benefits: [
        "با اعتمادبه‌نفس تو جمع‌ها حاضر میشی",
        "درخواست می‌کنی بدون ترس → درآمدت بیشتر میشه"
      ]
    },
    {
      icon: Star,
      title: "لایف‌استایل زن موفق",
      benefits: [
        "انرژی بالا و تمرکز قوی هر روز",
        "تعادل بین خانواده، رشد و پول"
      ]
    },
    {
      icon: Zap,
      title: "غلبه بر کمال‌گرایی",
      benefits: [
        "زود شروع می‌کنی، زود نتیجه می‌گیری",
        "مسیر پول‌سازی بدون کلافه شدن"
      ]
    },
    {
      icon: DollarSign,
      title: "آگاهی مالی و رشد درآمد",
      benefits: [
        "پول درآوردن یه مهارت میشه",
        "با امکانات الانت پول بسازی"
      ]
    }
  ];

  const curriculum = [
    {
      session: "۱",
      title: "چکاپ وضعیت و بازسازی تصویر از خود",
      topics: [
        "بازسازی تصویر فعلی و گذشته",
        "تمرین خودبخششی (صلح با خود)",
        "معناگرایی در چالش‌ها"
      ]
    },
    {
      session: "۲-۳",
      title: "مدیریت افکار و احساسات با ACT",
      topics: [
        "غلبه بر افکار منفی",
        "تسلط بر احساسات",
        "مدیریت در شرایط سخت",
        "مدیریت در مواقع ضعف",
        "بازطراحی ماشین رفتار"
      ]
    },
    {
      session: "۳",
      title: "مکانیزم انگیزه و توقع",
      topics: [
        "ایجاد انگیزه دائمی",
        "طراحی فیلمنامه زندگی",
        "پیش زمینه احساس لیاقت"
      ]
    },
    {
      session: "۴",
      title: "مکانیزم نگرش‌ها",
      topics: [
        "اصول شکل‌گیری نگرش‌ها",
        "ریشه‌یابی ۳ حوزه: فردی، ارتباطی، پولسازی",
        "تغییر نگرش شخصی"
      ]
    },
    {
      session: "۵",
      title: "قانون درخواست و ارتباط‌سازی",
      topics: [
        "غلبه بر ترس از نه شنیدن",
        "اصول درخواست قوی",
        "حضور با اعتمادبه‌نفس در جمع",
        "اصول دوست‌یابی و ارتباط‌سازی"
      ]
    },
    {
      session: "۶",
      title: "لایف استایل خانم رئیس",
      topics: [
        "طراحی روتین‌های روزانه",
        "اصول تغییر عادت",
        "مدیریت زمان و ژورنال نویسی",
        "لایف استایل سالم غذایی"
      ]
    },
    {
      session: "۷",
      title: "هدف‌گذاری پیشرفته",
      topics: [
        "مدیریت اهداف و تعادل زندگی",
        "هدف‌نویسی و برنامه‌ریزی",
        "طراحی رویا + هدف + چشم‌انداز"
      ]
    },
    {
      session: "۸",
      title: "غلبه بر کمالگرایی و اهمال‌کاری",
      topics: [
        "ریشه کمبود عزت نفس",
        "آموزش اقدام‌گرایی",
        "رفع کمالگرایی"
      ]
    },
    {
      session: "۹",
      title: "پول و مدیریت پول",
      topics: [
        "نگرش برای پول",
        "تمرینات عملی مدیریت مالی",
        "اصول درآمدسازی"
      ]
    },
    {
      session: "۱۰",
      title: "بیزنس و بیزنس استایل",
      topics: [
        "نگرش‌های ایجاد بیزنس",
        "طراحی مسیر شغلی شخصی",
        "راه‌اندازی و ارتقا کسب و کار"
      ]
    }
  ];

  const transformations = [
    "ترس‌های بی‌اساس از بین میره",
    "حال و انرژی متعادل",
    "اضطراب و استرس کم میشه",
    "هر شرایطی رو به نفع خودت تغییر میدی",
    "با تمام وجود برای خواسته‌هات میجنگی",
    "سرعت اقدام زیاد میشه",
    "ایمان به کار چند برابر میشه",
    "راحت تو جمع‌ها حاضر میشی",
    "با قدرت ظاهر میشی",
    "منظم میشی و عادت‌های مخرب رو حذف میکنی",
    "به همه چی میرسی (ورزش، خانواده، پول)",
    "توی زندگیت معنا شکل میگیره",
    "زود شروع می‌کنی، لفت نمیدی",
    "با امکانات موجود حرکت میکنی"
  ];

  const powerManifestations = [
    {
      title: "خلق انتخاب جدید",
      description: "تا دیروز دو راه داشتی: تسلیم یا فرار. قدرت راه سوم رو باز می‌کنه!"
    },
    {
      title: "انتخاب سطح زندگی",
      description: "با سطحی زندگی می‌کنی که خودت انتخاب می‌کنی، نه جامعه"
    },
    {
      title: "رها کردن هوشمندانه",
      description: "می‌دونی کی و کجا رها کنی. افکار اشتباه رو رها می‌کنی، نه اهدافتو"
    },
    {
      title: "انتخاب‌گر بودن",
      description: "کی دوستت بشه، چی بخوری، کجا کار کنی رو خودت انتخاب می‌کنی"
    }
  ];

  const questions = [
    "می‌خوای ذهن و احساست رو کنترل کنی؟",
    "دلت می‌خواد دیگه نگی 'الان حسش نیست'؟",
    "خسته‌ای از صدای درونی که می‌گه 'نمی‌تونی'؟",
    "می‌خوای بدون ترس تو جمع‌ها ظاهر بشی؟",
    "می‌خوای لایف‌استایلی با آرامش و درآمد داشته باشی؟",
    "می‌خوای دست از اهمال‌کاری برداری؟",
    "می‌خوای با امکانات الانت پول بسازی؟",
    "می‌خوای کسب‌وکار با درآمد مستمر بسازی؟",
    "آماده‌ای خودت رو طوری نشون بدی که نادیده‌ات نگیرن؟"
  ];

  return (
    <>
      <SEOHead 
        title="کوچینگ زن قوی - تبدیل شو به بهترین نسخه از خودت | راضیه لیدی‌باس"
        description="برنامه ۳ ماهه کوچینگ گروهی برای زنانی که می‌خواهند در زندگی، کسب‌وکار و روابط خود قدرت واقعی داشته باشند."
        image="/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png"
      />
      
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero Section - Mobile Optimized */}
        <section className="relative py-8 md:py-20 px-4 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-12 items-center">
              {/* Text Content */}
              <div className="space-y-4 md:space-y-6 animate-fade-in text-center md:text-right">
                <Badge className="text-sm md:text-lg px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary border-primary/20 inline-block">
                  کوچینگ گروهی ۳ ماهه
                </Badge>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  کوچینگ <span className="text-primary">زن قوی</span>
                </h1>
                <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
                  تبدیل شو به نسخه‌ای از خودت که قدرت، نظم و درآمد واقعی داره
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2 md:pt-4 text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-primary w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold">۳ ماه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="text-primary w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold">گروهی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-primary w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold">۱۰ جلسه</span>
                  </div>
                </div>

                <div className="pt-4 md:pt-6">
                  <Button 
                    size="lg" 
                    className="text-base md:text-lg px-6 py-5 md:px-8 md:py-6 w-full md:w-auto"
                    onClick={handleDepositClick}
                    disabled={isLoading}
                  >
                    {isLoading ? "در حال انتقال..." : "رزرو با ۱۰۰ دلار"}
                  </Button>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2 md:mt-3">
                    💎 ظرفیت محدود - فقط با مصاحبه
                  </p>
                </div>
              </div>

              {/* Image */}
              <div className="relative w-full max-w-sm md:max-w-none mx-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={razie1} 
                    alt="راضیه لیدی‌باس"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 bg-primary text-primary-foreground p-4 md:p-6 rounded-xl shadow-lg">
                  <div className="text-2xl md:text-3xl font-bold">+۵۰۰</div>
                  <div className="text-xs md:text-sm">زن توانمند</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Limited Spots Alert */}
        <section className="py-3 md:py-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-center text-sm md:text-base">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <p className="font-semibold">
                فقط ۵ جای خالی باقی مانده
              </p>
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </section>

        {/* What You'll Gain Section - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2">
                💡 توی این <span className="text-primary">۳ ماه</span> چی به دست میاری؟
              </h2>
              <p className="text-base md:text-xl text-muted-foreground px-2">
                ۶ حوزه کلیدی که زندگی‌ت رو متحول می‌کنن
              </p>
            </div>

            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gains.map((gain, index) => (
                <Card key={index} className="p-4 md:p-6 hover-lift">
                  <div className="flex items-start gap-3 mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <gain.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold flex-1">{gain.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {gain.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-12">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 py-5 md:px-8 md:py-6 w-full md:w-auto"
                onClick={handleDepositClick}
                disabled={isLoading}
              >
                شروع با ۱۰۰ دلار
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Curriculum - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2">
                سرفصل <span className="text-primary">۱۰ جلسه</span>
              </h2>
              <p className="text-base md:text-xl text-muted-foreground px-2">
                برنامه جامع و کامل
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
              {curriculum.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 md:px-6">
                  <AccordionTrigger className="text-right hover:no-underline py-4 md:py-6">
                    <div className="flex items-start gap-2 md:gap-4 text-right w-full">
                      <Badge className="bg-primary/10 text-primary flex-shrink-0 text-xs md:text-sm">
                        جلسه {item.session}
                      </Badge>
                      <span className="font-bold text-sm md:text-lg">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 md:pb-6">
                    <ul className="space-y-2 md:space-y-3 mt-3 md:mt-4 mr-8 md:mr-16">
                      {item.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-start gap-2 md:gap-3">
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm md:text-base text-muted-foreground">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Transformations - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2">
                این چیزیه که <span className="text-primary">تغییر می‌کنه</span>
              </h2>
            </div>

            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {transformations.map((transformation, index) => (
                <Card key={index} className="p-4 md:p-6 hover-lift">
                  <div className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-foreground font-medium">{transformation}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Power Manifestations - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2">
                نمودهای <span className="text-primary">قدرت</span>
              </h2>
            </div>

            <div className="grid gap-4 md:gap-8 md:grid-cols-2">
              {powerManifestations.map((power, index) => (
                <Card key={index} className="p-6 md:p-8 hover-lift">
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold flex-1">{power.title}</h3>
                  </div>
                  <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">{power.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Questions - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2">
                ❓ از خودت <span className="text-primary">بپرس</span>
              </h2>
              <p className="text-sm md:text-xl text-muted-foreground px-2">
                اگه جواب‌ها «بله» بود، این برنامه برای تو طراحی شده
              </p>
            </div>

            <div className="space-y-3 md:space-y-6 max-w-4xl mx-auto">
              {questions.map((question, index) => (
                <Card key={index} className="p-4 md:p-6 hover-lift border-r-4 border-r-primary">
                  <div className="flex items-start gap-3 md:gap-4">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm md:text-lg text-foreground">{question}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-12">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 py-5 md:px-8 md:py-6 w-full md:w-auto"
                onClick={handleDepositClick}
                disabled={isLoading}
              >
                بله، آماده‌ام!
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Value & Pricing - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-16 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 px-2">
                این یه <span className="text-primary">سرمایه‌گذاریه</span>
              </h2>
              
              {/* Value Cards */}
              <Card className="p-6 md:p-8 mb-6 md:mb-8 bg-gradient-to-br from-primary/10 to-secondary/10">
                <p className="text-xl md:text-2xl font-bold mb-4 md:mb-6">۷۴۷ دلار یعنی چی؟</p>
                <div className="grid gap-4 md:gap-6 text-right">
                  <div className="space-y-1">
                    <p className="text-base md:text-lg font-semibold">💰 کمتر از دو مانتوی گرون</p>
                    <p className="text-xs md:text-sm text-muted-foreground">که بعد چند ماه فراموششون می‌کنی</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base md:text-lg font-semibold">☕ روزی فقط ۱۰ دلار</p>
                    <p className="text-xs md:text-sm text-muted-foreground">کمتر از یه قهوه!</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 mb-6 md:mb-8 border-2 border-success">
                <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4 text-right">
                  <DollarSign className="w-10 h-10 md:w-12 md:h-12 text-success flex-shrink-0" />
                  <div>
                    <p className="text-base md:text-xl font-bold mb-2 md:mb-3">این کوچینگ مستقیماً تبدیل میشه به پول</p>
                    <p className="text-sm md:text-lg text-muted-foreground">
                      فقط کافیه یک بار یه تصمیم درست بگیری، هزینه دوره دراومده
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Pricing Steps */}
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 px-2">
                  چطور <span className="text-primary">شروع کنم</span>؟
                </h2>
              </div>

              {/* Step 1 */}
              <Card className="p-6 md:p-8 mb-6 md:mb-8 border-2 border-primary shadow-xl">
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0">
                    ۱
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">پیش‌پرداخت و مصاحبه</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
                      ۱۰۰ دلار پیش‌پرداخت کن و وقت مصاحبه رزرو کن
                    </p>
                    <Button
                      size="lg"
                      onClick={handleDepositClick}
                      disabled={isLoading}
                      className="w-full text-base md:text-lg px-6 py-5 md:px-8 md:py-6"
                    >
                      {isLoading ? "در حال انتقال..." : "پرداخت ۱۰۰ دلار"}
                      <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Step 2 */}
              <Card className="p-6 md:p-8 mb-6 md:mb-8">
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0">
                    ۲
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">پس از قبولی</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                      یکی از دو گزینه پرداخت رو انتخاب کن:
                    </p>

                    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                      {/* Monthly */}
                      <Card className="p-4 md:p-6 border-2 hover-lift">
                        <div className="text-center">
                          <h4 className="text-base md:text-xl font-bold mb-2">ماهانه</h4>
                          <div className="text-3xl md:text-4xl font-bold text-primary mb-2">۲۹۹$</div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">۳ ماه</p>
                          
                          <div className="border-t pt-3 md:pt-4 mb-3 md:mb-4">
                            <div className="flex justify-between text-xs md:text-sm mb-1">
                              <span className="text-muted-foreground">جمع:</span>
                              <span className="font-semibold">۸۹۷$</span>
                            </div>
                          </div>

                          <ul className="space-y-1.5 md:space-y-2 text-right text-xs md:text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>انعطاف در پرداخت</span>
                            </li>
                          </ul>
                        </div>
                      </Card>

                      {/* One-time */}
                      <Card className="p-4 md:p-6 border-2 border-success hover-lift bg-success/5 relative">
                        <div className="absolute top-0 left-0 bg-success text-success-foreground px-2 md:px-3 py-0.5 md:py-1 text-xs font-bold rounded-br-lg">
                          توصیه
                        </div>
                        <div className="text-center mt-4 md:mt-6">
                          <h4 className="text-base md:text-xl font-bold mb-2">یکجا</h4>
                          <div className="text-3xl md:text-4xl font-bold text-success mb-2">۷۴۷$</div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">کل دوره</p>
                          
                          <div className="border-t pt-3 md:pt-4 mb-3 md:mb-4">
                            <div className="flex justify-between text-xs md:text-sm mb-1">
                              <span className="text-muted-foreground">بدون تخفیف:</span>
                              <span className="line-through">۸۹۷$</span>
                            </div>
                            <div className="text-xs md:text-sm text-success font-semibold">
                              صرفه‌جویی ۱۵۰$
                            </div>
                          </div>

                          <ul className="space-y-1.5 md:space-y-2 text-right text-xs md:text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>بهترین ارزش</span>
                            </li>
                          </ul>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Guarantee */}
              <Card className="p-6 md:p-8 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30">
                <div className="flex items-start gap-3 md:gap-4">
                  <Shield className="w-10 h-10 md:w-12 md:h-12 text-success flex-shrink-0" />
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">ضمانت ۳۰ روزه</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      اگر تا ۳۰ روز اول احساس کنی مناسب نیست، کل مبلغ بازگردانده میشه
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 px-2">سوالات متداول</h2>
            
            <div className="space-y-4 md:space-y-6">
              <Card className="p-4 md:p-6 hover-lift">
                <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3">چرا ۱۰۰ دلار پیش‌پرداخت؟</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  برای رزرو جایگاه و مصاحبه با راضیه. تضمین می‌کنه افراد متعهد شرکت کنن.
                </p>
              </Card>

              <Card className="p-4 md:p-6 hover-lift">
                <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3">اگر قبول نشم چی؟</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  کل ۱۰۰ دلار بازگردانده میشه. هیچ ریسکی نیست.
                </p>
              </Card>

              <Card className="p-4 md:p-6 hover-lift">
                <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3">اگه ایده بیزنسی ندارم؟</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  نگران نباش! ما کمکت می‌کنیم مسیرت رو پیدا کنی.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA - Mobile Optimized */}
        <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-success/10">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              من اینجام که <span className="text-primary">راهو نشونت بدم</span>
            </h2>
            <p className="text-lg md:text-2xl text-muted-foreground mb-3 md:mb-4 px-2">
              اگه تو هم آماده‌ای که بری...
            </p>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
              من نمی‌خوام بهت بگم می‌تونی—می‌خوام کاری کنیم که <strong>بتونی</strong>
            </p>
            
            <div className="space-y-4 md:space-y-6">
              <Button
                size="lg"
                onClick={handleDepositClick}
                disabled={isLoading}
                className="text-base md:text-lg px-8 py-6 md:px-10 md:py-7 w-full md:w-auto shadow-2xl"
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                {isLoading ? "در حال انتقال..." : "شروع با ۱۰۰ دلار"}
              </Button>
              
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
                  <span>ضمانت ۳۰ روزه</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-urgency" />
                  <span>فقط ۵ جا</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
                  <span>+۵۰۰ زن</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default EmpoweredWomanCoaching;