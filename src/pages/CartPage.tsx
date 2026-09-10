import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, ShoppingBag, ArrowRight, Loader2, Lock, Zap, MessageCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { useCart, PENDING_CART_KEY, type CartItem } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { usePrograms } from '@/hooks/usePrograms';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import InlineAuth from '@/components/checkout/InlineAuth';

/** Item a signed-out visitor picked — kept in localStorage until they sign in. */
const readGuestItem = (): CartItem | null => {
  try {
    const raw = localStorage.getItem(PENDING_CART_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.slug || !p?.title) return null;
    return {
      id: 'guest',
      user_id: 'guest',
      program_slug: p.slug,
      program_title: p.title,
      price_amount: p.price_amount ?? 0,
      payment_type: p.payment_type ?? 'one-time',
      deposit_price: p.deposit_price ?? null,
      payment_option: p.payment_option ?? null,
      added_by: null,
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, isLoading, removeFromCart } = useCart();
  const { getProgramBySlug } = usePrograms();
  const [checkingOut, setCheckingOut] = useState(false);
  const [guestItem, setGuestItem] = useState<CartItem | null>(() => readGuestItem());

  useEffect(() => {
    if (user) setGuestItem(null);
  }, [user]);

  const displayItems: CartItem[] = user ? cartItems : (guestItem ? [guestItem] : []);

  const totalCents = displayItems.reduce((sum, item) => {
    const price = item.payment_type === 'deposit' && item.deposit_price
      ? item.deposit_price
      : item.price_amount;
    return sum + price;
  }, 0);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const subscriptionItem = cartItems.find((i) => i.payment_type === 'subscription');
      const { data, error } = subscriptionItem
        ? await supabase.functions.invoke('create-payment', {
            body: {
              program: subscriptionItem.program_slug,
              paymentOption: subscriptionItem.payment_option || 'monthly',
            },
          })
        : await supabase.functions.invoke('create-cart-checkout');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not create checkout session');
      }
    } catch {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  const removeItem = (slug: string) => {
    if (user) {
      removeFromCart(slug);
    } else {
      localStorage.removeItem(PENDING_CART_KEY);
      setGuestItem(null);
      toast.success('Removed from cart');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Your Cart" description="Review your selected programs" />
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>

          {user && isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40" />
              <h2 className="text-xl font-semibold">Your cart is empty</h2>
              <p className="text-muted-foreground">Browse our programs to find the perfect fit</p>
              <Link to="/programs">
                <Button className="mt-4">
                  Browse Programs <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayItems.map((item) => {
                const displayPrice = item.payment_type === 'deposit' && item.deposit_price
                  ? item.deposit_price
                  : item.price_amount;
                const program = getProgramBySlug(item.program_slug);
                const remaining = item.payment_type === 'deposit' && item.deposit_price
                  ? item.price_amount - item.deposit_price
                  : 0;
                return (
                  <Card key={item.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      {program?.image ? (
                        <img
                          src={program.image}
                          alt={item.program_title}
                          loading="lazy"
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-border/50"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-7 h-7 text-primary/50" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-snug">{item.program_title}</h3>
                        {program?.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {program.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-2">
                          <span className="capitalize px-2 py-0.5 rounded-full bg-muted">
                            {item.payment_type === 'one-time' ? 'One-time payment' : item.payment_type}
                          </span>
                          {program?.duration && (
                            <span className="px-2 py-0.5 rounded-full bg-muted">{program.duration}</span>
                          )}
                        </div>
                        {item.payment_type === 'deposit' && remaining > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Pay {formatPrice(displayPrice)} today • {formatPrice(remaining)} remaining later
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="font-bold text-lg">{formatPrice(displayPrice)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.program_title} from cart`}
                          onClick={() => removeItem(item.program_slug)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {user && (
                <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                  <CheckCircle2 className="w-4 h-4" /> Saved to your account — signed in as {user.email}
                </p>
              )}

              {/* Total & Checkout */}
              <div className="border-t pt-6 mt-6 space-y-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{totalCents === 0 ? 'Free' : formatPrice(totalCents)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total due today</span>
                  <span className="font-bold text-2xl">{totalCents === 0 ? 'Free' : formatPrice(totalCents)}</span>
                </div>
                {user ? (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={checkingOut}
                    >
                      {checkingOut ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : totalCents === 0 ? (
                        <>Enroll for Free <ArrowRight className="ml-2 w-4 h-4" /></>
                      ) : (
                        <>Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" /></>
                      )}
                    </Button>
                  </>
                ) : (
                  <InlineAuth
                    ctaLabel={totalCents === 0 ? 'Continue to enroll' : 'Continue to payment'}
                  />
                )}

                {/* Trust & reassurance */}
                <div className="grid gap-2 text-xs text-muted-foreground pt-1">
                  {totalCents > 0 && (
                    <p className="flex items-center justify-center gap-2">
                      <Lock className="w-3.5 h-3.5" /> Secure payment powered by Stripe
                    </p>
                  )}
                  <p className="flex items-center justify-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Instant access right after checkout
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Smartphone className="w-3.5 h-3.5" /> Open the Rilo app → My Programs to start
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-sm">
                  <Link to="/programs" className="text-muted-foreground hover:text-foreground underline underline-offset-4">
                    Continue browsing programs
                  </Link>
                  <span className="hidden sm:inline text-muted-foreground/40">•</span>
                  <button
                    onClick={() => navigate('/dashboard/chat')}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Questions? Chat with us
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
