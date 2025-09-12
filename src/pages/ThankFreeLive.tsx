import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

const ThankFreeLive = () => {
  const [whatsappLink, setWhatsappLink] = useState('');
  const [videoLink, setVideoLink] = useState('');

  return (
    <>
      <SEOHead
        title="تشکر از ثبت نام - وبینار رایگان نقشه راه جرات"
        description="ثبت نام شما با موفقیت انجام شد. مراحل بعدی را دنبال کنید تا آماده وبینار شوید."
      />
      
      {/* Success Banner */}
      <div className="bg-secondary text-luxury-black py-4 text-center">
        <p className="font-bold text-lg md:text-xl font-farsi">
          🎉 ثبت نام ۸۰٪ تکمیل شد - فقط یک قدم تا دریافت هدیه!
        </p>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-luxury relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-accent opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-secondary mb-6 font-farsi">
              این ویدیو را ببینید تا ۱۰۰٪ آماده وبینار شوید
            </h1>
            <p className="text-xl text-luxury-white mb-8 font-farsi">
              تقریباً رسیدید! مراحل زیر را دنبال کنید تا ثبت نام خود را کامل کنید و هدیه رایگان را دریافت کنید!
            </p>
          </div>

          {/* Video Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
              <div className="aspect-video bg-luxury-charcoal rounded-xl mb-6 flex items-center justify-center">
                {videoLink ? (
                  <iframe
                    src={videoLink}
                    className="w-full h-full rounded-xl"
                    allowFullScreen
                    title="وبینار آمادگی"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">▶️</span>
                    </div>
                    <p className="text-luxury-white font-farsi">ویدیو آمادگی وبینار</p>
                    <p className="text-luxury-silver/80 text-sm font-farsi mt-2">برای صدا کلیک کنید</p>
                  </div>
                )}
              </div>
              
              {/* WhatsApp Button */}
              <div className="text-center">
                <Button
                  onClick={() => whatsappLink && window.open(whatsappLink, '_blank')}
                  className="bg-secondary hover:bg-secondary-dark text-luxury-black font-bold text-xl px-12 py-4 h-auto rounded-2xl shadow-luxury transition-all duration-300 transform hover:scale-105 font-farsi mb-4"
                  disabled={!whatsappLink}
                >
                  🚀 به گروه واتساپ بپیوندید و هدیه رایگان را دریافت کنید
                </Button>
                <p className="text-luxury-silver/80 text-sm font-farsi">
                  ظرفیت محدود - همین الان بپیوندید تا کتاب راهنمای عملی را رایگان دریافت کنید (ارزش ۹۷ دلار)
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary text-center mb-12 font-farsi">
              مراحل بعدی:
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-4 font-farsi">
                    ایمیل خود را چک کنید
                  </h3>
                  <p className="text-luxury-silver/90 font-farsi">
                    به دنبال ایمیل تأیید با جزئیات کامل وبینار باشید
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-4 font-farsi">
                    به گروه واتساپ بپیوندید
                  </h3>
                  <p className="text-luxury-silver/90 font-farsi">
                    روی دکمه بالا کلیک کنید تا بپیوندید و هدیه رایگان را دریافت کنید
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-luxury-white/10 backdrop-blur-sm border-secondary/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">📅</span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-4 font-farsi">
                    تاریخ را علامت‌گذاری کنید
                  </h3>
                  <p className="text-luxury-silver/90 font-farsi">
                    تاریخ و زمان وبینار را ذخیره کنید تا از دست ندهید
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Support Section */}
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <div className="bg-luxury-white/5 backdrop-blur-sm border border-secondary/20 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-secondary mb-4 font-farsi">پشتیبانی:</h3>
              <p className="text-luxury-white font-farsi text-lg">
                📱 واتساپ: +1-000-000-0000
              </p>
              <p className="text-luxury-silver/80 text-sm font-farsi mt-2">
                برای هرگونه سوال یا مشکل با ما تماس بگیرید
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankFreeLive;