import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MessageCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/utils/calendar";

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
      // Check for test mode
      const isTestMode = searchParams.get('test') === 'true';
      
      if (isTestMode) {
        // Show test data for Bilingual Power Class
        setOrderDetails({
          id: 'test-order-bilingual-123',
          product_name: 'Bilingual Power Class',
          amount: 9700, // $97 in cents
          email: 'test@example.com',
          name: 'Sara Ahmadi',
          phone: '+1 (818) 555-1234',
          status: 'paid',
          created_at: new Date().toISOString()
        });
        setIsLoading(false);
        toast.success('Test Mode - Registration Confirmed!');
        return;
      }
      
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
  }, [sessionId, searchParams]);

  const createTelegramMessage = () => {
    if (!orderDetails) {
      return 'https://t.me/ladybosslook?text=Hello%2C%20I%20just%20registered%20for%20the%20Bilingual%20Power%20Class!';
    }
    
    const message = `سلام ادمین! من در کلاس قدرت دو زبانه ثبت نام کردم
    
اطلاعات من:
نام: ${orderDetails.name}
ایمیل: ${orderDetails.email}
${orderDetails.phone ? `تلفن: ${orderDetails.phone}` : ''}

من آماده شروع کلاس هستم! 🎉`;
    
    return `https://t.me/ladybosslook?text=${encodeURIComponent(message)}`;
  };

  const handleAddToCalendar = (type: 'google' | 'ics') => {
    const classEvent = {
      title: 'کلاس قدرت دو زبانه - Bilingual Power Class',
      description: `Join the Bilingual Power Class!\n\nMeeting Link: https://meet.google.com/xpu-mvcm-nhj\n\nYou will learn how to speak with power in any language.`,
      startDate: new Date('2025-11-22T09:30:00-08:00'), // 9:30 AM PST
      endDate: new Date('2025-11-22T11:00:00-08:00'), // 1.5 hours duration
      location: 'https://meet.google.com/xpu-mvcm-nhj'
    };

    if (type === 'google') {
      const url = generateGoogleCalendarUrl(classEvent);
      window.open(url, '_blank');
      toast.success('Opening Google Calendar...');
    } else {
      downloadICSFile(classEvent, 'bilingual-power-class.ics');
      toast.success('Calendar file downloaded!');
    }
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
      
      <SEOHead title="Thank You - Payment Successful" description="Registration successful! Welcome to کلاس قدرت دو زبانه online class." />
      
      <div className="thankone-page-green font-farsi">
        {/* Success Banner */}
        <div className="py-3 md:py-4 text-center px-4" style={{ background: 'linear-gradient(135deg, hsl(var(--cta-primary)), hsl(var(--cta-primary-hover)))' }}>
          <p className="font-bold text-sm md:text-base lg:text-lg text-white">🎉 پرداخت موفق - خوش آمدید!</p>
          <p className="font-bold text-sm md:text-base lg:text-lg text-white">ثبت نام شما در کلاس قدرت دو زبانه تکمیل شد</p>
        </div>

        {/* Main Content */}
        <div className="min-h-screen relative overflow-hidden" style={{ background: `linear-gradient(to bottom, hsl(var(--bg-navy)), hsl(var(--bg-navy-dark)))` }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
          
          <div className="container mx-auto px-4 py-3 md:py-12 relative z-10">
            {/* Header */}
            <div className="text-center mb-4 md:mb-8">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight" style={{ color: 'hsl(var(--cta-primary))' }}>
                این ویدیو را ببینید<br />تا ۱۰۰٪ آماده کلاس شوید
              </h1>
              <p className="text-base md:text-lg text-white/90 mb-4 md:mb-6 px-2 font-bold">
                همین الان ویدیوی پایین را ببینید تا آماده کلاس قدرت دو زبانه شوید!
              </p>
            </div>

            {/* Video Section */}
            <div className="max-w-4xl mx-auto mb-6 md:mb-10">
              <div className="backdrop-blur-sm rounded-xl p-3 md:p-6 border"
                   style={{ 
                     background: 'hsl(var(--card-bg) / 0.3)', 
                     borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                   }}>
                <div className="aspect-video rounded-lg mb-3 md:mb-4 flex items-center justify-center" 
                     style={{ background: 'hsl(var(--bg-navy-dark))' }}>
                  {videoLink ? (
                    <iframe 
                      src={videoLink} 
                      className="w-full h-full rounded-lg" 
                      allowFullScreen 
                      title="آمادگی کلاس" 
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3" 
                           style={{ background: 'hsl(var(--cta-primary))' }}>
                        <span className="text-xl md:text-2xl">▶️</span>
                      </div>
                      <p className="text-white text-xs md:text-sm">ویدیو آمادگی کلاس</p>
                      <p className="text-white/60 text-xs mt-1">برای صدا کلیک کنید</p>
                    </div>
                  )}
                </div>
                
                {/* Welcome Message */}
                <div className="text-center mb-2 md:mb-3">
                  <div className="backdrop-blur-sm border rounded-lg md:rounded-xl p-2 md:p-3" 
                       style={{ 
                         background: 'linear-gradient(135deg, hsl(var(--cta-primary) / 0.2), hsl(var(--cta-primary-hover) / 0.2))',
                         borderColor: 'hsl(var(--cta-primary) / 0.3)'
                       }}>
                    <p className="text-sm md:text-lg font-bold" style={{ color: 'hsl(var(--cta-primary))' }}>
                      💎 شما جزء ۱۰۰ نفر اول هستید - تبریک! 💎
                    </p>
                  </div>
                </div>
                
                {/* Arrow Down */}
                <div className="text-center py-1 md:py-2">
                  <div className="text-2xl md:text-3xl animate-bounce">👇</div>
                </div>
                
                {/* Telegram Contact Button */}
                <div className="text-center">
                  {isLoading ? (
                    <div className="w-full h-14 rounded-lg animate-pulse" style={{ background: 'hsl(var(--card-bg))' }}></div>
                  ) : (
                    <Button 
                      onClick={() => window.open(createTelegramMessage(), '_blank')} 
                      className="w-full font-bold text-sm md:text-lg px-4 md:px-8 py-4 md:py-5 h-auto rounded-lg md:rounded-xl shadow-lg transition-all duration-300 whitespace-normal leading-tight hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--cta-primary)), hsl(var(--cta-primary-hover)))',
                        color: 'white'
                      }}
                    >
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 ml-2" />
                      <span>تماس با ادمین از طریق تلگرام</span>
                    </Button>
                  )}
                  <p className="text-white/60 text-xs md:text-sm px-2 mt-3">
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
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-4 md:mb-8" 
                  style={{ color: 'hsl(var(--cta-primary))' }}>
                مراحل بعدی
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                {/* Step 1 - Contact Telegram */}
                <Card className="backdrop-blur-sm border" 
                      style={{ 
                        background: 'hsl(var(--card-bg) / 0.3)', 
                        borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                      }}>
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4" 
                         style={{ background: 'hsl(var(--cta-primary))' }}>
                      <span className="text-xl md:text-2xl">💬</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3" 
                        style={{ color: 'hsl(var(--cta-primary))' }}>
                      با پشتیبانی تلگرام تماس بگیرید
                    </h3>
                    <p className="text-xs md:text-sm text-white/70">
                      برای دریافت لینک جلسه آنلاین
                    </p>
                  </CardContent>
                </Card>

                {/* Step 2 - Check Email */}
                <Card className="backdrop-blur-sm border" 
                      style={{ 
                        background: 'hsl(var(--card-bg) / 0.3)', 
                        borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                      }}>
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4" 
                         style={{ background: 'hsl(var(--cta-primary))' }}>
                      <span className="text-xl md:text-2xl">📧</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3" 
                        style={{ color: 'hsl(var(--cta-primary))' }}>
                      ایمیل خود را چک کنید
                    </h3>
                    <p className="text-xs md:text-sm text-white/70">
                      برای دریافت جزئیات کامل کلاس
                    </p>
                  </CardContent>
                </Card>

                {/* Step 3 - Set Alarm */}
                <Card className="backdrop-blur-sm border" 
                      style={{ 
                        background: 'hsl(var(--card-bg) / 0.3)', 
                        borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                      }}>
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4" 
                         style={{ background: 'hsl(var(--cta-primary))' }}>
                      <span className="text-xl md:text-2xl">⏰</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3" 
                        style={{ color: 'hsl(var(--cta-primary))' }}>
                      یادآور بگذارید
                    </h3>
                    <p className="text-xs md:text-sm text-white/70 mb-3">
                      تا کلاس زنده را از دست ندهید
                    </p>
                    
                    {/* Add to Calendar Buttons */}
                    <div className="flex flex-col gap-2 mt-4">
                      <Button 
                        onClick={() => handleAddToCalendar('google')} 
                        className="w-full font-bold text-xs md:text-sm px-3 py-2.5 h-auto rounded-lg transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          background: 'hsl(var(--cta-primary))',
                          color: 'white'
                        }}
                      >
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>Google Calendar</span>
                      </Button>
                      <Button 
                        onClick={() => handleAddToCalendar('ics')} 
                        className="w-full font-bold text-xs md:text-sm px-3 py-2.5 h-auto rounded-lg transition-all duration-300 hover:scale-[1.02]"
                        variant="outline"
                        style={{
                          borderColor: 'hsl(var(--cta-primary))',
                          color: 'hsl(var(--cta-primary))',
                          background: 'transparent'
                        }}
                      >
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>Apple/Outlook</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Support Section */}
            <div className="max-w-2xl mx-auto mt-6 md:mt-12 text-center pb-6 md:pb-8">
              <div className="backdrop-blur-sm border rounded-lg md:rounded-xl p-4 md:p-6" 
                   style={{ 
                     background: 'hsl(var(--card-bg) / 0.2)', 
                     borderColor: 'hsl(var(--cta-primary) / 0.2)' 
                   }}>
                <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3" 
                    style={{ color: 'hsl(var(--cta-primary))' }}>
                  پشتیبانی:
                </h3>
                <p className="text-white text-sm md:text-base">
                  📱 تلگرام: @ladybosslook
                </p>
                <p className="text-white text-sm md:text-base mt-2">
                  📧 ایمیل: support@ladybosslook.com
                </p>
                <p className="text-white/60 text-xs mt-1 md:mt-2">
                  برای هرگونه سوال یا مشکل با ما تماس بگیرید
                </p>
                
                <p className="text-white text-xs md:text-sm mt-3 md:mt-4 mb-2 md:mb-3">
                  اگه تلگرام نداری ایمیل بزن
                </p>
                <Button 
                  onClick={() => {
                    const emailBody = orderDetails 
                      ? `سلام ادمین! من در کلاس قدرت دو زبانه ثبت نام کردم\n\nاطلاعات من:\nنام: ${orderDetails.name}\nایمیل: ${orderDetails.email}\n${orderDetails.phone ? `تلفن: ${orderDetails.phone}` : ''}\n\nمن آماده شروع کلاس هستم! 🎉`
                      : 'Hello, I just registered for the Bilingual Power Class!';
                    window.location.href = `mailto:support@ladybosslook.com?subject=Bilingual Power Class Registration&body=${encodeURIComponent(emailBody)}`;
                  }}
                  className="w-full font-bold text-xs md:text-sm px-4 py-2.5 md:py-3 h-auto rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'hsl(var(--card-bg))',
                    color: 'hsl(var(--cta-primary))',
                    border: '2px solid hsl(var(--cta-primary))'
                  }}
                >
                  📧 ارسال ایمیل به پشتیبانی
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankOne;
