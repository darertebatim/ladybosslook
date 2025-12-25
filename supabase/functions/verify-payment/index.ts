import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { sessionId } = requestBody;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string');
    }

    if (!sessionId.startsWith('cs_') || sessionId.length < 20 || sessionId.length > 200) {
      throw new Error('Invalid session ID format');
    }

    const sanitizedSessionId = sessionId.trim();
    logStep('Function started', { sessionId: sanitizedSessionId });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Step 1: Verify payment with Stripe
    logStep('Retrieving checkout session from Stripe');
    const session = await stripe.checkout.sessions.retrieve(sanitizedSessionId);
    
    logStep('Stripe session retrieved', { 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email
    });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({
        success: false,
        paymentStatus: session.payment_status,
        orderDetails: null,
        message: 'Payment not completed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Step 2: Look for existing order (created by webhook)
    logStep('Looking for existing order in database');
    
    // Try multiple times with delay (webhook might be slightly delayed)
    let orderDetails = null;
    let attempts = 0;
    const maxAttempts = 3;
    const delayMs = 1000;

    while (attempts < maxAttempts && !orderDetails) {
      const { data: existingOrder, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sanitizedSessionId)
        .maybeSingle();

      if (existingOrder) {
        orderDetails = existingOrder;
        logStep('Order found in database', { orderId: existingOrder.id, attempt: attempts + 1 });
        break;
      }

      if (orderError) {
        logStep('Error fetching order', { error: orderError.message });
      }

      attempts++;
      if (attempts < maxAttempts) {
        logStep('Order not found, retrying...', { attempt: attempts, maxAttempts });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Step 3: If order still not found, create minimal order from Stripe data
    if (!orderDetails) {
      logStep('Order not found after retries, creating from Stripe session');
      
      const customerEmail = session.customer_details?.email || 'unknown@example.com';
      const customerName = session.customer_details?.name || 'Customer';
      const programSlug = session.metadata?.program_slug || session.metadata?.program || null;
      let productName = session.metadata?.product_name || 'Purchase';
      
      // Try to get product name from line items if available
      if (productName === 'Purchase') {
        try {
          const sessionWithItems = await stripe.checkout.sessions.retrieve(sanitizedSessionId, {
            expand: ['line_items']
          });
          if (sessionWithItems.line_items?.data[0]?.description) {
            productName = sessionWithItems.line_items.data[0].description;
          }
        } catch (e) {
          logStep('Could not fetch line items', { error: e.message });
        }
      }

      // Create the order since webhook hasn't done it yet
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: sanitizedSessionId,
          email: customerEmail,
          name: customerName,
          phone: session.customer_details?.phone || null,
          billing_city: session.customer_details?.address?.city || null,
          billing_state: session.customer_details?.address?.state || null,
          billing_country: session.customer_details?.address?.country || null,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: 'paid',
          product_name: productName,
          program_slug: programSlug,
          payment_type: session.mode || 'payment'
        })
        .select()
        .single();

      if (insertError) {
        // Order might have been created by webhook in the meantime
        if (insertError.code === '23505') { // Unique constraint violation
          logStep('Order was created by webhook during retry, fetching it');
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_session_id', sanitizedSessionId)
            .single();
          
          if (existingOrder) {
            orderDetails = existingOrder;
          }
        } else {
          logStep('Error creating fallback order', { error: insertError.message });
        }
      } else {
        orderDetails = newOrder;
        logStep('Fallback order created', { orderId: newOrder.id });
      }
    }

    // Return success with order details
    const response = {
      success: true,
      paymentStatus: 'paid',
      orderDetails: orderDetails || {
        // Minimal fallback if somehow still no order
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        amount: session.amount_total || 0,
        product_name: session.metadata?.product_name || 'Purchase',
        status: 'paid',
        created_at: new Date().toISOString()
      }
    };

    logStep('Returning success response', { hasOrder: !!orderDetails });
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
