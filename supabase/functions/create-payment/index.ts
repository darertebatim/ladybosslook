import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers with strict length limits
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length >= 5 && email.length <= 255;
};

const validatePhone = (phone: string): boolean => {
  // International phone validation: E.164 format or common formats
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20;
};

const validateName = (name: string): boolean => {
  // Letters, spaces, hyphens, apostrophes only, 1-100 characters
  const nameRegex = /^[\p{L}\p{M}\s\-'\.]+$/u;
  return nameRegex.test(name) && name.trim().length >= 1 && name.trim().length <= 100;
};

const sanitizeString = (input: string, maxLength: number = 255): string => {
  // Remove potentially dangerous characters and limit length
  return input.trim().replace(/[<>'"\\]/g, '').substring(0, maxLength);
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Parse and validate request data
    const requestBody = await req.json();
    const { program, name, email, phone, use_deposit } = requestBody;
    
    // Validate required program field
    if (!program || typeof program !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Program selection required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logStep("Request data validated", { program });

    // Fetch program details from database
    const { data: programData, error: programError } = await supabase
      .from('program_catalog')
      .select('slug, title, price_amount, deposit_price, description')
      .eq('slug', program)
      .eq('is_active', true)
      .single();

    if (programError || !programData) {
      logStep("Program not found", { program, error: programError });
      return new Response(
        JSON.stringify({ error: 'Program not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which price to use
    const useDeposit = use_deposit === true;
    const amount = useDeposit && programData.deposit_price 
      ? programData.deposit_price 
      : programData.price_amount;
    
    if (useDeposit && !programData.deposit_price) {
      logStep("WARN: use_deposit requested but deposit_price is null, falling back to price_amount");
    }
    
    logStep("Program found", { 
      title: programData.title, 
      price: programData.price_amount,
      deposit_price: programData.deposit_price,
      use_deposit: useDeposit,
      amount_to_charge: amount
    });
    
    // Validate optional fields if provided (for future use)
    if (name && !validateName(name)) {
      return new Response(
        JSON.stringify({ error: 'Invalid name format. Use only letters, spaces, and hyphens.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (email && !validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (phone && !validatePhone(phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare pricing data from database
    const programPricing = {
      [program]: {
        name: programData.title,
        amount: amount,
        description: programData.description || programData.title,
      }
    };

    const selectedProgram = programPricing[program];
    if (!selectedProgram) {
      return new Response(
        JSON.stringify({ error: 'Program data not available' }),
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
      success_url: program === 'bilingual-power-class' 
        ? `${req.headers.get("origin")}/thankone?session_id={CHECKOUT_SESSION_ID}`
        : `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: program === 'bilingual-power-class'
        ? `${req.headers.get("origin")}/one`
        : `${req.headers.get("origin")}/programs`,
      payment_intent_data: {
        setup_future_usage: 'off_session', // Save payment method for future charges
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