import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { sessionId } = requestBody;

    // Input validation
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string');
    }

    // Validate session ID format (basic Stripe session ID validation)
    if (!sessionId.startsWith('cs_') || sessionId.length < 20 || sessionId.length > 200) {
      throw new Error('Invalid session ID format');
    }

    // Sanitize session ID
    const sanitizedSessionId = sessionId.trim();

    logStep('Function started', { sessionId: sanitizedSessionId });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');
    logStep('Stripe key verified');

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase with service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    logStep('Retrieving checkout session from Stripe');

    // Retrieve the checkout session from Stripe with expanded data
    const session = await stripe.checkout.sessions.retrieve(sanitizedSessionId, {
      expand: ['line_items', 'customer']
    });

    logStep('Payment verification completed', { 
      sessionId: sanitizedSessionId, 
      paymentStatus: session.payment_status 
    });

    // Only create order record if payment was successful
    let orderDetails = null;
    if (session.payment_status === 'paid') {
      logStep('Payment successful, creating order record');
      
      // Extract customer details from the session
      const customer = session.customer ? await stripe.customers.retrieve(session.customer as string) : null;
      
      // Create order record only after successful payment
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          email: session.customer_details?.email || (customer as any)?.email || 'unknown@example.com',
          name: session.customer_details?.name || (customer as any)?.name || 'Customer',
          phone: session.customer_details?.phone || (customer as any)?.phone,
          stripe_session_id: sanitizedSessionId,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: 'paid',
          product_name: session.line_items?.data[0]?.description || 'Purchase'
        })
        .select()
        .single();

      if (orderError) {
        logStep('Error creating order record', orderError);
        // Don't throw error - payment was successful, just log the issue
      } else {
        orderDetails = newOrder;
        logStep('Order record created', { orderId: newOrder.id });
      }

      // If payment successful, optionally subscribe to Mailchimp
      if (orderDetails) {
        logStep('Attempting Mailchimp subscription');
        try {
          const mailchimpResponse = await supabase.functions.invoke('mailchimp-subscribe', {
            body: {
              email: orderDetails.email,
              name: orderDetails.name,
              phone: orderDetails.phone
            }
          });
          logStep('Mailchimp subscription result', mailchimpResponse);
        } catch (mailchimpError) {
          logStep('Mailchimp subscription failed', mailchimpError);
          // Don't fail the entire response if Mailchimp fails
        }
      }
    }

    const response = {
      success: session.payment_status === 'paid',
      payment_status: session.payment_status,
      order_details: orderDetails
    };

    logStep('Returning response', response);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in verify-payment', { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});