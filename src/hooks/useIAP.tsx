import { useState, useEffect } from 'react';
import { iapService, IAPProduct } from '@/lib/iap';
import { isIOSApp } from '@/lib/platform';
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
      // Get user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Set user ID in RevenueCat
      await iapService.setUserId(user.id);

      // Make the purchase
      const result = await iapService.purchase(productId);

      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      // RevenueCat handles receipt validation automatically
      // Now create the enrollment in our database
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .upsert({
          user_id: user.id,
          program_slug: programSlug,
          status: 'active',
        } as any);

      if (enrollError) {
        console.error('Enrollment error:', enrollError);
        // Don't fail the purchase if enrollment fails - they still own it in RevenueCat
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
      const customerInfo = await iapService.restorePurchases();
      
      if (customerInfo) {
        const entitlements = Object.keys(customerInfo.entitlements.active);
        
        toast({
          title: 'Purchases Restored',
          description: `${entitlements.length} purchase(s) restored`,
        });

        return entitlements;
      }
      
      return [];
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
