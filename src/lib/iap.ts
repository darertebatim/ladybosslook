// Using @awesome-cordova-plugins/in-app-purchase-2 (installed)
// Note: This is a Cordova plugin wrapper, may have compatibility issues with Capacitor
import { isIOSApp } from './platform';

// Safe fallback that won't freeze the app
const SafeFallback = {
  initialize: async () => Promise.resolve(),
  getProducts: async () => Promise.resolve({ products: [] }),
  purchase: async () => Promise.reject(new Error('IAP not available')),
  restorePurchases: async () => Promise.resolve({ transactions: [] }),
  finishTransaction: async () => Promise.resolve(),
};

// Try to import plugin, fallback to safe implementation
let InAppPurchase2: any = SafeFallback;
let pluginAvailable = false;

// Dynamic import attempt
(async () => {
  try {
    const iapModule = await import('@awesome-cordova-plugins/in-app-purchase-2');
    InAppPurchase2 = iapModule.InAppPurchase2;
    pluginAvailable = true;
    console.log('[IAP] Plugin loaded successfully');
  } catch (error) {
    console.warn('[IAP] Plugin not available, using safe fallback');
  }
})();

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

      const result = await InAppPurchase2.purchase({
        productIdentifier: productId,
      });

      console.log('[IAP] Purchase successful:', result);

      return {
        success: true,
        transactionId: result.transactionId,
        receipt: result.transactionReceipt,
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
      
      const { transactions } = await InAppPurchase2.restorePurchases();
      
      return transactions.map(t => t.productId);
    } catch (error) {
      console.error('Failed to restore purchases:', error);
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
