// Shared region-restriction helper for enrollment edge functions.
// Returns the ISO country code (uppercase) the caller appears to be in based
// on their profile.country and phone prefix — VPN-proof for phone/country
// fields but not for device timezone (timezone is not checked here).

// Map profile.country values (as stored) to ISO codes.
const COUNTRY_TO_ISO: Record<string, string> = {
  iran: 'IR',
  'islamic republic of iran': 'IR',
  ir: 'IR',
  afghanistan: 'AF',
  af: 'AF',
  iraq: 'IQ',
  iq: 'IQ',
};

// Map phone prefix -> ISO code. Longest-prefix match wins.
const PHONE_PREFIX_TO_ISO: Array<[string, string]> = [
  ['+98', 'IR'],
  ['+93', 'AF'],
  ['+964', 'IQ'],
];

export function detectUserRegions(profile: {
  country?: string | null;
  phone?: string | null;
} | null | undefined): string[] {
  const regions = new Set<string>();
  if (!profile) return [];

  const country = (profile.country || '').trim().toLowerCase();
  if (country && COUNTRY_TO_ISO[country]) {
    regions.add(COUNTRY_TO_ISO[country]);
  } else if (country.length === 2) {
    regions.add(country.toUpperCase());
  }

  const phone = (profile.phone || '').replace(/\s|-|\(|\)/g, '');
  if (phone) {
    // longest prefix wins
    const sorted = [...PHONE_PREFIX_TO_ISO].sort((a, b) => b[0].length - a[0].length);
    for (const [prefix, iso] of sorted) {
      if (phone.startsWith(prefix)) {
        regions.add(iso);
        break;
      }
    }
  }

  return [...regions];
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
    .select('country, phone')
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