import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const revenuecatApiKey = Deno.env.get('REVENUECAT_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    console.log('[RC-WEBHOOK] Event received:', body.event?.type || body.type);

    // RevenueCat webhook format
    const event = body.event || body;
    const eventType = event.type;
    const appUserId = event.app_user_id;
    const productId = event.product_id;
    const expirationAtMs = event.expiration_at_ms;
    const purchasedAtMs = event.purchased_at_ms;

    if (!appUserId) {
      console.error('[RC-WEBHOOK] No app_user_id in event');
      return new Response(JSON.stringify({ error: 'Missing app_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // app_user_id should be the Supabase user_id
    const userId = appUserId;

    // Find matching subscription product
    const { data: subProduct } = await supabase
      .from('subscription_products')
      .select('id')
      .eq('ios_product_id', productId)
      .single();

    const expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION': {
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            status: 'active',
            platform: 'ios',
            product_id: subProduct?.id || null,
            expires_at: expiresAt,
            revenuecat_id: appUserId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) console.error('[RC-WEBHOOK] Upsert error:', error);
        else console.log('[RC-WEBHOOK] Subscription activated for user:', userId);
        break;
      }

      case 'CANCELLATION': {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) console.error('[RC-WEBHOOK] Cancel error:', error);
        else console.log('[RC-WEBHOOK] Subscription cancelled for user:', userId);
        break;
      }

      case 'EXPIRATION': {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) console.error('[RC-WEBHOOK] Expiration error:', error);
        else console.log('[RC-WEBHOOK] Subscription expired for user:', userId);
        break;
      }

      default:
        console.log('[RC-WEBHOOK] Unhandled event type:', eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[RC-WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
