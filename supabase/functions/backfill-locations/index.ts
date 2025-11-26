import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting location backfill...');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all orders without location that have stripe session IDs
    const { data: ordersToUpdate } = await supabase
      .from('orders')
      .select('id, stripe_session_id, email')
      .is('billing_city', null)
      .not('stripe_session_id', 'is', null);

    console.log(`Found ${ordersToUpdate?.length || 0} orders to backfill`);

    let updated = 0;
    let failed = 0;

    for (const order of ordersToUpdate || []) {
      try {
        // Fetch session from Stripe
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        const billingCity = session.customer_details?.address?.city || null;
        const billingState = session.customer_details?.address?.state || null;
        const billingCountry = session.customer_details?.address?.country || null;

        // Update order with location
        const { error } = await supabase
          .from('orders')
          .update({
            billing_city: billingCity,
            billing_state: billingState,
            billing_country: billingCountry,
          })
          .eq('id', order.id);

        if (!error) {
          updated++;
          console.log(`✓ Updated ${order.email}: ${billingCity || 'no city'}, ${billingCountry || 'no country'}`);
        } else {
          failed++;
          console.error(`✗ Failed to update ${order.email}:`, error);
        }
      } catch (error) {
        failed++;
        console.error(`✗ Error fetching session for ${order.email}:`, error.message);
      }
    }

    console.log(`Backfill complete: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated,
        failed,
        total: ordersToUpdate?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error backfilling locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
