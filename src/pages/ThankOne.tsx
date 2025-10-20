import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ThankOne = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [videoLink] = useState('https://www.youtube.com/embed/ct9plBl6B0c');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch order details and scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });
        
        if (error) throw error;
        
        if (data?.success && data?.orderDetails) {
          setOrderDetails(data.orderDetails);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Unable to load order details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [sessionId]);

  const createWhatsAppMessage = () => {
    if (!orderDetails) {
      return 'https://wa.me/16265028589?text=Hello%2C%20I%20just%20registered!';
    }
    
    // Get the program name from order details
    const programName = orderDetails.product_name || 'the program';
    
    const message = `سلام ادمین! من در ${programName} ثبت نام کردم
    
اطلاعات من:
نام: ${orderDetails.name}
ایمیل: ${orderDetails.email}
${orderDetails.phone ? `تلفن: ${orderDetails.phone}` : ''}

من آماده شروع کلاس هستم! 🎉`;
    
    return `https://wa.me/16265028589?text=${encodeURIComponent(message)}`;
  };
  return (
    <>
      <style>{`
        .thankone-page-green {
          --cta-primary: 142 71% 45%;
          --cta-primary-hover: 142 71% 40%;
          --cta-glow: 142 71% 45%;
          --accent-teal: 174 72% 56%;
          --accent-coral: 0 79% 72%;
          --bg-navy: 217 33% 17%;
          --bg-navy-dark: 217 91% 6%;
          --card-bg: 215 25% 27%;
        }
      `}</style>
      
      <SEOHead title="Thank You - Payment Successful" description={`Registration successful! Welcome to ${orderDetails?.product_name || 'your program'}.`} />
      
      <div className="thankone-page-green">
        {/* Success Banner */}
        <div className="py-3 md:py-4 text-center px-4" style={{ background: 'linear-gradient(135deg, hsl(var(--cta-primary)), hsl(var(--cta-primary-hover)))' }}>
          <p className="font-bold text-base md:text-lg lg:text-xl text-white">🎉 پرداخت موفق - خوش آمدید!</p>
          <p className="font-bold text-base md:text-lg lg:text-xl text-white">
            {isLoading ? 'در حال بارگذاری...' : `ثبت نام شما در ${orderDetails?.product_name || 'دوره'} تکمیل شد`}
          </p>
        </div>

        {/* Main Content */}
        <div className="min-h-screen relative overflow-hidden" style={{ background: `linear-gradient(to bottom, hsl(var(--bg-navy)), hsl(var(--bg-navy-dark)))` }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
          
          <div className="container mx-auto px-4 py-3 md:py-12 relative z-10">
            {/* Header */}
            <div className="text-center mb-4 md:mb-12">
              <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight" style={{ color: 'hsl(var(--cta-primary))' }}>
                این ویدیو را ببینید<br />تا ۱۰۰٪ آماده کلاس شوید
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 px-2 font-bold">
                {isLoading ? '' : `همین الان ویدیوی پایین را ببینید تا آماده ${orderDetails?.product_name || 'کلاس'} شوید!`}
              </p>
            </div>

            {/* Video Section */}
            <div className="max-w-4xl mx-auto mb-4 md:mb-12">
              <div className="backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border" 
                   style={{ 
                     background: 'hsl(var(--card-bg) / 0.3)', 
                     borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                   }}>
                <div className="aspect-video rounded-lg md:rounded-xl mb-2 md:mb-4 flex items-center justify-center" 
                     style={{ background: 'hsl(var(--bg-navy-dark))' }}>
                  {videoLink ? (
                    <iframe 
                      src={videoLink} 
                      className="w-full h-full rounded-lg md:rounded-xl" 
                      allowFullScreen 
                      title="آمادگی کلاس" 
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4" 
                           style={{ background: 'hsl(var(--cta-primary))' }}>
                        <span className="text-2xl md:text-3xl">▶️</span>
                      </div>
                      <p className="text-white text-sm md:text-base">ویدیو آمادگی کلاس</p>
                      <p className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">برای صدا کلیک کنید</p>
                    </div>
                  )}
                </div>
                
                {/* Welcome Message */}
                <div className="text-center mb-3">
                  <div className="backdrop-blur-sm border rounded-xl p-2 md:p-3" 
                       style={{ 
                         background: 'linear-gradient(135deg, hsl(var(--cta-primary) / 0.2), hsl(var(--cta-primary-hover) / 0.2))',
                         borderColor: 'hsl(var(--cta-primary) / 0.3)'
                       }}>
                    <p className="text-lg md:text-xl font-bold" style={{ color: 'hsl(var(--cta-primary))' }}>
                      💎 شما جزء ۱۰۰ نفر اول هستید - تبریک! 💎
                    </p>
                  </div>
                </div>
                
                {/* Arrow Down */}
                <div className="text-center py-2">
                  <div className="text-4xl animate-bounce">👇</div>
                </div>
                
                {/* WhatsApp Contact Button */}
                <div className="text-center">
                  {isLoading ? (
                    <div className="w-full h-14 rounded-lg animate-pulse" style={{ background: 'hsl(var(--card-bg))' }}></div>
                  ) : (
                    <Button 
                      onClick={() => window.open(createWhatsAppMessage(), '_blank')} 
                      className="w-full font-bold text-sm md:text-lg px-4 md:px-8 py-4 md:py-5 h-auto rounded-lg md:rounded-xl shadow-lg transition-all duration-300 mb-3 md:mb-4 whitespace-normal leading-tight hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--cta-primary)), hsl(var(--cta-primary-hover)))',
                        color: 'white'
                      }}
                    >
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 ml-2" />
                      <span>تماس با ادمین از طریق واتساپ</span>
                    </Button>
                  )}
                  <p className="text-white/60 text-xs md:text-sm px-2">
                    برای دریافت اطلاعات کامل کلاس و پشتیبانی
                  </p>
                  
                  {/* Arrow Up */}
                  <div className="text-center pt-4">
                    <div className="text-4xl animate-bounce">☝️</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-12" 
                  style={{ color: 'hsl(var(--cta-primary))' }}>
                مراحل بعدی
              </h2>
              
              <div className="grid grid-cols-3 gap-4 md:gap-8">
                {/* Step 1 */}
                <Card className="backdrop-blur-sm border" 
                      style={{ 
                        background: 'hsl(var(--card-bg) / 0.3)', 
                        borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                      }}>
                  <CardContent className="p-4 md:p-8 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6" 
                         style={{ background: 'hsl(var(--cta-primary))' }}>
                      <span className="text-lg md:text-2xl">📧</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4" 
                        style={{ color: 'hsl(var(--cta-primary))' }}>
                      ایمیل خود را چک کنید
                    </h3>
                    <p className="text-sm md:text-base text-white/70">
                      به دنبال ایمیل تأیید با جزئیات کامل کلاس باشید
                    </p>
                  </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className="backdrop-blur-sm border" 
                      style={{ 
                        background: 'hsl(var(--card-bg) / 0.3)', 
                        borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                      }}>
                  <CardContent className="p-4 md:p-8 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6" 
                         style={{ background: 'hsl(var(--cta-primary))' }}>
                      <span className="text-lg md:text-2xl">💬</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4" 
                        style={{ color: 'hsl(var(--cta-primary))' }}>
                      با رضیه تماس بگیرید
                    </h3>
                    <p className="text-sm md:text-base text-white/70">
                      روی دکمه بالا کلیک کنید تا از طریق واتساپ تماس بگیرید
                    </p>
                  </CardContent>
                </Card>

                {/* Step 3 */}
                <Card className="backdrop-blur-sm border" 
                      style={{ 
                        background: 'hsl(var(--card-bg) / 0.3)', 
                        borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                      }}>
                  <CardContent className="p-4 md:p-8 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6" 
                         style={{ background: 'hsl(var(--cta-primary))' }}>
                      <span className="text-lg md:text-2xl">📚</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4" 
                        style={{ color: 'hsl(var(--cta-primary))' }}>
                      آماده کلاس شوید
                    </h3>
                    <p className="text-sm md:text-base text-white/70">
                      جزئیات شروع کلاس از طریق ایمیل و واتساپ ارسال می‌شود
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Support Section */}
            <div className="max-w-2xl mx-auto mt-8 md:mt-16 text-center">
              <div className="backdrop-blur-sm border rounded-xl p-4 md:p-8" 
                   style={{ 
                     background: 'hsl(var(--card-bg) / 0.2)', 
                     borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                   }}>
                <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4" 
                    style={{ color: 'hsl(var(--cta-primary))' }}>
                  پشتیبانی:
                </h3>
                <p className="text-white text-base md:text-lg">
                  📱 واتساپ: +1 (626) 502‑8589
                </p>
                <p className="text-white text-base md:text-lg mt-2">
                  📧 ایمیل: support@ladybosslook.com
                </p>
                <p className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">
                  برای هرگونه سوال یا مشکل با ما تماس بگیرید
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankOne;
