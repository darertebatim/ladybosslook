import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePhone = (phone: string): boolean => {
  // Basic international phone validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
  return phoneRegex.test(phone);
};

const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>'"]/g, '').substring(0, 255);
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

    // Parse request data with enhanced validation
    const requestBody = await req.json();
    
    // Enhanced input validation
    const { name, email, phone, program } = requestBody;
    
    if (!name || typeof name !== 'string' || name.length > 100 || name.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid name provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!phone || !validatePhone(phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!program || typeof program !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Program selection required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPhone = sanitizeString(phone);
    logStep("Request data parsed and validated", { name: sanitizedName, email: sanitizedEmail, phone: sanitizedPhone, program });

    // Define program pricing (whitelist approach)
    const programPricing = {
      "courageous-character": {
        name: "Courageous Character Workshop",
        amount: 9700, // $97 in cents
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
      return new Response(
        JSON.stringify({ error: 'Invalid program selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Program selected", selectedProgram);

    // Check if customer exists (with sanitized email)
    const customers = await stripe.customers.list({ 
      email: sanitizedEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: sanitizedEmail,
        name: sanitizedName,
        phone: sanitizedPhone,
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
          customer_name: sanitizedName,
          customer_email: sanitizedEmail,
        },
      },
    });

    logStep("Stripe checkout session created", { sessionId: session.id });

    // Create order record in database (using sanitized inputs)
    const { data: orderData, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        email: sanitizedEmail,
        name: sanitizedName,
        phone: sanitizedPhone,
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