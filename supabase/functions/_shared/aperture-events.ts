/**
 * Server-side helper for writing into aperture_events from edge
 * functions. Uses the service-role client passed in by the caller so
 * writes bypass RLS and can be attributed to the correct user.
 *
 * Fire-and-forget — never throws. Losing a single event must never
 * break a chat stream or an onboarding flow.
 */
export async function logApertureEvent(
  supabase: any,
  userId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
  conversationId: string | null = null,
): Promise<void> {
  try {
    if (!userId) return;
    await supabase.from("aperture_events").insert({
      user_id: userId,
      event_type: eventType,
      payload,
      conversation_id: conversationId,
    });
  } catch (e) {
    console.error("logApertureEvent failed", eventType, e);
  }
}