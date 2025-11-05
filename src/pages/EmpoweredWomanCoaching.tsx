import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  Trophy,
  Rocket,
  X,
  CheckCircle2,
  Lightbulb,
  UserCheck,
  Compass
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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="کوچینگ زن قوی"
        description="برنامه کوچینگ گروهی ۳ ماهه برای زنان مهاجر. قدرت ۱۰ برابری در کار، روابط و درآمد. با راضیه لیدی باس"
        image="/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png"
      />

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-12 md:pb-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 gradient-hero opacity-10" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-fade-in-up rtl font-farsi">
            {/* Badge */}
            <Badge className="mb-4 md:mb-6 text-sm md:text-base px-4 md:px-6 py-1.5 md:py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
              ویژه خانم‌های مهاجر
            </Badge>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight px-2">
              <span className="gradient-text">کوچینگ زن قوی</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              ۳ ماه قدرتمند ده‌برابر با راضیه لیدی‌باس
              <br />
              برای پیشرفت قدرتمند در کار، روابط و درآمد
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 md:mb-10 px-2">
              <div className="flex items-center gap-2 text-foreground text-sm md:text-base">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold">۳ ماه</span>
              </div>
              <div className="flex items-center gap-2 text-foreground text-sm md:text-base">
                <Video className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold">۱۲ جلسه زنده</span>
              </div>
              <div className="flex items-center gap-2 text-foreground text-sm md:text-base">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold">کوچینگ گروهی</span>
              </div>
            </div>

            {/* Special Offer Banner */}
            <div className="py-4 md:py-6 px-4 bg-gradient-to-r from-urgency via-urgency-light to-urgency rounded-2xl mb-6 md:mb-8 mx-2">
              <div className="text-center">
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 text-white">
                  <Gift className="w-6 h-6 md:w-8 md:h-8 animate-bounce" />
                  <div>
                    <p className="text-lg md:text-2xl lg:text-3xl font-bold mb-0.5 md:mb-1">
                      پیشنهاد ویژه: از <span className="line-through opacity-75">۱۲۰۰$</span> به <span className="text-2xl md:text-4xl">۹۹۷$</span>
                    </p>
                    <p className="text-sm md:text-lg opacity-90">صرفه‌جویی ۲۰۳ دلار - فقط برای افراد واجد شرایط</p>
                  </div>
                  <Gift className="w-6 h-6 md:w-8 md:h-8 animate-bounce" />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
              <Button
                size="lg"
                onClick={handleDepositClick}
                disabled={isLoading}
                className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-7 text-white font-bold shadow-bold hover:shadow-glow w-full sm:w-auto"
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                {isLoading ? "در حال انتقال به پرداخت..." : "رزرو با پیش‌پرداخت ۱۰۰ دلار"}
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
                <span>ضمانت ۳۰ روزه بازگشت وجه</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
                <span>مربی معتبر با سابقه</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                <span>محدودیت ظرفیت</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* What You'll Gain - 7 Key Benefits */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16 animate-fade-in-up">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              💡 توی این مسیر <span className="gradient-text">۳ ماهه</span>، دقیقاً چه چیزی به دست میاری؟
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* 1. مدیریت ذهن و احساسات */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">مدیریت ذهن و احساسات</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">وقتی بتونی ذهنتو کنترل کنی، تصمیمات مالی‌ات دیگه از روی ترس یا عجله نیست</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">آرامش ذهنی یعنی فرصت‌ها رو می‌فهمی، نه اینکه از دستشون بدی</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">دیگه نمی‌گی "الان حسش نیست" → سریع اقدام می‌کنی، سریع نتیجه می‌گیری</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. اصلاح نگرش‌ها */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">اصلاح نگرش‌ها</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">اون صدایی که همیشه می‌گه "نمی‌تونی" یا "الان وقتش نیست" → ساکت میشه</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">وقتی نگرش‌هاتو درست کنی، هر موقعیت سختی می‌تونه یه سکوی پرتاب بشه</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. قدرت ارتباط و دیده شدن */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                  <Users className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">قدرت ارتباط و دیده شدن</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">می‌تونی توی جمع‌ها با اعتمادبه‌نفس صحبت کنی → دیده می‌شی، پیشنهادهای کاری بیشتر می‌گیری</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">می‌تونی درخواست کنی بدون اینکه بترسی → درآمدت بیشتر میشه</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. ساختن لایف‌استایل زن موفق */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">ساختن لایف‌استایل زن موفق</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">با برنامه‌ریزی و تغییر عادت‌ها، هر روز انرژی‌ات بالاست و تمرکزت قویه</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">عادت‌های مخرب حذف می‌شن، ذهنت برات کار می‌کنه نه بر علیه‌ات</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">بین خانواده، رشد شخصی و پول درآوردن تعادل واقعی ایجاد می‌کنی</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 5. غلبه بر کمال‌گرایی و اهمال‌کاری */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">غلبه بر کمال‌گرایی و اهمال‌کاری</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">دیگه نمی‌گی "هنوز آمادگی ندارم" → زود شروع می‌کنی، زود نتیجه می‌گیری</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">مسیر پول‌سازی رو بدون کلافه شدن و تأخیر یاد می‌گیری</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 6. آگاهی مالی و رشد درآمد */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">آگاهی مالی و رشد درآمد</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">پول درآوردن برات یه مهارت میشه، نه یه اتفاق نادر</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">می‌فهمی پول تو رو قدرتمندتر می‌کنه نه وابسته‌تر</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">با همون امکانات الان، پول بسازی و بعد بیشترش کنی</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 7. بیزنس استایل و فروش حرفه‌ای */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border md:col-span-2">
              <div className="flex flex-col items-end text-right space-y-3 md:space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">بیزنس استایل و فروش حرفه‌ای</h3>
                <div className="space-y-2 md:space-y-3 w-full">
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">می‌تونی از تخصصت پول بسازی—حتی اگه الان هیچ ایده‌ای نداری</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">سوشال مدیات رو تبدیل به پول واقعی کنی با استراتژی حرفه‌ای</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm md:text-base text-muted-foreground flex-1">خودتو به عنوان یه زن حرفه‌ای معرفی کنی که کسی نمی‌تونه نادیده‌اش بگیره</p>
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed 12-Session Curriculum */}
      <section className="py-12 md:py-16 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">سرفصل ۱۲ جلسه</span> کوچینگ زن قوی
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              مسیر کامل تبدیل شدن به نسخه قدرتمند خودت
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="session-1" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-sm md:text-base">جلسه ۱</Badge>
                  <span className="font-bold text-base md:text-lg">چکاپ وضعیت فعلی و بازسازی تصویر از خود</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>بازسازی تصویر فعلی و گذشته از خود</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>تمرین خودبخشی (صلح با خود)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>معناگرایی در وجود چالش‌های هر فرد</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-2" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-sm md:text-base">جلسات ۲-۳</Badge>
                  <span className="font-bold text-base md:text-lg">مدیریت و پرورش افکار و احساسات با متد ACT</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>غلبه بر افکار منفی و تسلط بر احساسات</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>مدیریت فکر و احساس در شرایط سخت</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>مدیریت افکار و احساسات تخریبگر و تنبیهی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>بازطراحی ماشین رفتار</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-4" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-success/10 text-success border-success/20 text-sm md:text-base">جلسه ۴</Badge>
                  <span className="font-bold text-base md:text-lg">مکانیزم انگیزه و ایجاد انگیزه دائمی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>طراحی فیلمنامه زندگی برای ایجاد انگیزه</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>طراحی و ساخت توقع</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>پیش‌زمینه احساس لیاقت</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-5" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-sm md:text-base">جلسه ۵</Badge>
                  <span className="font-bold text-base md:text-lg">مکانیزم نگرش‌ها و تغییر باورها</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>ریشه‌یابی نگرش‌های ۳ حوزه: فردی، ارتباطی، مستقل شدن</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>طراحی سوالات تخصصی برای ریشه‌یابی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>آموزش شیوه تغییر نگرش شخصی</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-6" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-sm md:text-base">جلسه ۶</Badge>
                  <span className="font-bold text-base md:text-lg">قانون درخواست و فنون ارتباط‌سازی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>غلبه بر ترس از نه شنیدن</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>اصول یک درخواست قوی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>تمرین برای حضور در جمع</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>اصول دوست‌یابی و ارتباط‌سازی</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-7" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-success/10 text-success border-success/20 text-sm md:text-base">جلسه ۷</Badge>
                  <span className="font-bold text-base md:text-lg">لایف‌استایل خانم رئیس</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>طراحی روتین‌های روزانه شتاب‌دهنده</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>اصول تغییر عادت و مدیریت زمان</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>ژورنال‌نویسی روزانه و کنترل ذهن</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>طراحی لایف‌استایل سالم غذایی</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-8" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-sm md:text-base">جلسه ۸</Badge>
                  <span className="font-bold text-base md:text-lg">هدف‌گذاری پیشرفته</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>مدیریت اهداف و ایجاد تعادل در زندگی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>اصول زندگی پردستاورد</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>هدف‌نویسی و برنامه‌ریزی عملی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>طراحی رویا + هدف + چشم‌انداز</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-9" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-sm md:text-base">جلسه ۹</Badge>
                  <span className="font-bold text-base md:text-lg">غلبه بر اهمال‌کاری و کمال‌گرایی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>ریشه‌های کمبود عزت‌نفس و اعتماد به نفس</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>آموزش اقدام‌گرایی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>رفع کمال‌گرایی و اهمال‌کاری</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-10" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-success/10 text-success border-success/20 text-sm md:text-base">جلسه ۱۰</Badge>
                  <span className="font-bold text-base md:text-lg">پول و مدیریت مالی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>نگرش درست برای پول</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>تمرینات عملی مدیریت مالی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>اصول درآمدسازی</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="session-11" className="border-2 border-border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50">
                <div className="flex items-center gap-3 md:gap-4 text-right w-full">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-sm md:text-base">جلسات ۱۱-۱۲</Badge>
                  <span className="font-bold text-base md:text-lg">بیزنس و بیزنس‌استایل</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4">
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>نگرش‌های ایجاد بیزنس</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>طراحی مسیر شغلی شخصی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>هدف‌گذاری برای پول‌سازی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>مسیر راه‌اندازی و ارتقا کسب‌وکار</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>


      {/* Transformation Results Grid */}
      <section className="py-12 md:py-16 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">تحول واقعی</span> که تجربه می‌کنی
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[
              "ترس‌های بی‌اساس از بین می‌ره",
              "حال و انرژیت همیشه متعادله",
              "اضطراب و استرست خیلی کم می‌شه",
              "هر شرایطی رو به نفع خودت تغییر می‌دی",
              "با تمام وجود برای خواسته‌هات می‌جنگی",
              "سرعت اقداماتت زیاد می‌شه",
              "ایمانت به کاری که می‌کنی چند برابر می‌شه",
              "راحت و با اعتماد‌به‌نفس تو جمع‌ها حاضر می‌شی",
              "در مقابل افراد غریبه با قدرت ظاهر می‌شی",
              "منظم می‌شی و عادت‌های بد رو از بین می‌بری",
              "به همه چی می‌رسی: ورزش، خانواده، پول",
              "عمرت هدر نمی‌ره برای اهداف بیهوده",
              "به فکر و حرف دیگران عمیقاً فکر نمی‌کنی",
              "هر کاری لازمه انجام می‌دی",
              "زود شروع می‌کنی، لفت نمی‌دی",
              "با امکانات موجود حرکت می‌کنی",
              "در مورد پول می‌دونی چیکار کنی",
              "پول‌هات بیشتر می‌شن و قدرتت می‌ره بالا"
            ].map((result, index) => (
              <Card key={index} className="p-4 hover-lift bg-card border-l-4 border-l-primary">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base font-medium">{result}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* True Power Manifestations */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              نمودهای <span className="gradient-text">درست قدرت</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <Card className="p-6 md:p-8 hover-lift bg-gradient-to-br from-primary/5 to-transparent border-2">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">خلق انتخاب جدید</h3>
              </div>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3">
                توانایی خلق انتخابی که قبلاً نداشتی! یعنی اگه تا دیروز دو تا راه داشتی: تسلیم یا فرار، قدرت راه سومی رو برات باز می‌کنه!
              </p>
              <div className="p-3 bg-primary/10 rounded-lg border-r-4 border-r-primary">
                <p className="text-sm md:text-base italic">
                  «وقتی مهاجرت کردم همه گفتن نمی‌تونی اینجا همون کار ایران رو کنی! ولی من رفتم کردم!»
                </p>
              </div>
            </Card>

            <Card className="p-6 md:p-8 hover-lift bg-gradient-to-br from-secondary/5 to-transparent border-2">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">زندگی به انتخاب خودت</h3>
              </div>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3">
                با سطحی زندگی می‌کنی که خودت انتخاب می‌کنی، نه لولی که جامعه انتخاب کرده!
              </p>
              <div className="p-3 bg-secondary/10 rounded-lg border-r-4 border-r-secondary">
                <p className="text-sm md:text-base italic">
                  جامعه گفته دختر باید زود ازدواج کنه، مادر شد دیگه کار نکنه! من انتخاب می‌کنم آدما چجوری برخورد کنن.
                </p>
              </div>
            </Card>

            <Card className="p-6 md:p-8 hover-lift bg-gradient-to-br from-success/5 to-transparent border-2">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-7 h-7 text-success" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">دونستن کی و کجا رها کنی</h3>
              </div>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                آدمای ضعیف وقتی سخت می‌شه اهدافشونو رها می‌کنن. اما آدمای قوی افکارشونو و عقاید اشتباهشونو رها می‌کنن. یه چیزی تو سرم هست که باید تغییرش بدم.
              </p>
            </Card>

            <Card className="p-6 md:p-8 hover-lift bg-gradient-to-br from-urgency/5 to-transparent border-2">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-urgency/20 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-7 h-7 text-urgency" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">انتخاب‌گر باشی</h3>
              </div>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                کی با من دوست بشه! چی بخورم! وقتامو چجوری بگذرونم! کجا کار کنم! نه صرفاً چون منو قبول کردن.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Self-Reflection Questions */}
      <section className="py-12 md:py-16 lg:py-20 px-4">
        <div className="max-w-5xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-block mb-4">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">از خودت بپرس...</span>
            </h2>
          </div>

          <div className="space-y-4 md:space-y-6">
            {[
              "آیا تو هم کسی هستی که می‌خواد بتونه ذهن و احساساتش رو کنترل کنه، تا دیگه تصمیمات مهم زندگیش از روی ترس یا عجله نباشن؟",
              "آیا تو هم دلت می‌خواد یه روزایی بیاد که بگی: «من هیچ‌وقت دیگه با جمله‌ی \"الان حسش نیست\" کارمو عقب نمی‌ندازم»؟",
              "آیا خسته‌ای از صدای درونت که همیشه می‌گه: «نمی‌تونی»، «الان وقتش نیست»، «شرایط مناسب نیست»؟",
              "آیا دوست داری بتونی بدون ترس، توی جمع‌ها با اعتمادبه‌نفس ظاهر بشی، دیده بشی، و فرصتا بیان سمتت؟",
              "آیا تو هم می‌خوای لایف‌استایلی بسازی که توش هم آرامش داشته باشی، هم درآمد، هم رشد شخصی، هم زمان برای خانواده؟",
              "آیا می‌خوای بالاخره دست از اهمال‌کاری برداری، زودتر اقدام کنی و زودتر نتیجه ببینی؟",
              "آیا وقتشه که یاد بگیری چطور با امکانات الانت پول بسازی و بعد چندبرابرش کنی؟",
              "آیا دلت می‌خواد از تخصصت، یا حتی بدون تخصص، یه کسب‌وکار واقعی بسازی که درآمد مستمر برات داشته باشه؟",
              "آیا آماده‌ای که خودت رو طوری به دنیا نشون بدی که هیچ‌کس نتونه نادیده‌ت بگیره؟"
            ].map((question, index) => (
              <Card key={index} className="p-5 md:p-6 hover-lift border-2 bg-card">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <p className="text-base md:text-lg leading-relaxed">{question}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-8 md:mt-12 p-6 md:p-8 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success">
            <p className="text-lg md:text-xl lg:text-2xl font-bold text-center leading-relaxed">
              اگه جواب بیشتر این سوالا «بله» بود، پس کوچینگ زن قوی <span className="text-success">برای تو طراحی شده</span>.
            </p>
          </Card>

          <div className="text-center mt-8 md:mt-12">
            <Button
              size="lg"
              onClick={handleDepositClick}
              disabled={isLoading}
              className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-7 text-white font-bold shadow-bold hover:shadow-glow w-full sm:w-auto"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              {isLoading ? "در حال انتقال..." : "بله، آماده‌ام برای تحول"}
            </Button>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              برنامه <span className="gradient-text">کوچینگ چگونه است؟</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <Card className="p-4 md:p-6 hover-lift bg-card">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">مدت زمان</h3>
                    <p className="text-sm md:text-base text-muted-foreground">۳ ماه با ۱۲ جلسه هفتگی</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 hover-lift bg-card">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">فرمت جلسات</h3>
                    <p className="text-sm md:text-base text-muted-foreground">کوچینگ گروهی آنلاین زنده (Face-to-Face)</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 hover-lift bg-card">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">مربی شما</h3>
                    <p className="text-sm md:text-base text-muted-foreground">راضیه لیدی باس - کوچ و مربی معتبر زنان</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6 hover-lift bg-card">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-urgency/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-urgency" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">گروه هدف</h3>
                    <p className="text-sm md:text-base text-muted-foreground">زنان مهاجری که می‌خواهند قدرتمند شوند</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4 md:space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">شامل چه چیزهایی می‌شود؟</h3>
              
              <div className="space-y-3 md:space-y-4">
                {[
                  { icon: Video, text: "۱۲ جلسه کوچینگ گروهی زنده" },
                  { icon: MessageCircle, text: "دسترسی به گروه پشتیبانی انحصاری" },
                  { icon: Target, text: "برنامه شخصی‌سازی شده برای اهداف شما" },
                  { icon: Zap, text: "تمرین‌ها و تکالیف هفتگی" },
                  { icon: Award, text: "گواهینامه دیجیتال پایان دوره" },
                  { icon: Users, text: "شبکه‌سازی با زنان موفق مهاجر" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-base text-foreground font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Psychology Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5">
        <div className="max-w-5xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              این <span className="gradient-text">سرمایه‌گذاری</span> یعنی چی؟
            </h2>
          </div>

          {/* Value of Past Losses */}
          <Card className="p-6 md:p-8 mb-6 md:mb-8 border-2 border-urgency/30 bg-gradient-to-br from-urgency/5 to-transparent">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">بذار بپرسم...</h3>
            <div className="space-y-3 md:space-y-4 mb-6">
              <div className="flex items-start gap-3 p-3 md:p-4 bg-background/50 rounded-lg">
                <X className="w-5 h-5 md:w-6 md:h-6 text-urgency flex-shrink-0 mt-0.5" />
                <p className="text-base md:text-lg">چند بار به خاطر نداشتن اعتماد‌به‌نفس یه فرصت رو از دست دادی؟</p>
              </div>
              <div className="flex items-start gap-3 p-3 md:p-4 bg-background/50 rounded-lg">
                <X className="w-5 h-5 md:w-6 md:h-6 text-urgency flex-shrink-0 mt-0.5" />
                <p className="text-base md:text-lg">چند بار بخاطر نداشتن تسلط بر احساسات، یه رابطه یا یه شغل رو نابود کردی؟</p>
              </div>
              <div className="flex items-start gap-3 p-3 md:p-4 bg-background/50 rounded-lg">
                <X className="w-5 h-5 md:w-6 md:h-6 text-urgency flex-shrink-0 mt-0.5" />
                <p className="text-base md:text-lg">چند ساله فقط فکر می‌کنی یه روز باید تغییر کنی، اما هنوز همون‌جایی که بودی هستی؟</p>
              </div>
            </div>
            <div className="p-4 md:p-6 bg-success/10 rounded-lg border-r-4 border-r-success">
              <p className="text-lg md:text-xl font-bold leading-relaxed">
                اگه فقط یکی از این اشتباهاتو نخوای دوباره تکرار کنی، کوچینگ زن قوی، نه تنها ارزون نیست—حتی گرون هم نیست. 
                <span className="text-success"> این یه سرمایه‌گذاریه. روی خودت. روی آینده‌ت.</span>
              </p>
            </div>
          </Card>

          {/* ROI & Investment Return */}
          <Card className="p-6 md:p-8 mb-6 md:mb-8 border-2 border-success/30 bg-gradient-to-br from-success/5 to-transparent">
            <div className="flex items-start gap-4 mb-4">
              <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-success flex-shrink-0" />
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">بازدهی واقعی</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                  این کوچینگ می‌تونه مستقیماً تبدیل بشه به پول توی حساب بانکی‌ت.
                </p>
                <div className="p-4 bg-background/50 rounded-lg">
                  <p className="text-base md:text-lg font-semibold">
                    فقط کافیه یک بار، یه تصمیم درست تو ارتباطاتت یا کارت بگیری، هزینه این دوره دراومده. 
                    تازه بقیه دستاوردهاش می‌مونه برای تو.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Rare Opportunity */}
          <Card className="p-6 md:p-8 mb-6 md:mb-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
            <div className="flex items-start gap-4 mb-4">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-secondary flex-shrink-0" />
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">فرصت نادر</h3>
                <p className="text-base md:text-lg leading-relaxed">
                  تو الان به چیزی دسترسی داری که شاید ۹۰٪ زن‌ها هیچ‌وقت بهش نمی‌رسن: یک مسیر واضح برای تبدیل شدن به نسخه‌ای از خودت که 
                  <span className="font-bold text-secondary"> قدرت، نظم، حضور اجتماعی، عزت‌نفس و درآمد داره</span>.
                </p>
                <div className="mt-4 p-4 bg-background/50 rounded-lg">
                  <p className="text-base md:text-lg font-semibold">
                    خیلیا برای این مسیر، باید سال‌ها سردرگم باشن. ولی تو الان یه راه میانبر داری. این یعنی فرصت. نه هزینه.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Cost Breakdown */}
          <Card className="p-6 md:p-8 mb-6 md:mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">۷۴۷ دلار یعنی چی واقعاً؟</h3>
            <div className="space-y-3 md:space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-base md:text-lg">کمتر از هزینه‌ی دو تا مانتوی گرون</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-base md:text-lg">کمتر از یه مسافرت معمولی</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-base md:text-lg">حتی بعضیا اینقد پول می‌دن واسه یه کرم دور چشم!</span>
              </div>
            </div>
            <div className="p-5 md:p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/30">
              <div className="text-center mb-4">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">۱۰ دلار</div>
                <div className="text-base md:text-lg text-muted-foreground">در روز</div>
              </div>
              <p className="text-base md:text-lg font-semibold text-center mb-4">کمتر از قیمت یه قهوه بیرون!</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">کنترل ذهنت</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">اعتماد‌به‌نفس‌ت</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">درآمدت</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">آرامش و نظم زندگیت</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base">ساختن یک نسخه‌ی کاملاً جدید از خودت</span>
                </div>
              </div>
            </div>
          </Card>

          {/* You Deserve It */}
          <Card className="p-6 md:p-8 bg-gradient-to-br from-urgency/10 to-urgency/5 border-2 border-urgency/30">
            <div className="text-center">
              <Award className="w-12 h-12 md:w-16 md:h-16 text-urgency mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold mb-4">تو لایق اینی...</h3>
              <p className="text-lg md:text-xl leading-relaxed mb-4">
                که یه مربی در کنارت باشه. لایق اینی که توی بیزنس، رابطه و زندگی بدرخشی.
              </p>
              <p className="text-xl md:text-2xl font-bold text-urgency">
                این کوچینگ فقط یه کلاس نیست—یه بیانیه‌ست: اینکه تو دیگه قرار نیست نسخه ضعیف خودت باشی.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">سرمایه‌گذاری</span> روی خودتان
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground px-4">با ضمانت بازگشت وجه محافظت می‌شوید</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Step 1: Deposit */}
            <Card className="p-5 md:p-6 lg:p-8 mb-6 md:mb-8 border-2 border-primary shadow-bold">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0">
                  ۱
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-1.5 md:mb-2">مرحله اول: پیش‌پرداخت و مصاحبه</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 leading-relaxed">
                    برای شروع، ۱۰۰ دلار پیش‌پرداخت کنید و وقت مصاحبه با راضیه لیدی باس را رزرو کنید.
                    در مصاحبه مشخص می‌شود که این برنامه برای شما مناسب است یا خیر.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleDepositClick}
                    disabled={isLoading}
                    className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-6 text-white font-bold w-full sm:w-auto"
                  >
                    {isLoading ? "در حال انتقال..." : "پرداخت ۱۰۰ دلار و رزرو مصاحبه"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Step 2: After Acceptance */}
            <Card className="p-5 md:p-6 lg:p-8 mb-6 md:mb-8 bg-card">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0">
                  ۲
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">مرحله دوم: پس از قبولی</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 leading-relaxed">
                    اگر در مصاحبه قبول شدید، یکی از دو گزینه پرداخت را انتخاب کنید:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    {/* Monthly Payment */}
                    <Card className="p-4 md:p-6 border-2 border-border hover-lift bg-background">
                      <div className="text-center">
                        <h4 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">پرداخت ماهانه</h4>
                        <div className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">۲۹۹$</div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">به مدت ۳ ماه</p>
                        
                        <div className="border-t pt-3 md:pt-4 mb-3 md:mb-4">
                          <div className="flex justify-between items-center text-xs md:text-sm mb-1 md:mb-2">
                            <span className="text-muted-foreground">پرداخت ماهانه:</span>
                            <span className="font-semibold">۲۹۹$ × ۳</span>
                          </div>
                          <div className="flex justify-between items-center font-bold text-sm md:text-base">
                            <span>جمع:</span>
                            <span className="text-primary">۸۹۷$</span>
                          </div>
                        </div>

                        <ul className="space-y-1.5 md:space-y-2 text-right text-xs md:text-sm">
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>انعطاف در پرداخت</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>شروع فوری برنامه</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    {/* One-time Payment - Recommended */}
                    <Card className="p-4 md:p-6 border-2 border-success hover-lift bg-success/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bg-success text-success-foreground px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-bold rounded-br-lg">
                        توصیه می‌شود
                      </div>
                      <div className="text-center mt-4 md:mt-6">
                        <h4 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">پرداخت یکجا</h4>
                        <div className="text-3xl md:text-4xl font-bold text-success mb-1 md:mb-2">۷۴۷$</div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">کل دوره</p>
                        
                        <div className="border-t pt-3 md:pt-4 mb-3 md:mb-4">
                          <div className="flex justify-between items-center text-xs md:text-sm mb-1 md:mb-2">
                            <span className="text-muted-foreground">پرداخت ماهانه:</span>
                            <span className="line-through opacity-60">۸۹۷$</span>
                          </div>
                          <div className="flex justify-between items-center font-bold text-sm md:text-base">
                            <span>با تخفیف:</span>
                            <span className="text-success">۷۴۷$</span>
                          </div>
                          <div className="mt-1 md:mt-2 text-xs md:text-sm text-success font-semibold">
                            صرفه‌جویی ۱۵۰ دلار!
                          </div>
                        </div>

                        <ul className="space-y-1.5 md:space-y-2 text-right text-xs md:text-sm">
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>صرفه‌جویی ۱۵۰ دلاری</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>بدون دغدغه پرداخت ماهانه</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>بهترین ارزش</span>
                          </li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>

            {/* Money-Back Guarantee */}
            <Card className="p-5 md:p-6 lg:p-8 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30">
              <div className="flex items-start gap-3 md:gap-4">
                <Shield className="w-10 h-10 md:w-12 md:h-12 text-success flex-shrink-0" />
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">ضمانت بازگشت وجه ۳۰ روزه - بدون سوال</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    اگر تا ۳۰ روز اول احساس کنید این برنامه برای شما مناسب نیست، کافی است به ما اطلاع دهید 
                    و کل مبلغ پرداختی شما بدون هیچ سوالی بازگردانده می‌شود. هیچ ریسکی وجود ندارد!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4">
        <div className="max-w-4xl mx-auto rtl font-farsi">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 px-2">سوالات متداول</h2>
          
          <div className="space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6 hover-lift">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">چرا باید ۱۰۰ دلار پیش‌پرداخت کنم؟</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                این مبلغ برای رزرو جایگاه شما و انجام مصاحبه اولیه با راضیه لیدی باس است تا مطمئن شویم این برنامه برای شما مناسب است. این فرآیند به نفع هر دو طرف است و تضمین می‌کند که افراد واقعاً متعهد در برنامه شرکت کنند.
              </p>
            </Card>

            <Card className="p-4 md:p-6 hover-lift">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">اگر در مصاحبه قبول نشوم چه می‌شود؟</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                اگر مشخص شود که این برنامه در حال حاضر برای شما مناسب نیست، کل مبلغ ۱۰۰ دلار بازگردانده می‌شود. هیچ ریسکی برای شما وجود ندارد.
              </p>
            </Card>

            <Card className="p-4 md:p-6 hover-lift">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">آیا جلسات رو در رو هستند؟</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                بله، تمام جلسات کوچینگ به صورت آنلاین و Face-to-Face (رو در رو) برگزار می‌شوند. این فرمت تجربه تحول‌آفرین و واقعی را برای شما فراهم می‌کند.
              </p>
            </Card>

            <Card className="p-4 md:p-6 hover-lift">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">ضمانت بازگشت وجه چگونه کار می‌کند؟</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                اگر تا ۳۰ روز اول احساس کنید این برنامه برای شما مناسب نیست، کافی است به ما اطلاع دهید و کل مبلغ پرداختی بدون هیچ سوالی بازگردانده می‌شود. ما کاملاً به پشت این برنامه ایستاده‌ایم.
              </p>
            </Card>

            <Card className="p-4 md:p-6 hover-lift">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">کی می‌توانم برنامه را شروع کنم؟</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                پس از پرداخت پیش‌پرداخت و تایید در مصاحبه، می‌توانید فوراً شروع کنید. دوره‌های جدید هر ماه شروع می‌شوند.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-success/10">
        <div className="max-w-4xl mx-auto text-center rtl font-farsi">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
            آماده‌اید <span className="gradient-text">زن ۱۰ برابر قدرتمند</span> شوید؟
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 px-4">
            تعداد جایگاه محدود است. امروز جای خود را رزرو کنید و اولین قدم را به سوی تحول بردارید.
          </p>
          
          <div className="space-y-4 md:space-y-6">
            <Button
              size="lg"
              onClick={handleDepositClick}
              disabled={isLoading}
              className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-7 text-white font-bold shadow-bold hover:shadow-glow w-full sm:w-auto"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              {isLoading ? "در حال انتقال..." : "رزرو جایگاه با ۱۰۰ دلار پیش‌پرداخت"}
            </Button>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
                <span>ضمانت بازگشت کامل وجه تا ۳۰ روز</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-urgency" />
                <span>ظرفیت محدود</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}