import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

const RC_IOS_API_KEY = 'appl_FfoHuonnYUncpGWZBaIfXkvurVW';

let rcInitialized = false;

/**
 * Initialize RevenueCat SDK - call once on app startup when user is authenticated
 */
export async function initializeRevenueCat(userId: string) {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RC] Skipping - not native platform');
    return;
  }

  if (rcInitialized) {
    console.log('[RC] Already initialized');
    return;
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    
    await Purchases.configure({
      apiKey: RC_IOS_API_KEY,
      appUserID: userId,
    });

    rcInitialized = true;
    console.log('[RC] ✓ Initialized for user:', userId);
  } catch (error) {
    console.error('[RC] Init failed:', error);
  }
}

/**
 * Purchase a product by its App Store product ID
 */
export async function purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Not available on web' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');

    // Get the store product first
    const { products } = await Purchases.getProducts({ 
      productIdentifiers: [productId],
    });

    if (!products || products.length === 0) {
      console.error('[RC] Product not found:', productId);
      return { success: false, error: 'Product not found in App Store' };
    }

    const product = products[0];
    console.log('[RC] Purchasing product:', product.identifier, product.priceString);

    const { customerInfo } = await Purchases.purchaseStoreProduct({ product });

    console.log('[RC] Purchase successful, entitlements:', Object.keys(customerInfo.entitlements.active));

    // Sync subscription to Supabase
    await syncSubscriptionToSupabase(customerInfo);

    return { success: true };
  } catch (error: any) {
    // User cancelled
    if (error?.code === 1 || error?.userCancelled) {
      console.log('[RC] Purchase cancelled by user');
      return { success: false, error: 'cancelled' };
    }
    console.error('[RC] Purchase error:', error);
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{ success: boolean; hasActive: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, hasActive: false, error: 'Not available on web' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();

    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    console.log('[RC] Restore complete, active entitlements:', Object.keys(customerInfo.entitlements.active));

    if (hasActive) {
      await syncSubscriptionToSupabase(customerInfo);
    }

    return { success: true, hasActive };
  } catch (error: any) {
    console.error('[RC] Restore error:', error);
    return { success: false, hasActive: false, error: error?.message || 'Restore failed' };
  }
}

/**
 * Check current entitlements without making a purchase
 */
export async function checkEntitlements(): Promise<string[]> {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active);
  } catch (error) {
    console.error('[RC] Check entitlements error:', error);
    return [];
  }
}

/**
 * Sync RevenueCat subscription status to Supabase user_subscriptions table
 */
async function syncSubscriptionToSupabase(customerInfo: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const activeEntitlements = customerInfo.entitlements.active;
    
    for (const [entitlementId, entitlement] of Object.entries(activeEntitlements) as any) {
      const programSlug = entitlementId; // Entitlement ID = program slug (e.g. 'simora-plus')
      
      // Upsert subscription record
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          program_slug: programSlug,
          status: 'active',
          platform: 'ios',
          product_id: entitlement.productIdentifier || null,
          revenuecat_id: customerInfo.originalAppUserId || null,
          expires_at: entitlement.expirationDate || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,program_slug',
        } as any);

      if (error) {
        console.error('[RC] Supabase sync error:', error);
      } else {
        console.log('[RC] ✓ Synced subscription:', programSlug);
      }

      // Also create course enrollment so it appears in admin & profile
      await ensureEnrollment(user.id, programSlug);
    }
  } catch (error) {
    console.error('[RC] Supabase sync failed:', error);
  }
}

/**
 * Ensure a course_enrollment exists for this subscription program
 */
async function ensureEnrollment(userId: string, programSlug: string) {
  try {
    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('program_slug', programSlug)
      .maybeSingle() as any;

    if (existing) {
      console.log('[RC] Enrollment already exists for:', programSlug);
      return;
    }

    // Look up the program title
    const { data: program } = await supabase
      .from('program_catalog')
      .select('title')
      .eq('slug', programSlug)
      .maybeSingle() as any;

    const courseName = program?.title || programSlug;

    // Create enrollment
    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_name: courseName,
        program_slug: programSlug,
        status: 'active',
      } as any);

    if (error) {
      console.error('[RC] Enrollment creation error:', error);
    } else {
      console.log('[RC] ✓ Created enrollment for:', programSlug);
    }
  } catch (error) {
    console.error('[RC] Enrollment creation failed:', error);
  }
}
