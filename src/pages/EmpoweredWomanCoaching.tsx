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
  Gift
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmpoweredWomanCoaching() {
  const navigate = useNavigate();

  const handleDepositClick = () => {
    navigate("/checkout?program=empowered-woman-coaching&amount=100");
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
              <Button
                size="lg"
                onClick={handleDepositClick}
                className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-7 text-white font-bold shadow-bold hover:shadow-glow w-full sm:w-auto"
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                رزرو با پیش‌پرداخت ۱۰۰ دلار
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

      {/* Special Offer Banner */}
      <section className="py-4 md:py-6 px-4 bg-gradient-to-r from-urgency via-urgency-light to-urgency">
        <div className="max-w-6xl mx-auto text-center rtl font-farsi">
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
      </section>

      {/* Transformation Areas */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16 animate-fade-in-up">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">قدرت ۱۰ برابری</span> در ۳ حوزه کلیدی
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              با این برنامه، قدرت واقعی خود را در سه بعد مهم زندگی کشف کنید
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Career Card */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
                <Briefcase className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">کار و شغل</h3>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">افزایش اعتماد به نفس در محیط کار</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">مهارت مذاکره و ارتباط حرفه‌ای</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">رشد و پیشرفت شغلی سریع‌تر</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">رهبری و تاثیرگذاری بیشتر</span>
                </li>
              </ul>
            </Card>

            {/* Relationships Card */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4 md:mb-6">
                <Heart className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-secondary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">روابط</h3>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">برقراری ارتباطات قدرتمند و واقعی</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">تعیین مرزهای سالم و احترام</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">روابط خانوادگی متعادل</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">شبکه‌سازی موثر و حرفه‌ای</span>
                </li>
              </ul>
            </Card>

            {/* Income Card */}
            <Card className="p-5 md:p-6 lg:p-8 hover-lift bg-card border-2 border-border">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4 md:mb-6">
                <DollarSign className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-success" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">درآمد</h3>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">افزایش درآمد و فرصت‌های مالی</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">ذهنیت ثروت و فراوانی</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">مهارت سرمایه‌گذاری و مدیریت مالی</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base text-muted-foreground">استقلال و امنیت مالی</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-12 md:py-16 lg:py-20 px-4">
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

      {/* Pricing Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
              <span className="gradient-text">سرمایه‌گذاری</span> روی خودتان
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground px-4">ارزشش را دارد، و با ضمانت بازگشت وجه محافظت می‌شوید</p>
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
                    className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-6 text-white font-bold w-full sm:w-auto"
                  >
                    پرداخت ۱۰۰ دلار و رزرو مصاحبه
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
              className="cta-button text-base md:text-lg px-8 md:px-10 py-5 md:py-7 text-white font-bold shadow-bold hover:shadow-glow w-full sm:w-auto"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              رزرو جایگاه با ۱۰۰ دلار پیش‌پرداخت
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