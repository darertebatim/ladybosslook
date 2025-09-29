import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, ArrowLeft, ExternalLink, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const announcements = [
  {
    id: 1,
    title: "Welcome to Courageous Character Workshop Community!",
    titlePersian: "به جامعه ورکشاپ کارکتر پرجرات خوش آمدید!",
    date: "September 29, 2025",
    datePersian: "۲۹ سپتامبر ۲۰۲۵",
    category: "Important",
    categoryPersian: "مهم",
    content: "Thank you for joining our Courageous Character Workshop. Check this page weekly for workshop materials, exercises, and community updates.",
    contentPersian: "سلام سلام دوباره، بازم تبریک میگم بخاطر حضورتون توی ورکشاپ کاراکتر پرجرات. در حال آماده کردن زیر ساخت ها هستیم، فردا اشانتیون هاتون رو براتون میفرستیم. ورکشاپ ۳ جلسه آنلاینه، توی ۳ هفته از هفته سوم اکتبر شروع می کنیم. برای راحتی شما ۲ تا سانس داریم (یک سانس مخصوص امریکا/کانادا/اروپا) (یک سانس مخصوص اروپا/انگلیس/دبی)",
    isUrgent: true,
    isToday: true
  },
  {
    id: 2,
    title: "Workshop Materials & Resources",
    titlePersian: "مواد و منابع کارگاه",
    date: "September 29, 2025",
    datePersian: "۲۹ سپتامبر ۲۰۲۵",
    category: "Resources",
    categoryPersian: "منابع",
    content: "Access your workshop materials, exercises, and bonus content. More resources will be added weekly.",
    contentPersian: "به مواد کارگاه، تمرینات و محتوای جایزه خود دسترسی داشته باشید. هر هفته منابع بیشتری اضافه می‌شود.",
    resourceLink: "https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/",
    isUrgent: false,
    isToday: false
  },
  {
    id: 3,
    title: "Weekly Check-in & Community Support",
    titlePersian: "چک‌این هفتگی و پشتیبانی جامعه",
    date: "Every Week",
    datePersian: "هر هفته",
    category: "Community",
    categoryPersian: "جامعه",
    content: "Join us for weekly check-ins, share your progress, and connect with other workshop participants. Together we grow stronger!",
    contentPersian: "هر هفته به ما بپیوندید، پیشرفت خود را به اشتراک بگذارید و با سایر شرکت‌کنندگان کارگاه ارتباط برقرار کنید. با هم قوی‌تر می‌شویم!",
    isUrgent: false,
    isToday: false
  }
];

export default function CCWAnnouncements() {
  return (
    <div className="min-h-screen bg-gradient-luxury">
      <SEOHead 
        title="CCW News & Announcements | تابلوی اعلانات کارگاه شخصیت شجاع"
        description="Stay updated with the latest news, announcements, and resources from Courageous Character Workshop community. Visit weekly for new updates."
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-[hsl(var(--luxury-gold))]" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-[hsl(var(--pure-white))]">
              CCW Announcements
            </h1>
          </div>
          <div className="mb-4 md:mb-6" dir="rtl">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-[hsl(var(--luxury-gold))] font-persian mb-2" dir="rtl">
              تابلوی اعلانات ورکشاپ کارکتر پرجرات
            </h2>
            <p className="text-base md:text-xl text-[hsl(var(--luxury-silver))] font-persian" dir="rtl">
              هر هفته به این صفحه سر بزنید
            </p>
          </div>
        </div>

        {/* Weekly Visit Reminder */}
        <div className="mb-6 md:mb-8">
          <Card className="bg-[hsl(var(--luxury-charcoal))] border-[hsl(var(--luxury-gold))]/20">
            <CardContent className="p-4 md:p-6">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--luxury-gold))]" />
                  <span className="text-base md:text-lg font-semibold text-[hsl(var(--pure-white))]">
                    Weekly Updates
                  </span>
                </div>
                <p className="text-sm md:text-base text-[hsl(var(--luxury-silver))]">
                  Please check this page weekly for the latest news, exercises, and workshop materials.
                </p>
              </div>
              <div className="text-center" dir="rtl">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                  <span className="text-base md:text-lg font-semibold text-[hsl(var(--pure-white))] font-persian">
                    اطلاعیه‌های هفتگی
                  </span>
                  <Heart className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--luxury-gold))]" />
                </div>
                <p className="text-sm md:text-base text-[hsl(var(--luxury-silver))] font-persian">
                  لطفا هر هفته به این صفحه سر بزنید چون آخرین خبرها، تمرین‌ها و جزوه‌های کارگاه به این صفحه اضافه میشن
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements Grid */}
        <div className="space-y-4 md:space-y-6">
          {announcements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`bg-[hsl(var(--luxury-charcoal))] border transition-all duration-300 hover:shadow-luxury ${
                announcement.isUrgent 
                  ? 'border-[hsl(var(--luxury-gold))] shadow-[0_0_20px_hsl(var(--luxury-gold)/0.3)]' 
                  : 'border-[hsl(var(--luxury-silver))]/20 hover:border-[hsl(var(--luxury-gold))]/40'
              }`}
            >
              <CardHeader className="pb-3">
                {/* English Section */}
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={announcement.isUrgent ? "default" : "secondary"}
                          className={announcement.isUrgent 
                            ? 'bg-[hsl(var(--luxury-gold))] text-[hsl(var(--pure-black))]' 
                            : 'bg-[hsl(var(--luxury-silver))]/20 text-[hsl(var(--luxury-silver))]'
                          }
                        >
                          {announcement.category}
                        </Badge>
                        {announcement.isToday && (
                          <Badge className="bg-green-600 text-white">
                            New Today
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg md:text-xl lg:text-2xl mb-2 text-[hsl(var(--pure-white))]">
                        {announcement.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-[hsl(var(--luxury-silver))]">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{announcement.date}</span>
                    </div>
                  </div>
                  <p className="text-[hsl(var(--luxury-silver))] leading-relaxed text-sm md:text-base">
                    {announcement.content}
                  </p>
                </div>

                {/* Persian Section */}
                <div dir="rtl" className="pt-4 border-t border-[hsl(var(--luxury-silver))]/10">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 justify-end">
                        {announcement.isToday && (
                          <Badge className="bg-green-600 text-white font-persian">
                            امروز
                          </Badge>
                        )}
                        <Badge 
                          variant={announcement.isUrgent ? "default" : "secondary"}
                          className={`font-persian ${
                            announcement.isUrgent 
                              ? 'bg-[hsl(var(--luxury-gold))] text-[hsl(var(--pure-black))]' 
                              : 'bg-[hsl(var(--luxury-silver))]/20 text-[hsl(var(--luxury-silver))]'
                          }`}
                        >
                          {announcement.categoryPersian}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg md:text-xl lg:text-2xl mb-2 text-[hsl(var(--pure-white))] font-persian text-right">
                        {announcement.titlePersian}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-[hsl(var(--luxury-silver))] justify-end sm:justify-start">
                      <span className="text-sm font-persian">{announcement.datePersian}</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[hsl(var(--luxury-silver))] font-persian leading-relaxed text-sm md:text-base text-right">
                    {announcement.contentPersian}
                  </p>
                </div>
              </CardHeader>

              {announcement.resourceLink && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 justify-center bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(announcement.resourceLink, '_blank')}
                      className="text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Access Resources
                    </Button>
                    <ExternalLink className="h-4 w-4 text-purple-400" />
                    <BookOpen className="h-5 w-5 text-purple-400" />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 md:mt-12 text-center">
          <Card className="bg-gradient-bw-gold border-[hsl(var(--luxury-gold))]/30">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-[hsl(var(--pure-white))]">
                Stay Connected
              </h3>
              <p className="text-[hsl(var(--luxury-silver))] mb-4 text-sm md:text-base">
                Don't miss important announcements, resources, and community events. 
              </p>
              <div dir="rtl" className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-[hsl(var(--pure-white))] font-persian">
                  در ارتباط باشید
                </h3>
                <p className="text-[hsl(var(--luxury-silver))] font-persian text-sm md:text-base">
                  اطلاعیه‌های مهم، منابع و رویدادهای جامعه را از دست ندهید.
                </p>
              </div>
              <Button 
                size="lg" 
                className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-gold-dark))] text-[hsl(var(--pure-black))] font-semibold"
                onClick={() => window.location.href = '/'}
              >
                Return to Home / بازگشت به صفحه اصلی
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
