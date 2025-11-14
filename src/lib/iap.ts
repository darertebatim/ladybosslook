// IAP Implementation for iOS using RevenueCat
import { isIOSApp, isRealDevice } from './platform';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

// Use PUBLIC key for iOS SDK (starts with 'test_' or 'appl_')
const REVENUECAT_PUBLIC_KEY = 'test_KVPklNpuMtxERnmeuzcYwutfOPs';
const pluginAvailable = true;

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
    
    // Check if running on real device (not simulator)
    const isReal = await isRealDevice();
    if (!isReal) {
      console.warn('[IAP] Simulator detected, skipping IAP initialization');
      return;
    }
    
    if (!pluginAvailable) {
      console.warn('[IAP] Plugin not available, skipping initialization');
      return;
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_KEY,
        appUserID: undefined, // Will use RevenueCat anonymous ID
      });
      this.initialized = true;
      console.log('[IAP] RevenueCat initialized successfully');
    } catch (error) {
      console.error('[IAP] Failed to initialize RevenueCat:', error);
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
      
      // Get offerings from RevenueCat (includes all products)
      const offeringsResult = await Purchases.getOfferings();
      
      if (!offeringsResult.current) {
        console.warn('[IAP] No current offering found');
        return [];
      }

      // Extract products from the current offering
      const availablePackages = offeringsResult.current.availablePackages;
      
      return availablePackages.map((pkg: any) => ({
        id: pkg.product.identifier,
        title: pkg.product.title || '',
        description: pkg.product.description || '',
        price: pkg.product.priceString || '',
        currency: pkg.product.currencyCode || 'USD',
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

      // Get offerings to find the package with this product ID
      const offeringsResult = await Purchases.getOfferings();
      const currentOffering = offeringsResult.current;
      
      if (!currentOffering) {
        console.error('[IAP] No current offering found');
        return { success: false };
      }

      // Find the package matching the product ID
      const pkg = currentOffering.availablePackages.find(
        (p: any) => p.product.identifier === productId
      );

      if (!pkg) {
        console.error('[IAP] Product not found in offerings:', productId);
        return { success: false };
      }

      // Make the purchase
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      
      console.log('[IAP] Purchase successful:', customerInfo);

      // Extract transaction info
      const latestTransaction = customerInfo.latestExpirationDate 
        ? Object.keys(customerInfo.nonSubscriptionTransactions)[0]
        : undefined;

      return {
        success: true,
        transactionId: latestTransaction,
        receipt: undefined, // RevenueCat handles receipt validation
      };
    } catch (error: any) {
      console.error('[IAP] Purchase failed:', error);
      
      // Check if user cancelled
      if (error.code === '1' || error.message?.includes('cancel')) {
        return { success: false };
      }
      
      return { success: false };
    }
  }

  async restorePurchases(): Promise<string[]> {
    if (!isIOSApp()) return [];

    try {
      await this.initialize();
      
      const { customerInfo } = await Purchases.restorePurchases();
      
      // Get all active entitlement identifiers
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      
      console.log('[IAP] Restored purchases:', activeEntitlements);
      
      return activeEntitlements;
    } catch (error) {
      console.error('[IAP] Failed to restore purchases:', error);
      return [];
    }
  }

  async finishTransaction(_transactionId: string): Promise<void> {
    // RevenueCat automatically finishes transactions
    // No manual finishing needed
    console.log('[IAP] Transaction finishing handled by RevenueCat');
  }
}

export const iapService = new IAPService();
