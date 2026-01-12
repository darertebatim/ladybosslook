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
    const { program, paymentOption, name, email, phone, idempotencyKey } = requestBody;
    
    // Validate required program field
    if (!program || typeof program !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Program selection required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logStep("Request data validated", { program, paymentOption, hasIdempotencyKey: !!idempotencyKey });

    // Fetch program details from database
    const { data: programData, error: programError } = await supabase
      .from('program_catalog')
      .select('slug, title, price_amount, description, payment_type, deposit_price, subscription_interval, subscription_interval_count, subscription_full_payment_price, stripe_product_id, stripe_price_id')
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
    
    const sanitizedEmail = email ? email.trim().toLowerCase() : null;
    
    if (sanitizedEmail && !validateEmail(sanitizedEmail)) {
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

    // Check for recent duplicate payment attempts (within 10 minutes)
    if (sanitizedEmail) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: recentOrder, error: recentOrderError } = await supabase
        .from('orders')
        .select('id, status, created_at, stripe_session_id')
        .eq('email', sanitizedEmail)
        .eq('program_slug', program)
        .gte('created_at', tenMinutesAgo)
        .in('status', ['pending', 'paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!recentOrderError && recentOrder) {
        logStep("Duplicate payment detected", { 
          email: sanitizedEmail, 
          program, 
          existingOrderId: recentOrder.id,
          status: recentOrder.status,
          createdAt: recentOrder.created_at
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'duplicate_detected',
            message: 'You have a recent payment attempt for this program. Please wait a few minutes before trying again.',
            existingOrderId: recentOrder.id,
            status: recentOrder.status
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Build Stripe idempotency key
    const stripeIdempotencyKey = idempotencyKey 
      ? `checkout-${program}-${idempotencyKey}` 
      : undefined;

    if (isSubscription) {
      // Create subscription checkout session
      logStep("Creating subscription checkout session");
      
      let priceId: string;
      
      // Check if we have an existing Stripe price ID to reuse
      if (programData.stripe_price_id) {
        priceId = programData.stripe_price_id;
        logStep("Reusing existing Stripe price", { priceId });
      } else {
        // Create a new price for the subscription (legacy behavior)
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
        priceId = price.id;
        logStep("Created new Stripe price for subscription", { priceId });
      }

      // Build subscription data
      // Note: cancel_at is not supported in Checkout Session subscription_data
      // Auto-cancellation must be handled via webhook after subscription creation
      const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
        metadata: {
          program: program,
          payment_type: programData.payment_type,
          product_name: productName,
          auto_cancel_after_months: programData.subscription_interval_count?.toString() || '',
        },
      };

      if (programData.subscription_interval_count) {
        logStep("Subscription configured for auto-cancel", { 
          intervalCount: programData.subscription_interval_count,
          note: "Will be set via webhook after subscription creation"
        });
      }

      const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
        line_items: [
          {
            price: priceId,
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
      };

      session = stripeIdempotencyKey 
        ? await stripe.checkout.sessions.create(sessionCreateParams, { idempotencyKey: stripeIdempotencyKey })
        : await stripe.checkout.sessions.create(sessionCreateParams);

    } else {
      // Create one-time payment checkout session
      logStep("Creating one-time payment checkout session");
      
      // Build line items - reuse existing product if available
      let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
      
      if (programData.stripe_product_id) {
        // Create a price using the existing product
        logStep("Reusing existing Stripe product", { productId: programData.stripe_product_id });
        lineItems = [
          {
            price_data: {
              currency: "usd",
              product: programData.stripe_product_id,
              unit_amount: chargeAmount,
            },
            quantity: 1,
          },
        ];
      } else {
        // Create inline product_data (legacy behavior)
        lineItems = [
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
        ];
      }
      
      const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode: "payment",
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
      };

      session = stripeIdempotencyKey
        ? await stripe.checkout.sessions.create(sessionCreateParams, { idempotencyKey: stripeIdempotencyKey })
        : await stripe.checkout.sessions.create(sessionCreateParams);
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
