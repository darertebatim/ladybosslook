// Resolves which round a user should be auto-enrolled into for a program.
// If the auto-enrollment rule has East/West rounds configured, the user's
// stored device timezone (profiles.timezone) decides which one they get.
// Otherwise the single default round_id is used.

const EAST_TIMEZONES = new Set<string>([
  'America/New_York', 'America/Toronto', 'America/Detroit', 'America/Montreal',
  'America/Boston', 'America/Philadelphia', 'America/Washington', 'America/Atlanta',
  'America/Miami', 'America/Indianapolis', 'America/Columbus', 'America/Baltimore',
  'America/Milwaukee', 'America/Kansas_City', 'America/Minneapolis', 'America/St_Louis',
  'America/Nashville', 'America/New_Orleans', 'America/Houston', 'America/Austin',
  'America/San_Antonio', 'America/Fort_Worth', 'America/Oklahoma_City', 'America/Memphis',
  'America/Louisville', 'America/Cincinnati', 'America/Pittsburgh', 'America/Raleigh',
  'America/Charlotte', 'America/Chicago', 'America/Dallas',
]);

const WEST_TIMEZONES = new Set<string>([
  'America/Los_Angeles', 'America/Vancouver', 'America/Seattle', 'America/Portland',
  'America/San_Francisco', 'America/San_Diego', 'America/Las_Vegas', 'America/Phoenix',
  'America/Denver', 'America/Colorado_Springs', 'America/Boise', 'America/Sacramento',
  'America/Oakland', 'America/San_Jose', 'America/Tijuana',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Canberra',
  'Australia/Hobart', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Noumea', 'Pacific/Port_Moresby',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Shanghai',
  'Asia/Taipei', 'Asia/Manila', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Ho_Chi_Minh',
  'Asia/Kuala_Lumpur', 'Asia/Hanoi',
]);

// Europe + Middle East: from the UK eastwards through Dubai.
const EUROPE_PREFIXES = ['Europe/', 'Atlantic/', 'Africa/'];
const EUROPE_TIMEZONES = new Set<string>([
  'Asia/Dubai', 'Asia/Muscat', 'Asia/Qatar', 'Asia/Bahrain', 'Asia/Kuwait',
  'Asia/Riyadh', 'Asia/Baghdad', 'Asia/Tehran', 'Asia/Jerusalem', 'Asia/Tel_Aviv',
  'Asia/Beirut', 'Asia/Damascus', 'Asia/Amman', 'Asia/Nicosia', 'Asia/Istanbul',
  'Europe/Istanbul', 'Asia/Baku', 'Asia/Tbilisi', 'Asia/Yerevan',
]);

export function sideForTimezone(tz?: string | null): 'east' | 'west' | 'europe' | null {
  const t = (tz || '').trim();
  if (!t) return null;
  if (EAST_TIMEZONES.has(t)) return 'east';
  if (WEST_TIMEZONES.has(t)) return 'west';
  if (EUROPE_TIMEZONES.has(t)) return 'europe';
  if (EUROPE_PREFIXES.some((p) => t.startsWith(p))) return 'europe';
  return null;
}

/**
 * Returns the round id to auto-enroll `userId` into for `programSlug`,
 * or null when no rule exists.
 */
export async function resolveAutoEnrollRoundId(
  supabase: any,
  programSlug: string,
  userId?: string | null,
  timezoneOverride?: string | null,
): Promise<string | null> {
  const { data: rule } = await supabase
    .from('program_auto_enrollment')
    .select('round_id, east_round_id, west_round_id, europe_round_id')
    .eq('program_slug', programSlug)
    .maybeSingle();

  if (!rule) return null;
  if (!rule.east_round_id && !rule.west_round_id && !rule.europe_round_id) return rule.round_id ?? null;

  let tz = timezoneOverride || null;
  if (!tz && userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone, timezone_synced_at')
      .eq('id', userId)
      .maybeSingle();
    // profiles.timezone defaults to America/Los_Angeles, so only trust it once
    // the device actually reported a timezone (timezone_synced_at is set).
    tz = profile?.timezone_synced_at ? (profile?.timezone ?? null) : null;
  }

  const side = sideForTimezone(tz);
  if (side === 'west' && rule.west_round_id) return rule.west_round_id;
  if (side === 'east' && rule.east_round_id) return rule.east_round_id;
  if (side === 'europe' && rule.europe_round_id) return rule.europe_round_id;
  return rule.round_id ?? rule.east_round_id ?? rule.west_round_id ?? rule.europe_round_id ?? null;
}
