import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PENDING_CART_KEY = 'simora_pending_cart_item';

interface PendingCartProgram {
  slug: string;
  title: string;
  price_amount: number;
  payment_type: string;
  deposit_price?: number | null;
  payment_option?: string | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  program_slug: string;
  program_title: string;
  price_amount: number;
  payment_type: string;
  deposit_price: number | null;
  payment_option: string | null;
  added_by: string | null;
  created_at: string;
}

export const useCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CartItem[];
    },
    enabled: !!user,
  });

  // Enroll a free program directly (no cart / no Stripe)
  const enrollFreeMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (!user) {
        // Deferred action: remember the free enrollment so it resumes after sign-in.
        localStorage.setItem(PENDING_FREE_KEY, slug);
        navigate(`/auth?redirect=${window.location.pathname}`);
        throw new Error('Sign in required');
      }
      const { data, error } = await supabase.functions.invoke('enroll-free-programs', {
        body: { slugs: [slug] },
      });
      if (error) throw error;
      return { data, slug };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['active-enrollments'] });
      toast.success("You're enrolled!");
      const slug = (result as any)?.slug;
      navigate(`/payment-success?free=1${slug ? `&programs=${encodeURIComponent(slug)}` : ''}`);
    },
    onError: (err: Error) => {
      if (err.message !== 'Sign in required') {
        toast.error('Could not enroll. Please try again.');
      }
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (program: PendingCartProgram) => {
      if (!user) {
        // Deferred action: remember the item so we can auto-add it after sign-in.
        localStorage.setItem(PENDING_CART_KEY, JSON.stringify(program));
        navigate(`/auth?redirect=${window.location.pathname}`);
        throw new Error('Sign in required');
      }
      const { error } = await supabase.from('cart_items').upsert({
        user_id: user.id,
        program_slug: program.slug,
        program_title: program.title,
        price_amount: program.price_amount,
        payment_type: program.payment_type,
        deposit_price: program.deposit_price ?? null,
        payment_option: program.payment_option ?? null,
      }, { onConflict: 'user_id,program_slug' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      toast.success('Added to cart');
      navigate('/cart');
    },
    onError: (err: Error) => {
      if (err.message !== 'Sign in required') {
        toast.error('Could not add to cart');
      }
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (programSlug: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('program_slug', programSlug);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      toast.success('Removed from cart');
    },
  });

  // After sign-in, automatically complete a cart add that was interrupted by auth.
  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(PENDING_CART_KEY);
    if (!raw) return;
    // Claim it synchronously so other mounted useCart instances don't double-add.
    localStorage.removeItem(PENDING_CART_KEY);
    try {
      const program = JSON.parse(raw) as PendingCartProgram;
      if (program?.slug && program?.title) {
        addToCartMutation.mutate(program);
      }
    } catch {
      // ignore malformed payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isInCart = (programSlug: string) =>
    cartItems.some((item) => item.program_slug === programSlug);

  return {
    cartItems,
    cartCount: cartItems.length,
    isLoading,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    isInCart,
    isAdding: addToCartMutation.isPending,
    enrollFree: enrollFreeMutation.mutate,
    isEnrollingFree: enrollFreeMutation.isPending,
  };
};
