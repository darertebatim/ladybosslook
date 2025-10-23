import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate VAPID keys using Web Crypto API with correct format
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export public key as raw (uncompressed format - 65 bytes)
    const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    
    // Export private key in JWK format to extract the raw 32-byte 'd' value
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    
    // Extract the 'd' parameter which is the raw private key (32 bytes when decoded)
    if (!privateKeyJwk.d) {
      throw new Error('Failed to extract private key material');
    }
    
    // Decode the base64url 'd' parameter to get raw bytes
    const privateKeyBase64Url = privateKeyJwk.d;
    const privateKeyBase64 = privateKeyBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const privateKeyRaw = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

    // Convert public key to base64url format (65 bytes)
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Convert private key to base64url format (32 bytes)
    const privateKeyBase64Final = btoa(String.fromCharCode(...privateKeyRaw))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    console.log('VAPID keys generated successfully');
    console.log('Public key length (bytes):', new Uint8Array(publicKey).length);
    console.log('Private key length (bytes):', privateKeyRaw.length);

    return new Response(
      JSON.stringify({
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64Final,
        instructions: 'Store these keys as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase secrets'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error generating VAPID keys:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
