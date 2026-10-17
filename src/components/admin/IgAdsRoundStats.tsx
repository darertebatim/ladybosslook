import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';
import { calculateCampaignRoundMetrics } from '@/lib/campaignRoundMetrics';
import { allocateRoundSpend, attributeEnrollments, attributeRevenue, autoEmailKind, type AutoEmailKind } from '@/lib/igAdsRoundStats';
import { getLocalDateStr } from '@/lib/localDate';

const campaigns = LEAD_CAMPAIGNS.filter((c) => c.key === 'igads' || c.key === 'aliagads');
const regSources = campaigns.map((c) => c.regSource);
const KINDS: AutoEmailKind[] = ['signup', 'reminder', 'morning', 'start'];
const norm = (e: string | null) => (e || '').trim().toLowerCase();

async function pageAll<T>(build: (from: number) => any): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from);
    if (error) throw error;
    all.push(...((data || []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}

export function IgAdsRoundStats() {
  const { data: rounds = [] } = useQuery({
    queryKey: ['igads-stats-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase.from('program_rounds')
        .select('id, program_slug, round_name, round_number, first_session_date, first_session_duration, status')
        .eq('program_slug', 'igadsfree').order('first_session_date', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['igads-stats-subs'],
    queryFn: () => pageAll<any>((from) => supabase.from('form_submissions')
      .select('email, source, submitted_at, round_id').in('source', [...regSources, 'igads_gifts'])
      .order('id').range(from, from + 999)),
  });

  const { data: clicks = [] } = useQuery({
    queryKey: ['igads-stats-clicks'],
    queryFn: () => pageAll<any>((from) => supabase.from('webinar_calendar_clicks')
      .select('id, email, page, round_id, created_at').neq('page', 'email:test').order('id').range(from, from + 999)),
  });

  const earliest = rounds.length ? rounds[rounds.length - 1].first_session_date : null;
  const { data: events = [] } = useQuery({
    queryKey: ['igads-stats-events', earliest],
    enabled: !!earliest,
    queryFn: () => {
      const since = new Date(Date.parse(earliest!) - 14 * 86_400_000).toISOString();
      return pageAll<any>((from) => supabase.from('email_delivery_events')
        .select('event_type, recipient, subject, occurred_at').in('event_type', ['email.delivered', 'email.opened', 'delivered', 'opened'])
        .gte('occurred_at', since).order('occurred_at').range(from, from + 999));
    },
  });

  const { data: acqEnrollments = [] } = useQuery({
    queryKey: ['igads-stats-acq-enrollments'],
    queryFn: async () => {
      const rows = await pageAll<any>((from) => supabase.from('course_enrollments')
        .select('user_id, created_at').eq('program_slug', 'casigads').order('created_at').range(from, from + 999));
      const ids = [...new Set(rows.map((r) => r.user_id))];
      const emails: Record<string, string> = {};
      for (let i = 0; i < ids.length; i += 200) {
        const { data } = await supabase.from('profiles').select('id, email').in('id', ids.slice(i, i + 200));
        for (const p of data || []) if (p.email) emails[p.id] = p.email;
      }
      return rows.map((r) => ({ email: emails[r.user_id] || '', created_at: r.created_at })).filter((r) => r.email);
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['igads-stats-orders'],
    queryFn: () => pageAll<any>((from) => supabase.from('orders')
      .select('email, created_at, amount, usd_amount').eq('program_slug', 'casigads')
      .in('status', ['completed', 'paid', 'partially_refunded']).order('created_at').range(from, from + 999)),
  });

  const { data: spendReport, error: spendError } = useQuery({
    queryKey: ['igads-stats-spend', earliest],
    enabled: !!earliest,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const since = getLocalDateStr(new Date(Date.parse(earliest!) - 21 * 86_400_000));
      const { data, error } = await supabase.functions.invoke('meta-ad-expenses', {
        body: { since, until: getLocalDateStr(new Date()), daily: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const daily: Record<string, number> = {};
      for (const row of data.campaigns || []) {
        if (!/webinar/i.test(row.campaign_name || '')) continue;
        daily[row.date_start] = (daily[row.date_start] || 0) + Number(row.spend || 0);
      }
      return daily;
    },
  });

  const rows = useMemo(() => {
    const metrics = calculateCampaignRoundMetrics(campaigns, rounds, subs, clicks);
    const signupSets: Record<string, Set<string>> = {};
    const roundsByEmail: Record<string, string[]> = {};
    for (const s of subs) {
      if (!regSources.includes(s.source) || !s.round_id) continue;
      const e = norm(s.email);
      if (!e) continue;
      (signupSets[s.round_id] ||= new Set()).add(e);
      (roundsByEmail[e] ||= []).includes(s.round_id) || roundsByEmail[e].push(s.round_id);
    }
    const spend = spendReport
      ? allocateRoundSpend(rounds.map((r) => ({ id: r.id, first_session_date: r.first_session_date, signups: signupSets[r.id]?.size || 0 })), spendReport)
      : {};
    const revenue = attributeRevenue(rounds, roundsByEmail, orders);
    const acqEnrolled = attributeEnrollments(rounds, roundsByEmail, acqEnrollments);

    return rounds.map((r) => {
      const people = signupSets[r.id] || new Set<string>();
      const start = r.first_session_date ? Date.parse(r.first_session_date) : NaN;
      const opens = {} as Record<AutoEmailKind, number | null>;
      for (const k of KINDS) {
        const delivered = new Set<string>();
        const opened = new Set<string>();
        for (const ev of events) {
          if (autoEmailKind(ev.subject) !== k) continue;
          const who = norm(ev.recipient);
          if (!people.has(who)) continue;
          const at = Date.parse(ev.occurred_at);
          if (!(at >= start - 10 * 86_400_000 && at <= start + 6 * 3_600_000)) continue;
          (String(ev.event_type).includes('open') ? opened : delivered).add(who);
        }
        opens[k] = delivered.size ? Math.round((opened.size / delivered.size) * 100) : null;
      }
      const m = campaigns.reduce((acc, c) => {
        const v = metrics[`${c.key}:${r.id}`];
        return { calendar: acc.calendar + (v?.calendar || 0), attendees: acc.attendees + (v?.attendees || 0) };
      }, { calendar: 0, attendees: 0 });
      return {
        id: r.id, name: r.round_name || `Round ${r.round_number ?? '?'}`, date: r.first_session_date, status: r.status,
        signups: people.size, calendar: m.calendar, showups: m.attendees, opens,
        spend: spendReport ? spend[r.id] ?? 0 : null, enrollments: enrolled[r.id]?.size || 0, sales: sales[r.id] || 0,
      };
    });
  }, [rounds, subs, clicks, events, enrollments, orders, spendReport]);

  const money = (v: number | null) => (v === null ? '—' : `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
  const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

  const exportCsv = () => {
    const head = ['Round', 'Date', 'Sign-ups', 'Calendar adds', 'Show-ups', 'Sign-up email open %', 'Reminder open %', 'Morning open %', 'Start now open %', 'Ad spend', 'Enrollments', 'Acquisition sold'];
    const lines = rows.map((r) => [r.name, r.date || '', r.signups, r.calendar, r.showups, ...KINDS.map((k) => r.opens[k] ?? ''), r.spend ?? '', r.enrollments, r.sales]);
    const csv = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'ig-ads-round-stats.csv';
    a.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>IG Ads Rounds (both pages)</CardTitle>
          <p className="text-sm text-muted-foreground">
            IG Ads + IG Ads (Ali) combined. Open rates = opened ÷ delivered among this round's sign-ups. Ad spend = webinar campaigns from the day after the previous session up to this session. Acquisition sold = unique buyers within 14 days after their round.
          </p>
          {spendError && <p className="text-xs text-destructive">Ad spend could not load: {(spendError as Error).message}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead className="text-right">Sign-ups</TableHead>
                <TableHead className="text-right">Calendar</TableHead>
                <TableHead className="text-right">Show-ups</TableHead>
                <TableHead className="text-right">Sign-up email</TableHead>
                <TableHead className="text-right">Reminder</TableHead>
                <TableHead className="text-right">Morning</TableHead>
                <TableHead className="text-right">Start now</TableHead>
                <TableHead className="text-right">Ad spend</TableHead>
                <TableHead className="text-right">Enrollments</TableHead>
                <TableHead className="text-right">Acquisition sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.date ? new Date(r.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                      {r.status && r.status !== 'active' ? ` · ${r.status}` : ''}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{r.signups}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.calendar}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.showups}</TableCell>
                  {KINDS.map((k) => <TableCell key={k} className="text-right tabular-nums">{pct(r.opens[k])}</TableCell>)}
                  <TableCell className="text-right tabular-nums">{money(r.spend)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.enrollments}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{r.sales}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
