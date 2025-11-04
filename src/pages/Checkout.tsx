import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { ArrowLeft, Shield, Crown, CheckCircle, ExternalLink } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const program = searchParams.get('program') || 'courageous-character';
  
  const programDetails = {
    'courageous-character': {
      name: 'Courageous Character Course',
      displayName: 'Courageous Character Course',
      price: 9700, // $97
      originalPrice: 49700, // $497
      description: 'Transform your mindset and build unshakeable confidence',
      stripePaymentLink: 'https://buy.stripe.com/8x25kC8bL4T87J559n9Ve02',
      features: [
        '3-week live workshop',
        '7-day session recordings',
        'Supportive community',
        'Completion certificate'
      ]
    }
  };

  const details = programDetails[program as keyof typeof programDetails] || programDetails['courageous-character'];

  const handleBuyNow = async () => {
    // Add success and cancel URLs to the Stripe payment link
    const successUrl = encodeURIComponent(`${window.location.origin}/payment-success`);
    const cancelUrl = encodeURIComponent(`${window.location.origin}/checkout?cancelled=true`);
    const stripeUrl = `${details.stripePaymentLink}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
    
    // Use native browser on mobile, regular redirect on web
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: stripeUrl });
    } else {
      window.location.href = stripeUrl;
    }
  };

  return (
    <>
      <SEOHead />
      
      <div className="min-h-screen bg-luxury-black ltr">
        {/* Navigation Header */}
        <header className="border-b border-luxury-accent/20 bg-luxury-black/95 backdrop-blur-md sticky top-0 z-50 shadow-luxury">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-luxury-text bg-clip-text text-transparent">
                <Crown className="w-6 h-6 inline-block mr-2 text-luxury-white" />
                LadyBoss Academy
              </h1>
              <Button variant="ghost" size="sm" asChild className="text-luxury-silver hover:text-luxury-white hover:bg-luxury-charcoal">
                <Link to="/ccw" className="flex items-center gap-2">
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Workshop</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-3 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Mobile: Order Summary First (Above Fold) */}
            <div className="block lg:hidden mb-4">
              <div className="bg-gradient-to-br from-luxury-charcoal/50 to-luxury-accent/30 backdrop-blur-sm rounded-lg p-3 border border-luxury-white/20 shadow-luxury">
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold text-luxury-white mb-1">{details.displayName}</h2>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-base text-luxury-silver/60 line-through">${(details.originalPrice / 100).toFixed(0)}</span>
                    <span className="text-2xl font-bold text-luxury-white">${(details.price / 100).toFixed(0)}</span>
                  </div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block">
                    ${((details.originalPrice - details.price) / 100).toFixed(0)} discount
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {details.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 text-luxury-silver">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Side by Side Layout */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
              
              {/* Buy Now Section */}
              <div className="order-1">
                <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-lg p-6 border border-luxury-white/20 shadow-luxury">
                  <h1 className="text-lg sm:text-xl font-bold text-luxury-white mb-4 text-center whitespace-nowrap">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-2" />
                    Ready to Transform Your Life?
                  </h1>
                  
                  <div className="text-center mb-6">
                    <p className="text-luxury-silver mb-4 leading-relaxed">
                      <span className="whitespace-nowrap">Join the Courageous Character Course</span><br />
                      and Behave like a confident Ladyboss
                    </p>
                    
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-lg text-luxury-silver/60 line-through">${(details.originalPrice / 100).toFixed(0)}</span>
                      <span className="text-3xl font-bold text-luxury-white">${(details.price / 100).toFixed(0)}</span>
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold inline-block mb-6">
                      Save ${((details.originalPrice - details.price) / 100).toFixed(0)}!
                    </div>
                  </div>

                  <Button
                    onClick={handleBuyNow}
                    className="w-full h-14 text-lg font-black bg-luxury-white hover:bg-luxury-silver text-luxury-black mb-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-luxury-white"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Buy Now - Secure Payment
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>

                  {/* Trust Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-luxury-white/20">
                    <div className="flex items-center gap-2 text-sm text-luxury-silver justify-center sm:justify-start">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Secure Stripe Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-luxury-silver justify-center sm:justify-start">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>30-Day Guarantee</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-luxury-silver/60 text-center mt-4">
                    You'll be redirected to Stripe's secure checkout. No account required.
                  </p>
                </div>
              </div>

              {/* Desktop Order Summary */}
              <div className="order-2 hidden lg:block">
                <div className="bg-gradient-to-br from-luxury-charcoal/50 to-luxury-accent/30 backdrop-blur-sm rounded-lg p-4 border border-luxury-white/20 shadow-luxury">
                  <h2 className="text-lg font-bold text-luxury-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Order Summary
                  </h2>
                  
                  <div className="space-y-4 mb-4">
                    <div className="p-3 bg-luxury-black/30 rounded-lg border border-luxury-white/10">
                      <h3 className="font-bold text-luxury-white text-base mb-2">{details.displayName}</h3>
                      <p className="text-luxury-silver text-sm mb-3">{details.description}</p>
                      
                      <div className="space-y-2">
                        {details.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-luxury-silver">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-luxury-white/20 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-luxury-silver text-sm">Original Price:</span>
                        <span className="text-luxury-silver line-through text-sm">${(details.originalPrice / 100).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-luxury-silver text-sm">Special Discount:</span>
                        <span className="text-green-400 text-sm">-${((details.originalPrice - details.price) / 100).toFixed(0)}</span>
                      </div>
                      <div className="border-t border-luxury-white/10 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-luxury-white font-bold text-base">Total:</span>
                          <span className="text-luxury-white font-bold text-xl">${(details.price / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-luxury-white/20">
                    <div className="flex items-center gap-2 text-xs text-luxury-silver">
                      <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>100% Secure Payment with Stripe</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-luxury-silver">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>30-day Money Back Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-luxury-silver">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>Instant Access After Payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Checkout;