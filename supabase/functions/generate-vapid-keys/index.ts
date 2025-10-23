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
    // Generate VAPID keys using Web Crypto API
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // Convert to base64url format
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    console.log('VAPID keys generated successfully');

    return new Response(
      JSON.stringify({
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
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
