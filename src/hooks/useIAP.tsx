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
      const result = await iapService.purchase(productId);

      if (!result.success) {
        throw new Error('Purchase failed');
      }

      // Verify receipt with backend
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('verify-iap-receipt', {
        body: {
          receipt: result.receipt,
          transactionId: result.transactionId,
          productId,
          programSlug,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.verified) {
        // Finish the transaction
        if (result.transactionId) {
          await iapService.finishTransaction(result.transactionId);
        }

        toast({
          title: 'Purchase Successful',
          description: 'You now have access to this content!',
        });

        return { success: true };
      } else {
        throw new Error('Receipt verification failed');
      }
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
