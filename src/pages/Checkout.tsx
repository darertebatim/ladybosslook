import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEOHead } from '@/components/SEOHead';
import { ArrowLeft, Shield, Crown, CheckCircle, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const program = searchParams.get('program') || 'courageous-character';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "اطلاعات ناکامل",
        description: "لطفاً تمام فیلدهای مورد نیاز را پر کنید.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: program,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "انتقال به صفحه پرداخت",
          description: "لطفاً پرداخت خود را در تب جدید باز شده تکمیل کنید.",
        });
      } else {
        throw new Error('لینک پرداخت دریافت نشد');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "خطا در پرداخت",
        description: "مشکلی در پردازش پرداخت شما به وجود آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

        <main className="container mx-auto px-4 py-3 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Mobile: Order Summary First (Above Fold) */}
            <div className="block lg:hidden mb-4">
              <div className="bg-gradient-to-br from-luxury-charcoal/50 to-luxury-accent/30 backdrop-blur-sm rounded-lg p-3 border border-luxury-white/20 shadow-luxury">
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold text-luxury-white mb-1">{details.displayName}</h2>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-base text-luxury-silver/60 line-through farsi-nums">${(details.originalPrice / 100).toFixed(0)}</span>
                    <span className="text-2xl font-bold text-luxury-white farsi-nums">${(details.price / 100).toFixed(0)}</span>
                  </div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block">
                    ${((details.originalPrice - details.price) / 100).toFixed(0)} تخفیف
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
              
              {/* Compact Payment Form */}
              <div className="order-1">
                <div className="bg-gradient-to-br from-luxury-white/10 to-luxury-white/5 backdrop-blur-sm rounded-lg p-4 border border-luxury-white/20 shadow-luxury">
                  <h1 className="text-lg sm:text-xl font-bold text-luxury-white mb-3 text-center">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 inline-block ml-2" />
                    پرداخت امن
                  </h1>
                  
                  {/* Compact Form */}
                  <div className="space-y-3">
                     <form onSubmit={handleSubmit} className="space-y-3">
                       <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="name" className="text-xs font-medium text-luxury-silver text-left">
                              Full Name *
                            </Label>
                            <Label htmlFor="name" className="text-xs font-medium text-luxury-silver text-right">
                              نام کامل *
                            </Label>
                          </div>
                         <Input
                           id="name"
                           name="name"
                           type="text"
                           placeholder="Enter your full name | نام کامل خود را وارد کنید"
                           className="h-10 bg-luxury-black/30 border-luxury-white/20 text-luxury-white placeholder-luxury-silver/60"
                           value={formData.name}
                           onChange={handleInputChange}
                           required
                         />
                       </div>
                       
                       <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="email" className="text-xs font-medium text-luxury-silver text-left">
                              Email Address *
                            </Label>
                            <Label htmlFor="email" className="text-xs font-medium text-luxury-silver text-right">
                              آدرس ایمیل *
                            </Label>
                          </div>
                         <Input
                           id="email"
                           name="email"
                           type="email"
                           placeholder="Enter your email | ایمیل خود را وارد کنید"
                           className="h-10 bg-luxury-black/30 border-luxury-white/20 text-luxury-white placeholder-luxury-silver/60"
                           value={formData.email}
                           onChange={handleInputChange}
                           required
                         />
                       </div>
                       
                       <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="phone" className="text-xs font-medium text-luxury-silver text-left">
                              Phone Number (Optional)
                            </Label>
                            <Label htmlFor="phone" className="text-xs font-medium text-luxury-silver text-right">
                              شماره تلفن (اختیاری)
                            </Label>
                          </div>
                         <Input
                           id="phone"
                           name="phone"
                           type="tel"
                           placeholder="Phone number | شماره تلفن"
                           className="h-10 bg-luxury-black/30 border-luxury-white/20 text-luxury-white placeholder-luxury-silver/60"
                           value={formData.phone}
                           onChange={handleInputChange}
                         />
                       </div>

                       <Button
                         type="submit"
                         disabled={isLoading}
                         className="w-full h-11 text-base font-bold bg-luxury-white hover:bg-luxury-silver text-luxury-black mt-4"
                       >
                         {isLoading ? (
                           <>
                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             Processing... | در حال پردازش...
                           </>
                         ) : (
                           <>
                             <Crown className="mr-2 h-4 w-4" />
                             Secure Payment - ${(details.price / 100).toFixed(0)} | پرداخت امن
                           </>
                         )}
                       </Button>
                     </form>

                    {/* Trust Indicators - Compact */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-luxury-white/20">
                      <div className="flex items-center gap-1 text-xs text-luxury-silver">
                        <Shield className="w-3 h-3 text-green-400" />
                        <span>پرداخت امن</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-luxury-silver">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span>ضمانت ۳۰ روزه</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Order Summary */}
              <div className="order-2 hidden lg:block">
                <div className="bg-gradient-to-br from-luxury-charcoal/50 to-luxury-accent/30 backdrop-blur-sm rounded-lg p-4 border border-luxury-white/20 shadow-luxury">
                  <h2 className="text-lg font-bold text-luxury-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    خلاصه سفارش
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
                        <span className="text-luxury-silver text-sm">قیمت اصلی:</span>
                        <span className="text-luxury-silver line-through farsi-nums text-sm">${(details.originalPrice / 100).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-luxury-silver text-sm">تخفیف ویژه:</span>
                        <span className="text-green-400 farsi-nums text-sm">-${((details.originalPrice - details.price) / 100).toFixed(0)}</span>
                      </div>
                      <div className="border-t border-luxury-white/10 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-luxury-white font-bold text-base">مجموع:</span>
                          <span className="text-luxury-white font-bold text-xl farsi-nums">${(details.price / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-luxury-white/20">
                    <div className="flex items-center gap-2 text-xs text-luxury-silver">
                      <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>پرداخت ۱۰۰% امن با Stripe</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-luxury-silver">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>ضمانت ۳۰ روزه بازگشت وجه</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-luxury-silver">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
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