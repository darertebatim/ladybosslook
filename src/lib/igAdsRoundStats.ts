export type AutoEmailKind = 'signup' | 'reminder' | 'morning' | 'start';

/** Map an automated IG Ads webinar email subject to its type. */
export function autoEmailKind(subject: string | null): AutoEmailKind | null {
  const s = (subject || '').trim();
  if (s.startsWith('تایید ثبت')) return 'signup';
  if (s.startsWith('یادآوری وبینار اینستاگرام ادز')) return 'reminder';
  if (s.startsWith('امروز: جذب مشتری') || s.startsWith('امشب: جذب مشتری')) return 'morning';
  if (s.startsWith('وبینار در حال شروع است')) return 'start';
  return null;
}

const laDate = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(iso));

export interface SpendRound { id: string; first_session_date: string | null; signups: number }

/**
 * Ad spend per round: each round gets the spend from the day after the previous
 * session day up to its own session day (ad account time). Rounds on the same day
 * split that window by their share of sign-ups.
 */
export function allocateRoundSpend(rounds: SpendRound[], dailySpend: Record<string, number>): Record<string, number> {
  const dated = rounds.filter((r) => r.first_session_date).map((r) => ({ ...r, day: laDate(r.first_session_date!) }));
  const days = [...new Set(dated.map((r) => r.day))].sort();
  const result: Record<string, number> = {};
  days.forEach((day, i) => {
    const prev = i > 0 ? days[i - 1] : '';
    const windowSpend = Object.entries(dailySpend)
      .filter(([d]) => d > prev && d <= day)
      .reduce((sum, [, v]) => sum + v, 0);
    const group = dated.filter((r) => r.day === day);
    const totalSignups = group.reduce((s, r) => s + r.signups, 0);
    for (const r of group) {
      const share = totalSignups > 0 ? r.signups / totalSignups : 1 / group.length;
      result[r.id] = Math.round(windowSpend * share * 100) / 100;
    }
  });
  return result;
}

export interface SaleRound { id: string; first_session_date: string | null }

/**
 * Attribute each buyer to the most recent round they signed up for whose live session
 * started before the purchase and no more than `days` earlier. Counts unique buyers.
 */
export function attributeSales(
  rounds: SaleRound[],
  signupRoundsByEmail: Record<string, string[]>,
  orders: { email: string; created_at: string }[],
  days = 14,
): Record<string, number> {
  const sets: Record<string, Set<string>> = {};
  const start = (id: string) => {
    const d = rounds.find((r) => r.id === id)?.first_session_date;
    return d ? Date.parse(d) : NaN;
  };
  for (const o of orders) {
    const email = o.email.trim().toLowerCase();
    const at = Date.parse(o.created_at);
    const best = (signupRoundsByEmail[email] || [])
      .filter((id) => start(id) <= at && at - start(id) <= days * 86_400_000)
      .sort((a, b) => start(b) - start(a))[0];
    if (best) (sets[best] ||= new Set()).add(email);
  }
  return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.size]));
}
