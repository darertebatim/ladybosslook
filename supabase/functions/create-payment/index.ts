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
    const { program, paymentOption, name, email, phone } = requestBody;
    
    // Validate required program field
    if (!program || typeof program !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Program selection required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logStep("Request data validated", { program, paymentOption });

    // Fetch program details from database
    const { data: programData, error: programError } = await supabase
      .from('program_catalog')
      .select('slug, title, price_amount, description, payment_type, deposit_price, subscription_interval, subscription_interval_count, subscription_full_payment_price')
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

    logStep("Program found", { title: programData.title, price: programData.price_amount, paymentType: programData.payment_type });
    
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

    // Determine payment mode and pricing
    // Check if subscription program with full payment option selected
    const isFullPaymentForSubscription = programData.payment_type === 'subscription' && 
      paymentOption === 'full' && 
      programData.subscription_full_payment_price;
    
    const isSubscription = programData.payment_type === 'subscription' && !isFullPaymentForSubscription;
    const isDeposit = programData.payment_type === 'deposit';
    
    // Calculate charge amount
    let chargeAmount: number;
    let productName: string;
    let productDescription: string;
    
    if (isFullPaymentForSubscription) {
      // One-time full payment for a subscription program
      chargeAmount = programData.subscription_full_payment_price!;
      productName = `${programData.title} (Full Payment)`;
      productDescription = `One-time full payment for ${programData.title}`;
    } else if (isDeposit && programData.deposit_price) {
      chargeAmount = programData.deposit_price;
      productName = `${programData.title} (Deposit)`;
      productDescription = `Deposit payment for ${programData.title}. Remaining balance to be paid separately.`;
    } else {
      chargeAmount = programData.price_amount;
      productName = programData.title;
      productDescription = programData.description || programData.title;
    }

    logStep("Payment configuration", { 
      isSubscription, 
      isDeposit,
      isFullPaymentForSubscription,
      chargeAmount, 
      interval: programData.subscription_interval,
      intervalCount: programData.subscription_interval_count 
    });

    // Build success/cancel URLs
    const origin = req.headers.get("origin") || 'https://ladybosslook.com';
    const successUrl = program === 'bilingual-power-class' 
      ? `${origin}/thankone?session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = program === 'bilingual-power-class'
      ? `${origin}/one`
      : `${origin}/programs`;

    let session: Stripe.Checkout.Session;

    if (isSubscription) {
      // Create subscription checkout session
      logStep("Creating subscription checkout session");
      
      // Create a price for the subscription
      const price = await stripe.prices.create({
        unit_amount: chargeAmount,
        currency: 'usd',
        recurring: {
          interval: (programData.subscription_interval as 'day' | 'week' | 'month' | 'year') || 'month',
        },
        product_data: {
          name: productName,
          metadata: {
            program_slug: program,
          },
        },
      });

      logStep("Stripe price created for subscription", { priceId: price.id });

      // Build subscription data with cancel_at if interval_count is set
      const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
        metadata: {
          program: program,
          payment_type: programData.payment_type,
          product_name: productName,
        },
      };

      // Auto-cancel after N billing periods
      if (programData.subscription_interval_count) {
        const intervalDays: Record<string, number> = {
          'day': 1,
          'week': 7,
          'month': 30,
          'year': 365,
        };
        const daysPerInterval = intervalDays[programData.subscription_interval || 'month'] || 30;
        const totalDays = daysPerInterval * programData.subscription_interval_count;
        const cancelAt = Math.floor(Date.now() / 1000) + (totalDays * 24 * 60 * 60);
        subscriptionData.cancel_at = cancelAt;
        logStep("Subscription will auto-cancel", { 
          intervalCount: programData.subscription_interval_count,
          cancelAt: new Date(cancelAt * 1000).toISOString()
        });
      }

      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: subscriptionData,
        metadata: {
          program: program,
          payment_type: programData.payment_type,
          product_name: productName,
        },
      });

    } else {
      // Create one-time payment checkout session
      logStep("Creating one-time payment checkout session");
      
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: productName,
                description: productDescription,
              },
              unit_amount: chargeAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true
        },
        customer_creation: 'always',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
          setup_future_usage: 'off_session',
          metadata: {
            program: program,
            payment_type: programData.payment_type,
            is_deposit: isDeposit ? 'true' : 'false',
            product_name: productName,
          },
        },
        metadata: {
          program: program,
          program_slug: program,
          payment_type: programData.payment_type,
          product_name: productName,
        },
      });
    }

    logStep("Stripe checkout session created", { sessionId: session.id, mode: session.mode });

    // Return session URL directly
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
