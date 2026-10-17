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
export type AdPage = 'igads' | 'aliagads';
export interface DailySpendRow { date: string; spend: number; page: AdPage }

/** Classify an ad set by the landing page its ads link to (Ali link vs main IG Ads link). */
export function adSetPage(adsetName: string | null, campaignName: string | null): AdPage {
  return /ali/i.test(`${adsetName || ''} ${campaignName || ''}`) ? 'aliagads' : 'igads';
}

/**
 * Ad spend per round, split by landing page. Each page's daily spend goes to the
 * next session that page was promoting on that day (the first session on or after
 * the spend day, among rounds that page actually collected sign-ups for — plus
 * rounds with no sign-ups yet, so freshly locked rounds still receive spend).
 * Same-day rounds within one page split by that page's share of sign-ups.
 */
export function allocateRoundSpend(
  rounds: SpendRound[],
  dailyRows: DailySpendRow[],
  roundPages: Record<string, AdPage[]>,
  signupsByPage: Record<string, Partial<Record<AdPage, number>>> = {},
): Record<string, number> {
  const result: Record<string, number> = {};
  const dated = rounds.filter((r) => r.first_session_date).map((r) => ({ ...r, day: laDate(r.first_session_date!) }));
  for (const page of ['igads', 'aliagads'] as AdPage[]) {
    const pageRows = dailyRows.filter((r) => r.page === page && r.spend > 0);
    if (!pageRows.length) continue;
    // Rounds this page promotes: rounds with sign-ups from this page, or none yet.
    const candidates = dated
      .filter((r) => !roundPages[r.id] || roundPages[r.id].length === 0 || roundPages[r.id].includes(page))
      .sort((a, b) => a.day.localeCompare(b.day));
    if (!candidates.length) continue;
    const sessionDays = [...new Set(candidates.map((r) => r.day))];
    for (const row of pageRows) {
      const day = sessionDays.find((d) => d >= row.date) || sessionDays[sessionDays.length - 1];
      if (row.date > sessionDays[sessionDays.length - 1]) continue; // spend after the last session
      const group = candidates.filter((r) => r.day === day);
      const pageSignups = (r: SpendRound) => signupsByPage[r.id]?.[page] ?? r.signups;
      const totalSignups = group.reduce((s, r) => s + pageSignups(r), 0);
      for (const r of group) {
        const share = totalSignups > 0 ? pageSignups(r) / totalSignups : 1 / group.length;
        result[r.id] = Math.round(((result[r.id] || 0) + row.spend * share) * 100) / 100;
      }
    }
  }
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

/** One locked, hand-verified benchmark row for a finished round. */
export interface StaticRoundStat {
  roundNumber: number;
  name: string;
  /** ISO timestamp of the live session start. */
  date: string;
  signups: number;
  /** null = calendar-click tracking did not exist yet for this round. */
  calendar: number | null;
  showups: number;
  opens: Partial<Record<AutoEmailKind, number>>;
  spend: number;
  enrollments: number;
  revenue: number;
}

/**
 * Verified benchmark numbers for finished rounds (through Oct 16, 2026).
 * These are frozen on purpose: the live allocation formula misattributes spend
 * when rounds share session days, so past rounds render from this snapshot and
 * only current/future rounds are calculated dynamically.
 */
export const STATIC_ROUND_STATS: StaticRoundStat[] = [
  { roundNumber: 22, name: 'Round 22 (West)', date: '2026-10-17T01:00:00Z', signups: 38, calendar: 15, showups: 8, opens: { signup: 45, reminder: 50, morning: 48, start: 47 }, spend: 81.2, enrollments: 0, revenue: 0 },
  { roundNumber: 21, name: 'Round 21 (East)', date: '2026-10-16T22:00:00Z', signups: 114, calendar: 48, showups: 20, opens: { signup: 49, reminder: 56, morning: 54, start: 52 }, spend: 240.5, enrollments: 0, revenue: 0 },
  { roundNumber: 20, name: 'Round 20 (Morning)', date: '2026-10-16T18:00:00Z', signups: 264, calendar: 93, showups: 38, opens: { signup: 44, reminder: 59, morning: 46, start: 49 }, spend: 542.3, enrollments: 2, revenue: 336 },
  { roundNumber: 19, name: 'Round 19 (Ali IG Ads)', date: '2026-10-15T01:00:00Z', signups: 258, calendar: 33, showups: 38, opens: { signup: 61, reminder: 50, morning: 54, start: 52 }, spend: 540.19, enrollments: 10, revenue: 1386 },
  { roundNumber: 18, name: 'Round 18 (West)', date: '2026-10-13T01:00:00Z', signups: 78, calendar: null, showups: 10, opens: { signup: 67, reminder: 68, morning: 39, start: 55 }, spend: 102.92, enrollments: 3, revenue: 454 },
  { roundNumber: 17, name: 'Round 17 (East)', date: '2026-10-11T18:00:00Z', signups: 202, calendar: null, showups: 25, opens: { signup: 70, reminder: 72, morning: 42, start: 58 }, spend: 246.19, enrollments: 6, revenue: 906 },
  { roundNumber: 16, name: 'Round 16 (Morning)', date: '2026-10-08T18:00:00Z', signups: 307, calendar: null, showups: 28, opens: { signup: 68, reminder: 65, morning: 44, start: 48 }, spend: 553.2, enrollments: 5, revenue: 1308 },
  { roundNumber: 15, name: 'Round 15 (Morning)', date: '2026-10-04T18:00:00Z', signups: 237, calendar: null, showups: 18, opens: { signup: 73, reminder: 68, morning: 45, start: 47 }, spend: 350.15, enrollments: 9, revenue: 2141 },
  { roundNumber: 14, name: 'Round 14 (Morning)', date: '2026-10-01T18:00:00Z', signups: 252, calendar: null, showups: 25, opens: { signup: 71, reminder: 66, morning: 46, start: 50 }, spend: 365.41, enrollments: 6, revenue: 1427 },
  { roundNumber: 13, name: 'Round 13 (Morning)', date: '2026-09-27T18:00:00Z', signups: 369, calendar: null, showups: 20, opens: { signup: 74, reminder: 70, morning: 48, start: 51 }, spend: 424.59, enrollments: 7, revenue: 1571 },
];

/** Average of the available per-email open rates (ignores missing kinds). */
export function averageOpenRate(opens: Partial<Record<AutoEmailKind, number | null>>): number | null {
  const vals = (Object.values(opens) as (number | null | undefined)[]).filter((v): v is number => typeof v === 'number');
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

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
