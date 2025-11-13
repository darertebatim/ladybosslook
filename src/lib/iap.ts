// Native iOS In-App Purchase using RevenueCat
// RevenueCat is a reliable IAP solution that handles receipt validation and cross-platform support
import { Purchases, CustomerInfo, PurchasesStoreProduct } from '@revenuecat/purchases-capacitor';
import { isIOSApp } from './platform';

export interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  priceAmount: number;
}

class IAPService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (!isIOSApp() || this.initialized) return;

    try {
      // Configure RevenueCat SDK
      // You'll need to get an API key from https://app.revenuecat.com/
      const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY || 'REVENUECAT_API_KEY_PLACEHOLDER';
      
      await Purchases.configure({
        apiKey: apiKey,
      });
      
      this.initialized = true;
      console.log('[IAP] RevenueCat initialized successfully');
    } catch (error) {
      console.error('[IAP] Failed to initialize:', error);
      throw error;
    }
  }

  async getProducts(productIds: string[]): Promise<IAPProduct[]> {
    if (!isIOSApp()) {
      console.warn('[IAP] Not iOS platform');
      return [];
    }

    try {
      await this.initialize();
      
      const { products } = await Purchases.getProducts({
        productIdentifiers: productIds,
      });

      return products.map((p: PurchasesStoreProduct) => ({
        id: p.identifier,
        title: p.title,
        description: p.description,
        price: p.priceString,
        currency: p.currencyCode,
        priceAmount: p.price,
      }));
    } catch (error) {
      console.error('[IAP] Failed to get products:', error);
      return [];
    }
  }

  async purchase(productId: string): Promise<{ 
    success: boolean; 
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    if (!isIOSApp()) {
      console.error('[IAP] Not iOS platform');
      return { success: false, error: 'Not iOS platform' };
    }

    try {
      await this.initialize();

      // First get the product
      const { products } = await Purchases.getProducts({
        productIdentifiers: [productId],
      });

      if (products.length === 0) {
        throw new Error('Product not found');
      }

      const result = await Purchases.purchaseStoreProduct({
        product: products[0]
      });

      console.log('[IAP] Purchase successful:', result);

      return {
        success: true,
        customerInfo: result.customerInfo,
      };
    } catch (error: any) {
      console.error('[IAP] Purchase failed:', error);
      return { 
        success: false,
        error: error.message || 'Purchase failed'
      };
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!isIOSApp()) return null;

    try {
      await this.initialize();
      
      const { customerInfo } = await Purchases.restorePurchases();
      
      console.log('[IAP] Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('[IAP] Failed to restore purchases:', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!isIOSApp()) return null;

    try {
      await this.initialize();
      
      const { customerInfo } = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('[IAP] Failed to get customer info:', error);
      return null;
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!isIOSApp()) return;

    try {
      await this.initialize();
      await Purchases.logIn({ appUserID: userId });
      console.log('[IAP] User ID set:', userId);
    } catch (error) {
      console.error('[IAP] Failed to set user ID:', error);
    }
  }
}

export const iapService = new IAPService();
