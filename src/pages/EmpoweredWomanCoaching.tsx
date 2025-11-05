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
        "آرامش ذهنی یعنی فرصت‌ها رو می‌فهمی، نه اینکه از دستشون بدی",
        "دیگه نمی‌گی 'الان حسش نیست' → سریع اقدام می‌کنی، سریع نتیجه می‌گیری"
      ]
    },
    {
      icon: Lightbulb,
      title: "اصلاح نگرش‌ها",
      benefits: [
        "اون صدایی که همیشه می‌گه 'نمی‌تونی' یا 'الان وقتش نیست' → ساکت میشه",
        "وقتی نگرش‌هاتو درست کنی، هر موقعیت سختی می‌تونه یه سکوی پرتاب بشه"
      ]
    },
    {
      icon: MessageCircle,
      title: "قدرت ارتباط و دیده شدن",
      benefits: [
        "می‌تونی توی جمع‌ها با اعتمادبه‌نفس صحبت کنی → دیده می‌شی، پیشنهادهای کاری بیشتر می‌گیری",
        "می‌تونی درخواست کنی بدون اینکه بترسی → درآمدت بیشتر میشه"
      ]
    },
    {
      icon: Star,
      title: "ساختن لایف‌استایل زن موفق",
      benefits: [
        "با برنامه‌ریزی و تغییر عادت‌ها، هر روز انرژی‌ات بالاست و تمرکزت قویه",
        "عادت‌های مخرب حذف می‌شن، ذهنت و بدنت برات کار می‌کنن",
        "بین خانواده، رشد شخصی، و پول درآوردن تعادل واقعی ایجاد می‌کنی"
      ]
    },
    {
      icon: Zap,
      title: "غلبه بر کمال‌گرایی و اهمال‌کاری",
      benefits: [
        "دیگه نمی‌گی 'هنوز آمادگی ندارم' → زود شروع می‌کنی، زود نتیجه می‌گیری",
        "مسیر پول‌سازی و کار راه انداختن رو بدون کلافه شدن یاد می‌گیری"
      ]
    },
    {
      icon: DollarSign,
      title: "آگاهی مالی و رشد درآمد",
      benefits: [
        "پول درآوردن برات یه مهارت میشه، نه یه اتفاق نادر",
        "می‌فهمی پول تو رو قدرتمندتر می‌کنه نه وابسته‌تر",
        "یاد می‌گیری با همون امکاناتی که الان داری، پول بسازی"
      ]
    },
    {
      icon: Award,
      title: "بیزنس استایل و فروش حرفه‌ای",
      benefits: [
        "می‌تونی از تخصصت پول بسازی—حتی اگر الان هیچ ایده‌ای نداری",
        "سوشال مدیات رو تبدیل به پول واقعی می‌کنی",
        "خودتو به عنوان یه زن حرفه‌ای معرفی می‌کنی که کسی نمی‌تونه نادیده‌اش بگیره"
      ]
    }
  ];

  const curriculum = [
    {
      session: "جلسه ۱",
      title: "چکاپ وضعیت فعلی و بازسازی تصویر از خود",
      topics: [
        "بازسازی تصویر فعلی و گذشته از خود",
        "تمرین خودبخششی (صلح با خود)",
        "معناگرایی در وجود چالش‌های هر فرد"
      ]
    },
    {
      session: "جلسه ۲-۳",
      title: "مدیریت و پرورش افکار و احساسات با متد ACT",
      topics: [
        "غلبه بر افکار منفی",
        "تسلط بر احساسات",
        "مدیریت فکر و احساسات در شرایط سخت",
        "مدیریت فکر و احساس در مواقع احساس ضعف",
        "مدیریت افکار و احساسات تخریبگر و تنبیهی",
        "بازطراحی ماشین رفتار"
      ]
    },
    {
      session: "جلسه ۳",
      title: "مکانیزم انگیزه و توقع",
      topics: [
        "ایجاد انگیزه دائمی",
        "طراحی فیلمنامه زندگی برای ایجاد انگیزه",
        "طراحی و ساخت توقع",
        "پیش زمینه احساس لیاقت"
      ]
    },
    {
      session: "جلسه ۴",
      title: "مکانیزم نگرش‌ها",
      topics: [
        "اصول شکل‌گیری نگرش‌ها",
        "ریشه‌یابی نگرش‌های ۳ حوزه: فردی، ارتباطی، مستقل شدن (پولسازی)",
        "طراحی سوالات تخصصی برای ریشه‌یابی",
        "آموزش شیوه تغییر نگرش بر اساس محدوده‌های شخصی"
      ]
    },
    {
      session: "جلسه ۵",
      title: "قانون درخواست و فنون ارتباط‌سازی",
      topics: [
        "ترس از نه شنیدن و غلبه بر آن",
        "اصول یک درخواست قوی",
        "غلبه بر ترس‌های حضور در جمع",
        "تمرین برای حضور در جمع",
        "اصول مهم دوست‌یابی و ارتباط‌سازی",
        "ارزش‌های مهم ارتباطی",
        "نگرش‌های کمک‌کننده ارتباطی"
      ]
    },
    {
      session: "جلسه ۶",
      title: "لایف استایل خانم رئیس",
      topics: [
        "مهم‌ترین فاکتورهای یک لایف استایل شتاب‌دهنده تغییر",
        "طراحی روتین‌های روزانه",
        "اصول تغییر عادت",
        "مدیریت زمان و برنامه‌ریزی",
        "ژورنال نویسی روزانه",
        "اصول کنترل ذهن",
        "طراحی لایف استایل سالم غذایی",
        "اصول یادگیری و آموزش‌پذیری"
      ]
    },
    {
      session: "جلسه ۷",
      title: "هدف‌گذاری پیشرفته",
      topics: [
        "مدیریت اهداف",
        "اصول ایجاد تعادل در زندگی",
        "اصول زندگی پر دستاورد",
        "هدف‌نویسی و برنامه‌ریزی برای اهداف",
        "طراحی رویا + هدف + چشم‌انداز"
      ]
    },
    {
      session: "جلسه ۸",
      title: "غلبه بر اهمال‌کاری و کمالگرایی برای اقدام",
      topics: [
        "ریشه‌های کمبود عزت نفس و اعتماد به نفس",
        "رابطه کمالگرایی با عزت نفس",
        "آموزش اقدام‌گرایی",
        "رفع کمالگرایی و اهمال‌کاری"
      ]
    },
    {
      session: "جلسه ۹",
      title: "پول و مدیریت پول",
      topics: [
        "نگرش برای پول",
        "تمرینات عملی مدیریت مالی",
        "اصول درآمدسازی"
      ]
    },
    {
      session: "جلسه ۱۰",
      title: "بیزنس و بیزنس استایل",
      topics: [
        "نگرش‌های ایجاد بیزنس",
        "طراحی مسیر شغلی شخصی",
        "هدف‌گذاری برای پولسازی",
        "اصول طراحی لایف استایل بیزنسی (بیزنس استایل)",
        "مسیر راه‌اندازی و ارتقا کسب و کار"
      ]
    }
  ];

  const transformations = [
    "ترس‌های بی‌اساس که تو رو محدود کرده از بین میره",
    "حال و انرژی‌ت همیشه متعادله. حالت خوبه",
    "اضطراب و استرس‌هات خیلی کم میشه",
    "هر شرایطی رو به نفع خودت تغییر میدی",
    "با تمام وجود برای خواسته‌هات میجنگی",
    "سرعت اقدام‌ات زیاد میشه. سریع اقدام می‌کنی",
    "ایمانت به کاری که میکنی چند برابر میشه",
    "خیلی راحت و با اعتمادبه‌نفس تو جمع‌ها حاضر میشی",
    "در مقابل افراد غریبه با قدرت ظاهر میشی",
    "منظم میشی و عادت‌های بد و مخرب رو از بین میبری",
    "وقت‌هات یه جوری میشه که به همه چی میرسی (ورزش - خانواده - روابط خوب - پول)",
    "عمرت هدر نمیره برای اهداف بیهوده",
    "توی زندگیت معنا شکل میگیره",
    "به اینکه دیگران چه فکری می‌کنن عمیقاً فکر نمی‌کنی و هر کاری لازمه انجام میدی",
    "زود شروع می‌کنی، لفت نمیدی",
    "یاد می‌گیری با امکانات موجود حرکت کنی",
    "در مورد پول بدونی که اگه دستت پول باشه می‌خوای باهاش چیکار کنی که قدرت تو بیشتر بشه"
  ];

  const powerManifestations = [
    {
      title: "توانایی خلق انتخابی که قبلاً نداشتی",
      description: "یعنی اگه تا دیروز دو تا راه داشتی: تسلیم یا فرار، قدرت راه سومی رو برات باز می‌کنه! وقتی مهاجرت کردم همه گفتن نمی‌تونی اینجا همون کار ایران رو کنی! ولی من رفتم کردم!"
    },
    {
      title: "زندگی با سطحی که خودت انتخاب می‌کنی",
      description: "نه لولی که جامعه انتخاب کرده! جامعه گفته دختر باید زود ازدواج کنه، مادر شد دیگه کار نکنه! من انتخاب می‌کنم آدم‌ها چجوری برخورد کنن."
    },
    {
      title: "بدونی کی و کجا رها کنی",
      description: "آدم‌های ضعیف وقتی سخت میشه رها می‌کنن. چیو؟ اهدافشونو! اما آدم‌های قوی افکارشونو، عقاید اشتباهاشونو رها می‌کنن. یه چیزی تو سر من هست باید تغییرش بدم."
    },
    {
      title: "انتخاب‌گر باشی",
      description: "کی با من دوست بشه! چی بخورم! وقت‌ها رو چجوری بگذرونم! کجا کار کنم! نه صرفاً چون منو قبول کردن."
    }
  ];

  const questions = [
    "آیا تو هم کسی هستی که می‌خواد بتونه ذهن و احساساتش رو کنترل کنه، تا دیگه تصمیمات مهم زندگیش از روی ترس یا عجله نباشن؟",
    "آیا تو هم دلت می‌خواد یه روزایی بیاد که بگی: «من هیچ‌وقت دیگه با جمله‌ی 'الان حسش نیست' کارمو عقب نمی‌ندازم»؟",
    "آیا خسته‌ای از صدای درونت که همیشه می‌گه: «نمی‌تونی»، «الان وقتش نیست»، «شرایط مناسب نیست»؟",
    "آیا دوست داری بتونی بدون ترس، توی جمع‌ها با اعتمادبه‌نفس ظاهر بشی، دیده بشی، و فرصت‌ها بیان سمتت؟",
    "آیا تو هم می‌خوای لایف‌استایلی بسازی که توش هم آرامش داشته باشی، هم درآمد، هم رشد شخصی، هم زمان برای خانواده؟",
    "آیا می‌خوای بالاخره دست از اهمال‌کاری برداری، زودتر اقدام کنی و زودتر نتیجه ببینی؟",
    "آیا وقتشه که یاد بگیری چطور با امکانات الانت پول بسازی و بعد چندبرابرش کنی؟",
    "آیا دلت می‌خواد از تخصصت، یا حتی بدون تخصص، یه کسب‌وکار واقعی بسازی که درآمد مستمر برات داشته باشه؟",
    "آیا آماده‌ای که خودت رو طوری به دنیا نشون بدی که هیچ‌کس نتونه نادیده‌ات بگیره؟"
  ];

  return (
    <>
      <SEOHead 
        title="کوچینگ زن قوی - تبدیل شو به بهترین نسخه از خودت | راضیه لیدی‌باس"
        description="برنامه ۳ ماهه کوچینگ گروهی برای زنانی که می‌خواهند در زندگی، کسب‌وکار و روابط خود قدرت واقعی داشته باشند. با راضیه لیدی‌باس، مربی توانمندسازی زنان."
        image="/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png"
      />
      
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
                <Badge className="text-lg px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  کوچینگ گروهی ۳ ماهه
                </Badge>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  کوچینگ <span className="text-primary">زن قوی</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  تبدیل شو به نسخه‌ای از خودت که قدرت، نظم، حضور اجتماعی، عزت‌نفس و درآمد واقعی داره
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-primary" />
                    <span className="font-semibold">۳ ماه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="text-primary" />
                    <span className="font-semibold">کوچینگ گروهی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-primary" />
                    <span className="font-semibold">۱۰ جلسه</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 w-full md:w-auto"
                    onClick={handleDepositClick}
                    disabled={isLoading}
                  >
                    {isLoading ? "در حال انتقال..." : "رزرو جلسه مصاحبه با ۱۰۰ دلار"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    💎 ظرفیت محدود - فقط با مصاحبه
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={razie1} 
                    alt="راضیه لیدی‌باس - مربی توانمندسازی زنان"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg">
                  <div className="text-3xl font-bold">+۵۰۰</div>
                  <div className="text-sm">زن توانمند شده</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Limited Spots Alert */}
        <section className="py-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-center">
              <Sparkles className="w-5 h-5" />
              <p className="font-semibold">
                🔥 فقط ۵ جای خالی برای این دوره باقی مانده - ثبت‌نام فقط پس از مصاحبه تأییدیه
              </p>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* What You'll Gain Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                💡 توی این مسیر <span className="text-primary">۳ ماهه</span>، دقیقاً چه چیزی به دست میاری؟
              </h2>
              <p className="text-xl text-muted-foreground">
                ۷ حوزه کلیدی که زندگی‌ت رو متحول می‌کنن
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gains.map((gain, index) => (
                <Card key={index} className="p-6 hover-lift">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <gain.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold flex-1">{gain.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {gain.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleDepositClick}
                disabled={isLoading}
              >
                شروع مسیر تحول با ۱۰۰ دلار
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Detailed Curriculum */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                سرفصل <span className="text-primary">۱۰ جلسه</span> کوچینگ زن قوی
              </h2>
              <p className="text-xl text-muted-foreground">
                برنامه جامع و کاملی که هر بخش زندگی‌ت رو پوشش می‌ده
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {curriculum.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-right hover:no-underline py-6">
                    <div className="flex items-start gap-4 text-right w-full">
                      <Badge className="bg-primary/10 text-primary flex-shrink-0">
                        {item.session}
                      </Badge>
                      <span className="font-bold text-lg">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <ul className="space-y-3 mt-4 mr-16">
                      {item.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Transformations Grid */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                این چیزیه که <span className="text-primary">تغییر می‌کنه</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                تحولاتی که توی زندگیت اتفاق می‌افته
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {transformations.map((transformation, index) => (
                <Card key={index} className="p-6 hover-lift">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-foreground font-medium">{transformation}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Power Manifestations */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                نمودهای <span className="text-primary">درست قدرت</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                قدرت واقعی یعنی چی؟
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {powerManifestations.map((power, index) => (
                <Card key={index} className="p-8 hover-lift">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold flex-1">{power.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-lg">{power.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Self-Reflection Questions */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                ❓ از خودت <span className="text-primary">بپرس</span>...
              </h2>
              <p className="text-xl text-muted-foreground">
                اگه جواب بیشتر این سوالا «بله» بود، پس کوچینگ زن قوی برای تو طراحی شده
              </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              {questions.map((question, index) => (
                <Card key={index} className="p-6 hover-lift border-r-4 border-r-primary">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-lg text-foreground">{question}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleDepositClick}
                disabled={isLoading}
              >
                بله، آماده‌ام برای تحول!
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Value Proposition & Pricing */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Value Reframing */}
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                این یه <span className="text-primary">سرمایه‌گذاریه</span>. روی خودت. روی آینده‌ت.
              </h2>
              
              <Card className="p-8 mb-8 bg-gradient-to-br from-primary/10 to-secondary/10">
                <p className="text-2xl font-bold mb-6">۷۴۷ دلار یعنی چی واقعاً؟</p>
                <div className="grid md:grid-cols-3 gap-6 text-right">
                  <div>
                    <p className="text-lg font-semibold mb-2">💰 کمتر از دو تا مانتوی گرون</p>
                    <p className="text-muted-foreground text-sm">که بعد از چند ماه فراموششون می‌کنی</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-2">✈️ کمتر از یه مسافرت معمولی</p>
                    <p className="text-muted-foreground text-sm">که فقط چند روز خاطره میشه</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-2">☕ روزی فقط ۱۰ دلار</p>
                    <p className="text-muted-foreground text-sm">کمتر از قیمت یه قهوه بیرون!</p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 mb-8 border-2 border-success">
                <div className="flex items-start gap-4">
                  <DollarSign className="w-12 h-12 text-success flex-shrink-0" />
                  <div className="text-right">
                    <p className="text-xl font-bold mb-3">این کوچینگ می‌تونه مستقیماً تبدیل بشه به پول توی حساب بانکی‌ت</p>
                    <p className="text-lg text-muted-foreground">
                      فقط کافیه یک بار، یه تصمیم درست تو ارتباطات‌ت یا کارت بگیری، هزینه این دوره دراومده.
                      تازه بقیه دستاوردهاش می‌مونه برای تو.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-urgency/10 to-urgency/5 border-2 border-urgency/30">
                <p className="text-2xl font-bold mb-4">💎 فرصت نادر</p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  تو الان به چیزی دسترسی داری که شاید ۹۰٪ زن‌ها هیچ‌وقت بهش نمی‌رسن: یک مسیر واضح برای تبدیل شدن به نسخه‌ای از خودت که قدرت، نظم، حضور اجتماعی، عزت‌نفس و درآمد داره. خیلیا برای این مسیر، باید سال‌ها سردرگم باشن. ولی تو الان یه راه میانبر داری. این یعنی فرصت. نه هزینه.
                </p>
              </Card>
            </div>

            {/* Pricing Steps */}
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  چطور <span className="text-primary">شروع کنم</span>؟
                </h2>
                <p className="text-xl text-muted-foreground">دو مرحله ساده تا شروع مسیر تحول</p>
              </div>

              {/* Step 1 */}
              <Card className="p-8 mb-8 border-2 border-primary shadow-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                    ۱
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">مرحله اول: پیش‌پرداخت و مصاحبه</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      برای شروع، ۱۰۰ دلار پیش‌پرداخت کنید و وقت مصاحبه با راضیه لیدی باس را رزرو کنید.
                      در مصاحبه مشخص می‌شود که این برنامه برای شما مناسب است یا خیر.
                    </p>
                    <Button
                      size="lg"
                      onClick={handleDepositClick}
                      disabled={isLoading}
                      className="w-full sm:w-auto text-lg px-8 py-6"
                    >
                      {isLoading ? "در حال انتقال..." : "پرداخت ۱۰۰ دلار و رزرو مصاحبه"}
                      <Shield className="w-5 h-5 mr-2" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Step 2 */}
              <Card className="p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                    ۲
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4">مرحله دوم: پس از قبولی</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      اگر در مصاحبه قبول شدید، یکی از دو گزینه پرداخت را انتخاب کنید:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Monthly Payment */}
                      <Card className="p-6 border-2 hover-lift">
                        <div className="text-center">
                          <h4 className="text-xl font-bold mb-2">پرداخت ماهانه</h4>
                          <div className="text-4xl font-bold text-primary mb-2">۲۹۹$</div>
                          <p className="text-sm text-muted-foreground mb-4">به مدت ۳ ماه</p>
                          
                          <div className="border-t pt-4 mb-4">
                            <div className="flex justify-between items-center text-sm mb-2">
                              <span className="text-muted-foreground">پرداخت ماهانه:</span>
                              <span className="font-semibold">۲۹۹$ × ۳</span>
                            </div>
                            <div className="flex justify-between items-center font-bold">
                              <span>جمع:</span>
                              <span className="text-primary">۸۹۷$</span>
                            </div>
                          </div>

                          <ul className="space-y-2 text-right text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>انعطاف در پرداخت</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>شروع فوری برنامه</span>
                            </li>
                          </ul>
                        </div>
                      </Card>

                      {/* One-time Payment */}
                      <Card className="p-6 border-2 border-success hover-lift bg-success/5 relative">
                        <div className="absolute top-0 left-0 bg-success text-success-foreground px-3 py-1 text-sm font-bold rounded-br-lg">
                          توصیه می‌شود
                        </div>
                        <div className="text-center mt-6">
                          <h4 className="text-xl font-bold mb-2">پرداخت یکجا</h4>
                          <div className="text-4xl font-bold text-success mb-2">۷۴۷$</div>
                          <p className="text-sm text-muted-foreground mb-4">کل دوره</p>
                          
                          <div className="border-t pt-4 mb-4">
                            <div className="flex justify-between items-center text-sm mb-2">
                              <span className="text-muted-foreground">پرداخت ماهانه:</span>
                              <span className="line-through opacity-60">۸۹۷$</span>
                            </div>
                            <div className="flex justify-between items-center font-bold mb-2">
                              <span>با تخفیف:</span>
                              <span className="text-success">۷۴۷$</span>
                            </div>
                            <div className="text-sm text-success font-semibold">
                              صرفه‌جویی ۱۵۰ دلار!
                            </div>
                          </div>

                          <ul className="space-y-2 text-right text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>صرفه‌جویی ۱۵۰ دلاری</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>بدون دغدغه پرداخت ماهانه</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
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
              <Card className="p-8 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30">
                <div className="flex items-start gap-4">
                  <Shield className="w-12 h-12 text-success flex-shrink-0" />
                  <div>
                    <h3 className="text-2xl font-bold mb-3">ضمانت بازگشت وجه ۳۰ روزه - بدون سوال</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      اگر تا ۳۰ روز اول احساس کنید این برنامه برای شما مناسب نیست، کافی است به ما اطلاع دهید 
                      و کل مبلغ پرداختی شما بدون هیچ سوالی بازگردانده می‌شود. هیچ ریسکی وجود ندارد!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">سوالات متداول</h2>
            
            <div className="space-y-6">
              <Card className="p-6 hover-lift">
                <h3 className="text-xl font-bold mb-3">چرا باید ۱۰۰ دلار پیش‌پرداخت کنم؟</h3>
                <p className="text-muted-foreground leading-relaxed">
                  این مبلغ برای رزرو جایگاه شما و انجام مصاحبه اولیه با راضیه لیدی باس است تا مطمئن شویم این برنامه برای شما مناسب است. این فرآیند به نفع هر دو طرف است و تضمین می‌کند که افراد واقعاً متعهد در برنامه شرکت کنند.
                </p>
              </Card>

              <Card className="p-6 hover-lift">
                <h3 className="text-xl font-bold mb-3">اگر در مصاحبه قبول نشوم چه می‌شود؟</h3>
                <p className="text-muted-foreground leading-relaxed">
                  اگر مشخص شود که این برنامه در حال حاضر برای شما مناسب نیست، کل مبلغ ۱۰۰ دلار بازگردانده می‌شود. هیچ ریسکی برای شما وجود ندارد.
                </p>
              </Card>

              <Card className="p-6 hover-lift">
                <h3 className="text-xl font-bold mb-3">اگه هیچ ایده بیزنسی ندارم چی؟</h3>
                <p className="text-muted-foreground leading-relaxed">
                  نگران نباش! این برنامه دقیقاً برای کسایی طراحی شده که حتی الان ایده خاصی ندارن. ما کمکت می‌کنیم مسیر شغلی‌ت رو پیدا کنی و از تخصص یا علاقه‌ات پول بسازی.
                </p>
              </Card>

              <Card className="p-6 hover-lift">
                <h3 className="text-xl font-bold mb-3">ضمانت بازگشت وجه چگونه کار می‌کند؟</h3>
                <p className="text-muted-foreground leading-relaxed">
                  اگر تا ۳۰ روز اول احساس کنید این برنامه برای شما مناسب نیست، کافی است به ما اطلاع دهید و کل مبلغ پرداختی بدون هیچ سوالی بازگردانده می‌شود.
                </p>
              </Card>

              <Card className="p-6 hover-lift">
                <h3 className="text-xl font-bold mb-3">چرا مصاحبه لازمه؟</h3>
                <p className="text-muted-foreground leading-relaxed">
                  مصاحبه تضمین می‌کنه که این برنامه واقعاً برای شما مناسبه و می‌تونه بهترین نتایج رو برات داشته باشه. ما می‌خوایم مطمئن بشیم که هر کسی که توی برنامه شرکت می‌کنه، بهترین تجربه و نتیجه رو داشته باشه.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-success/10">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              من اینجام که <span className="text-primary">راهو نشونت بدم</span>
            </h2>
            <p className="text-2xl text-muted-foreground mb-4">
              اگه تو هم آماده‌ای که بری...
            </p>
            <p className="text-xl text-muted-foreground mb-8">
              بعضیا می‌رن هر هفته هزار دلار می‌دن تا فقط یکی بهشون بگه «می‌تونی». اینجا؟ من نمی‌خوام بهت بگم می‌تونی—می‌خوام کاری کنیم که <strong>بتونی</strong>.
            </p>
            
            <div className="space-y-6">
              <Button
                size="lg"
                onClick={handleDepositClick}
                disabled={isLoading}
                className="text-lg px-10 py-7 shadow-2xl hover:shadow-glow"
              >
                <Shield className="w-5 h-5 ml-2" />
                {isLoading ? "در حال انتقال..." : "شروع مسیر تحول با ۱۰۰ دلار"}
              </Button>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <span>ضمانت بازگشت کامل وجه تا ۳۰ روز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-urgency" />
                  <span>فقط ۵ جای خالی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  <span>+۵۰۰ زن توانمند شده</span>
                </div>
              </div>
            </div>

            <Card className="mt-12 p-8 bg-background/50 backdrop-blur">
              <p className="text-lg italic text-muted-foreground">
                "تو لایق اینی که یه مربی در کنارت باشه. لایق اینی که توی بیزنس، رابطه و زندگی بدرخشی. این کوچینگ فقط یه کلاس نیست—یه بیانیه‌ست: اینکه تو دیگه قرار نیست نسخه ضعیف خودت باشی."
              </p>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default EmpoweredWomanCoaching;