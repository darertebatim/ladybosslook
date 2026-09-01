import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MailOpen, RefreshCw } from 'lucide-react';

interface Props {
  /** unique key for caching */
  campaignKey: string;
  /** form_submissions sources that define this campaign's audience */
  sources: string[];
}

interface EventRow {
  event_type: string;
  recipient: string | null;
  subject: string | null;
  occurred_at: string;
}

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

async function fetchAudience(sources: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  let from = 0;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('email')
      .in('source', sources)
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String((r as any).email || '').trim().toLowerCase();
      if (e) set.add(e);
    }
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return set;
}

async function fetchEvents(days: number): Promise<EventRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const all: EventRow[] = [];
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from('email_delivery_events')
      .select('event_type, recipient, subject, occurred_at')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    all.push(...((data ?? []) as EventRow[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}

export function WebinarEmailEngagement({ campaignKey, sources }: Props) {
  const [days, setDays] = useState(30);

  const { data: audience } = useQuery({
    queryKey: ['webinar-engagement-audience', campaignKey],
    queryFn: () => fetchAudience(sources),
  });

  const { data: events, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['webinar-engagement-events', days],
    queryFn: () => fetchEvents(days),
    staleTime: 0,
  });

  const { rows, totals } = useMemo(() => {
    const map = new Map<
      string,
      {
        subject: string;
        lastAt: string;
        sent: Set<string>;
        delivered: Set<string>;
        opened: Set<string>;
        clicked: Set<string>;
        bounced: Set<string>;
      }
    >();

    for (const e of events ?? []) {
      const who = (e.recipient || '').toLowerCase();
      if (!who || (audience && !audience.has(who))) continue;
      const subject = e.subject || '(no subject)';
      let agg = map.get(subject);
      if (!agg) {
        agg = {
          subject,
          lastAt: e.occurred_at,
          sent: new Set(),
          delivered: new Set(),
          opened: new Set(),
          clicked: new Set(),
          bounced: new Set(),
        };
        map.set(subject, agg);
      }
      if (e.occurred_at > agg.lastAt) agg.lastAt = e.occurred_at;
      if (e.event_type === 'sent') agg.sent.add(who);
      if (e.event_type === 'delivered') agg.delivered.add(who);
      if (e.event_type === 'opened') agg.opened.add(who);
      if (e.event_type === 'clicked') agg.clicked.add(who);
      if (e.event_type.startsWith('bounce')) agg.bounced.add(who);
    }

    const rows = [...map.values()]
      .map((a) => ({
        subject: a.subject,
        sent: a.sent.size,
        delivered: a.delivered.size,
        opened: a.opened.size,
        clicked: a.clicked.size,
        bounced: a.bounced.size,
        lastAt: a.lastAt,
      }))
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

    const totals = rows.reduce(
      (acc, r) => ({
        sent: acc.sent + r.sent,
        delivered: acc.delivered + r.delivered,
        opened: acc.opened + r.opened,
        clicked: acc.clicked + r.clicked,
        bounced: acc.bounced + r.bounced,
      }),
      { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 },
    );

    return { rows, totals };
  }, [events, audience]);

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : '—');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" /> Email performance
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Delivered / opened / clicked per email, for this campaign’s signups only (live from
            Resend webhooks).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? 'default' : 'outline'}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading email events…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8">
            No email events for this campaign in the selected range yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Sent', value: String(totals.sent) },
                { label: 'Delivered', value: String(totals.delivered) },
                { label: 'Opened', value: String(totals.opened) },
                { label: 'Open rate', value: pct(totals.opened, totals.delivered || totals.sent) },
                { label: 'Clicked', value: String(totals.clicked) },
                { label: 'Bounced', value: String(totals.bounced) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 px-3">Delivered</th>
                    <th className="py-2 px-3">Opened</th>
                    <th className="py-2 px-3">Open rate</th>
                    <th className="py-2 px-3">Clicked</th>
                    <th className="py-2 px-3">Click rate</th>
                    <th className="py-2 px-3">Bounced</th>
                    <th className="py-2 pl-3">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const base = r.delivered || r.sent;
                    return (
                      <tr key={r.subject} className="border-b last:border-0 align-top">
                        <td className="py-2 pr-3 max-w-[360px]">{r.subject}</td>
                        <td className="py-2 px-3">{base}</td>
                        <td className="py-2 px-3">{r.opened}</td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary">{pct(r.opened, base)}</Badge>
                        </td>
                        <td className="py-2 px-3">{r.clicked}</td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary">{pct(r.clicked, base)}</Badge>
                        </td>
                        <td className="py-2 px-3">{r.bounced}</td>
                        <td className="py-2 pl-3 whitespace-nowrap text-muted-foreground">
                          {new Date(r.lastAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
