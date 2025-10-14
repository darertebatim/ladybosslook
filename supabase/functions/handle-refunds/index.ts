import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    console.log('[HANDLE-REFUNDS] Starting refund check');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get all paid orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, email, stripe_session_id, product_name, user_id')
      .eq('status', 'paid');

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: 'No paid orders to check' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`[HANDLE-REFUNDS] Checking ${orders.length} orders`);

    const refundedOrders = [];

    // Check each order for refunds
    for (const order of orders) {
      if (!order.stripe_session_id) continue;

      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          
          // Check if payment was refunded
          if (paymentIntent.status === 'canceled' || 
              (paymentIntent.charges.data[0] && paymentIntent.charges.data[0].refunded)) {
            console.log(`[HANDLE-REFUNDS] Found refunded order: ${order.id}`);
            refundedOrders.push(order);

            // Update order status
            await supabase
              .from('orders')
              .update({ status: 'refunded' })
              .eq('id', order.id);

            // Remove enrollment
            if (order.user_id) {
              await supabase
                .from('course_enrollments')
                .delete()
                .eq('user_id', order.user_id)
                .eq('course_name', order.product_name);
            }

            // Remove Mailchimp tag
            try {
              const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
              const listId = Deno.env.get('MAILCHIMP_LIST_ID');
              
              if (mailchimpApiKey && listId) {
                const dc = mailchimpApiKey.split('-')[1];
                const emailHash = await crypto.subtle.digest(
                  'MD5',
                  new TextEncoder().encode(order.email.toLowerCase())
                ).then(buf => 
                  Array.from(new Uint8Array(buf))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
                );

                const tagName = order.product_name.toLowerCase().replace(/\s+/g, '_');
                
                await fetch(
                  `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}/tags`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${mailchimpApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      tags: [{ name: tagName, status: 'inactive' }]
                    }),
                  }
                );
                console.log(`[HANDLE-REFUNDS] Removed Mailchimp tag for ${order.email}`);
              }
            } catch (mailchimpError) {
              console.error('[HANDLE-REFUNDS] Mailchimp error:', mailchimpError);
            }
          }
        }
      } catch (stripeError) {
        console.error(`[HANDLE-REFUNDS] Error checking order ${order.id}:`, stripeError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      refundedCount: refundedOrders.length,
      refundedOrders: refundedOrders.map(o => ({ email: o.email, product: o.product_name }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[HANDLE-REFUNDS] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
