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
    console.log('Starting refund sync from Stripe...');

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

    // Get all non-refunded orders with Stripe session IDs
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, stripe_session_id, amount')
      .eq('refunded', false)
      .not('stripe_session_id', 'is', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Checking ${orders?.length || 0} orders for refunds...`);

    let refundsProcessed = 0;

    for (const order of orders || []) {
      try {
        // Get the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id!);
        
        if (!session.payment_intent) {
          console.log(`No payment intent for order ${order.id}`);
          continue;
        }

        // Get the payment intent to check for refunds
        const paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent.id;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Check if the payment has been refunded
        if (paymentIntent.amount_refunded > 0) {
          console.log(`Found refund for order ${order.id}: $${paymentIntent.amount_refunded / 100}`);

          // Update the order in the database
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              refunded: true,
              refunded_at: new Date().toISOString(),
              refund_amount: paymentIntent.amount_refunded,
              status: 'refunded'
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Error updating order ${order.id}:`, updateError);
          } else {
            refundsProcessed++;

            // Also remove any course enrollments for this user
            const { data: orderData } = await supabase
              .from('orders')
              .select('user_id, program_slug')
              .eq('id', order.id)
              .single();

            if (orderData?.user_id && orderData?.program_slug) {
              await supabase
                .from('course_enrollments')
                .delete()
                .eq('user_id', orderData.user_id)
                .eq('program_slug', orderData.program_slug);
              
              console.log(`Removed enrollment for user ${orderData.user_id} from ${orderData.program_slug}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error checking order ${order.id}:`, error);
        // Continue with next order even if one fails
      }
    }

    console.log(`Refund sync complete. Processed ${refundsProcessed} refunds.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        refundsProcessed,
        ordersChecked: orders?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error syncing refunds:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
