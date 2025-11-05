import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import {
  Check,
  Star,
  Users,
  Calendar,
  Sparkles,
  Shield,
  TrendingUp,
  Heart,
  Briefcase,
  DollarSign,
  Award,
  Clock,
  Video,
  MessageCircle,
  Target,
  Zap,
  Gift,
  CheckCircle2,
  ArrowLeft,
  Brain,
  Lightbulb,
  Rocket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export default function EmpoweredWomanCoaching() {
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

  const curriculum = [
    {
      number: "۱",
      title: "چکاپ وضعیت فعلی و بازسازی",
      description: "بازسازی تصویر فعلی و گذشته از خود، تمرین خودبخششی (صلح با خود) و معناگرایی در وجود چالش‌های هر فرد"
    },
    {
      number: "۲",
      title: "مدیریت و پرورش افکار و احساسات",
      description: "با متد ACT - غلبه بر افکار منفی، تسلط بر احساسات، مدیریت در شرایط سخت، غلبه بر احساس ضعف، مدیریت افکار تخریبگر و بازطراحی ماشین رفتار"
    },
    {
      number: "۳",
      title: "مکانیزم انگیزه و توقع",
      description: "ایجاد انگیزه دائمی، طراحی فیلمنامه زندگی، طراحی و ساخت توقع، پیش‌زمینه احساس لیاقت"
    },
    {
      number: "۴",
      title: "مکانیزم نگرش‌ها",
      description: "اصول شکل‌گیری نگرش‌ها، ریشه‌یابی نگرش‌های ۳ حوزه (فردی، ارتباطی، مستقل شدن/پولسازی)، طراحی سوالات تخصصی، آموزش شیوه تغییر نگرش"
    },
    {
      number: "۵",
      title: "قانون درخواست و فنون ارتباط‌سازی",
      description: "غلبه بر ترس از نه شنیدن، اصول یک درخواست قوی، غلبه بر ترس‌های حضور در جمع، تمرین‌های حضور اجتماعی، اصول دوستی و ارتباط‌سازی"
    },
    {
      number: "۶",
      title: "لایف استایل خانم رئیس",
      description: "فاکتورهای شتاب‌دهنده تغییر، طراحی روتین‌های روزانه، اصول تغییر عادت، مدیریت زمان، ژورنال‌نویسی، کنترل ذهن، لایف استایل سالم غذایی"
    },
    {
      number: "۷",
      title: "هدف‌گذاری پیشرفته",
      description: "مدیریت اهداف، ایجاد تعادل در زندگی، زندگی پر دستاورد، هدف‌نویسی، برنامه‌ریزی برای اهداف، طراحی رویا + هدف + چشم‌انداز"
    },
    {
      number: "۸",
      title: "غلبه بر اهمال‌کاری و کمال‌گرایی",
      description: "ریشه‌های کمبود عزت نفس و اعتماد به نفس، رفع کمال‌گرایی، آموزش اقدام‌گرایی، رفع اهمال‌کاری"
    },
    {
      number: "۹",
      title: "پول و مدیریت پول",
      description: "نگرش برای پول، تمرینات عملی مدیریت مالی، اصول درآمدسازی"
    },
    {
      number: "۱۰",
      title: "بیزنس و بیزنس استایل",
      description: "نگرش‌های ایجاد بیزنس، طراحی مسیر شغلی شخصی، هدف‌گذاری پولسازی، طراحی لایف استایل بیزنسی، مسیر راه‌اندازی و ارتقا کسب و کار"
    }
  ];

  const transformations = [
    { icon: Brain, text: "مدیریت ذهن و احساسات برای تصمیمات مالی آرام و هوشمندانه" },
    { icon: Lightbulb, text: "اصلاح نگرش‌ها و ساکت کردن صدای «نمی‌تونی»" },
    { icon: Users, text: "قدرت ارتباط و دیده شدن در جمع‌ها با اعتماد به نفس" },
    { icon: Rocket, text: "ساختن لایف‌استایل زن موفق با انرژی و تمرکز بالا" },
    { icon: Target, text: "غلبه بر کمال‌گرایی و اهمال‌کاری - شروع سریع، نتیجه سریع" },
    { icon: DollarSign, text: "آگاهی مالی و رشد درآمد به عنوان یک مهارت" },
    { icon: Briefcase, text: "بیزنس استایل و فروش حرفه‌ای - تبدیل تخصص به پول" }
  ];

  const benefits = [
    "ترس‌های بی‌اساس که تو رو محدود کرده از بین می‌ره",
    "حال و انرژی‌ات همیشه متعادله. حالت خوبه",
    "اضطراب و استرس‌هات خیلی کم می‌شه",
    "هر شرایطی رو به نفع خودت تغییر میدی",
    "با تمام وجود برای خواسته‌هات می‌جنگی",
    "سرعت اقداماتت زیاد می‌شه. سریع اقدام می‌کنی",
    "ایمانت به کاری که می‌کنی چند برابر می‌شه",
    "خیلی راحت و با اعتماد به نفس تو جمع‌ها حاضر می‌شی",
    "در مقابل افراد غریبه با قدرت ظاهر می‌شی",
    "منظم می‌شی و عادت‌های بد و مخرب رو از بین می‌بری",
    "وقت‌هات یه‌جوری می‌شه که به همه‌چی می‌رسی (ورزش - خانواده - روابط خوب - پول)",
    "عمرت هدر نمی‌ره برای اهداف بیهوده",
    "توی زندگی‌ت معنا شکل می‌گیره",
    "به اینکه دیگران چه فکری می‌کنن عمیقاً فکر نمی‌کنی و هرکاری لازمه انجام می‌دی",
    "زود شروع می‌کنی، لفت نمی‌دی",
    "یاد می‌گیری با امکانات موجود حرکت کنی",
    "در مورد پول می‌دونی اگه دستت پول باشه می‌خوای باهاش چیکار کنی که قدرتت بیشتر بشه"
  ];

  const powerManifestations = [
    {
      title: "توانایی خلق انتخابی که قبلاً نداشتی",
      description: "اگه تا دیروز دو تا راه داشتی: تسلیم یا فرار، قدرت راه سومی رو برات باز می‌کنه"
    },
    {
      title: "زندگی در سطحی که خودت انتخاب می‌کنی",
      description: "نه لولی که جامعه انتخاب کرده - تو انتخاب می‌کنی آدم‌ها چجوری برخورد کنن"
    },
    {
      title: "دانستن کی و کجا رها کنی",
      description: "آدم‌های ضعیف اهدافشون رو رها می‌کنن، آدم‌های قوی افکار اشتباهشون رو"
    },
    {
      title: "انتخاب‌گر بودن",
      description: "کی با من دوست بشه، چی بخورم، وقتا رو چجوری بگذرونم، کجا کار کنم - نه صرفاً چون منو قبول کردن"
    }
  ];

  const questions = [
    "آیا تو هم کسی هستی که می‌خواد بتونه ذهن و احساساتش رو کنترل کنه، تا دیگه تصمیمات مهم زندگیش از روی ترس یا عجله نباشن؟",
    "آیا تو هم دلت می‌خواد یه روزایی بیاد که بگی: «من هیچ‌وقت دیگه با جمله‌ی 'الان حسش نیست' کارمو عقب نمی‌ندازم»؟",
    "آیا خسته‌ای از صدای درونت که همیشه می‌گه: «نمی‌تونی»، «الان وقتش نیست»، «شرایط مناسب نیست»؟",
    "آیا دوست داری بتونی بدون ترس، توی جمع‌ها با اعتماد به نفس ظاهر بشی، دیده بشی، و فرصتا بیان سمتت؟",
    "آیا تو هم می‌خوای لایف‌استایلی بسازی که توش هم آرامش داشته باشی، هم درآمد، هم رشد شخصی، هم زمان برای خانواده؟",
    "آیا می‌خوای بالاخره دست از اهمال‌کاری برداری، زودتر اقدام کنی و زودتر نتیجه ببینی؟",
    "آیا وقتشه که یاد بگیری چطور با امکانات الانت پول بسازی و بعد چندبرابرش کنی؟",
    "آیا دلت می‌خواد از تخصصت، یا حتی بدون تخصص، یه کسب‌وکار واقعی بسازی که درآمد مستمر برات داشته باشه؟",
    "آیا آماده‌ای که خودت رو طوری به دنیا نشون بدی که هیچ‌کس نتونه نادیده‌ت بگیره؟"
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="کوچینگ زن قوی - برنامه تحول ۳ ماهه با راضیه لیدی‌باس"
        description="قدرت ۱۰ برابری در ذهن، احساسات، روابط، درآمد و بیزنس. ۱۰ جلسه کوچینگ تخصصی برای زنان مهاجر که می‌خواهند قدرتمند شوند."
        image="/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png"
      />

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-12 md:pb-16 px-4 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center animate-fade-in rtl font-farsi">
            <Badge className="mb-6 text-base px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
              <Sparkles className="w-4 h-4 ml-2" />
              ویژه زنان مهاجری که می‌خواهند قدرتمند شوند
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">کوچینگ زن قوی</span>
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-foreground mb-4 max-w-4xl mx-auto leading-relaxed font-semibold">
              ۳ ماه قدرتمند ده‌برابر با راضیه لیدی‌باس
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              برنامه جامع ۱۰ جلسه‌ای برای تسلط بر ذهن، احساسات، روابط، پول و بیزنس
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">۳ ماه</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border">
                <Video className="w-5 h-5 text-primary" />
                <span className="font-semibold">۱۰ جلسه کوچینگ زنده</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">کوچینگ گروهی</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                onClick={handleDepositClick}
                disabled={isLoading}
                className="text-lg px-10 py-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105"
              >
                <Shield className="w-5 h-5 ml-2" />
                {isLoading ? "در حال انتقال..." : "رزرو جلسه مشاوره با پیش‌پرداخت ۱۰۰ دلار"}
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                <span>ضمانت ۳۰ روزه بازگشت وجه</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-secondary" />
                <span>مربی معتبر با سابقه</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>ظرفیت محدود</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="py-6 px-4 bg-gradient-to-r from-primary via-primary/90 to-primary">
        <div className="max-w-6xl mx-auto text-center rtl font-farsi">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-primary-foreground">
            <Gift className="w-8 h-8 animate-bounce" />
            <div>
              <p className="text-2xl md:text-4xl font-bold mb-1">
                پرداخت یکجا: از <span className="line-through opacity-75">۸۹۷$</span> به <span className="text-3xl md:text-5xl">۷۴۷$</span>
              </p>
              <p className="text-lg opacity-90">صرفه‌جویی ۱۵۰ دلار - شروع برنامه‌ات با برد، نه با بدهی</p>
            </div>
            <Gift className="w-8 h-8 animate-bounce" />
          </div>
        </div>
      </section>

      {/* What You'll Gain */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              💡 توی این مسیر ۳ ماهه، <span className="gradient-text">دقیقاً چه چیزی به دست میاری؟</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transformations.map((item, index) => (
              <Card key={index} className="p-6 hover-lift bg-card border-2 border-border hover:border-primary transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-base leading-relaxed text-foreground">{item.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              سرفصل <span className="gradient-text">۱۰ جلسه کوچینگ زن قوی</span>
            </h2>
            <p className="text-xl text-muted-foreground">مسیر گام‌به‌گام تحول شخصی و حرفه‌ای شما</p>
          </div>

          <div className="grid gap-6 max-w-5xl mx-auto">
            {curriculum.map((session, index) => (
              <Card key={index} className="p-6 md:p-8 hover-lift bg-card border-2 border-border hover:border-primary transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-2xl font-bold shadow-lg">
                    {session.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">{session.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{session.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits That Disappear */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">تحولی که در زندگی‌ات اتفاق می‌افته</span>
            </h2>
            <p className="text-xl text-muted-foreground">وقتی این کوچینگ رو تموم کنی، این تغییرات رو توی خودت می‌بینی:</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-base text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Power Manifestations */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">نمودهای درست قدرت</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {powerManifestations.map((power, index) => (
              <Card key={index} className="p-8 hover-lift bg-card border-2 border-border">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{power.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{power.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              ❓ <span className="gradient-text">از خودت بپرس...</span>
            </h2>
            <p className="text-xl text-muted-foreground">اگه جواب بیشتر این سوالا «بله» بود، این کوچینگ برای تو طراحی شده</p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {questions.map((question, index) => (
              <Card key={index} className="p-6 hover-lift bg-card border-r-4 border-r-primary">
                <p className="text-lg text-foreground leading-relaxed">{question}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-bold text-foreground mb-8">
              اگه جواب بیشتر این سوالا «بله» بود،<br />
              پس کوچینگ زن قوی برای تو طراحی شده.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">سرمایه‌گذاری</span> روی خودت
            </h2>
            <p className="text-xl text-muted-foreground mb-8">این یه سرمایه‌گذاریه. روی خودت. روی آینده‌ت.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="p-8 border-2 border-border hover-lift">
              <div className="text-center mb-6">
                <Badge className="mb-4 bg-secondary text-secondary-foreground">پرداخت ماهانه</Badge>
                <div className="text-4xl font-bold mb-2">۲۹۹$</div>
                <p className="text-muted-foreground">در ماه</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>۳ پرداخت ماهانه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>جمعاً ۸۹۷ دلار</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>انعطاف مالی بیشتر</span>
                </div>
              </div>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDepositClick}
                disabled={isLoading}
                className="w-full text-lg py-6"
              >
                شروع با پیش‌پرداخت ۱۰۰$
              </Button>
            </Card>

            <Card className="p-8 border-4 border-primary hover-lift relative overflow-hidden">
              <div className="absolute top-4 left-4">
                <Badge className="bg-success text-success-foreground">صرفه‌جویی ۱۵۰$</Badge>
              </div>
              <div className="text-center mb-6 mt-4">
                <Badge className="mb-4 bg-primary text-primary-foreground">پرداخت یکجا (پیشنهاد ویژه)</Badge>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-2xl line-through text-muted-foreground">۸۹۷$</span>
                  <span className="text-5xl font-bold text-primary">۷۴۷$</span>
                </div>
                <p className="text-muted-foreground">پرداخت یکجا</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span className="font-semibold">صرفه‌جویی ۱۵۰ دلار</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>شروع با برد، نه با بدهی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>دسترسی کامل فوری</span>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleDepositClick}
                disabled={isLoading}
                className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl"
              >
                شروع با پیش‌پرداخت ۱۰۰$
              </Button>
            </Card>
          </div>

          {/* Value Propositions */}
          <div className="max-w-4xl mx-auto space-y-8 mb-12">
            <Card className="p-8 bg-card">
              <h3 className="text-2xl font-bold mb-4">حالا شاید بگی "۷۴۷ دلار زیاده"...</h3>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>ولی بذار بپرسم:</p>
                <div className="space-y-2 pr-4">
                  <p>✖️ چند بار به خاطر نداشتن اعتماد به نفس یه فرصت رو از دست دادی؟</p>
                  <p>✖️ چند بار بخاطر نداشتن تسلط بر احساسات، یه رابطه یا یه شغل رو نابود کردی؟</p>
                  <p>✖️ چند ساله فقط فکر می‌کنی یه روز باید تغییر کنی، اما هنوز همون‌جایی که بودی هستی؟</p>
                </div>
                <p className="font-bold text-foreground text-xl mt-6">
                  اگه فقط یکی از این اشتباهاتو نخوای دوباره تکرار کنی، این کوچینگ نه تنها ارزون نیست—حتی گرون هم نیست.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
              <h3 className="text-2xl font-bold mb-4">۷۴۷ دلار یعنی چی واقعاً؟</h3>
              <div className="space-y-3 text-lg">
                <p>یعنی روزی <span className="font-bold text-primary text-2xl">۱۰ دلار</span> داری سرمایه‌گذاری می‌کنی روی:</p>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {[
                    "کنترل ذهنت",
                    "اعتماد به نفس‌ت",
                    "درآمدت",
                    "آرامش و نظم زندگیت",
                    "ساختن نسخه‌ی جدید از خودت",
                    "قدرت در جمع‌ها و روابط"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xl font-bold text-foreground mt-6">
                  یعنی کمتر از قیمت یه قهوه بیرون! 🤔
                </p>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/20 mb-8">
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                تو لایق اینی که یه مربی در کنارت باشه.
              </p>
              <p className="text-xl text-muted-foreground mb-2">
                لایق اینی که توی بیزنس، رابطه و زندگی بدرخشی.
              </p>
              <p className="text-lg text-muted-foreground">
                این کوچینگ فقط یه کلاس نیست—یه بیانیه‌ست:<br />
                <span className="font-bold text-foreground">اینکه تو دیگه قرار نیست نسخه ضعیف خودت باشی.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-primary/95 to-primary">
        <div className="max-w-4xl mx-auto text-center rtl font-farsi text-primary-foreground">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            من اینجام که راهو نشونت بدم.
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            اگه تو هم آماده‌ای که بری...
          </p>
          <Button
            size="lg"
            onClick={handleDepositClick}
            disabled={isLoading}
            className="text-xl px-12 py-8 bg-background text-foreground hover:bg-background/90 shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <Shield className="w-6 h-6 ml-2" />
            {isLoading ? "در حال انتقال..." : "رزرو جلسه مشاوره - پیش‌پرداخت ۱۰۰ دلار"}
          </Button>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>ضمانت ۳۰ روزه بازگشت وجه</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>ظرفیت محدود</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>شروع سریع</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              سوالات <span className="gradient-text">متداول</span>
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "پیش‌پرداخت ۱۰۰ دلار برای چیه؟",
                a: "این پیش‌پرداخت برای رزرو جلسه مشاوره و بررسی واجد شرایط بودنه. بعد از جلسه اگه تصمیم بگیری ادامه بدی، این ۱۰۰ دلار از هزینه کل کم می‌شه."
              },
              {
                q: "ضمانت بازگشت وجه چگونه کار می‌کنه؟",
                a: "اگه تا ۳۰ روز اول احساس کردی این برنامه برات مناسب نیست، کل پولت رو بدون هیچ سوالی پس می‌گیری."
              },
              {
                q: "جلسات به چه صورتی برگزار می‌شن؟",
                a: "جلسات به صورت آنلاین و زنده (Face-to-Face) برگزار می‌شن. می‌تونی از هر کجای دنیا شرکت کنی."
              },
              {
                q: "اگه یه جلسه رو از دست بدم چی؟",
                a: "نگران نباش! تمام جلسات ضبط می‌شن و می‌تونی بعداً ببینی. همچنین گروه پشتیبانی برای سوالات همیشه فعاله."
              },
              {
                q: "کی برنامه شروع می‌شه؟",
                a: "بعد از تکمیل ثبت‌نام و جلسه مشاوره، تاریخ شروع دوره بهت اطلاع داده می‌شه. معمولاً ظرف ۲ هفته."
              }
            ].map((faq, index) => (
              <Card key={index} className="p-6 hover-lift bg-card">
                <h3 className="text-xl font-bold mb-3 text-foreground">{faq.q}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
