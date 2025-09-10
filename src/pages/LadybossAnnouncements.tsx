import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, ArrowLeft, Phone, Mail, Video, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const announcements = [
  {
    id: 1,
    title: "پشتیبانی واتساپ موقتاً در دسترس نیست",
    date: "۱۰ سپتامبر ۲۰۲۵",
    category: "مهم",
    content: "خط پشتیبانی واتساپ ما در حال حاضر در دسترس نیست. لطفاً برای تماس مجدد به این واتساپ پیام دهید:",
    phone: "(626) 502-8538",
    meetLink: "https://meet.google.com/rjh-acpj-wxn",
    supportEmail: "support@ladybosslook.com",
    isUrgent: true,
    isToday: true
  },
  {
    id: 2,
    title: "ویدیوی ضبط شده جلسات کوچینگ زن قوی با استاد راضیه لیدی باس",
    date: "۹ سپتامبر ۲۰۲۵",
    category: "ویدیو",
    content: "برای دسترسی به ویدیوی جلسه ها روی کلاس خودتان وارد شوید",
    europeLink: "https://drive.google.com/drive/folders/1lMNr1ztakLS8wuZzZ8MNSHPG8CMYIH1M?usp=sharing",
    americaLink: "https://drive.google.com/drive/folders/1kuWTyXIvJl6jbwBkUgv8D3smlxBd0LkW?usp=drive_link",
    isUrgent: false,
    isToday: false
  }
];

export default function LadybossAnnouncements() {
  return (
    <div className="min-h-screen bg-gradient-luxury">
      <SEOHead 
        title="LadyBoss Coaching News & Announcements | تابلوی اعلانات کوچینگ لیدی باس"
        description="Stay updated with the latest news, announcements, and success stories from LadyBoss Coaching community. Visit weekly for new updates."
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-[hsl(var(--luxury-gold))]" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-[hsl(var(--pure-white))]">
              News & Announcements
            </h1>
          </div>
          <div className="mb-4 md:mb-6" dir="rtl">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-[hsl(var(--luxury-gold))] font-farsi mb-2">
              تابلوی اعلانات کوچینگ لیدی باس
            </h2>
            <p className="text-base md:text-xl text-[hsl(var(--luxury-silver))] font-farsi">
              هر هفته به این صفحه سر بزنید
            </p>
          </div>
        </div>

        {/* Weekly Visit Reminder */}
        <div className="mb-6 md:mb-8">
          <Card className="bg-[hsl(var(--luxury-charcoal))] border-[hsl(var(--luxury-gold))]/20">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--luxury-gold))]" />
                <span className="text-base md:text-lg font-semibold text-[hsl(var(--pure-white))] font-farsi" dir="rtl">
                  اطلاعیه‌های هفتگی
                </span>
              </div>
              <p className="text-sm md:text-base text-[hsl(var(--luxury-silver))] font-farsi" dir="rtl">
                هر هفته به این صفحه سر بزنید تا از آخرین اخبار و اعلانات باخبر شوید
              </p>
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
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1" dir="rtl">
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      {announcement.isToday && (
                        <Badge className="bg-[hsl(var(--luxury-gold))] text-[hsl(var(--pure-black))] font-farsi">
                          امروز
                        </Badge>
                      )}
                      <Badge 
                        variant={announcement.isUrgent ? "default" : "secondary"}
                        className={`font-farsi ${
                          announcement.isUrgent 
                            ? 'bg-red-600 text-white' 
                            : 'bg-[hsl(var(--luxury-silver))]/20 text-[hsl(var(--luxury-silver))]'
                        }`}
                      >
                        {announcement.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg md:text-xl lg:text-2xl mb-2 text-[hsl(var(--pure-white))] font-farsi text-right">
                      {announcement.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-[hsl(var(--luxury-silver))] justify-end sm:justify-start" dir="rtl">
                    <span className="text-sm font-farsi">{announcement.date}</span>
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div dir="rtl">
                  <p className="text-[hsl(var(--luxury-silver))] font-farsi leading-relaxed text-sm md:text-base mb-4">
                    {announcement.content}
                  </p>
                  
                  {announcement.phone && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 justify-end bg-[hsl(var(--luxury-gold))]/10 p-3 rounded-lg border border-[hsl(var(--luxury-gold))]/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://wa.me/${announcement.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                          className="text-[hsl(var(--luxury-gold))] hover:text-[hsl(var(--pure-white))] p-0 h-auto font-mono"
                        >
                          {announcement.phone}
                        </Button>
                        <MessageCircle className="h-4 w-4 text-[hsl(var(--luxury-gold))]" />
                        <span className="text-[hsl(var(--pure-white))] font-farsi">واتساپ جدید:</span>
                      </div>
                      
                      {announcement.meetLink && (
                        <div className="flex items-center gap-2 justify-end bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(announcement.meetLink, '_blank')}
                            className="text-blue-400 hover:text-blue-300 p-0 h-auto font-farsi"
                          >
                            پیوند جلسه امروز
                          </Button>
                          <Video className="h-4 w-4 text-blue-400" />
                          <span className="text-[hsl(var(--pure-white))] font-farsi">گوگل میت:</span>
                        </div>
                      )}
                      
                      {announcement.supportEmail && (
                        <div className="flex items-center gap-2 justify-end bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`mailto:${announcement.supportEmail}`, '_blank')}
                            className="text-green-400 hover:text-green-300 p-0 h-auto font-mono"
                          >
                            {announcement.supportEmail}
                          </Button>
                          <Mail className="h-4 w-4 text-green-400" />
                          <span className="text-[hsl(var(--pure-white))] font-farsi">ایمیل پشتیبانی:</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(announcement.europeLink || announcement.americaLink) && (
                    <div className="space-y-3 mb-4">
                      {announcement.europeLink && (
                        <div className="flex items-center gap-2 justify-end bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(announcement.europeLink, '_blank')}
                            className="text-purple-400 hover:text-purple-300 p-0 h-auto font-farsi"
                          >
                            دسترسی به ویدیوها
                          </Button>
                          <ExternalLink className="h-4 w-4 text-purple-400" />
                          <span className="text-[hsl(var(--pure-white))] font-farsi">جلسات اروپا:</span>
                        </div>
                      )}
                      
                      {announcement.americaLink && (
                        <div className="flex items-center gap-2 justify-end bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(announcement.americaLink, '_blank')}
                            className="text-orange-400 hover:text-orange-300 p-0 h-auto font-farsi"
                          >
                            دسترسی به ویدیوها
                          </Button>
                          <ExternalLink className="h-4 w-4 text-orange-400" />
                          <span className="text-[hsl(var(--pure-white))] font-farsi">جلسات امریکا:</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {announcement.isToday && (
                  <div className="mt-4 pt-4 border-t border-[hsl(var(--luxury-gold))]/20">
                    <Button 
                      variant="ghost" 
                      className="group text-[hsl(var(--luxury-gold))] hover:text-[hsl(var(--pure-white))] font-farsi" 
                      dir="rtl"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      اطلاعات بیشتر
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 md:mt-12 text-center">
          <Card className="bg-gradient-bw-gold border-[hsl(var(--luxury-gold))]/30">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-[hsl(var(--pure-white))] font-farsi" dir="rtl">
                در ارتباط باشید
              </h3>
              <p className="text-[hsl(var(--luxury-silver))] mb-4 md:mb-6 max-w-2xl mx-auto font-farsi text-sm md:text-base" dir="rtl">
                اطلاعیه‌های مهم، کارگاه‌ها و رویدادهای جامعه را از دست ندهید. 
                عضو خبرنامه ما شوید تا اعلانات مستقیماً به ایمیل شما ارسال شود.
              </p>
              <Button 
                size="lg" 
                className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-gold-dark))] text-[hsl(var(--pure-black))] font-farsi font-semibold"
                dir="rtl"
              >
                عضویت در خبرنامه
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}