// Shared helper: invoke the send-enrollment-confirmation edge function from
// any enrollment path (free, stripe, revenuecat, admin). Fire-and-forget,
// non-blocking, mirrors send-purchase-welcome.ts semantics.

const PLUS_SLUGS = new Set([
  "simora-plus",
  "simora-plus-annual",
  "ladybosslook-plus",
  "ladybosslook-plus-annual",
]);

export interface SendEnrollmentEmailArgs {
  userId: string;
  programSlug: string;
  roundId?: string | null;
  orderId?: string | null;
}

export async function sendEnrollmentEmail(
  _supabase: any,
  { userId, programSlug, roundId, orderId }: SendEnrollmentEmailArgs,
): Promise<void> {
  try {
    if (!userId || !programSlug) {
      console.log("[ENROLL-EMAIL] skip — missing userId/programSlug");
      return;
    }
    if (PLUS_SLUGS.has(programSlug)) {
      console.log("[ENROLL-EMAIL] skip — subscription slug", programSlug);
      return;
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      console.error("[ENROLL-EMAIL] missing SUPABASE_URL/SERVICE_ROLE_KEY");
      return;
    }

    const res = await fetch(`${url}/functions/v1/send-enrollment-confirmation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        user_id: userId,
        program_slug: programSlug,
        round_id: roundId ?? null,
        order_id: orderId ?? null,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[ENROLL-EMAIL] failed", res.status, txt);
    } else {
      console.log("[ENROLL-EMAIL] ✓ sent for", programSlug, "→", userId);
    }
  } catch (err: any) {
    console.error("[ENROLL-EMAIL] error", err?.message || err);
  }
}