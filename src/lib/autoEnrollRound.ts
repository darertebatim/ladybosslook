import { supabase } from "@/integrations/supabase/client";
import { ROUND_1_TIMEZONE_LIST, ROUND_2_TIMEZONE_LIST } from "@/lib/webinarRounds";

// Europe + Middle East: from the UK eastwards through Dubai.
const EUROPE_PREFIXES = ["Europe/", "Atlantic/", "Africa/"];
const EUROPE_TIMEZONES = new Set<string>([
  "Asia/Dubai", "Asia/Muscat", "Asia/Qatar", "Asia/Bahrain", "Asia/Kuwait",
  "Asia/Riyadh", "Asia/Baghdad", "Asia/Tehran", "Asia/Jerusalem", "Asia/Tel_Aviv",
  "Asia/Beirut", "Asia/Damascus", "Asia/Amman", "Asia/Nicosia", "Asia/Istanbul",
  "Europe/Istanbul", "Asia/Baku", "Asia/Tbilisi", "Asia/Yerevan",
]);

export type AutoEnrollSide = "east" | "west" | "europe" | null;

export function sideForTimezone(tz?: string | null): AutoEnrollSide {
  const t = (tz || "").trim();
  if (!t) return null;
  if ((ROUND_1_TIMEZONE_LIST as readonly string[]).includes(t)) return "east";
  if ((ROUND_2_TIMEZONE_LIST as readonly string[]).includes(t)) return "west";
  if (EUROPE_TIMEZONES.has(t)) return "europe";
  if (EUROPE_PREFIXES.some((p) => t.startsWith(p))) return "europe";
  return null;
}

function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Resolves the round a user should be auto-enrolled into for a program,
 * honoring the East / West / Europe time zone rounds when configured.
 */
export async function resolveAutoEnrollRoundId(
  programSlug: string,
  timezoneOverride?: string | null,
): Promise<string | null> {
  const { data: rule } = await (supabase as any)
    .from("program_auto_enrollment")
    .select("round_id, east_round_id, west_round_id, europe_round_id")
    .eq("program_slug", programSlug)
    .maybeSingle();

  if (!rule) return null;
  if (!rule.east_round_id && !rule.west_round_id && !rule.europe_round_id) {
    return rule.round_id ?? null;
  }

  const side = sideForTimezone(timezoneOverride ?? deviceTimezone());
  if (side === "west" && rule.west_round_id) return rule.west_round_id;
  if (side === "east" && rule.east_round_id) return rule.east_round_id;
  if (side === "europe" && rule.europe_round_id) return rule.europe_round_id;
  return rule.round_id ?? rule.east_round_id ?? rule.west_round_id ?? rule.europe_round_id ?? null;
}
