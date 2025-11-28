import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import NotFound from './NotFound';

interface ProgramData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_amount: number;
  original_price: number | null;
  deposit_price: number | null;
  payment_type: string;
  type: string;
  duration: string | null;
  features: string[] | null;
  is_active: boolean;
  available_on_web: boolean;
}

const DynamicProgramRoute = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  // Check if this is a payment redirect (ends with 'pay')
  const isPaymentRedirect = rawSlug?.endsWith('pay');
  const slug = isPaymentRedirect && rawSlug ? rawSlug.slice(0, -3) : rawSlug;

  useEffect(() => {
    const fetchProgram = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('program_catalog')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('available_on_web', true)
        .single();

      if (error || !data) {
        console.error('Error fetching program:', error);
        setNotFound(true);
      } else {
        setProgram(data as ProgramData);
        
        // If this is a payment redirect, initiate payment immediately
        if (isPaymentRedirect) {
          initiatePayment(slug);
        }
      }
      
      setLoading(false);
    };

    fetchProgram();
  }, [slug, isPaymentRedirect]);

  const initiatePayment = async (programSlug: string) => {
    try {
      setRedirecting(true);
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          program: programSlug
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        setNotFound(true);
        setRedirecting(false);
        return;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setNotFound(true);
        setRedirecting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setNotFound(true);
      setRedirecting(false);
    }
  };

  const handlePayment = () => {
    if (slug) {
      initiatePayment(slug);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Not found state
  if (notFound || !program) {
    return <NotFound />;
  }

  // Payment redirect loading state
  if (isPaymentRedirect && redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
        <div className="bg-card p-8 rounded-lg shadow-lg text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl font-semibold">Redirecting to secure checkout...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Product page display
  const isDeposit = program.payment_type === 'deposit';
  const isFree = program.payment_type === 'free';
  const displayPrice = isDeposit ? program.deposit_price : program.price_amount;
  const hasOriginalPrice = program.original_price && program.original_price > (displayPrice || 0);

  return (
    <>
      <SEOHead 
        title={program.title}
        description={program.description || `Learn more about ${program.title}`}
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{program.title}</h1>
              
              {/* Pricing */}
              <div className="mb-6">
                {isFree ? (
                  <p className="text-3xl font-bold text-primary">Free</p>
                ) : (
                  <div className="flex items-center gap-4">
                    {hasOriginalPrice && (
                      <span className="text-2xl text-muted-foreground line-through">
                        ${program.original_price}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-primary">
                      ${displayPrice}
                    </span>
                    {isDeposit && (
                      <span className="text-sm text-orange-500 font-semibold">
                        Deposit Only
                      </span>
                    )}
                  </div>
                )}
                {isDeposit && program.original_price && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Full price: ${program.original_price} (remaining balance due separately)
                  </p>
                )}
              </div>

              {/* Description */}
              {program.description && (
                <div 
                  className="prose prose-lg max-w-none mb-8 text-foreground"
                  dangerouslySetInnerHTML={{ __html: program.description }}
                />
              )}

              {/* Duration and Type */}
              <div className="flex gap-4 mb-8 text-sm text-muted-foreground">
                {program.duration && <span>Duration: {program.duration}</span>}
                <span>Type: {program.type}</span>
              </div>

              {/* Features */}
              {program.features && program.features.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">What You'll Get</h2>
                  <ul className="space-y-3">
                    {program.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!isFree && (
                  <Button 
                    size="lg" 
                    className="text-lg px-8"
                    onClick={handlePayment}
                    disabled={redirecting}
                  >
                    {redirecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isDeposit ? `Pay Deposit ($${displayPrice})` : `Enroll Now - $${displayPrice}`}
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8"
                  onClick={() => window.open('https://t.me/ladybosslook', '_blank')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DynamicProgramRoute;
