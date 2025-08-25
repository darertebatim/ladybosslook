import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, MapPin, Users, TrendingUp, Briefcase, PiggyBank, DollarSign } from "lucide-react";

const EventIrvine = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handlePurchase = () => {
    // Handle ticket purchase logic here
    console.log("Purchase ticket:", { email, phone });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 font-persian">
      <div className="container mx-auto px-3 py-3 md:px-4 md:py-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-3">
            🎉 رویداد ویژه
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
            بیزنس کلاب لیدی‌باس – ارواین
          </h1>
          <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
        </div>

        {/* Main Event Card */}
        <Card className="shadow-xl border-0 bg-card/90 backdrop-blur-sm mb-4">
          <CardContent className="p-4 md:p-6 space-y-4">
            
            {/* Date & Time */}
            <div className="text-center p-3 md:p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base font-medium">سه‌شنبه ۲ سپتامبر</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base font-medium">ساعت ۶ غروب</span>
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 text-center">
                💼 مناسب برای:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <div className="flex items-center justify-center p-2 md:p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-xs md:text-sm text-foreground">👩‍💼 خانم‌های کارمند</span>
                </div>
                <div className="flex items-center justify-center p-2 md:p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                  <span className="text-xs md:text-sm text-foreground">👩‍💻 خانم‌های صاحب بیزینس</span>
                </div>
                <div className="flex items-center justify-center p-2 md:p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <span className="text-xs md:text-sm text-foreground">👩‍🎓 دانشجویان</span>
                </div>
              </div>
            </div>

            {/* Special Event Notice */}
            <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20">
              <MapPin className="w-6 h-6 md:w-8 md:h-8 text-secondary mx-auto mb-2" />
              <p className="text-sm md:text-base text-foreground font-medium">
                ✨ یک رویداد حضوری ویژه برای ساکنین اورنج کانتی
              </p>
            </div>

            {/* Learning Topics */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 text-center">
                در این جلسه یاد می‌گیری:
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">چطور درآمدت رو افزایش بدی</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-secondary flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">چطور در شغلت ارتقا بگیری</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <PiggyBank className="w-5 h-5 md:w-6 md:h-6 text-accent flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">چطور شرایط مالی خودت رو بسازی</span>
                </div>
              </div>
            </div>

            {/* Networking */}
            <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2" />
              <p className="text-sm md:text-base text-foreground">
                به همراه فرصت ویژه برای نتورکینگ با خانم‌رئیس‌های هدفمند و پرتلاش
              </p>
            </div>

            {/* Pricing */}
            <div className="text-center p-4 md:p-6 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/15 border-2 border-primary/30">
              <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto mb-3" />
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                🎟️ بلیط زودهنگام
              </h3>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-3xl md:text-4xl font-bold text-primary">$29</span>
                <div className="text-muted-foreground">
                  <span className="line-through text-lg md:text-xl">$70</span>
                  <span className="block text-xs md:text-sm">قیمت عادی</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-center text-foreground font-semibold text-base md:text-lg">
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
        <div className="text-center text-muted-foreground">
          <p className="text-xs md:text-sm">
            برای اطلاعات بیشتر با ما تماس بگیرید
          </p>
        </div>

      </div>
    </div>
  );
};

export default EventIrvine;