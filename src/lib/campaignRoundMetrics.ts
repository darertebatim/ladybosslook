import type { LeadCampaign } from '@/lib/leadCampaigns';

export interface MetricSubmission {
  email: string | null;
  source: string | null;
  submitted_at: string | null;
  round_id: string | null;
}

export interface MetricRound {
  id: string;
  program_slug: string | null;
  first_session_date: string | null;
  first_session_duration: number | null;
}

export interface MetricCalendarClick {
  id: string;
  email: string | null;
  page: string;
  round_id: string | null;
  created_at: string;
}

export interface RoundMetrics { signups: number; calendar: number; attendees: number }

const normalizeEmail = (email: string | null) => (email || '').trim().toLowerCase();
const metricKey = (campaign: string, round: string) => `${campaign}:${round}`;

/** Attribute each action to one campaign only, even when campaigns share rounds. */
export function calculateCampaignRoundMetrics(
  campaigns: LeadCampaign[],
  rounds: MetricRound[],
  submissions: MetricSubmission[],
  clicks: MetricCalendarClick[],
): Record<string, RoundMetrics> {
  const buckets: Record<string, { signups: Set<string>; calendar: Set<string>; attendees: Set<string> }> = {};
  for (const c of campaigns) {
    for (const r of rounds.filter((round) => round.program_slug === c.programSlug)) {
      buckets[metricKey(c.key, r.id)] = { signups: new Set(), calendar: new Set(), attendees: new Set() };
    }
  }
  const registrations = submissions.filter((s) => campaigns.some((c) => c.regSource === s.source));
  for (const s of registrations) {
    const c = campaigns.find((campaign) => campaign.regSource === s.source);
    const email = normalizeEmail(s.email);
    if (c && s.round_id && email) buckets[metricKey(c.key, s.round_id)]?.signups.add(email);
  }

  const latestRegistration = (email: string, roundId: string, at: string) => registrations
    .filter((s) => normalizeEmail(s.email) === email && s.round_id === roundId && s.submitted_at && s.submitted_at <= at)
    .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))[0];

  for (const click of clicks) {
    if (!click.round_id || click.page === 'email:test') continue;
    const email = normalizeEmail(click.email);
    const pageCampaign = campaigns.find((c) => click.page === c.thankYouPath || click.page.startsWith(`email:${c.key}-`));
    const signup = email ? latestRegistration(email, click.round_id, click.created_at) : undefined;
    const c = pageCampaign || campaigns.find((campaign) => campaign.regSource === signup?.source);
    if (c) buckets[metricKey(c.key, click.round_id)]?.calendar.add(email || click.id);
  }

  for (const gift of submissions.filter((s) => s.source === 'igads_gifts')) {
    const email = normalizeEmail(gift.email);
    if (!email || !gift.submitted_at) continue;
    const at = Date.parse(gift.submitted_at);
    // The shared gift page has no round ID: match its timestamp to the live session.
    const candidates = rounds.filter((r) => {
      if (r.program_slug !== 'igadsfree' || !r.first_session_date) return false;
      const start = Date.parse(r.first_session_date);
      return at >= start && at <= start + (r.first_session_duration ?? 90) * 60_000;
    });
    const round = gift.round_id ? rounds.find((r) => r.id === gift.round_id) : candidates.length === 1 ? candidates[0] : undefined;
    if (!round) continue;
    const signup = latestRegistration(email, round.id, gift.submitted_at) || registrations
      .filter((s) => normalizeEmail(s.email) === email && s.submitted_at && s.submitted_at <= gift.submitted_at &&
        campaigns.some((c) => c.regSource === s.source && c.programSlug === round.program_slug))
      .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))[0];
    const c = campaigns.find((campaign) => campaign.regSource === signup?.source);
    if (c) buckets[metricKey(c.key, round.id)]?.attendees.add(email);
  }

  return Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, {
    signups: value.signups.size, calendar: value.calendar.size, attendees: value.attendees.size,
  }]));
}