import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Only import SocialLogin on native platforms
let SocialLogin: any = null;

export const initializeSocialLogin = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capgo/capacitor-social-login');
      SocialLogin = module.SocialLogin;
      
      // Initialize Google provider for all platforms
      await SocialLogin.initialize({
        google: {
          webClientId: '945736365946-79h9fsgo6uedji5tq5qsmpa55m88rg7e.apps.googleusercontent.com',
          iOSClientId: '945736365946-auuab5v8310rvlpol3uh226p088nj1n5.apps.googleusercontent.com',
        },
      });
      console.log('[SocialAuth] Initialized successfully');
    } catch (error) {
      console.error('[SocialAuth] Failed to initialize:', error);
    }
  }
};

// Generate nonce for security
const generateNonce = async (): Promise<[string, string]> => {
  const rawNonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(rawNonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return [rawNonce, hashedNonce];
};

export const nativeGoogleSignIn = async (): Promise<{ error: any }> => {
  if (!Capacitor.isNativePlatform() || !SocialLogin) {
    // Fallback to browser OAuth for web
    return browserGoogleSignIn();
  }

  try {
    const [rawNonce, hashedNonce] = await generateNonce();
    
    // Show native Google Sign In UI
    const result = await SocialLogin.login({
      provider: 'google',
      options: {
        nonce: hashedNonce,
      },
    });

    if (result?.result?.idToken) {
      // Exchange ID token with Supabase
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: result.result.idToken,
        nonce: rawNonce,
      });
      return { error };
    }
    
    return { error: { message: 'Failed to get ID token from Google' } };
  } catch (error: any) {
    console.error('[SocialAuth] Google sign in error:', error);
    return { error };
  }
};

export const nativeAppleSignIn = async (): Promise<{ error: any }> => {
  if (!Capacitor.isNativePlatform() || !SocialLogin) {
    return browserAppleSignIn();
  }

  try {
    const [rawNonce, hashedNonce] = await generateNonce();
    
    // Show native Apple Sign In UI
    const result = await SocialLogin.login({
      provider: 'apple',
      options: {
        nonce: hashedNonce,
        scopes: ['email', 'name'],
      },
    });

    if (result?.result?.idToken) {
      // Exchange ID token with Supabase
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: result.result.idToken,
        nonce: rawNonce,
      });
      return { error };
    }
    
    return { error: { message: 'Failed to get ID token from Apple' } };
  } catch (error: any) {
    console.error('[SocialAuth] Apple sign in error:', error);
    return { error };
  }
};

// Fallback for web browsers
const browserGoogleSignIn = async (): Promise<{ error: any }> => {
  // Preserve the redirect path so user returns to the page they were on (e.g. /cart)
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect') || '/app/home';
  const redirectTo = `${window.location.origin}${redirectPath}`;

  const isCustomDomain =
    !window.location.hostname.includes('lovable.app') &&
    !window.location.hostname.includes('lovableproject.com') &&
    !window.location.hostname.includes('localhost');

  if (isCustomDomain) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (!error && data?.url) {
      window.location.href = data.url;
    }
    return { error };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  return { error };
};

const browserAppleSignIn = async (): Promise<{ error: any }> => {
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect') || '/app/home';
  const redirectTo = `${window.location.origin}${redirectPath}`;

  const isCustomDomain =
    !window.location.hostname.includes('lovable.app') &&
    !window.location.hostname.includes('lovableproject.com') &&
    !window.location.hostname.includes('localhost');

  if (isCustomDomain) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (!error && data?.url) {
      window.location.href = data.url;
    }
    return { error };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo },
  });
  return { error };
};
