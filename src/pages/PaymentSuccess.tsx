import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Download, Calendar, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      // Check for test mode
      const isTestMode = searchParams.get('test') === 'true';
      
      if (isTestMode) {
        // Show test data
        setPaymentVerified(true);
        setOrderDetails({
          id: 'test-order-123',
          product_name: 'Courageous Character Workshop',
          amount: 4999, // $49.99 in cents
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
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Verification Error",
          description: "There was an error verifying your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, searchParams, toast]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const getWorkshopDisplayName = (productName: string) => {
    if (productName.toLowerCase().includes('courageous')) {
      return {
        english: 'Courageous Character Workshop',
        farsi: 'کاراکتر پرجرات'
      };
    }
    return {
      english: productName,
      farsi: productName
    };
  };

  const createWhatsAppMessage = () => {
    if (!orderDetails) return '';
    
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
    return `https://wa.me/19495723730?text=${message}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  const isTestMode = searchParams.get('test') === 'true';
  
  if ((!sessionId || !paymentVerified) && !isTestMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Payment Not Found</CardTitle>
            <CardDescription>
              We couldn't verify your payment. Please contact support if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
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
          {/* Success Header - Ultra Compact */}
          <div className="text-center mb-2 sm:mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-2 sm:mb-4">
              <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">
              Payment Successful!
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Welcome to your transformation journey!
            </p>
          </div>

          {/* Order Details - Ultra Compact */}
          {orderDetails && (
            <Card className="mb-2 sm:mb-4">
              <CardHeader className="pb-1 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">Order Confirmation</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {new Date(orderDetails.created_at).toLocaleDateString()}
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
                <div className="flex justify-between items-center py-0.5 sm:py-1 border-b">
                  <span className="font-medium text-xs sm:text-sm">Amount:</span>
                  <span className="text-sm sm:text-base font-semibold text-primary">
                    {formatPrice(orderDetails.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 sm:py-1">
                  <span className="font-medium text-xs sm:text-sm">Status:</span>
                  <span className="text-green-600 font-semibold capitalize text-xs sm:text-sm">
                    {orderDetails.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps - WhatsApp Focus - Mobile Optimized */}
          <Card className="mb-3 sm:mb-8 border-primary bg-primary/5">
            <CardHeader className="text-center pb-2 sm:pb-6">
              <CardTitle className="flex items-center justify-center text-lg sm:text-2xl">
                <ArrowRight className="mr-2 sm:mr-3 h-5 w-5 sm:h-8 sm:w-8 text-primary font-bold" />
                What's Next? ❗️❗️
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-8 sm:w-8 text-red-600 font-bold transform rotate-90" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3 sm:space-y-6">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 sm:p-6 rounded-lg border-2 border-primary/20">
                <div className="space-y-2 sm:space-y-4">
                  {/* English Text */}
                  <div className="text-sm sm:text-lg font-semibold text-primary">
                    {/* Mobile: 2 lines without arrows */}
                    <div className="sm:hidden mb-1 leading-tight">
                      <div className="font-bold text-center text-sm">Click the button below</div>
                      <div className="font-bold text-center text-sm">and message our support on WhatsApp</div>
                    </div>
                    {/* Desktop: 1 line with arrows */}
                    <div className="hidden sm:flex items-center justify-center mb-2">
                      <ArrowRight className="mr-2 h-6 w-6 font-bold" />
                      <span className="font-bold text-center">Click the button below and message our support on WhatsApp</span>
                      <ArrowRight className="ml-2 h-6 w-6 font-bold" />
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-base">
                      Get your workshop access information and instructions immediately
                    </p>
                  </div>
                  
                  {/* Farsi Text */}
                  <div className="text-sm sm:text-lg font-semibold text-primary" dir="rtl">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-6 sm:w-6 font-bold" />
                      <span className="font-bold text-center">همین حالا روی دکمه پایین بزنید و به واتسپ پشتیبان پیام بزنید</span>
                      <ArrowRight className="mr-1 sm:mr-2 h-4 w-4 sm:h-6 sm:w-6 font-bold" />
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-base">
                      از واتسپ اطلاعات ورود به ورکشاپ را دریافت کنید
                    </p>
                  </div>
                  
                  {/* Multiple Red Bold Arrows Pointing Down - Side by Side */}
                  <div className="flex justify-center py-1 sm:py-2">
                    <div className="animate-bounce flex items-center space-x-2">
                      <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 font-bold transform rotate-90" />
                      <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 font-bold transform rotate-90" />
                      <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 font-bold transform rotate-90" />
                    </div>
                  </div>
                  
                  {/* WhatsApp Button - Directly Under Arrow */}
                  <div className="pt-1 sm:pt-2">
                    <a 
                      href={createWhatsAppMessage()}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block w-full sm:w-auto"
                    >
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-6 animate-pulse"
                      >
                        <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Message Us on WhatsApp
                      </Button>
                    </a>
                    <p className="text-xs text-green-700 mt-1 sm:mt-2">
                      Your message is ready to send with all your details!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Action Buttons - Mobile Hidden/Compact */}
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

          {/* Support Info - Mobile Compact */}
          <div className="text-center mt-4 sm:mt-8 p-3 sm:p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Alternative Support</h3>
            <p className="text-muted-foreground mb-2 sm:mb-4 text-xs sm:text-sm">
              You can also reach us through email if needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <a 
                href="mailto:support@ladybosslook.com" 
                className="text-primary hover:underline text-sm"
              >
                support@ladybosslook.com
              </a>
              <a 
                href="https://wa.me/19495723730" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                WhatsApp: +1 (949) 572-3730
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}