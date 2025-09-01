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
      price: 29700,
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

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Order Summary */}
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-luxury-charcoal/50 to-luxury-accent/30 backdrop-blur-sm rounded-xl p-6 border border-luxury-white/20 shadow-luxury">
                  <h2 className="text-xl font-bold text-luxury-white mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    خلاصه سفارش
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-luxury-black/30 rounded-lg border border-luxury-white/10">
                      <h3 className="font-bold text-luxury-white text-lg mb-2">{details.displayName}</h3>
                      <p className="text-luxury-silver text-sm mb-3">{details.description}</p>
                      
                      <div className="space-y-2">
                        {details.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-luxury-silver">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-luxury-white/20 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-luxury-silver">قیمت اصلی:</span>
                        <span className="text-luxury-silver line-through farsi-nums">$497</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-luxury-silver">تخفیف ویژه:</span>
                        <span className="text-green-400 farsi-nums">-$200</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-luxury-white">مجموع:</span>
                        <span className="text-luxury-white farsi-nums">${(details.price / 100).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="space-y-3 pt-4 border-t border-luxury-white/20">
                    <div className="flex items-center gap-3 text-sm text-luxury-silver">
                      <Shield className="w-4 h-4 text-green-400" />
                      پرداخت ۱۰۰% امن با Stripe
                    </div>
                    <div className="flex items-center gap-3 text-sm text-luxury-silver">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      ضمانت ۳۰ روزه بازگشت وجه
                    </div>
                    <div className="flex items-center gap-3 text-sm text-luxury-silver">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      دسترسی فوری پس از پرداخت
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="order-1 lg:order-2">
                <div className="sticky top-24">
                  <h1 className="text-2xl sm:text-3xl font-bold text-luxury-white mb-6 text-center">
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
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Checkout;