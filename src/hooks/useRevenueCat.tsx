import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { purchaseProduct, restorePurchases } from '@/lib/revenueCat';
import { haptic } from '@/lib/haptics';

export function useRevenueCat() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const queryClient = useQueryClient();

  const handlePurchase = useCallback(async (productId: string, plan: 'monthly' | 'annual') => {
    if (isPurchasing) return;
    setIsPurchasing(true);

    try {
      console.log('[useRC] Starting purchase:', productId, plan);
      const result = await purchaseProduct(productId);

      if (result.success) {
        haptic.success();
        toast.success('Welcome to simora+! 🎉', {
          description: 'Your premium features are now unlocked.',
        });
        // Invalidate subscription queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      } else if (result.error === 'cancelled') {
        // User cancelled - do nothing
      } else {
        toast.error('Purchase failed', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (error) {
      console.error('[useRC] Purchase error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, [isPurchasing, queryClient]);

  const handleRestore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);

    try {
      const result = await restorePurchases();

      if (result.success && result.hasActive) {
        haptic.success();
        toast.success('Purchases restored! 🎉', {
          description: 'Your subscription is active.',
        });
        queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      } else if (result.success && !result.hasActive) {
        toast.info('No active subscriptions found', {
          description: 'Make sure you\'re using the same Apple ID.',
        });
      } else {
        toast.error('Restore failed', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (error) {
      console.error('[useRC] Restore error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, queryClient]);

  return {
    handlePurchase,
    handleRestore,
    isPurchasing,
    isRestoring,
  };
}
