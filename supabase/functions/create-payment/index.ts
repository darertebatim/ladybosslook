import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role key for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request data
    const { name, email, phone, program } = await req.json();
    logStep("Request data parsed", { name, email, phone, program });

    if (!name || !email || !program) {
      throw new Error("Missing required fields: name, email, or program");
    }

    // Define program pricing
    const programPricing = {
      "courageous-character": {
        name: "Courageous Character Workshop",
        amount: 29700, // $297 in cents
        description: "Transform your mindset and build unshakeable confidence"
      },
      "business-coaching": {
        name: "Business Coaching Program",
        amount: 149700, // $1497 in cents
        description: "12-week intensive business transformation program"
      },
      "money-literacy": {
        name: "Money Literacy Program",
        amount: 79700, // $797 in cents
        description: "Master your finances and build wealth"
      }
    };

    const selectedProgram = programPricing[program as keyof typeof programPricing];
    if (!selectedProgram) {
      throw new Error("Invalid program selected");
    }

    logStep("Program selected", selectedProgram);

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        phone: phone,
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: selectedProgram.name,
              description: selectedProgram.description,
            },
            unit_amount: selectedProgram.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/courageous-workshop?payment=cancelled`,
      payment_intent_data: {
        metadata: {
          program: program,
          customer_name: name,
          customer_email: email,
        },
      },
    });

    logStep("Stripe checkout session created", { sessionId: session.id });

    // Create order record in database
    const { data: orderData, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        email: email,
        name: name,
        phone: phone,
        stripe_session_id: session.id,
        amount: selectedProgram.amount,
        currency: "usd",
        status: "pending",
        product_name: selectedProgram.name,
      })
      .select()
      .single();

    if (orderError) {
      logStep("Database error", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    logStep("Order created in database", { orderId: orderData.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      orderId: orderData.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});