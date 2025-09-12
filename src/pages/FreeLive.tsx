import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const FreeLive = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "خطا",
        description: "لطفا ایمیل و نام خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email,
          name,
          city: 'Online',
          phone: '',
          source: 'freelive',
          tags: ['ccwlive']
        }
      });

      if (error) throw error;

      toast({
        title: "موفقیت!",
        description: "لینک وبینار به ایمیل شما ارسال شد",
      });

      // Reset form
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد، لطفا دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="وبینار رایگان نقشه راه جرات - LadyBoss Academy"
        description="وبینار رایگان نقشه راه جرات مخصوص خانم‌های مهاجرت کرده به خارج. ایمیل و نام خود را وارد کنید تا لینک وبینار را دریافت کنید."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              وبینار رایگان
            </h1>
            <h2 className="text-2xl lg:text-4xl font-semibold text-primary mb-6">
              نقشه راه جرات
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              مخصوص خانم‌های مهاجرت کرده به خارج
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Benefits */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  در این وبینار یاد می‌گیرید:
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground text-sm">✓</span>
                    </div>
                    <p className="text-foreground">چگونه اعتماد به نفس خود را در محیط جدید بازیابید</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground text-sm">✓</span>
                    </div>
                    <p className="text-foreground">راهکارهای عملی برای غلبه بر ترس و نگرانی</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground text-sm">✓</span>
                    </div>
                    <p className="text-foreground">چگونه از چالش‌های مهاجرت به فرصت تبدیل کنید</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground text-sm">✓</span>
                    </div>
                    <p className="text-foreground">استراتژی‌های موثر برای شروع زندگی جدید با قدرت</p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border">
                  <p className="text-lg font-semibold text-foreground mb-2">
                    🎁 هدیه ویژه شرکت‌کنندگان
                  </p>
                  <p className="text-muted-foreground">
                    کتاب الکترونیکی "راهنمای عملی جرات برای زنان مهاجر"
                  </p>
                </div>
              </div>

              {/* Right Side - Registration Form */}
              <div className="lg:sticky lg:top-8">
                <Card className="shadow-2xl border-2 border-primary/20">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        همین الان ثبت نام کنید
                      </h3>
                      <p className="text-muted-foreground">
                        ایمیل و نام خود را وارد کنید تا لینک وبینار را دریافت کنید
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-right block">
                          نام شما
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="نام خود را وارد کنید"
                          required
                          className="text-right"
                          dir="rtl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-right block">
                          ایمیل شما
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ایمیل خود را وارد کنید"
                          required
                          className="text-left"
                          dir="ltr"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 text-lg font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'در حال ارسال...' : 'دریافت لینک وبینار رایگان'}
                      </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      <p>🔒 اطلاعات شما کاملاً محفوظ است</p>
                      <p className="mt-1">💌 فقط محتوای ارزشمند دریافت خواهید کرد</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-16 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                چرا این وبینار را از دست ندهید؟
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">تخصصی و هدفمند</h4>
                  <p className="text-muted-foreground text-sm">
                    مخصوص چالش‌های واقعی زنان مهاجر طراحی شده
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💡</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">راهکارهای عملی</h4>
                  <p className="text-muted-foreground text-sm">
                    استراتژی‌هایی که می‌توانید همین امروز شروع کنید
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">تحول سریع</h4>
                  <p className="text-muted-foreground text-sm">
                    نتایج قابل مشاهده در کمترین زمان ممکن
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FreeLive;