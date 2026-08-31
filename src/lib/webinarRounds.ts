import { supabase } from "@/integrations/supabase/client";

export interface WebinarRoundRow {
  id: string;
  round_number: number | null;
  round_name: string | null;
  first_session_date: string | null;
  first_session_duration: number | null;
  google_meet_link: string | null;
  support_link_url: string | null;
  video_url: string | null;
  status: string | null;
}

const SELECT =
  "id, round_number, round_name, first_session_date, first_session_duration, google_meet_link, support_link_url, video_url, status";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve which round a webinar page should show.
 *
 * Priority:
 * 1. Explicit `roundParam` (round UUID, or the round number like "1" / "2") — pinned forever.
 * 2. Next upcoming round whose first session is still in the future (auto-rollover).
 * 3. The round configured for auto-enrollment.
 * 4. Earliest active round.
 */
export async function resolveWebinarRound(
  programSlug: string,
  roundParam?: string | null,
): Promise<WebinarRoundRow | null> {
  const base = () =>
    (supabase as any).from("program_rounds").select(SELECT).eq("program_slug", programSlug);

  // 1. Pinned round
  if (roundParam) {
    const trimmed = roundParam.trim();
    const query = UUID_RE.test(trimmed)
      ? (supabase as any).from("program_rounds").select(SELECT).eq("id", trimmed)
      : /^\d+$/.test(trimmed)
        ? base().eq("round_number", Number(trimmed))
        : base().eq("round_name", trimmed);
    const { data } = await query.maybeSingle();
    if (data) return data as WebinarRoundRow;
  }

  // 2. Next upcoming active round
  const nowIso = new Date().toISOString();
  const { data: upcoming } = await base()
    .eq("status", "active")
    .gt("first_session_date", nowIso)
    .order("first_session_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (upcoming) return upcoming as WebinarRoundRow;

  // 3. Auto-enrollment round
  const { data: autoRule } = await (supabase as any)
    .from("program_auto_enrollment")
    .select("round_id")
    .eq("program_slug", programSlug)
    .maybeSingle();
  if (autoRule?.round_id) {
    const { data } = await (supabase as any)
      .from("program_rounds")
      .select(SELECT)
      .eq("id", autoRule.round_id)
      .maybeSingle();
    if (data) return data as WebinarRoundRow;
  }

  // 4. Earliest active round
  const { data: fallback } = await base()
    .eq("status", "active")
    .order("first_session_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (fallback as WebinarRoundRow) || null;
}

/** All active rounds with a future session, for round pickers. */
export async function listUpcomingWebinarRounds(
  programSlug: string,
): Promise<WebinarRoundRow[]> {
  const { data } = await (supabase as any)
    .from("program_rounds")
    .select(SELECT)
    .eq("program_slug", programSlug)
    .eq("status", "active")
    .gt("first_session_date", new Date().toISOString())
    .order("first_session_date", { ascending: true });
  return (data as WebinarRoundRow[]) || [];
}
