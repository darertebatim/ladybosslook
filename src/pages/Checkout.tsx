import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { PaymentForm } from '@/components/PaymentForm';
import { ArrowLeft, Shield, Crown, CheckCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const program = searchParams.get('program') || 'courageous-character';
  
  const programDetails = {
    'courageous-character': {
      name: 'Courageous Character Workshop',
      displayName: 'کارگاه آنلاین شخصیت شجاع',
      price: 9700, // $97
      originalPrice: 49700, // $497
      description: 'Transform your mindset and build unshakeable confidence',
      features: [
        'کارگاه زنده ۳ هفته‌ای',
        'ضبط جلسات به مدت ۷ روز',
        'جامعه پشتیبان',
        'گواهینامه تکمیل'
      ]
    }
  };

  const details = programDetails[program as keyof typeof programDetails] || programDetails['courageous-character'];

  return (
    <>
      <SEOHead 
        title="پرداخت امن - کارگاه آنلاین شخصیت شجاع"
        description="پرداخت امن برای کارگاه آنلاین شخصیت شجاع. با ضمانت ۳۰ روزه و پشتیبانی کامل."
      />
      
      <div className="min-h-screen bg-luxury-black font-farsi rtl">
        {/* Navigation Header */}
        <header className="border-b border-luxury-accent/20 bg-luxury-black/95 backdrop-blur-md sticky top-0 z-50 shadow-luxury">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-luxury-text bg-clip-text text-transparent">
                <Crown className="w-6 h-6 inline-block ml-2 text-luxury-white" />
                آکادمی لیدی‌باس
              </h1>
              <Button variant="ghost" size="sm" asChild className="text-luxury-silver hover:text-luxury-white hover:bg-luxury-charcoal">
                <Link to="/courageous-workshop" className="flex items-center gap-2">
                  <span className="hidden sm:inline">بازگشت به کارگاه</span>
                  <span className="sm:hidden">بازگشت</span>
                  <ArrowLeft size={16} className="rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-4 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {/* Mobile-First Layout */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
              
              {/* Payment Form - Mobile First */}
              <div className="order-1">
                <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-luxury-white/20 shadow-luxury">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-luxury-white mb-4 sm:mb-6 text-center">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 inline-block ml-2" />
                    پرداخت امن
                  </h1>
                  
                  <PaymentForm
                    program={program}
                    programName={details.name}
                    price={details.price}
                    description={details.description}
                  />
                </div>
              </div>

              {/* Order Summary - Mobile Optimized */}
              <div className="order-2">
                <div className="bg-gradient-to-br from-luxury-charcoal/50 to-luxury-accent/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-luxury-white/20 shadow-luxury">
                  <h2 className="text-lg sm:text-xl font-bold text-luxury-white mb-4 sm:mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    خلاصه سفارش
                  </h2>
                  
                  {/* Product Details */}
                  <div className="space-y-4 mb-6">
                    <div className="p-3 sm:p-4 bg-luxury-black/30 rounded-lg border border-luxury-white/10">
                      <h3 className="font-bold text-luxury-white text-base sm:text-lg mb-2">{details.displayName}</h3>
                      <p className="text-luxury-silver text-xs sm:text-sm mb-3">{details.description}</p>
                      
                      <div className="space-y-2">
                        {details.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-luxury-silver">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Pricing Breakdown - Mobile Optimized */}
                    <div className="border-t border-luxury-white/20 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-luxury-silver text-sm">قیمت اصلی:</span>
                        <span className="text-luxury-silver line-through farsi-nums text-sm">${(details.originalPrice / 100).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-luxury-silver text-sm">تخفیف ویژه:</span>
                        <span className="text-green-400 farsi-nums text-sm">-${((details.originalPrice - details.price) / 100).toFixed(0)}</span>
                      </div>
                      <div className="border-t border-luxury-white/10 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-luxury-white font-bold text-base sm:text-lg">مجموع:</span>
                          <span className="text-luxury-white font-bold text-xl sm:text-2xl farsi-nums">${(details.price / 100).toFixed(0)}</span>
                        </div>
                        <div className="text-center mt-2">
                          <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            ${((details.originalPrice - details.price) / 100).toFixed(0)} تخفیف
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators - Mobile Optimized */}
                  <div className="space-y-2 sm:space-y-3 pt-4 border-t border-luxury-white/20">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-luxury-silver">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                      <span>پرداخت ۱۰۰% امن با Stripe</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-luxury-silver">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                      <span>ضمانت ۳۰ روزه بازگشت وجه</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-luxury-silver">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                      <span>دسترسی فوری پس از پرداخت</span>
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