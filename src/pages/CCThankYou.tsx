import { Button } from '@/components/ui/button';
import { CheckCircle, Home, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';

const CCThankYou = () => {
  return (
    <>
      <SEOHead 
        title="تشکر از ثبت‌نام - ورکشاپ کاراکتر پرجرات"
        description="با تشکر از ثبت‌نام در ورکشاپ کاراکتر پرجرات. اطلاعات کامل به ایمیل شما ارسال شده است."
      />
      <div className="min-h-screen bg-luxury-black font-farsi rtl">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-16 h-16 text-success" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                پرداخت شما با موفقیت انجام شد! 🎉
              </h1>
              <p className="text-xl text-luxury-silver mb-8">
                از ثبت‌نام شما در ورکشاپ کاراکتر پرجرات متشکریم
              </p>
            </div>

            <div className="bg-luxury-charcoal/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-luxury-accent/20">
              <h2 className="text-2xl font-bold text-white mb-6">مراحل بعدی</h2>
              <div className="space-y-4 text-right">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-luxury-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-luxury-accent font-bold">۱</span>
                  </div>
                  <p className="text-luxury-silver">
                    ایمیل تایید پرداخت به ایمیل شما ارسال شده است
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-luxury-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-luxury-accent font-bold">۲</span>
                  </div>
                  <p className="text-luxury-silver">
                    جزئیات ورکشاپ و لینک دسترسی حداکثر ۲۴ ساعت قبل از شروع ارسال خواهد شد
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-luxury-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-luxury-accent font-bold">۳</span>
                  </div>
                  <p className="text-luxury-silver">
                    در صورت داشتن سوال، با ما در تماس باشید
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-luxury-accent hover:bg-luxury-accent/90 text-white"
              >
                <Link to="/" className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  بازگشت به صفحه اصلی
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="border-luxury-white/60 bg-luxury-black/60 text-luxury-white hover:bg-luxury-white hover:text-luxury-black"
                onClick={() => {
                  const message = encodeURIComponent('سلام! من در ورکشاپ کاراکتر پرجرات ثبت‌نام کردم.');
                  window.open(`https://wa.me/16265028589?text=${message}`, '_blank');
                }}
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                تماس با پشتیبانی
              </Button>
            </div>

            <div className="mt-12 p-6 bg-warning/10 rounded-xl border border-warning/30">
              <p className="text-white font-bold mb-2">⚠️ نکته مهم</p>
              <p className="text-luxury-silver text-sm">
                لطفاً ایمیل خود را چک کنید (همچنین پوشه Spam را بررسی کنید). در صورت دریافت نکردن ایمیل ظرف ۲۴ ساعت، با ما تماس بگیرید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CCThankYou;
