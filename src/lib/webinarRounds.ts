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

/** East-friendly and Central timezones → Round 1. */
export const ROUND_1_TIMEZONE_LIST = [
  "America/New_York",
  "America/Toronto",
  "America/Detroit",
  "America/Montreal",
  "America/Boston",
  "America/Philadelphia",
  "America/Washington",
  "America/Atlanta",
  "America/Miami",
  "America/Indianapolis",
  "America/Columbus",
  "America/Baltimore",
  "America/Milwaukee",
  "America/Kansas_City",
  "America/Minneapolis",
  "America/St_Louis",
  "America/Nashville",
  "America/New_Orleans",
  "America/Houston",
  "America/Austin",
  "America/San_Antonio",
  "America/Fort_Worth",
  "America/Oklahoma_City",
  "America/Memphis",
  "America/Louisville",
  "America/Cincinnati",
  "America/Pittsburgh",
  "America/Raleigh",
  "America/Charlotte",
  "America/Chicago",
  "America/Dallas",
] as const;

const ROUND_1_TIMEZONES = new Set<string>(ROUND_1_TIMEZONE_LIST);

/** West-friendly timezones → Round 2. */
export const ROUND_2_TIMEZONE_LIST = [
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Seattle",
  "America/Portland",
  "America/San_Francisco",
  "America/San_Diego",
  "America/Las_Vegas",
  "America/Phoenix",
  "America/Denver",
  "America/Colorado_Springs",
  "America/Boise",
  "America/Sacramento",
  "America/Oakland",
  "America/San_Jose",
  "America/Tijuana",
] as const;

const ROUND_2_TIMEZONES = new Set<string>(ROUND_2_TIMEZONE_LIST);

export function inferWebinarRoundNumberFromTimezone(timezone: string): 1 | 2 | null {
  if (ROUND_1_TIMEZONES.has(timezone)) return 1;
  if (ROUND_2_TIMEZONES.has(timezone)) return 2;
  return null;
}

/** All active rounds for a program, ordered by round number. */
export async function listActiveWebinarRounds(programSlug: string): Promise<WebinarRoundRow[]> {
  const { data } = await (supabase as any)
    .from("program_rounds")
    .select(SELECT)
    .eq("program_slug", programSlug)
    .eq("status", "active")
    .order("round_number", { ascending: true });
  return (data as WebinarRoundRow[]) || [];
}

/**
 * Resolve which round a webinar page should show.
 *
 * Priority:
 * 1. Explicit `roundParam` (round UUID, or the round number like "1" / "2") — pinned forever.
 * 2. Timezone-based assignment (when `timezone` is provided and no `roundParam`).
 *    East/Central timezones → Round 1, West timezones → Round 2.
 *    Unmatched timezones return `null` so the caller can show a manual selector.
 * 3. Next upcoming active round
 * 4. The round configured for auto-enrollment.
 * 5. Earliest active round.
 */
export async function resolveWebinarRound(
  programSlug: string,
  roundParam?: string | null,
  timezone?: string | null,
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

  // 2. Timezone-based assignment (only when no pinned round and timezone is known)
  if (timezone) {
    const inferred = inferWebinarRoundNumberFromTimezone(timezone);
    if (inferred) {
      const { data } = await base()
        .eq("round_number", inferred)
        .eq("status", "active")
        .maybeSingle();
      if (data) return data as WebinarRoundRow;
    }
    // Unmatched timezone: let the caller show a manual selector instead of falling back.
    return null;
  }

  // 3. Next upcoming active round
  const nowIso = new Date().toISOString();
  const { data: upcoming } = await base()
    .eq("status", "active")
    .gt("first_session_date", nowIso)
    .order("first_session_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (upcoming) return upcoming as WebinarRoundRow;

  // 4. Auto-enrollment round
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

  // 5. Earliest active round
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
