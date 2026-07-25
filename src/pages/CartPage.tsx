import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, isLoading, removeFromCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/auth?redirect=/cart');
    }
  }, [user, isLoading, navigate]);

  const totalCents = cartItems.reduce((sum, item) => {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Your Cart" description="Review your selected programs" />
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : cartItems.length === 0 ? (
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
              {cartItems.map((item) => {
                const displayPrice = item.payment_type === 'deposit' && item.deposit_price
                  ? item.deposit_price
                  : item.price_amount;
                return (
                  <Card key={item.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.program_title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{item.payment_type === 'one-time' ? 'One-time' : item.payment_type}</span>
                        {item.payment_type === 'deposit' && item.deposit_price && (
                          <span>• Deposit</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">{formatPrice(displayPrice)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.program_slug)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                );
              })}

              {/* Total & Checkout */}
              <div className="border-t pt-6 mt-6 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-2xl">{totalCents === 0 ? 'Free' : formatPrice(totalCents)}</span>
                </div>
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
                {totalCents > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment powered by Stripe
                  </p>
                )}
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
