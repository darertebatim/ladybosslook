import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';

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
        setNotFound(true);
      } else {
        setProgram(data as ProgramData);
      }
      setLoading(false);
    };

    fetchProgram();
  }, [slug]);

  const handlePayment = () => {
    window.location.href = `/${slug}pay`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">{program.title}</h1>
                
                {/* Price Display */}
                <div className="mb-8">
                  {isFree ? (
                    <div className="text-3xl font-bold text-green-600">FREE</div>
                  ) : (
                    <div className="space-y-2">
                      {program.original_price && program.original_price > program.price_amount && (
                        <div className="text-2xl text-muted-foreground line-through">
                          ${(program.original_price / 100).toFixed(0)}
                        </div>
                      )}
                      {isDeposit ? (
                        <>
                          <div className="text-4xl font-bold text-orange-600">
                            ${(displayPrice / 100).toFixed(0)} Deposit
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Full price: ${(program.price_amount / 100).toFixed(0)} • 
                            Remaining: ${((program.price_amount - displayPrice) / 100).toFixed(0)}
                          </div>
                        </>
                      ) : (
                        <div className="text-4xl font-bold text-primary">
                          ${(displayPrice / 100).toFixed(0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button 
                  onClick={isFree ? undefined : handlePayment}
                  size="lg"
                  className="text-lg px-8 py-6"
                  disabled={isFree}
                >
                  {isFree ? 'Sign In to Enroll' : isDeposit ? `Pay ${(displayPrice / 100).toFixed(0)}$ Deposit Now` : 'Enroll Now'}
                </Button>

                {program.duration && (
                  <p className="text-muted-foreground mt-4">{program.duration}</p>
                )}
              </div>
            </div>
          </section>

          {/* Description Section */}
          {program.description && (
            <section className="py-16 bg-background">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: program.description }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Features Section */}
          {program.features && program.features.length > 0 && (
            <section className="py-16 bg-muted/30">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl font-bold mb-8 text-center">What You'll Get</h2>
                  <div className="grid gap-4">
                    {program.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 bg-card p-4 rounded-lg">
                        <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <span className="text-lg">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Final CTA Section */}
          <section className="py-16 bg-primary/5">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
              <Button 
                onClick={isFree ? undefined : handlePayment}
                size="lg"
                className="text-lg px-8 py-6 mb-4"
                disabled={isFree}
              >
                {isFree ? 'Sign In to Enroll' : isDeposit ? `Pay ${(displayPrice / 100).toFixed(0)}$ Deposit Now` : 'Enroll Now'}
              </Button>
              <div className="mt-6">
                <a 
                  href="https://t.me/ladybosslook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <MessageCircle className="w-5 h-5" />
                  Questions? Contact us on Telegram
                </a>
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
