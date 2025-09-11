import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

    // Parse request data - only need program type
    const requestBody = await req.json();
    const { program } = requestBody;
    
    if (!program || typeof program !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Program selection required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logStep("Request data parsed", { program });

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

    // Create checkout session - let Stripe collect all customer data
    const session = await stripe.checkout.sessions.create({
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
      payment_method_types: ['card'], // Restrict to card payments only
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true
      },
      customer_creation: 'always',
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/courageous-workshop?payment=cancelled`,
      payment_intent_data: {
        metadata: {
          program: program,
        },
      },
    });

    logStep("Stripe checkout session created", { sessionId: session.id });

    // Return session URL directly - no pre-payment database records needed
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id
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