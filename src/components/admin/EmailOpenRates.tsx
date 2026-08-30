import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MailOpen, RefreshCw } from 'lucide-react';

type EventRow = {
  event_type: string;
  recipient: string | null;
  subject: string | null;
  occurred_at: string;
};

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

async function fetchEvents(days: number): Promise<EventRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const all: EventRow[] = [];
  const pageSize = 1000;
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from('email_delivery_events')
      .select('event_type, recipient, subject, occurred_at')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw error;
    all.push(...((data ?? []) as EventRow[]));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

type Agg = {
  subject: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  lastAt: string;
};

export function EmailOpenRates() {
  const [days, setDays] = useState(30);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['email-delivery-events', days],
    queryFn: () => fetchEvents(days),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { rows, totals } = useMemo(() => {
    const map = new Map<string, Agg & { openedSet: Set<string>; sentSet: Set<string>; deliveredSet: Set<string>; clickedSet: Set<string>; bouncedSet: Set<string> }>();

    for (const e of data ?? []) {
      const subject = e.subject || '(no subject)';
      let agg = map.get(subject);
      if (!agg) {
        agg = {
          subject,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          lastAt: e.occurred_at,
          openedSet: new Set(),
          sentSet: new Set(),
          deliveredSet: new Set(),
          clickedSet: new Set(),
          bouncedSet: new Set(),
        };
        map.set(subject, agg);
      }
      if (e.occurred_at > agg.lastAt) agg.lastAt = e.occurred_at;
      const who = (e.recipient || '').toLowerCase();
      if (e.event_type === 'sent') agg.sentSet.add(who);
      if (e.event_type === 'delivered') agg.deliveredSet.add(who);
      if (e.event_type === 'opened') agg.openedSet.add(who);
      if (e.event_type === 'clicked') agg.clickedSet.add(who);
      if (e.event_type.startsWith('bounce')) agg.bouncedSet.add(who);
    }

    const rows: Agg[] = [...map.values()]
      .map((a) => ({
        subject: a.subject,
        sent: a.sentSet.size,
        delivered: a.deliveredSet.size,
        opened: a.openedSet.size,
        clicked: a.clickedSet.size,
        bounced: a.bouncedSet.size,
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
  }, [data]);

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : '—');
  const base = (r: { delivered: number; sent: number }) => r.delivered || r.sent;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" /> Email open rates
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Live tracking from Resend. Turn on “Open tracking” for your domain in Resend →
            Domains → Tracking, and point a Resend webhook at the resend-webhook function.
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
            No email events recorded yet. Once the Resend webhook is connected, delivered/opened
            events will show up here automatically.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Sent', value: totals.sent },
                { label: 'Delivered', value: totals.delivered },
                { label: 'Opened', value: totals.opened },
                { label: 'Clicked', value: totals.clicked },
                { label: 'Bounced', value: totals.bounced },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Overall open rate</p>
              <p className="text-2xl font-bold">
                {pct(totals.opened, totals.delivered || totals.sent)}
              </p>
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
                    <th className="py-2 px-3">Bounced</th>
                    <th className="py-2 pl-3">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.subject} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 max-w-[360px]">{r.subject}</td>
                      <td className="py-2 px-3">{r.delivered || r.sent}</td>
                      <td className="py-2 px-3">{r.opened}</td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary">{pct(r.opened, base(r))}</Badge>
                      </td>
                      <td className="py-2 px-3">{r.clicked}</td>
                      <td className="py-2 px-3">{r.bounced}</td>
                      <td className="py-2 pl-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.lastAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
