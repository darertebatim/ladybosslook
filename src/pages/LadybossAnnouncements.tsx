import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const announcements = [
  {
    id: 1,
    title: "New Workshop: Advanced Business Strategies",
    titleFarsi: "کارگاه جدید: استراتژی‌های تجاری پیشرفته",
    date: "2024-01-15",
    category: "Workshop",
    categoryFarsi: "کارگاه",
    content: "Join us for an intensive workshop on advanced business strategies that will transform your entrepreneurial journey.",
    contentFarsi: "به ما در کارگاه فشرده استراتژی‌های تجاری پیشرفته بپیوندید که سفر کارآفرینی شما را متحول خواهد کرد.",
    isNew: true
  },
  {
    id: 2,
    title: "Monthly Success Stories",
    titleFarsi: "داستان‌های موفقیت ماهانه",
    date: "2024-01-10",
    category: "Success Stories",
    categoryFarsi: "داستان‌های موفقیت",
    content: "Read inspiring stories from our community members who achieved their business goals this month.",
    contentFarsi: "داستان‌های الهام‌بخش اعضای جامعه ما را بخوانید که این ماه به اهداف تجاری خود رسیدند.",
    isNew: false
  },
  {
    id: 3,
    title: "Networking Event - January 2024",
    titleFarsi: "رویداد شبکه‌سازی - ژانویه ۲۰۲۴",
    date: "2024-01-05",
    category: "Event",
    categoryFarsi: "رویداد",
    content: "Connect with fellow entrepreneurs at our monthly networking event. Build meaningful relationships and grow your business.",
    contentFarsi: "با کارآفرینان همکار در رویداد ماهانه شبکه‌سازی ما ارتباط برقرار کنید. روابط معنادار بسازید و کسب‌وکارتان را توسعه دهید.",
    isNew: false
  }
];

export default function LadybossAnnouncements() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEOHead 
        title="LadyBoss Coaching News & Announcements | تابلوی اعلانات کوچینگ لیدی باس"
        description="Stay updated with the latest news, announcements, and success stories from LadyBoss Coaching community. Visit weekly for new updates."
      />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Bell className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text">
              News & Announcements
            </h1>
          </div>
          <div className="mb-6" dir="rtl">
            <h2 className="text-3xl md:text-4xl font-bold text-primary font-farsi">
              تابلوی اعلانات کوچینگ لیدی باس
            </h2>
            <p className="text-xl text-muted-foreground mt-2 font-farsi">
              هر هفته به این صفحه سر بزنید
            </p>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay connected with the latest updates, workshops, and success stories from our thriving community.
          </p>
        </div>

        {/* Weekly Visit Reminder */}
        <div className="mb-8">
          <Card className="gradient-card border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">Weekly Updates</span>
              </div>
              <p className="text-muted-foreground" dir="rtl">
                <span className="font-farsi">هر هفته به این صفحه سر بزنید تا از آخرین اخبار و اعلانات باخبر شوید</span>
              </p>
              <p className="text-muted-foreground mt-2">
                Check back weekly for the latest announcements and community updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Announcements Grid */}
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="gradient-card hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={announcement.isNew ? "default" : "secondary"}>
                        {announcement.isNew ? "New" : announcement.category}
                      </Badge>
                      <Badge variant="outline" className="font-farsi" dir="rtl">
                        {announcement.categoryFarsi}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl md:text-2xl mb-2">
                      {announcement.title}
                    </CardTitle>
                    <CardTitle className="text-lg md:text-xl text-primary font-farsi" dir="rtl">
                      {announcement.titleFarsi}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{new Date(announcement.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 leading-relaxed">
                  {announcement.content}
                </p>
                <p className="text-muted-foreground font-farsi leading-relaxed" dir="rtl">
                  {announcement.contentFarsi}
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button variant="ghost" className="group">
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="gradient-accent">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Stay Connected</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Don't miss out on important updates, workshops, and community events. 
                Join our newsletter to get announcements delivered directly to your inbox.
              </p>
              <div className="mb-4" dir="rtl">
                <p className="font-farsi text-muted-foreground">
                  برای دریافت اطلاعیه‌ها در ایمیل خود، عضو خبرنامه ما شوید
                </p>
              </div>
              <Button size="lg" className="gradient-primary">
                Join Newsletter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}