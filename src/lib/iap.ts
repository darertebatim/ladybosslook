// IAP Implementation for iOS
// Note: Currently using Stripe for payments. To enable native iOS IAP:
// 1. Add a Capacitor IAP plugin (e.g., @revenuecat/purchases-capacitor)
// 2. Configure products in App Store Connect
// 3. Update this file to use the plugin
import { isIOSApp } from './platform';

// Currently IAP is not available - using Stripe instead
const InAppPurchase2 = {
  initialize: async (_config: any) => Promise.resolve(),
  getProducts: async (_config: any) => Promise.resolve({ products: [] }),
  purchase: async (_config: any) => Promise.reject(new Error('IAP not configured - use Stripe')),
  restorePurchases: async () => Promise.resolve({ transactions: [] }),
  finishTransaction: async (_config: any) => Promise.resolve(),
};

const pluginAvailable = false;

export interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

class IAPService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (!isIOSApp() || this.initialized) return;
    
    if (!pluginAvailable) {
      console.warn('[IAP] Plugin not available, skipping initialization');
      return;
    }

    try {
      await InAppPurchase2.initialize({
        enablePendingPurchases: true,
      });
      this.initialized = true;
      console.log('[IAP] Initialized successfully');
    } catch (error) {
      console.error('[IAP] Failed to initialize:', error);
      // Don't throw - fail gracefully
    }
  }

  async getProducts(productIds: string[]): Promise<IAPProduct[]> {
    if (!isIOSApp() || !pluginAvailable) {
      console.warn('[IAP] Plugin not available for getProducts');
      return [];
    }

    try {
      await this.initialize();
      
      const { products } = await InAppPurchase2.getProducts({
        productIdentifiers: productIds,
      });

      return products.map((p: any) => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        price: p.price || '',
        currency: p.currency || 'USD',
      }));
    } catch (error) {
      console.error('[IAP] Failed to get products:', error);
      return [];
    }
  }

  async purchase(productId: string): Promise<{ success: boolean; transactionId?: string; receipt?: string }> {
    if (!isIOSApp() || !pluginAvailable) {
      console.error('[IAP] Plugin not available for purchase');
      return { success: false };
    }

    try {
      await this.initialize();

      const result: any = await InAppPurchase2.purchase({
        productIdentifier: productId,
      });

      console.log('[IAP] Purchase successful:', result);

      return {
        success: true,
        transactionId: result?.transactionId,
        receipt: result?.transactionReceipt,
      };
    } catch (error) {
      console.error('[IAP] Purchase failed:', error);
      return { success: false };
    }
  }

  async restorePurchases(): Promise<string[]> {
    if (!isIOSApp()) return [];

    try {
      await this.initialize();
      
      const result: any = await InAppPurchase2.restorePurchases();
      
      return result?.transactions?.map((t: any) => t.productId) || [];
    } catch (error) {
      console.error('[IAP] Failed to restore purchases:', error);
      return [];
    }
  }

  async finishTransaction(transactionId: string): Promise<void> {
    if (!isIOSApp()) return;

    try {
      await InAppPurchase2.finishTransaction({ transactionId });
    } catch (error) {
      console.error('Failed to finish transaction:', error);
    }
  }
}

export const iapService = new IAPService();
