import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('No signature provided');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } else {
        // For testing without signature verification
        event = JSON.parse(body);
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook event received:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing checkout session:', session.id);

      // Get customer details
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
      
      // Get product name from metadata or line items
      let productName = session.metadata?.product_name || 'Unknown Product';
      const programSlug = session.metadata?.program_slug || null;
      
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

      if (existingOrder) {
        console.log('Order already exists for session:', session.id);
        return new Response(JSON.stringify({ received: true, message: 'Order already exists' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create order record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          billing_city: billingCity,
          billing_state: billingState,
          billing_country: billingCountry,
          amount,
          currency,
          status: 'completed',
          product_name: productName,
          program_slug: programSlug,
          payment_type: session.mode,
        });

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully for session:', session.id);
    }

    // Handle charge.refunded
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      
      console.log('Processing refund for charge:', charge.id);

      // Get the payment intent
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent?.id;

      if (!paymentIntentId) {
        console.log('No payment intent found for charge:', charge.id);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the checkout session for this payment intent
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });

      if (sessions.data.length === 0) {
        console.log('No session found for payment intent:', paymentIntentId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sessionId = sessions.data[0].id;

      // Find the order
      const { data: order } = await supabase
        .from('orders')
        .select('id, user_id, program_slug')
        .eq('stripe_session_id', sessionId)
        .single();

      if (!order) {
        console.log('No order found for session:', sessionId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update order as refunded
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refunded: true,
          refunded_at: new Date().toISOString(),
          refund_amount: charge.amount_refunded,
          status: 'refunded',
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      // Remove course enrollments if user_id and program_slug exist
      if (order.user_id && order.program_slug) {
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .delete()
          .eq('user_id', order.user_id)
          .eq('program_slug', order.program_slug);

        if (enrollmentError) {
          console.error('Error removing enrollment:', enrollmentError);
        } else {
          console.log('Enrollment removed for user:', order.user_id);
        }
      }

      console.log('Refund processed successfully for order:', order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
