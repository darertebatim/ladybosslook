// IAP placeholder - native iOS functionality requires local build
// This won't work in preview/web - only after building native iOS app
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
    // Placeholder - requires native build
    console.log('[IAP] Placeholder - native build required');
  }

  async getProducts(productIds: string[]): Promise<IAPProduct[]> {
    console.log('[IAP] getProducts placeholder');
    return [];
  }

  async purchase(productId: string): Promise<{ 
    success: boolean; 
    receipt?: string;
    transactionId?: string;
    error?: string;
  }> {
    console.log('[IAP] purchase placeholder');
    return { success: false, error: 'Native build required' };
  }

  async restorePurchases(): Promise<string[]> {
    console.log('[IAP] restorePurchases placeholder');
    return [];
  }
}

export const iapService = new IAPService();
