import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Star, Clock, ShoppingCart, Check } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { usePrograms } from '@/hooks/usePrograms';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import type { Program } from '@/data/programs';
import DOMPurify from 'dompurify';

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html), 'text/html');
  return doc.body.textContent || '';
};

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  'course': { label: 'Self-Paced Courses', icon: '📚' },
  'group-coaching': { label: 'Group Coaching', icon: '👥' },
  '1o1-session': { label: '1-on-1 Coaching', icon: '🎯' },
  'event': { label: 'Live Events', icon: '📅' },
  'webinar': { label: 'Online Webinars', icon: '🎥' },
  'audiobook': { label: 'Audiobooks', icon: '🎧' },
  'subscription': { label: 'Memberships', icon: '⭐' },
};

const ProgramCard = ({ program }: { program: Program }) => {
  const { addToCart, isInCart, isAdding } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inCart = isInCart(program.slug);
  const cleanDesc = stripHtml(program.description).slice(0, 120);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/auth?redirect=/programs`);
      return;
    }
    addToCart({
      slug: program.slug,
      title: program.title,
      price_amount: Math.round(program.priceAmount * 100),
      payment_type: program.paymentType,
    });
  };

  return (
    <Link to={`/${program.slug}`} className="block group">
      <Card className="overflow-hidden border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-[16/10] overflow-hidden relative">
          {program.image ? (
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          {program.duration && (
            <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock size={12} />
              {program.duration}
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {program.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {cleanDesc}{cleanDesc.length >= 120 ? '…' : ''}
          </p>

          <div className="flex items-end justify-between mt-auto">
            <div>
              {program.originalPrice && (
                <span className="text-sm text-muted-foreground line-through mr-2">
                  {program.originalPrice}
                </span>
              )}
              <span className="text-xl font-bold text-foreground">
                {program.isFree ? 'Free' : program.price}
              </span>
            </div>

            {inCart ? (
              <Link to="/cart" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <Check size={14} /> In Cart
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAdding || program.isFree}
                className="gap-1.5"
              >
                <ShoppingCart size={14} /> Add to Cart
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

const Programs = () => {
  const { programs, getProgramsByType, isLoading } = usePrograms();

  const sections = Object.entries(TYPE_LABELS)
    .map(([type, meta]) => ({
      type,
      ...meta,
      programs: getProgramsByType(type as Program['type']),
    }))
    .filter((s) => s.programs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Programs & Courses - Transform Your Business & Life"
        description="Discover our programs designed to accelerate your success. From business coaching to personal development."
      />
      <Navigation />

      <main>
        {/* Hero */}
        <section className="pt-28 pb-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Our Programs
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive training programs designed to fast-track your success with proven methodologies and expert coaching.
            </p>
          </div>
        </section>

        {/* Loading */}
        {isLoading ? (
          <section className="py-16">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[16/10] bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
            {sections.map((section) => (
              <section key={section.type} className="py-12 first:pt-8">
                <div className="container mx-auto px-6">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-2xl">{section.icon}</span>
                    <h2 className="font-display text-2xl md:text-3xl font-bold">
                      {section.label}
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.programs.map((program) => (
                      <ProgramCard key={program.slug} program={program} />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </>
        )}

        {/* Bottom CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-hero p-8 md:p-12 rounded-2xl text-white text-center max-w-3xl mx-auto">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Not Sure Which Program is Right?
              </h3>
              <p className="text-white/90 mb-6">
                Book a free consultation with our success coaches.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => window.open('https://wa.me/16265028589', '_blank')}
              >
                Book Free Consultation
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Programs;
