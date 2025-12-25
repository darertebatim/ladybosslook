import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import DOMPurify from 'dompurify';

interface ProgramData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  features: string[];
  price_amount: number;
  original_price: number | null;
  deposit_price: number | null;
  payment_type: string;
  type: string;
  duration: string | null;
  available_on_web: boolean;
  is_active: boolean;
  stripe_payment_link: string | null;
}

const ProgramPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPaymentRedirect, setIsPaymentRedirect] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check if this is a payment redirect (slug ends with "pay")
      if (slug.endsWith('pay')) {
        console.log('[ProgramPage] Detected payment redirect:', slug);
        setIsPaymentRedirect(true);
        
        // Extract actual slug by removing 'pay' suffix
        const actualSlug = slug.slice(0, -3);
        console.log('[ProgramPage] Extracted slug for payment:', actualSlug);
        
        try {
          const { data, error } = await supabase.functions.invoke('create-payment', {
            body: {
              program: actualSlug
            }
          });

          if (error) {
            console.error('[ProgramPage] Payment creation error:', error);
            setPaymentError('Error creating payment. Please try again.');
            setLoading(false);
            return;
          }

          if (data?.url) {
            console.log('[ProgramPage] Redirecting to Stripe:', data.url);
            window.location.href = data.url;
          } else {
            setPaymentError('Error creating payment. Please try again.');
            setLoading(false);
          }
        } catch (error) {
          console.error('[ProgramPage] Payment error:', error);
          setPaymentError('Error creating payment. Please try again.');
          setLoading(false);
        }
        
        return;
      }

      console.log('[ProgramPage] Fetching program with slug:', slug);

      // Fetch program data with case-insensitive slug matching
      const { data, error } = await supabase
        .from('program_catalog')
        .select('*')
        .ilike('slug', slug)
        .maybeSingle();

      console.log('[ProgramPage] Query result:', { data, error });

      if (error) {
        console.error('[ProgramPage] Error fetching program:', error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('[ProgramPage] No program found with slug:', slug);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!data.available_on_web) {
        console.log('[ProgramPage] Program not available on web:', slug);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!data.is_active) {
        console.log('[ProgramPage] Program not active:', slug);
        setNotFound(true);
        setLoading(false);
        return;
      }

      console.log('[ProgramPage] Program loaded successfully:', data.title);
      setProgram(data as ProgramData);
      setLoading(false);
    };

    fetchProgram();
  }, [slug]);

  const handlePayment = () => {
    window.location.href = `/${slug}pay`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
        <div className="bg-card p-8 rounded-lg shadow-lg text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          {isPaymentRedirect ? (
            <>
              <p className="text-xl font-semibold">Redirecting to secure checkout...</p>
              <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
            </>
          ) : (
            <p className="text-xl font-semibold">Loading program...</p>
          )}
        </div>
      </div>
    );
  }

  if (paymentError) {
    return <Navigate to="/404" replace />;
  }

  if (notFound || !program) {
    return <Navigate to="/404" replace />;
  }

  const isDeposit = program.payment_type === 'deposit';
  const isFree = program.payment_type === 'free';
  const displayPrice = isDeposit && program.deposit_price ? program.deposit_price : program.price_amount;

  return (
    <>
      <SEOHead 
        title={`${program.title} | Ladyboss Academy`}
        description={program.description || `Learn more about ${program.title}`}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 md:py-32">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 text-sm font-medium">
                  {program.type}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
                  {program.title}
                </h1>
                
                {/* Price Display */}
                <div className="mb-10 flex flex-col items-center gap-3">
                  {isFree ? (
                    <div className="text-4xl font-bold text-green-600 bg-green-50 dark:bg-green-950 px-8 py-4 rounded-xl">
                      FREE
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {program.original_price && program.original_price > program.price_amount && (
                        <div className="text-xl text-muted-foreground line-through">
                          Was ${(program.original_price / 100).toFixed(0)}
                        </div>
                      )}
                      {isDeposit ? (
                        <div className="bg-card border-2 border-orange-500/20 rounded-2xl p-6 shadow-lg">
                          <div className="text-5xl font-bold text-orange-600 mb-2">
                            ${(displayPrice / 100).toFixed(0)}
                          </div>
                          <div className="text-sm font-medium text-orange-600 mb-3">
                            DEPOSIT ONLY
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Full price: ${(program.price_amount / 100).toFixed(0)} • 
                            Remaining balance: ${((program.price_amount - displayPrice) / 100).toFixed(0)}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20 shadow-lg">
                          <div className="text-5xl font-bold text-primary">
                            ${(displayPrice / 100).toFixed(0)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button 
                  onClick={isFree ? undefined : handlePayment}
                  size="lg"
                  className="text-lg px-12 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  disabled={isFree}
                >
                  {isFree ? 'Sign In to Enroll' : isDeposit ? `Secure Your Spot - Pay $${(displayPrice / 100).toFixed(0)} Deposit` : 'Enroll Now'}
                </Button>

                {program.duration && (
                  <p className="text-muted-foreground mt-6 text-lg flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    {program.duration}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Description Section */}
          {program.description && (
            <section className="py-20 bg-card/50">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
                    <div 
                      className="prose prose-lg prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(program.description) }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Features Section */}
          {program.features && program.features.length > 0 && (
            <section className="py-20">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">What's Included</h2>
                    <p className="text-muted-foreground text-lg">Everything you need to succeed</p>
                  </div>
                  <div className="grid gap-4 md:gap-6">
                    {program.features.map((feature, index) => (
                      <div key={index} className="group flex items-start gap-4 bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                        <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-lg flex-1 pt-1">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Final CTA Section */}
          <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform?</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Join hundreds of successful students who have already enrolled
                </p>
                <Button 
                  onClick={isFree ? undefined : handlePayment}
                  size="lg"
                  className="text-lg px-12 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mb-8"
                  disabled={isFree}
                >
                  {isFree ? 'Sign In to Enroll' : isDeposit ? `Secure Your Spot - Pay $${(displayPrice / 100).toFixed(0)} Deposit` : 'Enroll Now'}
                </Button>
                <div className="flex flex-col items-center gap-4">
                  <a 
                    href="https://t.me/ladybosslook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Have questions? Chat with us on Telegram
                  </a>
                  <p className="text-sm text-muted-foreground">
                    Secure payment powered by Stripe
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProgramPage;
