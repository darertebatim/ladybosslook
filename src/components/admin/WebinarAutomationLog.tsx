import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Kind = 'reminder' | 'morning' | 'onehour' | 'start';
const KINDS: { key: Kind; label: string }[] = [
  { key: 'reminder', label: 'Reminder' },
  { key: 'morning', label: 'Morning' },
  { key: 'onehour', label: '1 hour before' },
  { key: 'start', label: 'Starting now' },
];
const TEST_EMAIL = 'darertebatim@gmail.com';

/** The automation runs hourly at minute :20. Returns the first run time inside [from, to] (ms offsets from session start). */
function runIn(session: Date, fromMin: number, toMin: number): Date | null {
  const t = new Date(session.getTime() + fromMin * 60_000);
  t.setUTCSeconds(0, 0);
  while (t.getUTCMinutes() !== 20) t.setTime(t.getTime() + 60_000);
  return t.getTime() <= session.getTime() + toMin * 60_000 ? t : null;
}

/** 9:00–9:59 AM run on the session day in a timezone, as a real instant. */
function morningIn(session: Date, tz: string): Date | null {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(session);
  for (let h = -48; h <= 0; h++) {
    const t = new Date(session.getTime() + h * 3600_000);
    t.setUTCMinutes(20, 0, 0);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(t);
    if (Number(parts) === 9 && new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(t) === day) return t;
  }
  return null;
}

const fmt = (d: Date | null) =>
  d
    ? d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

interface Upcoming { id: string; round_number: number | null; first_session_date: string; signups: number }

interface Row { round: string; kind: string; sent: number; delivered: number; opened: number; bounced: number; last: string }

export function WebinarAutomationLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextRound, setNextRound] = useState<{ id: string; round_number: number | null } | null>(null);
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 21 * 24 * 3600_000).toISOString();
      const all: any[] = [];
      for (let page = 0; page < 20; page++) {
        const { data, error } = await (supabase as any)
          .from('email_delivery_events')
          .select('recipient, event_type, tags, occurred_at')
          .eq('tags->>campaign', 'webinar_day')
          .gte('occurred_at', since)
          .range(page * 1000, page * 1000 + 999);
        if (error || !data) break;
        all.push(...data);
        if (data.length < 1000) break;
      }
      const map = new Map<string, { sent: Set<string>; delivered: Set<string>; opened: Set<string>; bounced: Set<string>; last: string; round: string; kind: string }>();
      for (const e of all) {
        const round = String(e.tags?.round ?? '');
        const kind = String(e.tags?.kind ?? '');
        const k = `${round}|${kind}`;
        if (!map.has(k)) map.set(k, { sent: new Set(), delivered: new Set(), opened: new Set(), bounced: new Set(), last: '', round, kind });
        const g = map.get(k)!;
        const r = String(e.recipient || '').toLowerCase();
        if (e.event_type === 'sent') g.sent.add(r);
        if (e.event_type === 'delivered') g.delivered.add(r);
        if (e.event_type === 'opened') g.opened.add(r);
        if (e.event_type === 'bounced') g.bounced.add(r);
        if (e.occurred_at > g.last) g.last = e.occurred_at;
      }
      setRows(
        [...map.values()]
          .map((g) => ({ round: g.round, kind: g.kind, sent: Math.max(g.sent.size, g.delivered.size), delivered: g.delivered.size, opened: g.opened.size, bounced: g.bounced.size, last: g.last }))
          .sort((a, b) => b.last.localeCompare(a.last)),
      );
      const { data: r } = await (supabase as any)
        .from('program_rounds')
        .select('id, round_number')
        .eq('program_slug', 'igadsfree')
        .gt('first_session_date', new Date().toISOString())
        .order('first_session_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      setNextRound(r ?? null);
      const { data: ups } = await (supabase as any)
        .from('program_rounds')
        .select('id, round_number, first_session_date')
        .eq('program_slug', 'igadsfree')
        .gt('first_session_date', new Date(Date.now() - 15 * 60_000).toISOString())
        .lte('first_session_date', new Date(Date.now() + 14 * 24 * 3600_000).toISOString())
        .order('first_session_date', { ascending: true });
      const withCounts: Upcoming[] = await Promise.all(
        (ups || []).map(async (u: any) => {
          const { count } = await (supabase as any)
            .from('form_submissions')
            .select('id', { count: 'exact', head: true })
            .eq('round_id', u.id);
          return { ...u, signups: count ?? 0 };
        }),
      );
      setUpcoming(withCounts);
      setLoading(false);
    })();
  }, []);

  const sendTest = async (kind: Kind) => {
    if (!nextRound) return;
    setSending(kind);
    const { error } = await supabase.functions.invoke('send-webinar-day-emails', {
      body: { round_id: nextRound.id, kind, testEmail: TEST_EMAIL },
    });
    setSending(null);
    if (error) toast.error(`Test failed: ${error.message}`);
    else toast.success(`Test sent to ${TEST_EMAIL}`);
  };

  const label = (k: string) => KINDS.find((x) => x.key === k)?.label ?? k;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webinar email automation — send log</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every automatic Reminder, Morning, 1-hour and Starting-now send (last 21 days). A copy of each send also goes to {TEST_EMAIL}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Send test to {TEST_EMAIL}{nextRound ? ` (round ${nextRound.round_number})` : ''}:
          </span>
          {KINDS.map((k) => (
            <Button key={k.key} size="sm" variant="outline" disabled={!nextRound || !!sending} onClick={() => sendTest(k.key)}>
              {sending === k.key ? 'Sending…' : k.label}
            </Button>
          ))}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Scheduled (upcoming rounds)</p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">{loading ? 'Loading…' : 'No upcoming rounds in the next 14 days.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Round</th>
                    <th className="py-2 pr-3">Session</th>
                    <th className="py-2 pr-3">Signups</th>
                    <th className="py-2 pr-3">Morning (East 8 AM)</th>
                    <th className="py-2 pr-3">Morning (West 8 AM)</th>
                    <th className="py-2 pr-3">1 hour before</th>
                    <th className="py-2 pr-3">Starting now</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((u) => {
                    const s = new Date(u.first_session_date);
                    return (
                      <tr key={u.id} className="border-b">
                        <td className="py-2 pr-3">{u.round_number}</td>
                        <td className="py-2 pr-3">{fmt(s)}</td>
                        <td className="py-2 pr-3">{u.signups}</td>
                        <td className="py-2 pr-3">{fmt(morningIn(s, 'America/New_York'))}</td>
                        <td className="py-2 pr-3">{fmt(morningIn(s, 'America/Los_Angeles'))}</td>
                        <td className="py-2 pr-3">{fmt(runIn(s, -105, -45))}</td>
                        <td className="py-2 pr-3">{fmt(runIn(s, -45, 15))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Times shown in your local time. Reminder goes to each person 2–3 hours after they sign up (skipped if the session is less than 6 hours away). Morning goes at 8 AM in each person's own timezone; East/West are shown as examples.
          </p>
        </div>

        <p className="text-sm font-semibold">Sent</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No automatic sends yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Round</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Sent</th>
                  <th className="py-2 pr-3">Delivered</th>
                  <th className="py-2 pr-3">Opened</th>
                  <th className="py-2 pr-3">Bounced</th>
                  <th className="py-2 pr-3">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.round}-${r.kind}`} className="border-b">
                    <td className="py-2 pr-3">{r.round}</td>
                    <td className="py-2 pr-3">{label(r.kind)}</td>
                    <td className="py-2 pr-3">{r.sent}</td>
                    <td className="py-2 pr-3">{r.delivered}</td>
                    <td className="py-2 pr-3">{r.opened}</td>
                    <td className="py-2 pr-3">{r.bounced}</td>
                    <td className="py-2 pr-3">{r.last ? new Date(r.last).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
