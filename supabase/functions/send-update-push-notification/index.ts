import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Compare semantic versions: returns true if v1 < v2
function isVersionLessThan(v1: string, v2: string): boolean {
  const parts1 = v1.split(".").map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split(".").map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return true;
    if (p1 > p2) return false;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { targetVersion, title, body, dryRun = false } = await req.json();

    if (!targetVersion) {
      return new Response(
        JSON.stringify({ error: "targetVersion is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[UpdatePush] Targeting users below version: ${targetVersion}`);

    // Get all push subscriptions with their versions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, app_version")
      .like("endpoint", "native:%");

    if (subError) {
      console.error("[UpdatePush] Error fetching subscriptions:", subError);
      throw subError;
    }

    // Filter to users with outdated versions (or null/unknown versions)
    const outdatedSubscriptions = subscriptions?.filter((sub) => {
      if (!sub.app_version) return true; // Include users with unknown version
      return isVersionLessThan(sub.app_version, targetVersion);
    }) || [];

    console.log(`[UpdatePush] Found ${outdatedSubscriptions.length} outdated subscriptions`);

    // Group by version for stats
    const versionStats: Record<string, number> = {};
    outdatedSubscriptions.forEach((sub) => {
      const v = sub.app_version || "unknown";
      versionStats[v] = (versionStats[v] || 0) + 1;
    });

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          targetVersion,
          totalOutdated: outdatedSubscriptions.length,
          versionDistribution: versionStats,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send push notifications
    const apnKey = Deno.env.get("APNS_AUTH_KEY");
    const apnKeyId = Deno.env.get("APNS_KEY_ID");
    const apnTeamId = Deno.env.get("APNS_TEAM_ID");
    const apnBundleId = Deno.env.get("APNS_TOPIC") || "app.simora.ios";

    if (!apnKey || !apnKeyId || !apnTeamId) {
      return new Response(
        JSON.stringify({ error: "APNs credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // Generate JWT for APNs ONCE and reuse for all notifications
    const header = { alg: "ES256", kid: apnKeyId };
    const now = Math.floor(Date.now() / 1000);
    const claims = { iss: apnTeamId, iat: now };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const claimsB64 = btoa(JSON.stringify(claims))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const signatureInput = `${headerB64}.${claimsB64}`;

    const pemContent = apnKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, "");
    const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      encoder.encode(signatureInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const jwt = `${signatureInput}.${signatureB64}`;

    for (const sub of outdatedSubscriptions) {
      const deviceToken = sub.endpoint.replace("native:", "");

      try {
        const payload = {
          aps: {
            alert: {
              title: title || "Update Available 🚀",
              body: body || "A new version is ready! Update now for the best experience.",
            },
            sound: "default",
            badge: 1,
          },
          url: "https://apps.apple.com/app/id6746970920",
        };

        const response = await fetch(
          `https://api.push.apple.com/3/device/${deviceToken}`,
          {
            method: "POST",
            headers: {
              Authorization: `bearer ${jwt}`,
              "apns-topic": apnBundleId,
              "apns-push-type": "alert",
              "apns-priority": "10",
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          const errorText = await response.text();
          console.error(`[UpdatePush] APNs error for ${sub.user_id}:`, errorText);
          failCount++;

          if (response.status === 410 || response.status === 400) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
        }
      } catch (err) {
        console.error(`[UpdatePush] Error sending to ${sub.user_id}:`, err);
        failCount++;
      }
    }

    // Log the notification
    await supabase.from("push_notification_logs").insert({
      type: "update_notification",
      title: title || "Update Available 🚀",
      body: body || "A new version is ready!",
      sent_count: successCount,
      failed_count: failCount,
      metadata: {
        targetVersion,
        versionDistribution: versionStats,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        targetVersion,
        sent: successCount,
        failed: failCount,
        versionDistribution: versionStats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[UpdatePush] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
