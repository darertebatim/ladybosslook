export interface MetaAudienceRow {
  email: string;
  fn: string;
  ln: string;
  ct: string;
}

const TEST_PATTERNS = [/^test/i, /darertebatim@/i, /@example\./i, /\+test/i];

/** Dedupe by lowercased email, drop invalid/test emails, split names for Meta matching. */
export function buildMetaAudienceRows(
  rows: { email: string | null; name: string | null; city: string | null }[],
): MetaAudienceRow[] {
  const seen = new Map<string, MetaAudienceRow>();
  for (const r of rows) {
    const email = (r.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (TEST_PATTERNS.some((p) => p.test(email))) continue;
    if (seen.has(email)) continue;
    const parts = (r.name || '').trim().split(/\s+/).filter(Boolean);
    seen.set(email, {
      email,
      fn: (parts[0] || '').toLowerCase(),
      ln: (parts.slice(1).join(' ') || '').toLowerCase(),
      ct: (r.city || '').trim().toLowerCase(),
    });
  }
  return [...seen.values()];
}
