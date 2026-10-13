import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/** Internal-only log of thank-you page calendar taps. Never throws. */
export function trackCalendarClick(
  calendar: "google" | "apple",
  opts: { email?: string | null; roundId?: string | null; page?: string } = {},
): void {
  try {
    const page = (opts.page || window.location.pathname).slice(0, 40);
    const roundId = opts.roundId && UUID_RE.test(opts.roundId) ? opts.roundId : null;
    const email = opts.email ? opts.email.toLowerCase().trim().slice(0, 320) : null;
    void (supabase as any)
      .from("webinar_calendar_clicks")
      .insert({ calendar, page, round_id: roundId, email })
      .then(() => {}, () => {});
  } catch {
    /* ignore */
  }
}
