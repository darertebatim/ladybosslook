/**
 * Native Social Auth - STUBBED (Capacitor removed)
 * 
 * Uses browser OAuth only.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

import { supabase } from '@/integrations/supabase/client';

export const initializeSocialLogin = async () => {
  console.log('[SocialAuth] Initialization skipped (Capacitor removed)');
};

export const nativeGoogleSignIn = async (): Promise<{ error: any }> => {
  // Use browser OAuth
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://ladybosslook.com/app/home',
    },
  });
  return { error };
};

export const nativeAppleSignIn = async (): Promise<{ error: any }> => {
  // Use browser OAuth
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: 'https://ladybosslook.com/app/home',
    },
  });
  return { error };
};
