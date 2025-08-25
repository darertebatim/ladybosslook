import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, DollarSign, Users, TrendingUp, Briefcase, PiggyBank } from "lucide-react";

const EventIrvine = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handlePurchase = () => {
    // Handle ticket purchase logic here
    console.log("Purchase ticket:", { email, phone });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 font-persian">
      {/* Header */}
      <div className="container mx-auto px-2 py-2 md:px-4 md:py-4">
        <div className="text-center mb-4 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-6">
            🎉 رویداد ویژه
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-foreground mb-2 md:mb-4 leading-tight">
            بیزنس کلاب لیدی‌باس
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-2">
            در ارواین
          </p>
          <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
        </div>

        {/* Event Details Card */}
        <Card className="max-w-4xl mx-auto mb-4 md:mb-8 shadow-xl border-0 bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 md:pb-6 pt-4 md:pt-6">
            <CardTitle className="text-lg md:text-2xl lg:text-3xl font-bold text-primary mb-2 md:mb-4">
              موضوع این جلسه: سواد پولی در آمریکا
            </CardTitle>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-sm md:text-lg">سه‌شنبه ۲ سپتامبر</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-sm md:text-lg">۷:۰۰ عصر</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
            {/* Learning Topics */}
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4 text-center">
                💼 در این جلسه یاد می‌گیری:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="flex flex-col items-center text-center p-3 md:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-primary mb-2" />
                  <h4 className="font-semibold text-foreground mb-1 text-sm md:text-base">افزایش درآمد</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">چطور درآمدتو افزایش بدی</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 md:p-4 rounded-lg bg-secondary/5 border border-secondary/10">
                  <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-secondary mb-2" />
                  <h4 className="font-semibold text-foreground mb-1 text-sm md:text-base">ارتقای شغلی</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">چطور در شغلت ارتقا بگیری</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 md:p-4 rounded-lg bg-accent/5 border border-accent/10">
                  <PiggyBank className="w-8 h-8 md:w-10 md:h-10 text-accent mb-2" />
                  <h4 className="font-semibold text-foreground mb-1 text-sm md:text-base">شرایط مالی</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">چطور شرایط مالی خودت رو بسازی</p>
                </div>
              </div>
            </div>

            {/* Networking & Pricing Combined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <Users className="w-8 h-8 md:w-12 md:h-12 text-primary mx-auto mb-2" />
                <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1">
                  ✨ نتورکینگ ویژه
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  با خانم‌رئیس‌های موفق
                </p>
              </div>
              
              <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-primary mx-auto mb-2" />
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl md:text-3xl font-bold text-primary">$29</span>
                  <div className="text-muted-foreground text-xs">
                    <span className="line-through">$70</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  🎟️ بلیط زودهنگام
                </p>
              </div>
            </div>

            {/* Registration Form */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-center text-foreground font-semibold text-base md:text-lg mb-3">
                  همین الان بلیطت رو رزرو کن!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    type="email"
                    placeholder="ایمیل شما"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-right text-sm"
                    dir="rtl"
                  />
                  <Input
                    type="tel"
                    placeholder="شماره تلفن"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-right text-sm"
                    dir="rtl"
                  />
                </div>
                <Button 
                  onClick={handlePurchase}
                  className="w-full text-base md:text-lg py-4 md:py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  size="lg"
                >
                  خرید بلیط - $29 💳
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  پرداخت امن و محافظت شده
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-muted-foreground mt-4">
          <p className="text-xs md:text-sm">
            برای اطلاعات بیشتر با ما تماس بگیرید
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventIrvine;