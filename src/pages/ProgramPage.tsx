import { useEffect, useState } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, MessageCircle, ShoppingCart, Clock, ArrowLeft, Calendar, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/ui/navigation';
import { SEOHead } from '@/components/SEOHead';
import { useCart } from '@/hooks/useCart';
import { HostBadges } from '@/components/app/HostBadges';
import { useAuth } from '@/hooks/useAuth';
import { useMyEnrollments } from '@/hooks/useMyEnrollments';
import DOMPurify from 'dompurify';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { Link as RLink } from 'react-router-dom';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
  english: '🇺🇸',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
};
const LANGUAGE_LABELS: Record<string, string> = {
  all: 'All languages',
  american: 'English',
  english: 'English',
  persian: 'Persian',
  farsi: 'Persian',
  turkish: 'Turkish',
  spanish: 'Spanish',
};

function sanitizeDescription(html: string): string {
  const sanitized = DOMPurify.sanitize(html);
  return sanitized.replace(
    /<(p|div|h[1-6]|li|blockquote|pre)(?![^>]*?\sdir=)([^>]*)>/gi,
    '<$1 dir="auto"$2>'
  );
}

function formatSessionTime(date: Date): string {
  const time = format(date, 'h:mm a');
  try {
    const parts = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(date);
    const zone = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    return zone ? `${time} ${zone}` : time;
  } catch {
    return time;
  }
}

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
  video_url: string | null;
  cover_image_url: string | null;
  subscription_interval: string | null;
  subscription_interval_count: number | null;
  subscription_full_payment_price: number | null;
  language?: string | null;
}

const convertToEmbedUrl = (url: string): string => {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const ProgramPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart, isAdding, enrollFree, isEnrollingFree } = useCart();
  const { isEnrolled } = useMyEnrollments();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPaymentRedirect, setIsPaymentRedirect] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'full'>('monthly');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }

      if (slug.endsWith('pay')) {
        setIsPaymentRedirect(true);
        const actualSlug = slug.slice(0, -3);
        try {
          const { data, error } = await supabase.functions.invoke('create-payment', {
            body: { program: actualSlug },
          });
          if (error || !data?.url) { setPaymentError('Error'); setLoading(false); return; }
          window.location.href = data.url;
        } catch { setPaymentError('Error'); setLoading(false); }
        return;
      }

      const { data, error } = await supabase
        .from('program_catalog')
        .select('*')
        .ilike('slug', slug)
        .maybeSingle();

      if (error || !data || !data.available_on_web || !data.is_active) {
        setNotFound(true); setLoading(false); return;
      }
      setProgram(data as ProgramData);
      setLoading(false);
    };
    fetchProgram();
  }, [slug]);

  const { data: autoEnrollRound } = useQuery({
    queryKey: ['program-page-auto-round', slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;
      const { data: autoEnroll } = await (supabase as any)
        .from('program_auto_enrollment')
        .select('round_id, program_rounds(*)')
        .eq('program_slug', slug)
        .maybeSingle();
      if (autoEnroll?.program_rounds) return autoEnroll.program_rounds as any;
      const { data: activeRound } = await (supabase as any)
        .from('program_rounds')
        .select('*')
        .eq('program_slug', slug)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return activeRound || null;
    },
  });

  const handleAddToCart = () => {
    if (!user) { navigate(`/auth?redirect=/${slug}`); return; }
    if (!program) return;
    if (program.payment_type === 'free' || program.price_amount === 0) {
      enrollFree(program.slug);
      return;
    }
    addToCart({
      slug: program.slug,
      title: program.title,
      price_amount: program.price_amount,
      payment_type: program.payment_type,
      deposit_price: program.deposit_price,
    });
  };

  const handleAddSubscriptionToCart = (option: 'monthly' | 'full') => {
    if (!program) return;
    if (!user) { navigate(`/auth?redirect=/${slug}`); return; }
    const price = option === 'full'
      ? (program.subscription_full_payment_price || 0)
      : program.price_amount;
    addToCart({
      slug: program.slug,
      title: program.title,
      price_amount: price,
      payment_type: option === 'full' ? 'one-time' : 'subscription',
      deposit_price: null,
      payment_option: option,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{isPaymentRedirect ? 'Redirecting to checkout…' : 'Loading…'}</p>
        </div>
      </div>
    );
  }

  if (paymentError || notFound || !program) return <Navigate to="/404" replace />;

  const isDeposit = program.payment_type === 'deposit';
  const isFree = program.payment_type === 'free' || program.price_amount === 0;
  const isSubscription = program.payment_type === 'subscription';
  const hasFullOption = isSubscription && !!program.subscription_full_payment_price && program.subscription_full_payment_price > 0;
  const displayPrice = isDeposit && program.deposit_price ? program.deposit_price : program.price_amount;
  const inCart = isInCart(program.slug);
  const enrolled = isEnrolled(program.slug);
  const isFarsi = program.language === 'persian' || program.language === 'farsi';

  const handleDirectCheckout = async (option: 'monthly' | 'full') => {
    if (!user) { navigate(`/auth?redirect=/${slug}`); return; }
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { program: program.slug, paymentOption: option },
      });
      if (error || !data?.url) throw new Error('checkout failed');
      window.location.href = data.url;
    } catch {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <SEOHead
        title={`${program.title} | Ladyboss Academy`}
        description={program.description ? program.description.replace(/<[^>]*>/g, '').slice(0, 155) : `Learn about ${program.title}`}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        <main className="flex-grow pt-14 lg:pt-20">
          {/* Back link + badges row */}
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to="/programs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={16} className="mr-1" /> All Programs
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                  {program.type.replace('-', ' ')}
                </span>
                {program.duration && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1 bg-muted/60 px-2.5 py-0.5 rounded-full">
                    <Clock size={12} /> {program.duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <section className="container mx-auto px-4 pb-8 lg:pb-16">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
              {/* Left: Details */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                {/* Cover image */}
                {program.cover_image_url && (
                  <div className="aspect-[16/10] lg:aspect-video rounded-xl lg:rounded-2xl overflow-hidden">
                    <img src={program.cover_image_url} alt={program.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Title & meta */}
                <div>
                  <h1
                    dir="auto"
                    className={`font-display text-2xl md:text-3xl lg:text-4xl font-bold ${isFarsi ? 'font-farsi' : ''}`}
                  >
                    {program.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <HostBadges contentType="program" contentId={program.slug} size="sm" />
                    {program.language && program.language !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        {isFarsi ? (
                          <PersianFlag className="h-4 w-4" />
                        ) : LANG_FLAGS[program.language] ? (
                          <span className="text-base leading-none">{LANG_FLAGS[program.language]}</span>
                        ) : null}
                        <span className="font-medium text-foreground">
                          {LANGUAGE_LABELS[program.language] || program.language}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Video */}
                {program.video_url && (
                  <div className="aspect-[16/10] lg:aspect-video rounded-xl lg:rounded-2xl overflow-hidden bg-muted">
                    {program.video_url.includes('youtube') || program.video_url.includes('youtu.be') ? (
                      <iframe src={convertToEmbedUrl(program.video_url)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={program.title} />
                    ) : program.video_url.includes('vimeo') ? (
                      <iframe src={convertToEmbedUrl(program.video_url)} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={program.title} />
                    ) : (
                      <video src={program.video_url} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                {/* Active Round Details */}
                {autoEnrollRound && (
                  <div className="rounded-xl bg-[hsl(var(--tint-peach,25_100%_96%))] border border-primary/10 shadow-sm p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">
                        {autoEnrollRound.round_name || 'Upcoming Round'}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-sm">
                      {(() => {
                        const sessionDateStr = autoEnrollRound.first_session_date || autoEnrollRound.start_date;
                        if (!sessionDateStr) return null;
                        const sessionDate = sessionDateStr.includes('T')
                          ? new Date(sessionDateStr)
                          : new Date(sessionDateStr + 'T00:00:00');
                        if (isNaN(sessionDate.getTime())) return null;
                        return (
                          <>
                            <p className="text-muted-foreground">
                              Starts <span className="font-medium text-foreground">{format(sessionDate, 'EEEE, MMMM d, yyyy')}</span>
                            </p>
                            {sessionDateStr.includes('T') && format(sessionDate, 'h:mm a') !== '12:00 AM' && (
                              <p className="text-muted-foreground">
                                Time <span className="font-medium text-foreground">{formatSessionTime(sessionDate)}</span>
                              </p>
                            )}
                          </>
                        );
                      })()}
                      {autoEnrollRound.first_session_duration ? (
                        <p className="text-muted-foreground">
                          Duration <span className="font-medium text-foreground">{autoEnrollRound.first_session_duration} min</span>
                        </p>
                      ) : null}
                      {autoEnrollRound.google_meet_link ? (
                        <p className="text-muted-foreground">
                          Meeting on{' '}
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Video className="h-3.5 w-3.5" /> Google Meet
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Features */}
                {program.features?.length > 0 && (
                  <div>
                    <h2 className="font-display text-xl lg:text-2xl font-bold mb-3">What's Included</h2>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {program.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5 bg-muted/50 rounded-lg p-3">
                          <Check className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Sticky pricing card — shown first on mobile so Enroll is visible */}
              <div className="lg:col-span-1 order-first lg:order-last">
                <div className="lg:sticky lg:top-24">
                  <Card className="p-6 space-y-5 border-2">
                    {/* Price */}
                    {hasFullOption ? (
                      <div className="space-y-3">
                        {program.original_price && program.original_price > 0 && (
                          <div className="text-muted-foreground line-through text-base">
                            ${(program.original_price / 100).toFixed(0)}
                          </div>
                        )}
                        <p className="text-sm font-medium text-muted-foreground">Choose your plan</p>

                        {/* Monthly */}
                        <button
                          type="button"
                          onClick={() => setSelectedPlan('monthly')}
                          className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                            selectedPlan === 'monthly'
                              ? 'border-primary bg-primary/5'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">Monthly</span>
                            <span className="text-2xl font-bold">
                              ${(program.price_amount / 100).toFixed(0)}
                              <span className="text-sm font-medium text-muted-foreground">/mo</span>
                            </span>
                          </div>
                          {program.subscription_interval_count && program.subscription_interval_count > 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Billed for {program.subscription_interval_count} months
                            </p>
                          )}
                        </button>

                        {/* Full payment */}
                        <button
                          type="button"
                          onClick={() => setSelectedPlan('full')}
                          className={`relative w-full text-left rounded-xl border-2 p-4 transition-all ${
                            selectedPlan === 'full'
                              ? 'border-primary bg-primary/5'
                              : 'border-border'
                          }`}
                        >
                          {(() => {
                            const monthlyTotal = program.price_amount * (program.subscription_interval_count || 3);
                            const savings = monthlyTotal - (program.subscription_full_payment_price || 0);
                            if (savings <= 0) return null;
                            return (
                              <span className="absolute -top-2.5 right-3 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Save ${(savings / 100).toFixed(0)}
                              </span>
                            );
                          })()}
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">One-time</span>
                            <span className="text-2xl font-bold">
                              ${((program.subscription_full_payment_price || 0) / 100).toFixed(0)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Pay once, full access</p>
                        </button>
                      </div>
                    ) : (
                    <div>
                      {isFree ? (
                        <div className="text-3xl font-bold text-primary">FREE</div>
                      ) : (
                        <div className="space-y-1">
                          {program.original_price && program.original_price > 0 && program.original_price > program.price_amount && (
                            <div className="text-muted-foreground line-through text-lg">
                              ${(program.original_price / 100).toFixed(0)}
                            </div>
                          )}
                          {isDeposit ? (
                            <>
                              <div className="text-3xl font-bold text-foreground">
                                ${(displayPrice / 100).toFixed(0)} <span className="text-sm font-medium text-muted-foreground">deposit</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Full price: ${(program.price_amount / 100).toFixed(0)} • Remaining: ${((program.price_amount - displayPrice) / 100).toFixed(0)}
                              </p>
                            </>
                          ) : (
                            <div className="text-3xl font-bold text-foreground">
                              ${(displayPrice / 100).toFixed(0)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    {/* Add to Cart / In Cart / Enrolled */}
                    {enrolled ? (
                      <Link to="/app/home" className="block">
                        <Button variant="secondary" className="w-full gap-2" size="lg">
                          <Check size={18} /> You're Enrolled — Open in App
                        </Button>
                      </Link>
                    ) : hasFullOption ? (
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        onClick={() => inCart ? navigate('/cart') : handleAddSubscriptionToCart(selectedPlan)}
                        disabled={isAdding}
                      >
                        {inCart ? (
                          <><Check size={18} /> In Your Cart — View Cart</>
                        ) : selectedPlan === 'monthly' ? (
                          <><ShoppingCart size={18} /> Add Monthly — ${(program.price_amount / 100).toFixed(0)}/mo</>
                        ) : (
                          <><ShoppingCart size={18} /> Add One-time — ${((program.subscription_full_payment_price || 0) / 100).toFixed(0)}</>
                        )}
                      </Button>
                    ) : inCart ? (
                      <Link to="/cart" className="block">
                        <Button variant="secondary" className="w-full gap-2" size="lg">
                          <Check size={18} /> In Your Cart — View Cart
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full gap-2" size="lg" onClick={handleAddToCart} disabled={isAdding || isEnrollingFree}>
                        {isFree ? (
                          <><Check size={18} /> {isEnrollingFree ? 'Enrolling…' : (user ? 'Enroll for Free' : 'Sign In to Enroll')}</>
                        ) : (
                          <><ShoppingCart size={18} /> {isDeposit ? `Add to Cart — $${(displayPrice / 100).toFixed(0)} Deposit` : 'Add to Cart'}</>
                        )}
                      </Button>
                    )}

                    <div className="pt-2 space-y-3 text-center">
                      <a
                        href="https://t.me/ladybosslook"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <MessageCircle size={16} /> Questions? Chat on Telegram
                      </a>
                      <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Description — below enroll section */}
          {program.description && (
            <section className="container mx-auto px-4 pb-16">
              <div
                dir="auto"
                className={`prose prose-lg prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground max-w-none ${isFarsi ? 'font-farsi' : ''}`}
                dangerouslySetInnerHTML={{ __html: sanitizeDescription(program.description) }}
              />
            </section>
          )}
        </main>

        <footer className="bg-card border-t border-border mt-8">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © 2024 LadyBoss Academy. All rights reserved. Empowering women worldwide.
              </p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                <RLink to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</RLink>
                <RLink to="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</RLink>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProgramPage;
