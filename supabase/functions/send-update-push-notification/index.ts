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

// ─── FCM helpers ───
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

async function getFcmAccessToken(serviceAccountJson: string): Promise<{ token: string; projectId: string }> {
  const sa = JSON.parse(serviceAccountJson);
  const keyData = pemToArrayBuffer(sa.private_key);
  const key = await crypto.subtle.importKey(
    "pkcs8", keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, signingInput);
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = `${header}.${payload}.${signature}`;
  const tokenResponse = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenResponse.ok) {
    throw new Error(`FCM token exchange failed: ${await tokenResponse.text()}`);
  }
  const tokenData = await tokenResponse.json();
  return { token: tokenData.access_token, projectId: sa.project_id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { targetVersion, title, body, dryRun = false, platform } = await req.json();

    if (!targetVersion) {
      return new Response(
        JSON.stringify({ error: "targetVersion is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[UpdatePush] Targeting users below version: ${targetVersion} (platform=${platform || 'any'})`);

    // Get push subscriptions, optionally filtered by platform
    let query = supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, app_version, platform")
      .like("endpoint", "native:%");
    if (platform === "ios" || platform === "android") {
      // Include legacy null-platform rows ONLY for iOS (existing fleet was iOS-dominant before tagging shipped).
      // For Android, require explicit platform tag to avoid pushing iOS users.
      if (platform === "ios") {
        query = query.or("platform.eq.ios,platform.is.null");
      } else {
        query = query.eq("platform", "android");
      }
    }
    const { data: subscriptions, error: subError } = await query;

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
          platform: platform || "any",
          totalOutdated: outdatedSubscriptions.length,
          versionDistribution: versionStats,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // ─── Prepare APNs JWT (lazy: only if any iOS subscriber present) ───
    const iosSubs = outdatedSubscriptions.filter((s) => s.platform === "ios" || !s.platform);
    const androidSubs = outdatedSubscriptions.filter((s) => s.platform === "android");

    let apnsJwt: string | null = null;
    let apnsTopic = "";
    if (iosSubs.length > 0) {
      const apnKey = Deno.env.get("APNS_AUTH_KEY");
      const apnKeyId = Deno.env.get("APNS_KEY_ID");
      const apnTeamId = Deno.env.get("APNS_TEAM_ID");
      apnsTopic = Deno.env.get("APNS_TOPIC") || "app.simora.ios";
      if (!apnKey || !apnKeyId || !apnTeamId) {
        console.error("[UpdatePush] APNs credentials not configured — skipping iOS subs");
      } else {
        const headerB64 = btoa(JSON.stringify({ alg: "ES256", kid: apnKeyId }))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const claimsB64 = btoa(JSON.stringify({ iss: apnTeamId, iat: Math.floor(Date.now() / 1000) }))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const signatureInput = `${headerB64}.${claimsB64}`;
        const pemContent = apnKey
          .replace(/-----BEGIN PRIVATE KEY-----/, "")
          .replace(/-----END PRIVATE KEY-----/, "")
          .replace(/\s/g, "");
        const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
          "pkcs8", binaryKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
        );
        const signature = await crypto.subtle.sign(
          { name: "ECDSA", hash: "SHA-256" }, cryptoKey, new TextEncoder().encode(signatureInput)
        );
        const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        apnsJwt = `${signatureInput}.${signatureB64}`;
      }
    }

    // ─── Prepare FCM access token (lazy: only if any Android subscriber present) ───
    let fcmAccess: { token: string; projectId: string } | null = null;
    if (androidSubs.length > 0) {
      const sa = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
      if (!sa) {
        console.error("[UpdatePush] FCM_SERVICE_ACCOUNT_KEY not configured — skipping Android subs");
      } else {
        try {
          fcmAccess = await getFcmAccessToken(sa);
        } catch (err) {
          console.error("[UpdatePush] FCM token error:", err);
        }
      }
    }

    const notifTitle = title || "Update Available 🚀";
    const notifBody = body || "A new version is ready! Update now for the best experience.";
    const iosUrl = "https://apps.apple.com/app/simora-ladybosslook/id6755076134";
    const androidUrl = "https://play.google.com/store/apps/details?id=com.ladybosslook.academy";

    // Send to iOS
    if (apnsJwt) {
      for (const sub of iosSubs) {
        const deviceToken = sub.endpoint.replace("native:", "");
        try {
          const response = await fetch(`https://api.push.apple.com/3/device/${deviceToken}`, {
            method: "POST",
            headers: {
              Authorization: `bearer ${apnsJwt}`,
              "apns-topic": apnsTopic,
              "apns-push-type": "alert",
              "apns-priority": "10",
            },
            body: JSON.stringify({
              aps: { alert: { title: notifTitle, body: notifBody }, sound: "default", badge: 1 },
              url: iosUrl,
            }),
          });
          if (response.ok) {
            successCount++;
          } else {
            const errorText = await response.text();
            console.error(`[UpdatePush] APNs error for ${sub.user_id}:`, errorText);
            failCount++;
            if (response.status === 410 || response.status === 400) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        } catch (err: any) {
          console.error(`[UpdatePush] APNs send error for ${sub.user_id}:`, err);
          failCount++;
        }
      }
    } else if (iosSubs.length > 0) {
      failCount += iosSubs.length;
    }

    // Send to Android via FCM
    if (fcmAccess) {
      for (const sub of androidSubs) {
        const fcmToken = sub.endpoint.replace("native:", "");
        try {
          const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${fcmAccess.projectId}/messages:send`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${fcmAccess.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: {
                  token: fcmToken,
                  notification: { title: notifTitle, body: notifBody },
                  data: { url: androidUrl },
                  android: {
                    priority: "HIGH",
                    notification: { channel_id: "default", sound: "default" },
                  },
                },
              }),
            }
          );
          if (response.ok) {
            successCount++;
          } else {
            const errorText = await response.text();
            console.error(`[UpdatePush] FCM error for ${sub.user_id}:`, errorText);
            failCount++;
            if (response.status === 404 || response.status === 400) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        } catch (err: any) {
          console.error(`[UpdatePush] FCM send error for ${sub.user_id}:`, err);
          failCount++;
        }
      }
    } else if (androidSubs.length > 0) {
      failCount += androidSubs.length;
    }

    // Log the notification
    await supabase.from("push_notification_logs").insert({
      type: "update_notification",
      title: notifTitle,
      body: notifBody,
      sent_count: successCount,
      failed_count: failCount,
      metadata: {
        targetVersion,
        platform: platform || "any",
        versionDistribution: versionStats,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        targetVersion,
        platform: platform || "any",
        sent: successCount,
        failed: failCount,
        versionDistribution: versionStats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[UpdatePush] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
