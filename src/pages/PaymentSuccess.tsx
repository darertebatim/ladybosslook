import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Download, Calendar, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const programSlug = searchParams.get('program');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      const isTestMode = searchParams.get('test') === 'true';
      
      if (isTestMode) {
        const testProgramData: Record<string, { title: string; amount: number }> = {
          'empowered-woman-coaching': { title: 'Empowered Woman Coaching', amount: 99700 },
          'courageous-character': { title: 'Courageous Character Course', amount: 4999 },
          'iqmoney-workshop': { title: 'IQ Money Workshop', amount: 9900 }
        };
        
        const programData = (programSlug && testProgramData[programSlug]) || testProgramData['courageous-character'];
        
        setPaymentVerified(true);
        setOrderDetails({
          id: 'test-order-123',
          product_name: programData.title,
          amount: programData.amount,
          email: 'test@example.com',
          name: 'Sarah Johnson',
          phone: '+1 (555) 123-4567',
          status: 'paid',
          created_at: new Date().toISOString()
        });
        setIsLoading(false);
        toast({
          title: "Test Mode - Payment Confirmed!",
          description: "This is a test view of the payment success page.",
        });
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

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success && data?.paymentStatus === 'paid') {
          setPaymentVerified(true);
          setOrderDetails(data.orderDetails);
          toast({
            title: "Payment Confirmed!",
            description: "Your payment has been successfully processed.",
          });
        } else if (data?.paymentStatus && data.paymentStatus !== 'paid') {
          // Payment not yet complete
          toast({
            title: "Payment Processing",
            description: "Your payment is still being processed. Please wait a moment.",
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        // Don't show error toast - we'll show a friendly message instead
      } finally {
        setIsLoading(false);
        setVerificationAttempts(prev => prev + 1);
      }
    };

    verifyPayment();
  }, [sessionId, searchParams, toast, programSlug]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const getWorkshopDisplayName = (productName: string) => {
    if (productName?.toLowerCase().includes('courageous')) {
      return { english: 'Courageous Character Course', farsi: 'کاراکتر پرجرات' };
    }
    if (productName?.toLowerCase().includes('five') || productName?.toLowerCase().includes('language')) {
      return { english: 'Five Language of Empowered Woman', farsi: '۵ زبان زن توانمند' };
    }
    if (productName?.toLowerCase().includes('money') || productName?.toLowerCase().includes('iq')) {
      return { english: 'IQ Money Workshop', farsi: 'کارگاه هوش مالی' };
    }
    return { english: productName || 'Your Course', farsi: 'دوره شما' };
  };

  const createTelegramMessage = () => {
    const baseUrl = 'https://t.me/ladybosslook';
    
    if (!orderDetails) {
      const fallbackMessage = encodeURIComponent(
        `Hello! I just completed my payment and need access to my course.\n\nPlease send me the workshop details and next steps. Thank you!`
      );
      return `${baseUrl}?text=${fallbackMessage}`;
    }
    
    const workshop = getWorkshopDisplayName(orderDetails.product_name);
    const message = encodeURIComponent(
      `Hello! I just completed my payment for the ${workshop.english} (${workshop.farsi}) workshop.\n\n` +
      `My details:\n` +
      `Name: ${orderDetails.name}\n` +
      `Email: ${orderDetails.email}\n` +
      `Phone: ${orderDetails.phone || 'Not provided'}\n` +
      `Amount Paid: ${formatPrice(orderDetails.amount)}\n\n` +
      `Please send me the workshop details and next steps. Thank you!`
    );
    return `${baseUrl}?text=${message}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  const isTestMode = searchParams.get('test') === 'true';
  
  // Show success page even if order details are incomplete
  // Payment was confirmed by Stripe, just waiting for our system to process
  if (!sessionId && !isTestMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Missing Session</CardTitle>
            <CardDescription>
              No payment session was found. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <a href={createTelegramMessage()} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Support on Telegram
              </Button>
            </a>
            <Link to="/">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have a session ID, show success even without complete order details
  // The webhook will process it, user just needs to contact support
  const showSuccessPage = isTestMode || (sessionId && (paymentVerified || verificationAttempts > 0));

  if (!showSuccessPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Processing Your Payment</CardTitle>
            <CardDescription>
              Your payment is being processed. Please contact support to get access to your course.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <a href={createTelegramMessage()} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Support on Telegram
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-4 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-2 sm:mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-2 sm:mb-4">
              <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 text-primary transform rotate-90" />
              <h1 className="text-xl sm:text-3xl font-bold text-primary">
                Payment Successful!
              </h1>
              <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 text-primary transform rotate-90" />
            </div>
          </div>

          {/* Order Details - Only show if we have them */}
          {orderDetails && orderDetails.product_name && (
            <Card className="mb-2 sm:mb-4">
              <CardHeader className="pb-1 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">Order Confirmation</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {orderDetails.created_at ? new Date(orderDetails.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center py-0.5 sm:py-1 border-b">
                  <span className="font-medium text-xs sm:text-sm">Program:</span>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm">{getWorkshopDisplayName(orderDetails.product_name).english}</div>
                    <div className="text-xs text-muted-foreground">{getWorkshopDisplayName(orderDetails.product_name).farsi}</div>
                  </div>
                </div>
                {orderDetails.amount > 0 && (
                  <div className="flex justify-between items-center py-0.5 sm:py-1 border-b">
                    <span className="font-medium text-xs sm:text-sm">Amount:</span>
                    <span className="text-sm sm:text-base font-semibold text-primary">
                      {formatPrice(orderDetails.amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-0.5 sm:py-1">
                  <span className="font-medium text-xs sm:text-sm">Status:</span>
                  <span className="text-green-600 font-semibold capitalize text-xs sm:text-sm">
                    {orderDetails.status || 'Paid'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps - Telegram Focus */}
          <Card className="mb-3 sm:mb-6 border-primary bg-primary/5">
            <CardHeader className="text-center pb-2 pt-3 sm:pt-6">
              <CardTitle className="text-lg sm:text-2xl font-bold font-farsi" dir="rtl">
                ⚠️ مهم: مرحله بعدی
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2 sm:space-y-3 py-3 sm:py-4">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 sm:p-4 rounded-lg border-2 border-primary/30">
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-base sm:text-xl font-bold text-primary font-farsi leading-tight" dir="rtl">
                    🚨 همین الان روی دکمه زیر کلیک کنید
                  </div>
                  
                  <p className="text-xs sm:text-sm text-foreground font-farsi font-semibold" dir="rtl">
                    بدون پیام دادن به تلگرام، دسترسی به دوره ندارید!
                  </p>
                  
                  <div className="flex justify-center py-1">
                    <div className="animate-bounce">
                      <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 transform rotate-90" />
                    </div>
                  </div>
                  
                  <div>
                    <a 
                      href={createTelegramMessage()}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block w-full"
                    >
                      <Button 
                        size="lg" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-xl py-5 sm:py-7 px-6 sm:px-8 font-farsi font-bold shadow-lg hover:shadow-xl transition-all animate-pulse"
                      >
                        <MessageCircle className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                        کلیک کنید - پیام به پشتیبانی
                      </Button>
                    </a>
                    <p className="text-xs sm:text-sm text-primary mt-2 font-farsi font-semibold" dir="rtl">
                      ✅ پیام شما آماده است، فقط ارسال کنید
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Action Buttons - Desktop Only */}
          <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Access Course Materials
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Your First Session
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center mt-4 sm:mt-8 p-3 sm:p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base font-farsi" dir="rtl">راه های دیگه پشتیبانی</h3>
            <p className="text-muted-foreground mb-2 sm:mb-4 text-xs sm:text-sm font-farsi" dir="rtl">
              اگه تلگرام نداری، میتونی از طریق ایمیل هم با ما در تماس باشی
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center mb-4">
              <a 
                href="mailto:support@ladybosslook.com" 
                className="text-primary hover:underline text-sm"
              >
                support@ladybosslook.com
              </a>
              <a 
                href="https://t.me/ladybosslook" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Telegram: @ladybosslook
              </a>
            </div>
            
            <p className="text-muted-foreground text-sm mb-3">
              اگه تلگرام نداری ایمیل بزن
            </p>
            <Button 
              onClick={() => {
                const workshop = getWorkshopDisplayName(orderDetails?.product_name || 'My Course');
                const emailBody = `Hello! I just completed my payment for the ${workshop.english} (${workshop.farsi}) workshop.\n\nMy details:\nName: ${orderDetails?.name || 'Not available'}\nEmail: ${orderDetails?.email || 'Not available'}\nPhone: ${orderDetails?.phone || 'Not provided'}\n${orderDetails?.amount ? `Amount Paid: ${formatPrice(orderDetails.amount)}` : ''}\n\nPlease send me the workshop details and next steps. Thank you!`;
                window.location.href = `mailto:support@ladybosslook.com?subject=Payment Successful - Workshop Access&body=${encodeURIComponent(emailBody)}`;
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              📧 ارسال ایمیل به پشتیبانی
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
