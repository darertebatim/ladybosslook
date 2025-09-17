import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Calendar, Download } from "lucide-react";
import { generateGoogleCalendarUrl, downloadICSFile, webinarEvent } from "@/utils/calendar";
const ThankFreeLive = () => {
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com/CRH4Ke6wZlN1KC0tYwFcfk?mode=ems_copy_t');
  const [videoLink, setVideoLink] = useState('https://www.youtube.com/embed/ct9plBl6B0c');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <>
      <SEOHead title="Thank You - Registration Complete" description="Registration successful! Follow next steps to prepare for webinar." />
      
      {/* Success Banner */}
      <div className="bg-secondary text-luxury-black py-3 md:py-4 text-center px-4">
        <p className="font-bold text-base md:text-lg lg:text-xl font-farsi">🎉 ثبت نام ۸۰٪ تکمیل شد</p>
        <p className="font-bold text-base md:text-lg lg:text-xl font-farsi">فقط یک قدم تا دریافت هدیه!</p>
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


تا ۱۰۰٪ آماده وبینار شوید</h1>
            <p className="text-lg md:text-xl text-luxury-white mb-6 md:mb-8 font-farsi px-2 font-bold">
              همین الان ویدیوی پایین را ببینید تا لایو را از دست ندهید !
            </p>
          </div>

          {/* Video Section */}
          <div className="max-w-4xl mx-auto mb-4 md:mb-12">
            <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-xl md:rounded-2xl p-4 md:p-8">
              <div className="aspect-video bg-luxury-charcoal rounded-lg md:rounded-xl mb-4 md:mb-6 flex items-center justify-center">
                {videoLink ? <iframe src={videoLink} className="w-full h-full rounded-lg md:rounded-xl" allowFullScreen title="وبینار آمادگی" /> : <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <span className="text-2xl md:text-3xl">▶️</span>
                    </div>
                    <p className="text-luxury-white font-farsi text-sm md:text-base">ویدیو آمادگی وبینار</p>
                    <p className="text-luxury-silver/80 text-xs md:text-sm font-farsi mt-1 md:mt-2">برای صدا کلیک کنید</p>
                  </div>}
              </div>
              
              {/* Prize Announcement */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4">
                  <p className="text-lg md:text-xl font-bold text-yellow-400 font-farsi">
                    🎁جایزه ۶۰۰ دلاری برای ۳ نفر از بین شرکت‌کنندان لایو قرعه کشی می‌شود🎁
                  </p>
                </div>
              </div>
              
              {/* Arrow Down */}
              <div className="text-center py-4">
                <div className="text-4xl animate-pulse">👇</div>
              </div>
              
              {/* WhatsApp Button */}
              <div className="text-center">
                <Button onClick={() => whatsappLink && window.open(whatsappLink, '_blank')} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-sm md:text-lg px-4 md:px-8 py-4 md:py-5 h-auto rounded-lg md:rounded-xl shadow-lg transition-all duration-300 font-farsi mb-3 md:mb-4 whitespace-normal leading-tight" disabled={!whatsappLink}>
                  <span className="text-center text-xl">🚀 به گروه واتساپ بپیوندید و
هدیه رایگان را دریافت کنید</span>
                </Button>
                <p className="text-luxury-silver/80 text-xs md:text-sm font-farsi px-2">
                  ظرفیت محدود - همین الان بپیوندید تا کتاب راهنمای عملی را رایگان دریافت کنید (ارزش ۹۷ دلار)
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
              سه مرحله گرفتن هدیه
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
                    به دنبال ایمیل تأیید با جزئیات کامل وبینار باشید
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
                    روی دکمه بالا کلیک کنید تا بپیوندید و هدیه رایگان را دریافت کنید
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-4 md:p-8 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                    <span className="text-lg md:text-2xl">📅</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-secondary mb-2 md:mb-4 font-farsi">
                    تاریخ را علامت‌گذاری کنید
                  </h3>
                  <p className="text-sm md:text-base text-luxury-silver/90 font-farsi mb-2">
                    یکشنبه ۲۸ سپتامبر ساعت ۹:۳۰ بوقت کالیفرنیا
                  </p>
                  <p className="text-xs md:text-sm text-secondary font-medium mb-3">
                    Sunday, September 28th at 9:30 AM
                  </p>
                  
                  {/* Time Zones */}
                  <div className="text-xs text-luxury-silver/80 mb-4 space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <p>Los Angeles: 9:30 AM</p>
                      <p>Toronto: 12:30 PM</p>
                      <p>New York: 12:30 PM</p>
                      <p>Miami: 12:30 PM</p>
                      <p>Chicago: 11:30 AM</p>
                      <p>Texas: 11:30 AM</p>
                      <p>London: 5:30 PM</p>
                      <p>France: 6:30 PM</p>
                      <p>Germany: 6:30 PM</p>
                      <p>Istanbul: 7:30 PM</p>
                      <p>Dubai: 8:30 PM</p>
                      <p>Sydney: 2:30 AM+1</p>
                    </div>
                  </div>
                  
                  {/* Calendar Buttons */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => window.open(generateGoogleCalendarUrl(webinarEvent), '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm py-2 px-3 h-auto font-farsi"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      افزودن به Google Calendar
                    </Button>
                    <Button 
                      onClick={() => downloadICSFile(webinarEvent, 'webinar-event.ics')}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs md:text-sm py-2 px-3 h-auto font-farsi"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      دانلود برای Apple Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Support Section */}
          <div className="max-w-2xl mx-auto mt-8 md:mt-16 text-center">
            <div className="bg-luxury-white/5 backdrop-blur-sm border border-secondary/20 rounded-xl p-4 md:p-8">
              <h3 className="text-lg md:text-2xl font-bold text-secondary mb-2 md:mb-4">Support:</h3>
              <p className="text-luxury-white text-base md:text-lg">
                📱 WhatsApp: +1 (626) 502‑8538
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
export default ThankFreeLive;