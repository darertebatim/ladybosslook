import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Calendar, Download } from "lucide-react";
import { generateGoogleCalendarUrl, downloadICSFile, webinarEvent } from "@/utils/calendar";
const ThankOne = () => {
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com/CRH4Ke6wZlN1KC0tYwFcfk?mode=ems_copy_t');
  const [videoLink, setVideoLink] = useState('https://www.youtube.com/embed/ct9plBl6B0c');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <>
      <SEOHead title="Thank You - Payment Successful" description="Registration successful! Welcome to قدرت دوزبانه online class." />
      
      {/* Success Banner */}
      <div className="bg-secondary text-luxury-black py-3 md:py-4 text-center px-4">
        <p className="font-bold text-base md:text-lg lg:text-xl font-farsi">🎉 پرداخت موفق - خوش آمدید!</p>
        <p className="font-bold text-base md:text-lg lg:text-xl font-persian">ثبت نام شما در کلاس قدرت دوزبانه تکمیل شد</p>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-luxury relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-accent opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-3 md:py-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-4 md:mb-12">
            <h1 className="md:text-7xl lg:text-8xl font-display font-bold text-secondary mb-4 md:mb-6 font-farsi leading-tight text-3xl">این ویدیو را ببینید


تا ۱۰۰٪ آماده کلاس شوید</h1>
            <p className="text-lg md:text-xl text-luxury-white mb-6 md:mb-8 font-farsi px-2 font-bold">
              همین الان ویدیوی پایین را ببینید تا آماده کلاس قدرت دوزبانه شوید!
            </p>
          </div>

          {/* Video Section */}
          <div className="max-w-4xl mx-auto mb-4 md:mb-12">
            <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl md:rounded-2xl p-4 md:p-8">
              <div className="aspect-video bg-luxury-charcoal rounded-lg md:rounded-xl mb-2 md:mb-4 flex items-center justify-center">
                {videoLink ? <iframe src={videoLink} className="w-full h-full rounded-lg md:rounded-xl" allowFullScreen title="آمادگی کلاس" /> : <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <span className="text-2xl md:text-3xl">▶️</span>
                    </div>
                    <p className="text-luxury-white font-farsi text-sm md:text-base">ویدیو آمادگی کلاس</p>
                    <p className="text-luxury-silver/80 text-xs md:text-sm font-farsi mt-1 md:mt-2">برای صدا کلیک کنید</p>
                  </div>}
              </div>
              
              {/* Welcome Message */}
              <div className="text-center mb-3">
                <div className="bg-gradient-to-r from-green-400/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-2 md:p-3">
                  <p className="text-lg md:text-xl font-bold text-green-400 font-farsi">
                    💎 شما جزء ۱۰۰ نفر اول هستید - تبریک! 💎
                  </p>
                </div>
              </div>
              
              {/* Arrow Down */}
              <div className="text-center py-2">
                <div className="text-4xl animate-pulse">👇</div>
              </div>
              
              {/* WhatsApp Button */}
              <div className="text-center">
                <Button onClick={() => whatsappLink && window.open(whatsappLink, '_blank')} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-sm md:text-lg px-4 md:px-8 py-4 md:py-5 h-auto rounded-lg md:rounded-xl shadow-lg transition-all duration-300 font-farsi mb-3 md:mb-4 whitespace-normal leading-tight" disabled={!whatsappLink}>
                   <span className="font-persian">🚀 به گروه واتساپ کلاس بپیوندید</span>
                </Button>
                <p className="text-luxury-silver/80 text-xs md:text-sm font-persian px-2">
                  برای دریافت اطلاعات کلاس و ارتباط با سایر شرکت‌کنندگان
                </p>
                
                {/* Arrow Up */}
                <div className="text-center pt-4">
                  <div className="text-4xl animate-pulse">☝️</div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-display font-bold text-secondary text-center mb-6 md:mb-12 font-farsi">
              مراحل بعدی
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {/* Step 1 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-4 md:p-8 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                    <span className="text-lg md:text-2xl">📧</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-secondary mb-2 md:mb-4 font-farsi">
                    ایمیل خود را چک کنید
                  </h3>
                  <p className="text-sm md:text-base text-luxury-silver/90 font-farsi">
                    به دنبال ایمیل تأیید با جزئیات کامل کلاس باشید
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-4 md:p-8 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                    <span className="text-lg md:text-2xl">👥</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-secondary mb-2 md:mb-4 font-farsi">
                    به گروه واتساپ بپیوندید
                  </h3>
                  <p className="text-sm md:text-base text-luxury-silver/90 font-farsi">
                    روی دکمه بالا کلیک کنید تا بپیوندید
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-4 md:p-8 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                    <span className="text-lg md:text-2xl">📚</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-secondary mb-2 md:mb-4 font-farsi">
                    آماده کلاس شوید
                  </h3>
                  <p className="text-sm md:text-base text-luxury-silver/90 font-farsi">
                    جزئیات شروع کلاس از طریق ایمیل و واتساپ ارسال می‌شود
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Support Section */}
          <div className="max-w-2xl mx-auto mt-8 md:mt-16 text-center">
            <div className="bg-luxury-white/5 backdrop-blur-sm border border-secondary/20 rounded-xl p-4 md:p-8">
              <h3 className="text-lg md:text-2xl font-bold text-secondary mb-2 md:mb-4">Support:</h3>
              <p className="text-luxury-white text-base md:text-lg">
                📱 WhatsApp: +1 (626) 502‑8589
              </p>
              <p className="text-luxury-white text-base md:text-lg mt-2">
                📧 Email: support@ladybosslook.com
              </p>
              <p className="text-luxury-silver/80 text-xs md:text-sm mt-1 md:mt-2">
                Contact us for any questions or issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </>;
};
export default ThankOne;
