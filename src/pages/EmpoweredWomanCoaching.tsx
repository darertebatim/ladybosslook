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
  Brain,
  Lightbulb,
  Rocket,
  ChevronDown,
  ArrowLeft,
  Coffee
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      session: "جلسه ۱",
      title: "چکاپ وضعیت فعلی و بازسازی",
      description: "بازسازی تصویر فعلی و گذشته از خود، تمرین خود بخششی (صلح با خود) و معناگرایی در وجود چالشها",
      icon: Target
    },
    {
      session: "جلسات ۲-۳",
      title: "مدیریت و پرورش افکار و احساسات",
      description: "غلبه بر افکار منفی، تسلط بر احساسات با متد ACT، مدیریت فکر در شرایط سخت، بازطراحی ماشین رفتار",
      icon: Brain
    },
    {
      session: "جلسه ۴",
      title: "مکانیزم انگیزه و توقع",
      description: "ایجاد انگیزه دائمی، طراحی فیلمنامه زندگی، ساخت توقع و پیش‌زمینه احساس لیاقت",
      icon: Rocket
    },
    {
      session: "جلسه ۵",
      title: "مکانیزم نگرشها",
      description: "ریشه‌یابی نگرشهای فردی، ارتباطی و استقلال مالی، آموزش شیوه تغییر نگرش شخصی",
      icon: Lightbulb
    },
    {
      session: "جلسه ۶",
      title: "قانون درخواست و فنون ارتباط‌سازی",
      description: "غلبه بر ترس از نه شنیدن، اصول درخواست قوی، حضور در جمع، دوست‌یابی و ارتباط‌سازی",
      icon: MessageCircle
    },
    {
      session: "جلسه ۷",
      title: "لایف استایل خانم رئیس",
      description: "طراحی روتین‌های روزانه، مدیریت زمان، ژورنال‌نویسی، کنترل ذهن، لایف‌استایل سالم",
      icon: Star
    },
    {
      session: "جلسه ۸",
      title: "هدف‌گذاری پیشرفته",
      description: "مدیریت اهداف، ایجاد تعادل در زندگی، زندگی پر دستاورد، طراحی رویا + هدف + چشم‌انداز",
      icon: Target
    },
    {
      session: "جلسه ۹",
      title: "غلبه بر اهمال‌کاری و کمال‌گرایی",
      description: "ریشه‌های کمبود عزت نفس، آموزش اقداماتی‌گرایی، رفع کمال‌گرایی و اهمال‌کاری",
      icon: Zap
    },
    {
      session: "جلسه ۱۰",
      title: "پول و مدیریت پول",
      description: "نگرش برای پول، تمرینات عملی مدیریت مالی، اصول درآمدسازی",
      icon: DollarSign
    },
    {
      session: "جلسات ۱۱-۱۲",
      title: "بیزنس و بیزنس استایل",
      description: "نگرشهای ایجاد بیزنس، طراحی مسیر شغلی، هدف‌گذاری پولسازی، لایف‌استایل بیزنسی، راه‌اندازی کسب‌وکار",
      icon: Briefcase
    }
  ];

  const transformations = [
    "ترس‌های بی‌اساس که محدودت کرده از بین می‌رود",
    "حال و انرژی‌ات همیشه متعادل است - حالت خوب است",
    "اضطراب و استرس‌هایت خیلی کم می‌شود",
    "هر شرایطی را به نفع خودت تغییر می‌دهی",
    "با تمام وجود برای خواسته‌هایت می‌جنگی",
    "سرعت اقداماتت زیاد می‌شود - سریع اقدام می‌کنی",
    "ایمانت به کاری که می‌کنی چند برابر می‌شود",
    "خیلی راحت و با اعتماد‌به‌نفس در جمع‌ها حاضر می‌شوی",
    "در مقابل افراد غریبه با قدرت ظاهر می‌شوی",
    "منظم می‌شوی و عادت‌های بد و مخرب را از بین می‌بری",
    "وقت‌هایت یه‌جوری می‌شود که به همه‌چی می‌رسی (ورزش - خانواده - روابط خوب - پول)",
    "عمرت هدر نمی‌رود برای اهداف بیهوده",
    "در زندگی‌ات معنا شکل می‌گیرد",
    "به اینکه دیگران چه فکری می‌کنند عمیقاً فکر نمی‌کنی و هر کاری لازم است انجام می‌دهی",
    "زود شروع می‌کنی - لفت نمی‌دهی",
    "یاد می‌گیری با امکانات موجود حرکت کنی",
    "در مورد پول بدانی و اگر دستت پول باشد می‌خواهی باهاش چیکار کنی که قدرت تو بیشتر شود"
  ];

  const powerDefinitions = [
    {
      title: "توانایی خلق انتخاب جدید",
      description: "اگه تا دیروز دو تا راه داشتی: تسلیم یا فرار، قدرت سومی رو برات باز می‌کنه! (وقتی مهاجرت کردم همه گفتن نمیتونی اینجا همون کار ایران رو کنی! ولی من رفتم کردم!)",
      icon: Rocket
    },
    {
      title: "انتخاب سطح زندگی",
      description: "من با سطحی زندگی می‌کنم که خودم انتخاب می‌کنم، نه لولی که جامعه انتخاب کرده! من انتخاب می‌کنم آدم‌ها چطوری برخورد کنند",
      icon: Star
    },
    {
      title: "دانستن چه وقت رها کنی",
      description: "آدم‌های ضعیف وقتی سخت می‌شود اهدافشون رو رها می‌کنند. اما آدم‌های قوی افکار اشتباهشون رو رها می‌کنند. یه چیزی تو سر من هست باید تغییرش بدم",
      icon: Brain
    },
    {
      title: "انتخابگر باشی",
      description: "کی با من دوست بشه! چی بخورم! وقتا رو چطوری بگذرونم! کجا کار کنم! نه صرفاً چون منو قبول کردن",
      icon: Target
    }
  ];

  const reflectionQuestions = [
    "آیا تو هم کسی هستی که می‌خواد بتونه ذهن و احساساتش رو کنترل کنه، تا دیگه تصمیمات مهم زندگیش از روی ترس یا عجله نباشن؟",
    "آیا تو هم دلت می‌خواد یه روزایی بیاد که بگی: «من هیچ‌وقت دیگه با جمله‌ی 'الان حسش نیست' کارمو عقب نمی‌ندازم»؟",
    "آیا خسته‌ای از صدای درونت که همیشه می‌گه: «نمی‌تونی»، «الان وقتش نیست»، «شرایط مناسب نیست»؟",
    "آیا دوست داری بتونی بدون ترس، توی جمع‌ها با اعتماد‌به‌نفس ظاهر بشی، دیده بشی، و فرصتا بیان سمتت؟",
    "آیا تو هم می‌خوای لایف‌استایلی بسازی که توش هم آرامش داشته باشی، هم درآمد، هم رشد شخصی، هم زمان برای خانواده؟",
    "آیا می‌خوای بالاخره دست از اهمال‌کاری برداری، زودتر اقدام کنی و زودتر نتیجه ببینی؟",
    "آیا وقتشه که یاد بگیری چطور با امکانات الانت پول بسازی و بعد چندبرابرش کنی؟",
    "آیا دلت می‌خواد از تخصصت، یا حتی بدون تخصص، یه کسب‌وکار واقعی بسازی که درآمد مستمر برات داشته باشه؟",
    "آیا آماده‌ای که خودت رو طوری به دنیا نشون بدی که هیچ‌کس نتونه نادیده‌ت بگیره؟"
  ];

  return (
    <div className="min-h-screen bg-background font-farsi">
      <SEOHead
        title="کوچینگ زن قوی - تبدیل شوید به نسخه قدرتمند خودتان"
        description="برنامه کوچینگ ۳ ماهه تحول‌آفرین برای زنان مهاجر. مدیریت ذهن، افزایش درآمد، قدرت در روابط. با راضیه لیدی باس"
        image="/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png"
      />

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-12 md:pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-fade-in-up rtl">
            <Badge className="mb-4 md:mb-6 text-xs md:text-sm px-3 md:px-6 py-1.5 md:py-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 ml-2" />
              محدود به ۱۵ نفر - تنها ۵ جا باقی مانده
            </Badge>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight px-2">
              تبدیل شو به نسخه‌ای از خودت که
              <br />
              <span className="gradient-text">هیچ‌کس نمی‌تونه نادیده‌ش بگیره</span>
            </h1>

            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              کوچینگ ۳ ماهه زن قوی: مسیری که ذهنت رو کنترل می‌کنی، درآمدت رو چندبرابر می‌کنی،
              <br className="hidden md:block" />
              و با قدرت واقعی توی کار، روابط و زندگی ظاهر می‌شی
            </p>

            <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8 md:mb-10 px-2">
              <div className="flex items-center gap-2 text-foreground text-xs md:text-base bg-card px-3 md:px-4 py-2 md:py-2.5 rounded-full border border-border">
                <Calendar className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold">۳ ماه</span>
              </div>
              <div className="flex items-center gap-2 text-foreground text-xs md:text-base bg-card px-3 md:px-4 py-2 md:py-2.5 rounded-full border border-border">
                <Video className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold">۱۲ جلسه زنده</span>
              </div>
              <div className="flex items-center gap-2 text-foreground text-xs md:text-base bg-card px-3 md:px-4 py-2 md:py-2.5 rounded-full border border-border">
                <Users className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold">گروهی انحصاری</span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleDepositClick}
              disabled={isLoading}
              className="cta-button text-sm md:text-lg px-6 md:px-10 py-5 md:py-7 text-white font-bold shadow-bold hover:shadow-glow mb-4 md:mb-6 w-full sm:w-auto"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              {isLoading ? "در حال انتقال..." : "شروع با پیش‌پرداخت ۱۰۰ دلار"}
            </Button>

            <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-2 md:gap-6 text-xs md:text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Shield className="w-3 h-3 md:w-4 md:h-4 text-success" />
                <span>ضمانت ۳۰ روزه</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-secondary" />
                <span>+۵۰۰ زن توانمند</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Users className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span>محدودیت ظرفیت</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 md:mt-12 animate-bounce">
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8 mx-auto text-primary" />
        </div>
      </section>

      {/* What You'll Gain Section */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              💡 توی این مسیر ۳ ماهه، دقیقاً چه چیزی
              <br />
              <span className="gradient-text">به دست میاری؟</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "مدیریت ذهن و احساسات",
                points: [
                  "تصمیمات مالی از روی آرامش، نه ترس یا عجله",
                  "فرصت‌ها رو می‌فهمی، نه از دستشون می‌دی",
                  "دیگه نمی‌گی 'الان حسش نیست' → سریع اقدام، سریع نتیجه"
                ],
                icon: Brain
              },
              {
                title: "اصلاح نگرش‌ها",
                points: [
                  "صدای 'نمی‌تونی' یا 'الان وقتش نیست' → ساکت می‌شه",
                  "هر موقعیت سخت می‌تونه یه سکوی پرتاب بشه",
                  "نگرش‌های محدودکننده حذف می‌شن"
                ],
                icon: Lightbulb
              },
              {
                title: "قدرت ارتباط و دیده شدن",
                points: [
                  "با اعتماد‌به‌نفس در جمع‌ها صحبت می‌کنی",
                  "پیشنهادهای کاری و همکاری بیشتر می‌گیری",
                  "می‌تونی درخواست کنی بدون ترس → درآمد بیشتر"
                ],
                icon: Star
              },
              {
                title: "لایف‌استایل زن موفق",
                points: [
                  "هر روز انرژی بالا و تمرکز قوی",
                  "تعادل واقعی بین خانواده، رشد شخصی و پول",
                  "عادت‌های مخرب حذف می‌شن"
                ],
                icon: Rocket
              },
              {
                title: "غلبه بر کمال‌گرایی و اهمال‌کاری",
                points: [
                  "دیگه نمی‌گی 'هنوز آمادگی ندارم'",
                  "زود شروع می‌کنی، زود نتیجه می‌گیری",
                  "مسیر پول‌سازی بدون کلافه شدن"
                ],
                icon: Zap
              },
              {
                title: "آگاهی مالی و رشد درآمد",
                points: [
                  "پول‌درآوردن برات یه مهارت میشه",
                  "پول تو رو قدرتمندتر می‌کنه نه وابسته‌تر",
                  "با همون امکاناتی که داری پول می‌سازی"
                ],
                icon: DollarSign
              }
            ].map((item, index) => (
              <Card key={index} className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground">{item.title}</h3>
                </div>
                <ul className="space-y-2 md:space-y-3 mr-14">
                  {item.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-xs md:text-sm text-muted-foreground leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Results */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              بعد از این ۳ ماه،
              <br />
              <span className="gradient-text">چه تحولی توی تو رخ می‌ده؟</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              این‌ها فقط وعده نیست - این‌ها نتایج واقعی‌ای است که زن‌های قبلی تجربه کردند
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {transformations.map((item, index) => (
              <Card key={index} className="p-4 md:p-5 hover-lift bg-card border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-success" />
                  </div>
                  <p className="text-xs md:text-sm text-foreground leading-relaxed">{item}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Power Definitions */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">نمودهای درست قدرت</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              قدرت واقعی یعنی چی؟ بذار راضیه برات توضیح بده
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {powerDefinitions.map((item, index) => (
              <Card key={index} className="p-6 md:p-8 hover-lift bg-card border-2 border-border">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 md:mb-6">
                  <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-foreground">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              سرفصل <span className="gradient-text">۱۲ جلسه</span> کوچینگ زن قوی
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              هر جلسه یه قدم عملی به سمت نسخه قدرتمند خودت
            </p>
          </div>

          <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
            {curriculum.map((item, index) => (
              <Card key={index} className="p-5 md:p-6 hover-lift bg-card border-2 border-border transition-smooth">
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs w-fit">{item.session}</Badge>
                      <h3 className="text-base md:text-lg font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Reflection Questions */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              ❓ <span className="gradient-text">از خودت بپرس...</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground px-4">
              اگه جواب بیشتر این سوالا «بله» بود، کوچینگ زن قوی برای تو طراحی شده
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            {reflectionQuestions.map((question, index) => (
              <Card key={index} className="p-4 md:p-6 hover-lift bg-card border-l-4 border-l-primary">
                <p className="text-sm md:text-base text-foreground leading-relaxed">{question}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 inline-block">
              <p className="text-lg md:text-2xl font-bold text-foreground mb-2">
                اگه جواب‌ها «بله» بود...
              </p>
              <p className="text-base md:text-xl text-muted-foreground">
                پس <span className="text-primary font-bold">کوچینگ زن قوی</span> برای تو طراحی شده
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">سرمایه‌گذاری</span> روی خودتان
            </h2>
            <p className="text-base md:text-lg text-muted-foreground px-4">یعنی روزی ۱۰ دلار - کمتر از قیمت یه قهوه!</p>
          </div>

          {/* Price Comparison Banner */}
          <div className="max-w-3xl mx-auto mb-8 md:mb-12">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="text-sm md:text-base text-muted-foreground mb-1">قیمت معمولی</p>
                  <p className="text-3xl md:text-5xl font-bold text-muted-foreground line-through opacity-50">$1,200</p>
                </div>
                <ArrowLeft className="w-8 h-8 md:w-12 md:h-12 text-primary rotate-180 md:rotate-0" />
                <div className="text-right">
                  <p className="text-sm md:text-base text-primary mb-1 font-semibold">قیمت امروز</p>
                  <p className="text-4xl md:text-6xl font-bold gradient-text">$747</p>
                  <p className="text-xs md:text-sm text-success mt-1">صرفه‌جویی $453</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Options */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-8 md:mb-12">
            {/* One-Time Payment */}
            <Card className="p-6 md:p-8 hover-lift bg-gradient-to-br from-success/5 to-success/10 border-2 border-success relative overflow-hidden">
              <Badge className="absolute top-3 left-3 md:top-4 md:left-4 bg-success text-white text-xs">پیشنهاد ویژه</Badge>
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">پرداخت یکجا</h3>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-2xl md:text-3xl text-muted-foreground line-through opacity-50">$897</p>
                  <p className="text-4xl md:text-5xl font-bold gradient-text">$747</p>
                </div>
                <p className="text-success font-bold text-sm md:text-base mt-2">صرفه‌جویی $150</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm md:text-base">۱۲ جلسه کوچینگ زنده</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm md:text-base">دسترسی مادام‌العمر به ضبط‌ها</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm md:text-base">گروه پشتیبانی انحصاری</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm md:text-base">بونوس: جلسه خصوصی ۳۰ دقیقه‌ای</span>
                </li>
              </ul>
              <Button
                onClick={handleDepositClick}
                disabled={isLoading}
                className="w-full bg-success hover:bg-success/90 text-white font-bold py-5 md:py-6 text-sm md:text-base"
              >
                شروع با $100 پیش‌پرداخت
              </Button>
            </Card>

            {/* Monthly Payment */}
            <Card className="p-6 md:p-8 hover-lift bg-card border-2 border-border">
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">پرداخت ماهانه</h3>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-4xl md:text-5xl font-bold text-foreground">$299</p>
                  <span className="text-muted-foreground text-sm">/ماه</span>
                </div>
                <p className="text-muted-foreground text-sm md:text-base mt-2">۳ قسط × $299 = $897</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">۱۲ جلسه کوچینگ زنده</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">دسترسی به ضبط‌ها</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">گروه پشتیبانی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">پرداخت راحت‌تر ماهانه</span>
                </li>
              </ul>
              <Button
                onClick={handleDepositClick}
                disabled={isLoading}
                variant="outline"
                className="w-full font-bold py-5 md:py-6 text-sm md:text-base border-2"
              >
                شروع با $100 پیش‌پرداخت
              </Button>
            </Card>
          </div>

          {/* Value Comparison */}
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-8 bg-muted/30 border-2 border-border">
              <h3 className="text-xl md:text-2xl font-bold mb-6 text-center text-foreground">حالا شاید بگی "$747 زیاده"...</h3>
              
              <div className="space-y-4 md:space-y-5 mb-6">
                <div className="flex items-start gap-3 md:gap-4 p-4 rounded-lg bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">✖</span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">چند بار به خاطر نداشتن اعتماد‌به‌نفس یه فرصت رو از دست دادی؟</p>
                </div>
                <div className="flex items-start gap-3 md:gap-4 p-4 rounded-lg bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">✖</span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">چند بار بخاطر نداشتن تسلط بر احساسات، یه رابطه یا یه شغل رو نابود کردی؟</p>
                </div>
                <div className="flex items-start gap-3 md:gap-4 p-4 rounded-lg bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">✖</span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">چند ساله فقط فکر می‌کنی یه روز باید تغییر کنی، اما هنوز همون‌جایی که بودی هستی؟</p>
                </div>
              </div>

              <Card className="p-5 md:p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
                <p className="text-base md:text-lg text-foreground leading-relaxed text-center">
                  اگه فقط یکی از این اشتباهاتو نخوای دوباره تکرار کنی،
                  <br />
                  کوچینگ زن قوی، <span className="font-bold gradient-text">نه تنها ارزون نیست—حتی گرون هم نیست.</span>
                  <br />
                  <span className="text-sm md:text-base text-muted-foreground mt-2 inline-block">این یه سرمایه‌گذاریه. روی خودت. روی آینده‌ت.</span>
                </p>
              </Card>
            </Card>
          </div>

          {/* Daily Cost Breakdown */}
          <div className="max-w-2xl mx-auto mt-8 md:mt-12">
            <Card className="p-6 md:p-8 text-center bg-gradient-to-br from-success/5 to-primary/5 border-2 border-primary/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Coffee className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">یعنی روزانه فقط ۱۰ دلار</h3>
              </div>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                کمتر از قیمت یه قهوه بیرون!
                <br />
                یعنی داری سرمایه‌گذاری می‌کنی روی: کنترل ذهنت، اعتماد‌به‌نفس‌ت، درآمدت، آرامش و نظم زندگیت
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-base md:text-lg text-foreground font-semibold">
                  بعضیا می‌رن هر هفته هزار دلار می‌دن تا فقط یکی بهشون بگه «می‌تونی».
                </p>
                <p className="text-primary font-bold text-lg md:text-xl mt-2">
                  اینجا؟ من می‌خوام کاری کنیم که بتونی.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">داستان تحول</span> زن‌های قوی
            </h2>
            <p className="text-base md:text-lg text-muted-foreground px-4">
              این‌ها فقط بخش کوچکی از +۵۰۰ زن قدرتمندی هستند که تحول کردند
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: "سارا محمدی",
                role: "مدیر بازاریابی",
                text: "قبل از این کوچینگ، همیشه احساس می‌کردم یه چیزی کمه. الان با اعتماد‌به‌نفس کامل توی جلسات مدیریتی صحبت می‌کنم و درآمدم ۴۰٪ افزایش پیدا کرده.",
                rating: 5
              },
              {
                name: "مریم احمدی",
                role: "کارآفرین",
                text: "راضیه بهم یاد داد چطور افکارمو مدیریت کنم. الان کسب‌وکار خودمو راه انداختم و ماهی سه برابر قبلم درآمد دارم. این برنامه زندگیمو عوض کرد.",
                rating: 5
              },
              {
                name: "نازنین کریمی",
                role: "مهندس نرم‌افزار",
                text: "بعد از مهاجرت، خیلی احساس ضعف می‌کردم. این کوچینگ بهم کمک کرد قدرت درونیمو پیدا کنم. الان توی شرکت ارتقا گرفتم و زندگی متعادل‌تری دارم.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 md:p-8 hover-lift bg-card border-2 border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto rtl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">سوالات متداول</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-right hover:no-underline">
                <span className="text-base md:text-lg font-semibold">آیا این برنامه برای من مناسب است؟</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                اگر زن مهاجری هستی که می‌خواهی در کار، روابط و درآمد قدرتمند شوی، این برنامه دقیقاً برای تو طراحی شده. مهم نیست الان کجایی، مهم اینه که می‌خوای کجا باشی.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-right hover:no-underline">
                <span className="text-base md:text-lg font-semibold">جلسات چطور برگزار می‌شوند؟</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                تمام جلسات به صورت آنلاین و زنده (Face-to-Face) برگزار می‌شوند. ضبط تمام جلسات در اختیارت قرار می‌گیرد تا هر زمان بتونی دوباره ببینیشون.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-right hover:no-underline">
                <span className="text-base md:text-lg font-semibold">اگر نتیجه نگیرم چی؟</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                ما ضمانت ۳۰ روزه بازگشت وجه داریم. اگر در ۳۰ روز اول احساس کردی این برنامه برات مناسب نیست، تمام پولت رو پس می‌گیری. بدون هیچ سوالی.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-right hover:no-underline">
                <span className="text-base md:text-lg font-semibold">چرا باید الان ثبت‌نام کنم؟</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                ظرفیت این دوره محدوده - فقط ۱۵ نفر. الان تنها ۵ جا باقی مونده. هر روز که معطل کنی، یه روز دیگه از همون زندگی قبلی رو تکرار می‌کنی. تحول الان شروع میشه، نه فردا.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-right hover:no-underline">
                <span className="text-base md:text-lg font-semibold">چند وقت طول می‌کشه تا نتیجه ببینم؟</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                خیلی از شرکت‌کنندگان از جلسه اول تغییرات ذهنی رو احساس می‌کنند. تغییرات قابل مشاهده در رفتار و نتایج معمولاً ظرف ۴-۶ هفته شروع میشه. بعد از ۳ ماه، تحول کامل.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10">
        <div className="max-w-4xl mx-auto text-center rtl">
          <Badge className="mb-4 md:mb-6 text-xs md:text-sm px-3 md:px-6 py-1.5 md:py-2 bg-urgency text-white">
            <Clock className="w-3 h-3 md:w-4 md:h-4 ml-2" />
            فقط ۵ جا باقی مانده
          </Badge>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
            آماده‌ای که <span className="gradient-text">تحول واقعی</span> رو شروع کنی؟
          </h2>

          <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            من اینجام که راهو نشونت بدم.
            <br />
            اگه تو هم آماده‌ای که بری...
          </p>

          <Button
            size="lg"
            onClick={handleDepositClick}
            disabled={isLoading}
            className="cta-button text-base md:text-xl px-8 md:px-12 py-6 md:py-8 text-white font-bold shadow-bold hover:shadow-glow mb-6 w-full sm:w-auto"
          >
            <Shield className="w-5 h-5 md:w-6 md:h-6 ml-2" />
            {isLoading ? "در حال انتقال..." : "رزرو جایگاهت با $100 پیش‌پرداخت"}
          </Button>

          <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground px-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span>ضمانت ۳۰ روزه بازگشت وجه</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-urgency" />
              <span>محدود به ۱۵ نفر</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              <span>شروع دوره: ۱۵ روز دیگه</span>
            </div>
          </div>

          <Card className="mt-8 md:mt-12 p-6 md:p-8 bg-card border-2 border-border max-w-2xl mx-auto">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed italic">
              "بعضیا می‌رن هر هفته هزار دلار می‌دن تا فقط یکی بهشون بگه 'می‌تونی'.
              <br />
              اینجا؟ من نمی‌خوام بهت بگم می‌تونی—
              <br />
              <span className="text-primary font-bold not-italic text-base md:text-lg">می‌خوام کاری کنیم که بتونی.</span>"
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-4">- راضیه لیدی باس</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
