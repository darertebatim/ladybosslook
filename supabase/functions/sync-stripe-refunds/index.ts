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
    console.log('Starting full payment sync from Stripe...');

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

    // Get all existing order session IDs
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('stripe_session_id');

    const existingSessionIds = new Set(
      (existingOrders || [])
        .filter(o => o.stripe_session_id)
        .map(o => o.stripe_session_id)
    );

    console.log(`Found ${existingSessionIds.size} existing orders in database`);

    let paymentsImported = 0;
    let refundsProcessed = 0;
    let paymentsUpdated = 0;

    // Fetch ALL completed checkout sessions from Stripe (limit 100 most recent)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
    });

    console.log(`Found ${sessions.data.length} completed payments in Stripe`);

    for (const session of sessions.data) {
      try {
        const sessionId = session.id;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerName = session.customer_details?.name || '';
        const customerPhone = session.customer_details?.phone || null;

        // Get billing details
        const billingCity = session.customer_details?.address?.city || null;
        const billingState = session.customer_details?.address?.state || null;
        const billingCountry = session.customer_details?.address?.country || null;

        // Get payment details
        const amount = session.amount_total || 0;
        const currency = session.currency || 'usd';
        const productName = session.metadata?.product_name || 'Unknown Product';
        const programSlug = session.metadata?.program_slug || null;

        // Check if payment has refunds
        let isRefunded = false;
        let refundAmount = 0;
        let refundedAt = null;

        if (session.payment_intent) {
          const paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id;

          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (paymentIntent.amount_refunded > 0) {
            isRefunded = true;
            refundAmount = paymentIntent.amount_refunded;
            // Get refund date from the latest refund
            const refunds = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 1 });
            if (refunds.data.length > 0) {
              refundedAt = new Date(refunds.data[0].created * 1000).toISOString();
            }
          }
        }

        // Check if order exists in database
        if (existingSessionIds.has(sessionId)) {
          // Order exists - check if we need to update refund status
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, refunded, user_id, program_slug')
            .eq('stripe_session_id', sessionId)
            .single();

          if (existingOrder && !existingOrder.refunded && isRefunded) {
            // Update to refunded
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                refunded: true,
                refunded_at: refundedAt,
                refund_amount: refundAmount,
                status: 'refunded'
              })
              .eq('id', existingOrder.id);

            if (!updateError) {
              paymentsUpdated++;
              refundsProcessed++;
              console.log(`Updated order ${existingOrder.id} to refunded status`);

              // Remove enrollment if applicable
              if (existingOrder.user_id && existingOrder.program_slug) {
                await supabase
                  .from('course_enrollments')
                  .delete()
                  .eq('user_id', existingOrder.user_id)
                  .eq('program_slug', existingOrder.program_slug);
              }
            }
          }
        } else {
          // Order doesn't exist - import it
          const { error: insertError } = await supabase
            .from('orders')
            .insert({
              stripe_session_id: sessionId,
              email: customerEmail,
              name: customerName,
              phone: customerPhone,
              billing_city: billingCity,
              billing_state: billingState,
              billing_country: billingCountry,
              amount,
              currency,
              status: isRefunded ? 'refunded' : 'completed',
              product_name: productName,
              program_slug: programSlug,
              payment_type: session.mode,
              refunded: isRefunded,
              refunded_at: refundedAt,
              refund_amount: isRefunded ? refundAmount : null,
            });

          if (!insertError) {
            paymentsImported++;
            if (isRefunded) {
              refundsProcessed++;
            }
            console.log(`Imported payment: ${customerEmail} - ${productName} - ${isRefunded ? 'REFUNDED' : 'PAID'}`);
          } else {
            console.error(`Error importing payment ${sessionId}:`, insertError);
          }
        }
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
      }
    }

    console.log(`Sync complete: ${paymentsImported} imported, ${paymentsUpdated} updated, ${refundsProcessed} refunds processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentsImported,
        paymentsUpdated,
        refundsProcessed,
        totalProcessed: sessions.data.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error syncing payments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
