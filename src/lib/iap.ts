// TODO: Install @capacitor-community/in-app-purchases manually
// Run: npm install @capacitor-community/in-app-purchases
// import { InAppPurchase2 } from '@capacitor-community/in-app-purchases';
import { isIOSApp } from './platform';

// Placeholder types until plugin is installed
const InAppPurchase2 = {
  initialize: async (_config: any) => {},
  getProducts: async (_config: any) => ({ products: [] as any[] }),
  purchase: async (_config: any) => ({ productIdentifier: '', transactionId: '', transactionReceipt: '' }),
  restorePurchases: async () => ({ transactions: [] as any[] }),
  finishTransaction: async (_config: any) => {},
};

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

    try {
      await InAppPurchase2.initialize({
        enablePendingPurchases: true,
      });
      this.initialized = true;
      console.log('IAP initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      throw error;
    }
  }

  async getProducts(productIds: string[]): Promise<IAPProduct[]> {
    if (!isIOSApp()) return [];

    try {
      await this.initialize();
      
      const { products } = await InAppPurchase2.getProducts({
        productIdentifiers: productIds,
      });

      return products.map(p => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        price: p.price || '',
        currency: p.currency || 'USD',
      }));
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchase(productId: string): Promise<{ success: boolean; transactionId?: string; receipt?: string }> {
    if (!isIOSApp()) {
      return { success: false };
    }

    try {
      await this.initialize();

      const { productIdentifier, transactionId, transactionReceipt } = await InAppPurchase2.purchase({
        productIdentifier: productId,
      });

      console.log('Purchase successful:', { productIdentifier, transactionId });

      return {
        success: true,
        transactionId,
        receipt: transactionReceipt,
      };
    } catch (error) {
      console.error('Purchase failed:', error);
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
