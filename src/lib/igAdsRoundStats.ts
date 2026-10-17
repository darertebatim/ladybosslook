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
 * Attribute an event (purchase, enrollment) to the most recent round the person
 * signed up for whose live session started before the event and no more than
 * `days` earlier. Returns the round id or null.
 */
export function attributeToRound(
  rounds: SaleRound[],
  signupRoundsByEmail: Record<string, string[]>,
  email: string,
  at: number,
  days = 14,
): string | null {
  const start = (id: string) => {
    const d = rounds.find((r) => r.id === id)?.first_session_date;
    return d ? Date.parse(d) : NaN;
  };
  return (signupRoundsByEmail[email.trim().toLowerCase()] || [])
    .filter((id) => start(id) <= at && at - start(id) <= days * 86_400_000)
    .sort((a, b) => start(b) - start(a))[0] || null;
}

export interface OrderRow { email: string; created_at: string; amount: number | null; usd_amount: number | null }

/**
 * Revenue per round: each order is attributed to the buyer's most recent round
 * (within `days` after its live session) and its amount is summed there.
 * Amounts are in cents; usd_amount (cents) is preferred when present.
 */
export function attributeRevenue(
  rounds: SaleRound[],
  signupRoundsByEmail: Record<string, string[]>,
  orders: OrderRow[],
  days = 14,
): Record<string, number> {
  const revenue: Record<string, number> = {};
  for (const o of orders) {
    const roundId = attributeToRound(rounds, signupRoundsByEmail, o.email, Date.parse(o.created_at), days);
    if (!roundId) continue;
    const cents = o.usd_amount ?? o.amount ?? 0;
    revenue[roundId] = (revenue[roundId] || 0) + cents / 100;
  }
  return Object.fromEntries(Object.entries(revenue).map(([k, v]) => [k, Math.round(v * 100) / 100]));
}

/**
 * Enrollments per round: unique people who enrolled in the Acquisition program,
 * attributed to their most recent round (within `days` after its live session).
 */
export function attributeEnrollments(
  rounds: SaleRound[],
  signupRoundsByEmail: Record<string, string[]>,
  enrollments: { email: string; created_at: string }[],
  days = 14,
): Record<string, number> {
  const sets: Record<string, Set<string>> = {};
  for (const e of enrollments) {
    const email = e.email.trim().toLowerCase();
    const roundId = attributeToRound(rounds, signupRoundsByEmail, email, Date.parse(e.created_at), days);
    if (roundId) (sets[roundId] ||= new Set()).add(email);
  }
  return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.size]));
}
