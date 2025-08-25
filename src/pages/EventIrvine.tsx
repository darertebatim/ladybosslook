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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            🎉 رویداد ویژه
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            بیزنس کلاب لیدی‌باس
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            در ارواین
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
        </div>

        {/* Event Details Card */}
        <Card className="max-w-4xl mx-auto mb-12 shadow-xl border-0 bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary mb-4">
              موضوع این جلسه: سواد پولی در آمریکا
            </CardTitle>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-lg">سه‌شنبه ۲ سپتامبر</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-lg">۷:۰۰ عصر</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Learning Topics */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
                💼 در این جلسه یاد می‌گیری:
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-6 rounded-lg bg-primary/5 border border-primary/10">
                  <TrendingUp className="w-12 h-12 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">افزایش درآمد</h4>
                  <p className="text-sm text-muted-foreground">چطور درآمدتو افزایش بدی</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 rounded-lg bg-secondary/5 border border-secondary/10">
                  <Briefcase className="w-12 h-12 text-secondary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">ارتقای شغلی</h4>
                  <p className="text-sm text-muted-foreground">چطور در شغلت ارتقا بگیری</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 rounded-lg bg-accent/5 border border-accent/10">
                  <PiggyBank className="w-12 h-12 text-accent mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">شرایط مالی</h4>
                  <p className="text-sm text-muted-foreground">چطور شرایط مالی خودت رو بسازی</p>
                </div>
              </div>
            </div>

            {/* Networking Section */}
            <div className="text-center p-6 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <Users className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ✨ فرصت ویژه نتورکینگ
              </h3>
              <p className="text-muted-foreground">
                با خانم‌رئیس‌های هدفمند و پرتلاش
              </p>
            </div>

            {/* Pricing */}
            <div className="text-center p-8 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <DollarSign className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">
                🎟️ بلیط زودهنگام
              </h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-4xl font-bold text-primary">$29</span>
                <div className="text-muted-foreground">
                  <span className="line-through text-lg">$70</span>
                  <span className="block text-sm">قیمت عادی</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                تخفیف ویژه برای خریداران زودهنگام
              </p>
            </div>

            {/* Registration Form */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-center text-foreground">
                  همین الان بلیطت رو رزرو کن!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="ایمیل شما"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="شماره تلفن"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <Button 
                  onClick={handlePurchase}
                  className="w-full text-lg py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
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
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            برای اطلاعات بیشتر با ما تماس بگیرید
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventIrvine;