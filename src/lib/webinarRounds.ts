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

export interface WebinarRoundRouting {
  program_slug: string;
  east_round_number: number;
  west_round_number: number;
}

const SELECT =
  "id, round_number, round_name, first_session_date, first_session_duration, google_meet_link, support_link_url, video_url, status";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** East-friendly and Central timezones. */
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

/** West-friendly timezones + East Asia / Oceania (routed to the later West round). */
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
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Canberra",
  "Australia/Hobart",
  "Australia/Adelaide",
  "Australia/Darwin",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Noumea",
  "Pacific/Port_Moresby",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Manila",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Ho_Chi_Minh",
  "Asia/Kuala_Lumpur",
  "Asia/Hanoi",
] as const;

const ROUND_2_TIMEZONES = new Set<string>(ROUND_2_TIMEZONE_LIST);

/** Fallback round numbers when no routing row exists in the DB yet. */
export const FALLBACK_EAST_ROUND_NUMBER = 3;
export const FALLBACK_WEST_ROUND_NUMBER = 4;

/** Timezones routed to each side. */
export const EAST_TIMEZONE_LIST = ROUND_1_TIMEZONE_LIST;
export const WEST_TIMEZONE_LIST = ROUND_2_TIMEZONE_LIST;

/** Read the current East/West round mapping for a program from the admin settings. */
export async function getWebinarRoundRouting(
  programSlug: string,
): Promise<WebinarRoundRouting | null> {
  const { data, error } = await (supabase as any)
    .from("webinar_round_routing")
    .select("program_slug, east_round_number, west_round_number")
    .eq("program_slug", programSlug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    program_slug: data.program_slug,
    east_round_number: Number(data.east_round_number),
    west_round_number: Number(data.west_round_number),
  };
}

function routingOrFallback(routing?: WebinarRoundRouting | null): {
  east: number;
  west: number;
} {
  return {
    east: routing?.east_round_number ?? FALLBACK_EAST_ROUND_NUMBER,
    west: routing?.west_round_number ?? FALLBACK_WEST_ROUND_NUMBER,
  };
}

export function inferWebinarSideFromTimezone(timezone: string): 'east' | 'west' | null {
  if (ROUND_1_TIMEZONES.has(timezone)) return 'east';
  if (ROUND_2_TIMEZONES.has(timezone)) return 'west';
  return null;
}

/** Timezone → current round number (uses the DB routing config when provided). */
export function inferWebinarRoundNumberFromTimezone(
  timezone: string,
  routing?: WebinarRoundRouting | null,
): number | null {
  const side = inferWebinarSideFromTimezone(timezone);
  const { east, west } = routingOrFallback(routing);
  if (side === 'east') return east;
  if (side === 'west') return west;
  return null;
}

/** Timezones handled by a given round number, for admin display. */
export function timezonesForRoundNumber(
  roundNumber: number | null,
  routing?: WebinarRoundRouting | null,
): readonly string[] {
  const { east, west } = routingOrFallback(routing);
  if (roundNumber === east) return ROUND_1_TIMEZONE_LIST;
  if (roundNumber === west) return ROUND_2_TIMEZONE_LIST;
  return [];
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
 *    East/Central timezones → configured East round, West timezones → configured West round.
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
    const routing = await getWebinarRoundRouting(programSlug);
    const side = inferWebinarSideFromTimezone(timezone);
    if (side) {
      const { east, west } = routingOrFallback(routing);
      const inferred = side === "east" ? east : west;
      const { data } = await base()
        .eq("round_number", inferred)
        .eq("status", "active")
        .maybeSingle();
      if (data) return data as WebinarRoundRow;
      // Configured round missing/closed: use the next two upcoming active rounds
      // (earlier session = East, later session = West).
      const upcomingPair = await listUpcomingWebinarRounds(programSlug);
      if (upcomingPair.length) {
        const pick = side === "east" ? upcomingPair[0] : upcomingPair[1] || upcomingPair[0];
        return pick;
      }
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
