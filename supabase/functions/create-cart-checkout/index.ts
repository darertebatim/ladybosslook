import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkProgramRegionBlocks } from "../_shared/region-restriction.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[CART-CHECKOUT] User:', user.id);

    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[CART-CHECKOUT] Cart items:', cartItems.length);

    // Region check — reject before touching Stripe
    const cartSlugs = cartItems.map((i: any) => i.program_slug);
    const regionBlocks = await checkProgramRegionBlocks(supabase, user.id, cartSlugs);
    if (Object.keys(regionBlocks).length > 0) {
      console.log('[CART-CHECKOUT] Region blocked:', regionBlocks);
      return new Response(
        JSON.stringify({
          error: 'One or more programs in your cart are not available in your region.',
          code: 'region_restricted',
          blocked: regionBlocks,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Build line items from cart
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const programSlugs: string[] = [];
    const freePrograms: { slug: string; title: string }[] = [];

    for (const item of cartItems) {
      // Fetch current price from catalog
      const { data: program } = await supabase
        .from('program_catalog')
        .select('title, price_amount, deposit_price, payment_type, stripe_product_id, is_active')
        .eq('slug', item.program_slug)
        .eq('is_active', true)
        .single();

      if (!program) {
        console.log('[CART-CHECKOUT] Skipping inactive program:', item.program_slug);
        continue;
      }

      const isDeposit = program.payment_type === 'deposit';
      const chargeAmount = isDeposit && program.deposit_price ? program.deposit_price : program.price_amount;
      const isFree = program.payment_type === 'free' || chargeAmount === 0;

      if (isFree) {
        freePrograms.push({ slug: item.program_slug, title: program.title });
        continue;
      }

      const productName = isDeposit ? `${program.title} (Deposit)` : program.title;

      let resolvedPriceId: string | null = null;
      if (program.stripe_product_id && !isDeposit) {
        try {
          const stripeProduct = await stripe.products.retrieve(program.stripe_product_id, {
            expand: ['default_price'],
          });
          const dp: any = (stripeProduct as any).default_price;
          if (dp && typeof dp === 'object' && dp.active && !dp.recurring) {
            resolvedPriceId = dp.id;
            console.log('[CART-CHECKOUT] Using default price', dp.id, dp.currency, dp.unit_amount);
          }
        } catch (e: any) {
          console.error('[CART-CHECKOUT] Product lookup failed:', e?.message);
        }
      }

      if (resolvedPriceId) {
        lineItems.push({ price: resolvedPriceId, quantity: 1 });
      } else if (program.stripe_product_id) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product: program.stripe_product_id,
            unit_amount: chargeAmount,
          },
          quantity: 1,
        });
      } else {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: productName },
            unit_amount: chargeAmount,
          },
          quantity: 1,
        });
      }


      programSlugs.push(item.program_slug);
    }

    // Enroll free programs directly (no Stripe needed)
    if (freePrograms.length > 0) {
      console.log('[CART-CHECKOUT] Enrolling free programs:', freePrograms.map(p => p.slug));
      try {
        await supabase.functions.invoke('enroll-free-programs', {
          body: { slugs: freePrograms.map(p => p.slug) },
          headers: { Authorization: authHeader },
        });
      } catch (e: any) {
        console.error('[CART-CHECKOUT] Free enrollment invoke error:', e?.message);
      }
    }

    // If only free items — skip Stripe entirely
    if (lineItems.length === 0) {
      const origin = req.headers.get('origin') || 'https://ladybosslook.com';
      const freeSlugsParam = freePrograms.map(p => p.slug).join(',');
      return new Response(JSON.stringify({
        url: `${origin}/payment-success?free=1${freeSlugsParam ? `&programs=${encodeURIComponent(freeSlugsParam)}` : ''}`,
        freeOnly: true,
        enrolled: freePrograms.map(p => p.slug),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') || 'https://ladybosslook.com';

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      customer_creation: 'always',
      customer_email: user.email,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        cart_checkout: 'true',
        user_id: user.id,
        program_slugs: programSlugs.join(','),
        product_name: programSlugs.length === 1 ? programSlugs[0] : `Cart (${programSlugs.length} programs)`,
      },
    });

    console.log('[CART-CHECKOUT] Session created:', session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[CART-CHECKOUT] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
