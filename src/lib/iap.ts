// Native iOS In-App Purchase using cordova-plugin-purchase
import { isIOSApp } from './platform';

// Global CdvPurchase from cordova-plugin-purchase
declare global {
  interface Window {
    CdvPurchase: any;
  }
}

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
  private store: any = null;

  async initialize(): Promise<void> {
    if (!isIOSApp() || this.initialized) return;

    try {
      // Wait for CdvPurchase to be available
      if (!window.CdvPurchase) {
        console.warn('[IAP] cordova-plugin-purchase not loaded yet');
        return;
      }

      const { store, ProductType, Platform } = window.CdvPurchase;
      this.store = store;

      // Set verbosity for debugging
      this.store.verbosity = this.store.DEBUG;

      console.log('[IAP] Initialized with cordova-plugin-purchase');
      this.initialized = true;
    } catch (error) {
      console.error('[IAP] Failed to initialize:', error);
      throw error;
    }
  }

  registerProducts(productIds: string[]): void {
    if (!this.store || !isIOSApp()) return;

    const { ProductType, Platform } = window.CdvPurchase;

    productIds.forEach(productId => {
      this.store.register({
        type: ProductType.NON_CONSUMABLE,
        id: productId,
        platform: Platform.APPLE_APPSTORE,
      });
    });

    console.log('[IAP] Products registered:', productIds);
  }

  async getProducts(productIds: string[]): Promise<IAPProduct[]> {
    if (!isIOSApp()) {
      console.warn('[IAP] Not iOS platform');
      return [];
    }

    try {
      await this.initialize();
      
      if (!this.store) {
        console.warn('[IAP] Store not initialized');
        return [];
      }

      // Register products
      this.registerProducts(productIds);

      // Initialize the store
      await this.store.initialize([{ platform: window.CdvPurchase.Platform.APPLE_APPSTORE }]);

      // Get products
      const products: IAPProduct[] = [];
      productIds.forEach(productId => {
        const product = this.store.get(productId);
        if (product) {
          products.push({
            id: product.id,
            title: product.title || '',
            description: product.description || '',
            price: product.pricing?.priceMicros ? `$${(product.pricing.priceMicros / 1000000).toFixed(2)}` : '',
            currency: product.pricing?.currency || 'USD',
            priceAmount: product.pricing?.priceMicros ? product.pricing.priceMicros / 1000000 : 0,
          });
        }
      });

      return products;
    } catch (error) {
      console.error('[IAP] Failed to get products:', error);
      return [];
    }
  }

  async purchase(productId: string): Promise<{ 
    success: boolean; 
    receipt?: string;
    transactionId?: string;
    error?: string;
  }> {
    if (!isIOSApp()) {
      console.error('[IAP] Not iOS platform');
      return { success: false, error: 'Not iOS platform' };
    }

    try {
      await this.initialize();

      if (!this.store) {
        throw new Error('Store not initialized');
      }

      return new Promise((resolve) => {
        // Set up listeners
        this.store.when().approved((transaction: any) => {
          console.log('[IAP] Transaction approved:', transaction);
          transaction.verify();
        });

        this.store.when().verified((receipt: any) => {
          console.log('[IAP] Receipt verified:', receipt);
          
          // Extract receipt data
          const receiptData = receipt.nativeData?.appStoreReceipt || receipt.nativeData?.transactionReceipt;
          
          resolve({
            success: true,
            receipt: receiptData,
            transactionId: receipt.transactionId || receipt.id,
          });

          // Finish the transaction
          receipt.finish();
        });

        this.store.when().unverified((receipt: any) => {
          console.error('[IAP] Receipt not verified:', receipt);
          resolve({ 
            success: false, 
            error: 'Receipt verification failed' 
          });
        });

        this.store.error((error: any) => {
          console.error('[IAP] Store error:', error);
          if (error.code !== window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
            resolve({ 
              success: false, 
              error: error.message 
            });
          }
        });

        // Order the product
        const product = this.store.get(productId);
        if (!product) {
          resolve({ 
            success: false, 
            error: 'Product not found' 
          });
          return;
        }

        const offer = product.getOffer();
        if (!offer) {
          resolve({ 
            success: false, 
            error: 'No offer available' 
          });
          return;
        }

        offer.order()
          .catch((error: any) => {
            console.error('[IAP] Order failed:', error);
            resolve({ 
              success: false, 
              error: error.message 
            });
          });
      });
    } catch (error: any) {
      console.error('[IAP] Purchase failed:', error);
      return { 
        success: false,
        error: error.message || 'Purchase failed'
      };
    }
  }

  async restorePurchases(): Promise<string[]> {
    if (!isIOSApp()) return [];

    try {
      await this.initialize();
      
      if (!this.store) {
        return [];
      }

      await this.store.restorePurchases();
      
      const ownedProducts: string[] = [];
      this.store.products.forEach((product: any) => {
        if (product.owned) {
          ownedProducts.push(product.id);
        }
      });

      console.log('[IAP] Purchases restored:', ownedProducts);
      return ownedProducts;
    } catch (error) {
      console.error('[IAP] Failed to restore purchases:', error);
      return [];
    }
  }
}

export const iapService = new IAPService();
