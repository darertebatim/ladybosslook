import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    logStep("Starting Stripe products sync");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Use service role for database updates
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all programs from database
    const { data: programs, error: programsError } = await supabaseAdmin
      .from("program_catalog")
      .select("id, slug, title, payment_type, stripe_product_id, stripe_price_id");

    if (programsError) {
      throw new Error(`Failed to fetch programs: ${programsError.message}`);
    }

    logStep("Fetched programs from database", { count: programs?.length });

    // Fetch all active Stripe products
    const stripeProducts = await stripe.products.list({ active: true, limit: 100 });
    logStep("Fetched Stripe products", { count: stripeProducts.data.length });

    // Fetch all active prices
    const stripePrices = await stripe.prices.list({ active: true, limit: 100 });
    logStep("Fetched Stripe prices", { count: stripePrices.data.length });

    // Build a map of product prices
    const pricesByProduct: Record<string, Stripe.Price[]> = {};
    for (const price of stripePrices.data) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      if (!pricesByProduct[productId]) {
        pricesByProduct[productId] = [];
      }
      pricesByProduct[productId].push(price);
    }

    // Matching logic
    const results: Array<{
      program: string;
      matched: boolean;
      stripeProduct?: string;
      stripePrice?: string;
      updated: boolean;
      reason?: string;
    }> = [];

    const normalizeForMatch = (str: string) => {
      return str.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/coaching/g, '')
        .replace(/course/g, '')
        .replace(/program/g, '');
    };

    for (const program of programs || []) {
      const programNormalized = normalizeForMatch(program.title);
      const programSlugNormalized = normalizeForMatch(program.slug);

      let bestMatch: Stripe.Product | null = null;
      let bestMatchScore = 0;

      for (const stripeProduct of stripeProducts.data) {
        const productNormalized = normalizeForMatch(stripeProduct.name);
        
        // Check for matches
        let score = 0;
        
        // Exact match on normalized
        if (productNormalized === programNormalized || productNormalized === programSlugNormalized) {
          score = 100;
        }
        // Partial matches
        else if (productNormalized.includes(programNormalized) || programNormalized.includes(productNormalized)) {
          score = 80;
        }
        else if (productNormalized.includes(programSlugNormalized) || programSlugNormalized.includes(productNormalized)) {
          score = 70;
        }
        // Check for key words
        else {
          const programWords = programNormalized.split('').filter(c => c !== '');
          const productWords = productNormalized.split('').filter(c => c !== '');
          
          // Check specific program patterns
          if (program.slug.includes('ewplus') && stripeProduct.name.toLowerCase().includes('ewplus')) {
            score = 90;
          }
          else if (program.slug.includes('empowered-woman') && stripeProduct.name.toLowerCase().includes('empowered woman')) {
            score = 85;
          }
          else if (program.slug.includes('courageous') && stripeProduct.name.toLowerCase().includes('courageous')) {
            score = 85;
          }
          else if (program.slug.includes('money-literacy') && stripeProduct.name.toLowerCase().includes('money')) {
            score = 75;
          }
          else if (program.slug.includes('bilingual') && stripeProduct.name.toLowerCase().includes('bilingual')) {
            score = 85;
          }
          else if (program.slug.includes('health') && stripeProduct.name.toLowerCase().includes('health')) {
            score = 75;
          }
          else if (program.slug.includes('ladyboss') && stripeProduct.name.toLowerCase().includes('ladyboss')) {
            score = 85;
          }
        }

        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = stripeProduct;
        }
      }

      if (bestMatch && bestMatchScore >= 70) {
        const productPrices = pricesByProduct[bestMatch.id] || [];
        
        // For subscriptions, find recurring price; for one-time, find one_time price
        let selectedPrice: Stripe.Price | undefined;
        
        if (program.payment_type === 'subscription') {
          selectedPrice = productPrices.find(p => p.type === 'recurring');
        } else {
          selectedPrice = productPrices.find(p => p.type === 'one_time');
        }
        
        // If no specific type found, use the first active price
        if (!selectedPrice && productPrices.length > 0) {
          selectedPrice = productPrices[0];
        }

        // Check if update is needed
        const needsUpdate = 
          program.stripe_product_id !== bestMatch.id || 
          (selectedPrice && program.stripe_price_id !== selectedPrice.id);

        if (needsUpdate) {
          const updateData: any = { stripe_product_id: bestMatch.id };
          if (selectedPrice) {
            updateData.stripe_price_id = selectedPrice.id;
          }

          const { error: updateError } = await supabaseAdmin
            .from("program_catalog")
            .update(updateData)
            .eq("id", program.id);

          if (updateError) {
            results.push({
              program: program.title,
              matched: true,
              stripeProduct: bestMatch.name,
              stripePrice: selectedPrice?.id,
              updated: false,
              reason: `Update failed: ${updateError.message}`,
            });
          } else {
            results.push({
              program: program.title,
              matched: true,
              stripeProduct: bestMatch.name,
              stripePrice: selectedPrice?.id,
              updated: true,
            });
            logStep("Updated program", { 
              program: program.title, 
              productId: bestMatch.id,
              priceId: selectedPrice?.id 
            });
          }
        } else {
          results.push({
            program: program.title,
            matched: true,
            stripeProduct: bestMatch.name,
            stripePrice: selectedPrice?.id,
            updated: false,
            reason: "Already synced",
          });
        }
      } else {
        results.push({
          program: program.title,
          matched: false,
          updated: false,
          reason: bestMatch 
            ? `Best match "${bestMatch.name}" score too low (${bestMatchScore})` 
            : "No matching Stripe product found",
        });
      }
    }

    const summary = {
      total: results.length,
      matched: results.filter(r => r.matched).length,
      updated: results.filter(r => r.updated).length,
      notMatched: results.filter(r => !r.matched).length,
    };

    logStep("Sync completed", summary);

    return new Response(JSON.stringify({ results, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Error during sync", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
