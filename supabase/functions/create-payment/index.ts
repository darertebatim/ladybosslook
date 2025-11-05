import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

const validateProgram = (program: string): boolean => {
  const validPrograms = ['courageous-character', 'business-coaching', 'money-literacy', 'business-startup', 'business-growth', 'iqmoney', 'empowered-ladyboss', 'ladyboss-vip', 'connection-literacy', 'instagram-growth', 'private-coaching', 'one-bilingual', 'empowered-woman-coaching'];
  return validPrograms.includes(program);
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

    // Parse and validate request data
    const requestBody = await req.json();
    const { program, name, email, phone } = requestBody;
    
    // Validate required program field
    if (!program || typeof program !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Program selection required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate program against whitelist
    if (!validateProgram(program)) {
      return new Response(
        JSON.stringify({ error: 'Invalid program selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
    
    logStep("Request data validated", { program });

    // Define program pricing (whitelist approach)
    const programPricing = {
      "courageous-character": {
        name: "Courageous Character Course",
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
        amount: 99700, // $997 in cents
        description: "Master your finances and build wealth"
      },
      "iqmoney": {
        name: "IQMoney - Income Growth Program",
        amount: 199700, // $1997 in cents
        description: "Master strategies to increase your income and earning potential"
      },
      "empowered-ladyboss": {
        name: "Empowered Ladyboss Group Coaching",
        amount: 99700, // $997 in cents
        description: "3-month weekly group coaching sessions for ambitious women entrepreneurs"
      },
      "business-startup": {
        name: "Business Startup Accelerator",
        amount: 499700, // $4997 in cents
        description: "3-month semi-private weekly sessions to launch your business"
      },
      "business-growth": {
        name: "Business Growth Accelerator",
        amount: 499700, // $4997 in cents
        description: "3-month semi-private weekly sessions to scale your business"
      },
      "ladyboss-vip": {
        name: "Ladyboss VIP Club",
        amount: 499700, // $4997 in cents
        description: "12-month exclusive weekly group coaching for elite women entrepreneurs"
      },
      "connection-literacy": {
        name: "Connection Literacy for Ladyboss",
        amount: 49700, // $497 in cents
        description: "Master networking and relationship building to expand your influence"
      },
      "instagram-growth": {
        name: "Instagram Fast Growth Course",
        amount: 299700, // $2997 in cents
        description: "3-month semi-private coaching to rapidly grow your Instagram presence"
      },
      "private-coaching": {
        name: "1-Hour Private Session with Razie Ladyboss",
        amount: 59700, // $597 in cents
        description: "Exclusive one-on-one coaching session with Razie for personalized guidance"
      },
      "one-bilingual": {
        name: "کلاس قدرت دو زبانه - Bilingual Power Class",
        amount: 100, // $1 in cents
        description: "Learn to speak with power in any language - special for Iranian immigrant women"
      },
      "empowered-woman-coaching": {
        name: "Empowered Woman Coaching - Interview Deposit",
        amount: 10000, // $100 in cents
        description: "$100 deposit to reserve your spot and schedule interview with Razie Ladyboss"
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
      success_url: program === 'one-bilingual' 
        ? `${req.headers.get("origin")}/thankone?session_id={CHECKOUT_SESSION_ID}`
        : `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: program === 'one-bilingual'
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