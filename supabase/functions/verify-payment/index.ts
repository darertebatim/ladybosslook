import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request data
    const { sessionId } = await req.json();
    logStep("Request data parsed", { sessionId });

    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      status: session.payment_status,
      amount: session.amount_total 
    });

    // Update order status using secure function
    const newStatus = session.payment_status === "paid" ? "paid" : "failed";
    const { data: orderData, error: orderError } = await supabaseService
      .rpc('update_order_status_secure', {
        p_stripe_session_id: sessionId,
        p_status: newStatus
      });

    if (orderError) {
      logStep("Database error", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    // Get the updated order details
    const { data: updatedOrder, error: fetchError } = await supabaseService
      .from("orders")
      .select()
      .eq("stripe_session_id", sessionId)
      .single();

    if (fetchError) {
      logStep("Database fetch error", fetchError);
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    logStep("Order status updated", { 
      orderId: orderData, 
      status: newStatus,
      orderDetails: updatedOrder
    });

    // If payment is successful, send email to Mailchimp
    if (session.payment_status === "paid") {
      logStep("Payment successful, adding to Mailchimp");
      
      try {
         // Call the existing mailchimp-subscribe function with workshop-specific data
         const mailchimpResponse = await supabaseService.functions.invoke('mailchimp-subscribe', {
           body: {
             email: updatedOrder.email,
             name: updatedOrder.name,
             phone: updatedOrder.phone,
             city: "Not provided", // Default for payment customers
             source: `payment_${updatedOrder.product_name.toLowerCase().replace(/\s+/g, '_')}`,
             workshop_name: updatedOrder.product_name,
             purchase_amount: updatedOrder.amount,
             purchase_date: new Date().toISOString(),
             payment_status: "paid",
             tags: [
               `workshop_${updatedOrder.product_name.toLowerCase().replace(/\s+/g, '_')}`,
               "paid_customer",
               "workshop_attendee"
             ]
           }
         });

        if (mailchimpResponse.error) {
          logStep("Mailchimp error", mailchimpResponse.error);
        } else {
          logStep("Successfully added to Mailchimp");
        }
      } catch (mailchimpError) {
        logStep("Mailchimp subscription failed", mailchimpError);
        // Don't fail the payment verification if Mailchimp fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      paymentStatus: session.payment_status,
      order: updatedOrder,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});