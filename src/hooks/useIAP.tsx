import { useState, useEffect } from 'react';
import { iapService, IAPProduct } from '@/lib/iap';
import { isIOSApp, isRealDevice } from '@/lib/platform';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useIAP = (productIds: string[]) => {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isIOSApp() || productIds.length === 0) {
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        // Check if running on real device (not simulator)
        const realDevice = await isRealDevice();
        if (!realDevice) {
          console.log('[IAP] Simulator detected, skipping product load');
          setLoading(false);
          return;
        }

        const fetchedProducts = await iapService.getProducts(productIds);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [productIds, toast]);

  const purchase = async (productId: string, programSlug: string) => {
    setPurchasing(true);

    try {
      const result = await iapService.purchase(productId);

      if (!result.success) {
        throw new Error('Purchase failed');
      }

      // RevenueCat handles receipt validation automatically
      // Just create the enrollment directly
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create order record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          program_slug: programSlug,
          product_name: productId,
          amount: 0, // Will be updated by RevenueCat webhook
          status: 'completed',
          payment_type: 'ios_iap',
        });

      if (orderError) {
        console.error('Failed to create order:', orderError);
      }

      // Create course enrollment
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_name: programSlug,
          program_slug: programSlug,
          status: 'active',
        });

      if (enrollError && enrollError.code !== '23505') { // Ignore duplicate error
        throw enrollError;
      }

      toast({
        title: 'Purchase Successful',
        description: 'You now have access to this content!',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    setLoading(true);
    try {
      const productIds = await iapService.restorePurchases();
      
      toast({
        title: 'Purchases Restored',
        description: `${productIds.length} purchase(s) restored`,
      });

      return productIds;
    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore purchases',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    purchasing,
    purchase,
    restorePurchases,
  };
};
