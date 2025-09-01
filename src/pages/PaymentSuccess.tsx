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
          setOrderDetails(data.order);
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
      <SEOHead
        title="Payment Successful - Courageous Character Workshop"
        description="Thank you for your purchase! Your payment has been confirmed and you now have access to the Courageous Character Workshop."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-muted-foreground">
              Welcome to your transformation journey!
            </p>
          </div>

          {/* Order Details */}
          {orderDetails && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Order Confirmation</CardTitle>
                <CardDescription>
                  Order placed on {new Date(orderDetails.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Program:</span>
                  <div className="text-right">
                    <div>{getWorkshopDisplayName(orderDetails.product_name).english}</div>
                    <div className="text-sm text-muted-foreground">{getWorkshopDisplayName(orderDetails.product_name).farsi}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Amount Paid:</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatPrice(orderDetails.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Email:</span>
                  <span>{orderDetails.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600 font-semibold capitalize">
                    {orderDetails.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="mr-2 h-5 w-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Check Your Email</h3>
                  <p className="text-muted-foreground">
                    You'll receive a confirmation email with access instructions and program materials within the next few minutes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Join Our Community</h3>
                  <p className="text-muted-foreground">
                    Connect with other participants and get ongoing support throughout your transformation journey.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Start Your Journey</h3>
                  <p className="text-muted-foreground">
                    Begin with Module 1 and take your first step towards building unshakeable confidence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connect with Us - WhatsApp Priority */}
          <Card className="mb-8 border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800">🎉 Connect with Us Now!</CardTitle>
              <CardDescription className="text-green-700">
                Get instant support and your workshop materials
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <a 
                href={createWhatsAppMessage()}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block w-full sm:w-auto"
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white mb-4 text-lg py-6 px-8"
                >
                  <MessageCircle className="mr-3 h-6 w-6" />
                  Message Us on WhatsApp
                </Button>
              </a>
              <p className="text-sm text-green-700 mb-2">
                Your message is ready to send with all your details!
              </p>
              <p className="text-xs text-muted-foreground">
                We'll respond within minutes with your workshop access and next steps
              </p>
            </CardContent>
          </Card>

          {/* Additional Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Alternative Support</h3>
            <p className="text-muted-foreground mb-4">
              You can also reach us through email if needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@ladybosslook.com" 
                className="text-primary hover:underline"
              >
                support@ladybosslook.com
              </a>
              <a 
                href="https://wa.me/19495723730" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
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