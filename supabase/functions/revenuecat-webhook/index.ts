import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization header matches our RevenueCat webhook secret
    const authHeader = req.headers.get("authorization") || "";
    const rcApiKey = Deno.env.get("REVENUECAT_API_KEY") || "";
    
    // Support both "Bearer <key>" and raw "<key>" formats
    const providedKey = authHeader.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    
    if (!rcApiKey || !providedKey || providedKey !== rcApiKey) {
      console.error("[RC Webhook] Unauthorized - provided:", providedKey?.substring(0, 8) + "...", "expected:", rcApiKey?.substring(0, 8) + "...");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body.event;
    
    if (!event) {
      return new Response(JSON.stringify({ error: "No event data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[RC Webhook] Event type:", event.type);
    console.log("[RC Webhook] App user ID:", event.app_user_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userId = event.app_user_id;
    const productId = event.product_id;
    const entitlementIds = event.entitlement_ids || [];
    const expirationDate = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    // Map event types to subscription status
    const activeEvents = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "PRODUCT_CHANGE",
      "UNCANCELLATION",
    ];
    const inactiveEvents = [
      "CANCELLATION",
      "EXPIRATION",
      "BILLING_ISSUE",
      "SUBSCRIPTION_PAUSED",
    ];

    const isActive = activeEvents.includes(event.type);
    const isInactive = inactiveEvents.includes(event.type);

    if (!isActive && !isInactive) {
      console.log("[RC Webhook] Ignoring event type:", event.type);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = isActive ? "active" : "expired";

    // Helper to upsert subscription + enrollment
    async function upsertSubscription(programSlug: string) {
      const { error } = await supabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: userId,
            program_slug: programSlug,
            status,
            platform: "ios",
            product_id: productId,
            revenuecat_id: event.original_app_user_id || userId,
            expires_at: expirationDate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,program_slug" }
        );

      if (error) {
        console.error("[RC Webhook] Supabase upsert error:", error);
      } else {
        console.log("[RC Webhook] ✓ Updated subscription:", programSlug, status);
      }

      // Create enrollment for active subscriptions
      if (isActive) {
        await ensureEnrollment(supabase, userId, programSlug);
      }
      
      // Update enrollment status for inactive subscriptions
      if (isInactive) {
        const { error: enrollError } = await supabase
          .from("course_enrollments")
          .update({ status: "expired" })
          .eq("user_id", userId)
          .eq("program_slug", programSlug);
        
        if (enrollError) {
          console.error("[RC Webhook] Enrollment update error:", enrollError);
        }
      }
    }

    // For each entitlement, upsert the subscription
    for (const entitlementId of entitlementIds) {
      await upsertSubscription(entitlementId);
    }

    // If no entitlements but we have a product ID, try to map it
    if (entitlementIds.length === 0 && productId) {
      console.log("[RC Webhook] No entitlements, using product_id fallback:", productId);
      
      const { data: program } = await supabase
        .from("program_catalog")
        .select("slug")
        .or(`ios_product_id.eq.${productId},annual_ios_product_id.eq.${productId}`)
        .maybeSingle();

      if (program) {
        await upsertSubscription(program.slug);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[RC Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Ensure a course_enrollment exists for this subscription program
 */
async function ensureEnrollment(supabase: any, userId: string, programSlug: string) {
  try {
    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("program_slug", programSlug)
      .maybeSingle();

    if (existing) {
      // Reactivate if expired
      await supabase
        .from("course_enrollments")
        .update({ status: "active" })
        .eq("id", existing.id);
      console.log("[RC Webhook] ✓ Reactivated enrollment for:", programSlug);
      return;
    }

    // Look up the program title
    const { data: program } = await supabase
      .from("program_catalog")
      .select("title")
      .eq("slug", programSlug)
      .maybeSingle();

    const courseName = program?.title || programSlug;

    const { error } = await supabase
      .from("course_enrollments")
      .insert({
        user_id: userId,
        course_name: courseName,
        program_slug: programSlug,
        status: "active",
      });

    if (error) {
      console.error("[RC Webhook] Enrollment creation error:", error);
    } else {
      console.log("[RC Webhook] ✓ Created enrollment for:", programSlug);
    }
  } catch (error) {
    console.error("[RC Webhook] Enrollment creation failed:", error);
  }
}
