import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/sections/Footer";
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
        title="کوچینگ زنان توانمند - برنامه ۳ ماهه تحول ۱۰ برابری"
        description="برنامه کوچینگ گروهی ۳ ماهه برای زنان مهاجر. قدرت ۱۰ برابری در کار، روابط و درآمد. با رازیه لیدی باس"
        image="/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png"
      />
      
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 gradient-hero opacity-10" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-fade-in-up rtl font-farsi">
            {/* Badge */}
            <Badge className="mb-6 text-base px-6 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Sparkles className="w-4 h-4 ml-2" />
              ویژه زنان مهاجر
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">زن ۱۰ برابر توانمند</span>
              <br />
              <span className="text-foreground">شما باشید</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              برنامه کوچینگ گروهی ۳ ماهه با رازیه لیدی باس
              <br />
              برای پیشرفت قدرتمند در کار، روابط و درآمد
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">۳ ماه</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Video className="w-5 h-5 text-primary" />
                <span className="font-semibold">۱۲ جلسه زنده</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">کوچینگ گروهی</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleDepositClick}
                className="cta-button text-lg px-10 py-7 text-white font-bold shadow-bold hover:shadow-glow"
              >
                <Shield className="w-5 h-5 ml-2" />
                رزرو با پیش‌پرداخت ۱۰۰ دلار
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
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
                <span>محدودیت ظرفیت</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="py-6 px-4 bg-gradient-to-r from-urgency via-urgency-light to-urgency">
        <div className="max-w-6xl mx-auto text-center rtl font-farsi">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-white">
            <Gift className="w-8 h-8 animate-bounce" />
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-1">
                پیشنهاد ویژه: از <span className="line-through opacity-75">۱۲۰۰$</span> به <span className="text-4xl">۹۹۷$</span>
              </p>
              <p className="text-lg opacity-90">صرفه‌جویی ۲۰۳ دلار - فقط برای افراد واجد شرایط</p>
            </div>
            <Gift className="w-8 h-8 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Transformation Areas */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">تحول ۱۰ برابری</span> در ۳ حوزه کلیدی
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              با این برنامه، قدرت واقعی خود را در سه بعد مهم زندگی کشف کنید
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Career Card */}
            <Card className="p-8 hover-lift bg-card border-2 border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">کار و شغل</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">افزایش اعتماد به نفس در محیط کار</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">مهارت مذاکره و ارتباط حرفه‌ای</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">رشد و پیشرفت شغلی سریع‌تر</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">رهبری و تاثیرگذاری بیشتر</span>
                </li>
              </ul>
            </Card>

            {/* Relationships Card */}
            <Card className="p-8 hover-lift bg-card border-2 border-border">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">روابط</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">برقراری ارتباطات قدرتمند و واقعی</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">تعیین مرزهای سالم و احترام</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">روابط خانوادگی متعادل</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">شبکه‌سازی موثر و حرفه‌ای</span>
                </li>
              </ul>
            </Card>

            {/* Income Card */}
            <Card className="p-8 hover-lift bg-card border-2 border-border">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">درآمد</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">افزایش درآمد و فرصت‌های مالی</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">ذهنیت ثروت و فراوانی</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">مهارت سرمایه‌گذاری و مدیریت مالی</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">استقلال و امنیت مالی</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              برنامه <span className="gradient-text">کوچینگ چگونه است؟</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card className="p-6 hover-lift bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">مدت زمان</h3>
                    <p className="text-muted-foreground">۳ ماه با ۱۲ جلسه هفتگی</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover-lift bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">فرمت جلسات</h3>
                    <p className="text-muted-foreground">کوچینگ گروهی آنلاین زنده (Face-to-Face)</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover-lift bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">مربی شما</h3>
                    <p className="text-muted-foreground">رازیه لیدی باس - کوچ و مربی معتبر زنان</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover-lift bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-urgency/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-urgency" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">گروه هدف</h3>
                    <p className="text-muted-foreground">زنان مهاجری که می‌خواهند قدرتمند شوند</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <h3 className="text-3xl font-bold mb-6">شامل چه چیزهایی می‌شود؟</h3>
              
              <div className="space-y-4">
                {[
                  { icon: Video, text: "۱۲ جلسه کوچینگ گروهی زنده" },
                  { icon: MessageCircle, text: "دسترسی به گروه پشتیبانی انحصاری" },
                  { icon: Target, text: "برنامه شخصی‌سازی شده برای اهداف شما" },
                  { icon: Zap, text: "تمرین‌ها و تکالیف هفتگی" },
                  { icon: Award, text: "گواهینامه دیجیتال پایان دوره" },
                  { icon: Users, text: "شبکه‌سازی با زنان موفق مهاجر" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                    <item.icon className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">سرمایه‌گذاری</span> روی خودتان
            </h2>
            <p className="text-xl text-muted-foreground">ارزشش را دارد، و با ضمانت بازگشت وجه محافظت می‌شوید</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Step 1: Deposit */}
            <Card className="p-8 mb-8 border-2 border-primary shadow-bold">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                  ۱
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">مرحله اول: پیش‌پرداخت و مصاحبه</h3>
                  <p className="text-muted-foreground mb-4">
                    برای شروع، ۱۰۰ دلار پیش‌پرداخت کنید و وقت مصاحبه با رازیه لیدی باس را رزرو کنید.
                    در مصاحبه مشخص می‌شود که این برنامه برای شما مناسب است یا خیر.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleDepositClick}
                    className="cta-button text-lg px-10 py-6 text-white font-bold w-full sm:w-auto"
                  >
                    پرداخت ۱۰۰ دلار و رزرو مصاحبه
                  </Button>
                </div>
              </div>
            </Card>

            {/* Step 2: After Acceptance */}
            <Card className="p-8 mb-8 bg-card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                  ۲
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4">مرحله دوم: پس از قبولی</h3>
                  <p className="text-muted-foreground mb-6">
                    اگر در مصاحبه قبول شدید، یکی از دو گزینه پرداخت را انتخاب کنید:
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Monthly Payment */}
                    <Card className="p-6 border-2 border-border hover-lift bg-background">
                      <div className="text-center">
                        <h4 className="text-xl font-bold mb-2">پرداخت ماهانه</h4>
                        <div className="text-4xl font-bold text-primary mb-2">۲۹۷$</div>
                        <p className="text-muted-foreground mb-4">در ماه × ۳ ماه</p>
                        <div className="text-lg font-semibold mb-4">جمع: ۸۹۱ دلار</div>
                        <ul className="text-right space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                            <span>انعطاف در پرداخت</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                            <span>بدون فشار مالی</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    {/* One-time Payment */}
                    <Card className="p-6 border-2 border-success hover-lift bg-success/5 relative overflow-hidden">
                      <Badge className="absolute top-4 left-4 bg-success text-white">
                        صرفه‌جویی ۱۴۴$
                      </Badge>
                      <div className="text-center pt-6">
                        <h4 className="text-xl font-bold mb-2">پرداخت یکجا</h4>
                        <div className="text-4xl font-bold text-success mb-2">۷۴۷$</div>
                        <p className="text-muted-foreground mb-4">پرداخت کامل</p>
                        <div className="text-lg font-semibold mb-4 text-success">
                          ۱۴۴ دلار صرفه‌جویی!
                        </div>
                        <ul className="text-right space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                            <span>بهترین ارزش</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                            <span>خیال راحت کامل</span>
                          </li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>

            {/* Money-back Guarantee */}
            <Card className="p-8 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30">
              <div className="flex items-start gap-4">
                <Shield className="w-12 h-12 text-success flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-success">ضمانت ۳۰ روزه بازگشت ۱۰۰٪ وجه</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    اگر طی ۳۰ روز اول احساس کردید که این برنامه برای شما مناسب نیست،
                    بدون هیچ سوال و شرطی تمام پول خود را پس می‌گیرید.
                    ما به کیفیت برنامه‌مان اطمینان داریم و می‌خواهیم شما هم با خیال راحت شروع کنید.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why This Program */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              چرا این برنامه <span className="gradient-text">متفاوت است؟</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Star,
                title: "ویژه زنان مهاجر",
                description: "برنامه‌ای طراحی شده با درک عمیق چالش‌های خاص زنان مهاجر"
              },
              {
                icon: Users,
                title: "قدرت جمعی",
                description: "همراه با گروهی از زنان هم‌فکر و هم‌هدف رشد کنید"
              },
              {
                icon: Award,
                title: "مربی باتجربه",
                description: "رازیه لیدی باس با سال‌ها تجربه در توانمندسازی زنان"
              },
              {
                icon: TrendingUp,
                title: "نتایج واقعی",
                description: "روش‌های اثبات شده که تحول واقعی ایجاد می‌کنند"
              },
              {
                icon: Heart,
                title: "محیط امن",
                description: "فضایی امن و حمایتی برای رشد و یادگیری"
              },
              {
                icon: Target,
                title: "تمرکز عملی",
                description: "ابزارها و استراتژی‌های عملی که همین امروز می‌توانید به کار ببرید"
              }
            ].map((item, index) => (
              <Card key={index} className="p-6 hover-lift bg-card text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto rtl font-farsi">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              سوالات <span className="gradient-text">متداول</span>
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "آیا این برنامه برای من مناسب است؟",
                a: "اگر زن مهاجری هستید که می‌خواهید در زندگی حرفه‌ای، روابط و درآمد خود پیشرفت کنید، این برنامه برای شماست. در مصاحبه اولیه، رازیه به شما کمک می‌کند تا مطمئن شوید این برنامه با اهداف شما همخوانی دارد."
              },
              {
                q: "مصاحبه اولیه چگونه است؟",
                a: "پس از پیش‌پرداخت ۱۰۰ دلار، یک جلسه مصاحبه شخصی با رازیه خواهید داشت. در این جلسه، هدف‌ها و چالش‌های شما بررسی می‌شود و مشخص می‌شود که آیا این برنامه برای شما مناسب است یا خیر."
              },
              {
                q: "اگر در مصاحبه قبول نشوم چه می‌شود؟",
                a: "اگر مشخص شود که این برنامه در این مرحله برای شما مناسب نیست، ۱۰۰ دلار پیش‌پرداخت شما کاملاً بازگردانده می‌شود."
              },
              {
                q: "جلسات چه زمانی برگزار می‌شود؟",
                a: "جلسات به صورت هفتگی و در زمان‌های مشخص برگزار می‌شود. زمان دقیق جلسات بر اساس منطقه زمانی شرکت‌کنندگان هماهنگ می‌شود."
              },
              {
                q: "ضمانت بازگشت وجه چگونه است؟",
                a: "طی ۳۰ روز اول برنامه، اگر احساس کردید که برنامه برای شما مناسب نیست، می‌توانید بدون هیچ سوالی درخواست بازگشت کامل وجه خود را بدهید."
              },
              {
                q: "آیا ضبط جلسات در دسترس خواهد بود؟",
                a: "بله، تمام جلسات ضبط می‌شود و در صورت غیبت، می‌توانید به ضبط جلسه دسترسی داشته باشید."
              }
            ].map((item, index) => (
              <Card key={index} className="p-6 hover-lift bg-card">
                <h3 className="text-xl font-bold mb-3 text-foreground">{item.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
        <div className="max-w-4xl mx-auto text-center rtl font-farsi">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            آماده‌اید که <span className="gradient-text">۱۰ برابر توانمندتر</span> شوید؟
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            ظرفیت محدود است. همین امروز جایگاه خود را با پیش‌پرداخت ۱۰۰ دلار رزرو کنید
            و اولین قدم را برای تحول بزرگ زندگی‌تان بردارید.
          </p>
          
          <Button
            size="lg"
            onClick={handleDepositClick}
            className="cta-button text-xl px-12 py-8 text-white font-bold shadow-bold hover:shadow-glow mb-6"
          >
            <Shield className="w-6 h-6 ml-2" />
            رزرو جایگاه با ۱۰۰ دلار
          </Button>

          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span>ضمانت ۳۰ روزه بازگشت کامل وجه</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>ظرفیت محدود برای کیفیت بالا</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
