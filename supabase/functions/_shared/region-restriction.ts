// Shared region-restriction helper for enrollment edge functions.
// Detects the caller's region from their stored device timezone
// (profiles.timezone, synced by useTimezoneSync on app open).
// We deliberately do NOT use phone/country — those are not collected.

// Map IANA timezone -> ISO country code.
const TIMEZONE_TO_ISO: Record<string, string> = {
  'Asia/Tehran': 'IR',
  'Asia/Kabul': 'AF',
  'Asia/Baghdad': 'IQ',
};

export function detectUserRegions(profile: {
  timezone?: string | null;
} | null | undefined): string[] {
  if (!profile) return [];
  const tz = (profile.timezone || '').trim();
  const iso = TIMEZONE_TO_ISO[tz];
  return iso ? [iso] : [];
}

export function isRegionBlocked(
  userRegions: string[],
  restrictedRegions: string[] | null | undefined,
): string | null {
  if (!restrictedRegions || restrictedRegions.length === 0) return null;
  const restricted = new Set(restrictedRegions.map((r) => r.toUpperCase()));
  for (const r of userRegions) {
    if (restricted.has(r.toUpperCase())) return r.toUpperCase();
  }
  return null;
}

/**
 * Fetches the caller's profile and checks if any of the given program slugs
 * are region-restricted for them.
 * Returns a map of slug -> blocked region code (or empty object if none).
 */
export async function checkProgramRegionBlocks(
  supabase: any,
  userId: string,
  programSlugs: string[],
): Promise<Record<string, string>> {
  if (programSlugs.length === 0) return {};

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();

  const userRegions = detectUserRegions(profile);
  if (userRegions.length === 0) return {};

  const { data: programs } = await supabase
    .from('program_catalog')
    .select('slug, restricted_regions')
    .in('slug', programSlugs);

  const blocks: Record<string, string> = {};
  for (const p of programs || []) {
    const hit = isRegionBlocked(userRegions, p.restricted_regions);
    if (hit) blocks[p.slug] = hit;
  }
  return blocks;
}