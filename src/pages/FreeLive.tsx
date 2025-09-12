import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/CountdownTimer";

const FreeLive = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
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

      // Reset form and close modal
      setEmail('');
      setName('');
      setShowModal(false);
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
      
      {/* Event Banner */}
      <div className="bg-secondary text-luxury-black py-4 text-center">
        <p className="font-bold text-lg md:text-xl">
          🎯 وبینار رایگان | ۲۱ سپتامبر
        </p>
      </div>

      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-luxury relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-accent opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Logo Area */}
          <div className="text-center mb-8">
            <div className="text-lg md:text-xl text-luxury-silver/90 font-farsi">
              مخصوص خانم‌های مهاجرت کرده به خارج
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Hero Text */}
              <div className="text-center lg:text-right space-y-8">
                <div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-luxury-white leading-tight mb-6">
                    <span className="text-secondary block text-5xl md:text-7xl lg:text-8xl">نقشه راه جرات</span>
                    <span className="text-luxury-white block text-3xl md:text-5xl lg:text-6xl">برای زنان مهاجر</span>
                  </h1>
                  
                  {/* Location Restriction */}
                  <div className="text-center mb-4">
                    <p className="text-luxury-silver/90 font-medium text-lg md:text-xl font-farsi">
                      فقط ساکن امریکا | کانادا | اروپا | استرالیا | دبی
                    </p>
                  </div>
                  
                  {/* Signup Button - Mobile centered, Desktop right-aligned */}
                  <div className="flex justify-center lg:justify-end mb-8">
                    <Button
                      onClick={() => setShowModal(true)}
                      className="w-full max-w-sm h-16 text-lg md:text-xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black font-farsi transition-all duration-300 transform hover:scale-105 shadow-glow pulse-glow rounded-2xl"
                    >
                      🚀 کلیک کنید و جای خود را رزرو کنید
                    </Button>
                  </div>
                </div>

                <div className="bg-luxury-white/5 backdrop-blur-sm border border-secondary/20 rounded-xl p-6 mb-8">
                  <p className="text-luxury-white font-bold text-lg mb-2 font-farsi">
                    🎁 هدیه ویژه شرکت‌کنندگان
                  </p>
                  <p className="text-secondary font-medium font-farsi">
                    کتاب الکترونیکی "راهنمای عملی جرات برای زنان مهاجر"
                  </p>
                  <p className="text-luxury-silver/80 text-sm mt-2 font-farsi">
                    (ارزش ۹۷ دلار - رایگان!)
                  </p>
                </div>
              </div>

              {/* Right Side - Additional Info */}
              <div className="lg:sticky lg:top-8 text-center space-y-6">
                <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl p-6">
                  <p className="text-secondary font-bold text-xl mb-2 font-farsi">
                    ⚡ تنها ۱۰۰۰ نفر ظرفیت داریم!
                  </p>
                  <p className="text-luxury-silver/90 font-farsi">برای کیفیت بالا، تعداد شرکت‌کنندگان محدود است</p>
                </div>

                <div className="text-center text-sm text-luxury-silver/80 font-farsi">
                  <p>🔒 اطلاعات شما کاملاً محفوظ است</p>
                  <p className="mt-1">💌 فقط محتوای ارزشمند دریافت خواهید کرد</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-luxury-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-luxury-black mb-12 font-farsi">
              در این وبینار یاد می‌گیرید:
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-secondary/10 to-primary/10 p-8 rounded-2xl border border-secondary/20">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">💪</span>
                </div>
                <h4 className="text-xl font-bold text-luxury-black mb-4 font-farsi">
                  اعتماد به نفس قدرتمند
                </h4>
                <p className="text-luxury-accent font-farsi">
                  چگونه اعتماد به نفس خود را در محیط جدید بازیابید و قدرتمند شوید
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-2xl border border-primary/20">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h4 className="text-xl font-bold text-luxury-black mb-4 font-farsi">
                  غلبه بر ترس و نگرانی
                </h4>
                <p className="text-luxury-accent font-farsi">
                  راهکارهای عملی و مؤثر برای مدیریت ترس‌ها و نگرانی‌های شما
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-secondary/10 to-primary/10 p-8 rounded-2xl border border-secondary/20">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🚀</span>
                </div>
                <h4 className="text-xl font-bold text-luxury-black mb-4 font-farsi">
                  تبدیل چالش به فرصت
                </h4>
                <p className="text-luxury-accent font-farsi">
                  چگونه از چالش‌های مهاجرت به فرصت‌های طلایی تبدیل کنید
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-2xl border border-primary/20">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">⭐</span>
                </div>
                <h4 className="text-xl font-bold text-luxury-black mb-4 font-farsi">
                  استراتژی زندگی قدرتمند
                </h4>
                <p className="text-luxury-accent font-farsi">
                  نقشه راه عملی برای شروع زندگی جدید با اعتماد و قدرت
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-gradient-luxury py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-luxury-white mb-12 font-farsi">
              چرا این وبینار را از دست ندهید؟
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h4 className="text-xl font-bold text-secondary mb-4 font-farsi">تخصصی و هدفمند</h4>
                <p className="text-luxury-silver/90 font-farsi">
                  مخصوص چالش‌های واقعی زنان مهاجر طراحی شده
                </p>
              </div>
              
              <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💡</span>
                </div>
                <h4 className="text-xl font-bold text-secondary mb-4 font-farsi">راهکارهای عملی</h4>
                <p className="text-luxury-silver/90 font-farsi">
                  استراتژی‌هایی که می‌توانید همین امروز شروع کنید
                </p>
              </div>
              
              <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🚀</span>
                </div>
                <h4 className="text-xl font-bold text-secondary mb-4 font-farsi">تحول سریع</h4>
                <p className="text-luxury-silver/90 font-farsi">
                  نتایج قابل مشاهده در کمترین زمان ممکن
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-luxury-black mb-8 font-farsi">
              آماده برای تحول زندگی‌تان هستید؟
            </h3>
            <p className="text-xl text-luxury-black/80 mb-8 font-farsi">
              فقط چند کلیک تا دسترسی به وبینار رایگان که زندگی شما را تغییر خواهد داد
            </p>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-luxury-black hover:bg-luxury-charcoal text-secondary font-bold text-xl px-12 py-4 h-auto rounded-2xl shadow-luxury transition-all duration-300 transform hover:scale-105 font-farsi"
            >
              ⬆️ همین الان ثبت نام کنید
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-luxury-white border-2 border-secondary/20 shadow-luxury">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-luxury-black mb-2 font-farsi">
              🎉 رزرو جای شما در وبینار رایگان
            </DialogTitle>
            <p className="text-luxury-accent font-farsi mb-2">
              مخصوص ایرانیان مهاجر به خارج
            </p>
            <p className="text-luxury-accent font-farsi">
              فقط ایمیل و نام خود را وارد کنید
            </p>
            <p className="text-red-600 font-farsi text-sm font-medium">
              لطفا از داخل ایران ثبت نام نکنید
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-right block text-luxury-black font-farsi font-medium">
                نام شما
              </Label>
              <Input
                id="modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                required
                className="text-right h-12 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white font-farsi"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-right block text-luxury-black font-farsi font-medium">
                ایمیل شما
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل خود را وارد کنید"
                required
                className="text-left h-12 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary-dark text-luxury-black font-farsi transition-all duration-300 transform hover:scale-105 shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'در حال ارسال...' : '✅ کامل! لینک وبینار را ارسال کن'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-luxury-accent font-farsi">
            <p>🔒 اطلاعات شما کاملاً محفوظ است</p>
            <p className="mt-1">💌 فقط محتوای ارزشمند دریافت خواهید کرد</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FreeLive;