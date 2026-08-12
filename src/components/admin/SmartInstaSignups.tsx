import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SOURCES = ['smartinsta_registration'];
const PROGRAM_SLUG = 'smartinstagramframework';

interface Row {
  id: string;
  email: string;
  name: string | null;
  city: string | null;
  source: string | null;
  submitted_at: string;
  round_id: string | null;
  reminder_sent_at: string | null;
  reminder_round_id: string | null;
  join_now_sent_at: string | null;
  join_now_round_id: string | null;
  next_session_sent_at: string | null;
  next_session_round_id: string | null;
}

interface RoundRow {
  id: string;
  round_name: string | null;
  first_session_date: string | null;
  status: string | null;
}

export function SmartInstaSignups() {
  const [search, setSearch] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState<
    'test' | 'all' | 'join-test' | 'join-all' | 'next-test' | 'next-all' | null
  >(null);
  const [roundChoice, setRoundChoice] = useState<string>('auto');
  const [onlyUnsent, setOnlyUnsent] = useState(true);
  const [onlyUnsentJoinNow, setOnlyUnsentJoinNow] = useState(true);
  const [nextAudienceRound, setNextAudienceRound] = useState<string>('all');
  const [onlyUnsentNext, setOnlyUnsentNext] = useState(true);

  const { data: rounds } = useQuery({
    queryKey: ['smartinsta-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, first_session_date, status')
        .eq('program_slug', PROGRAM_SLUG)
        .order('first_session_date', { ascending: true });
      if (error) throw error;
      return (data || []) as RoundRow[];
    },
  });

  const { data: autoRoundId } = useQuery({
    queryKey: ['smartinsta-auto-round'],
    queryFn: async () => {
      const { data } = await supabase
        .from('program_auto_enrollment')
        .select('round_id')
        .eq('program_slug', PROGRAM_SLUG)
        .maybeSingle();
      return (data as any)?.round_id ?? null;
    },
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['smartinsta-signups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select(
          'id, email, name, city, source, submitted_at, round_id, reminder_sent_at, reminder_round_id, join_now_sent_at, join_now_round_id, next_session_sent_at, next_session_round_id',
        )
        .in('source', SOURCES)
        .order('submitted_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as unknown as Row[];
    },
  });

  const rows = data || [];
  const effectiveRoundId = roundChoice === 'auto' ? autoRoundId : roundChoice;

  const roundLabel = (id: string | null) => {
    if (!id) return '—';
    const r = rounds?.find((x) => x.id === id);
    if (!r) return 'Unknown';
    const d = r.first_session_date
      ? new Date(r.first_session_date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : '';
    return `${r.round_name || 'Round'}${d ? ` · ${d}` : ''}`;
  };

  const targetCount = rows.filter(
    (r) =>
      (!effectiveRoundId || r.round_id === effectiveRoundId) &&
      (!onlyUnsent || !r.reminder_sent_at),
  ).length;

  const joinNowTargetCount = rows.filter(
    (r) =>
      (!effectiveRoundId || r.round_id === effectiveRoundId) &&
      (!onlyUnsentJoinNow || !r.join_now_sent_at),
  ).length;

  const nextSessionTargetCount = rows.filter(
    (r) =>
      (nextAudienceRound === 'all' || r.round_id === nextAudienceRound) &&
      (!onlyUnsentNext || !r.next_session_sent_at),
  ).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const registrations = rows.length;

  function exportCsv() {
    const header = 'email,name,city,source,round,reminder_sent_at,join_now_sent_at,submitted_at';
    const body = filtered
      .map((r) =>
        [
          r.email,
          r.name || '',
          r.city || '',
          r.source || '',
          roundLabel(r.round_id),
          r.reminder_sent_at || '',
          r.join_now_sent_at || '',
          r.submitted_at,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartinsta-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sendReminder(
    mode: 'test' | 'all',
    joinNow = false,
    nextSession = false,
  ) {
    const key = (nextSession
      ? `next-${mode}`
      : joinNow
        ? `join-${mode}`
        : mode) as typeof sending;
    if (mode === 'test' && !testEmail.trim()) {
      toast.error('Enter a test email first');
      return;
    }
    if (
      mode === 'all' &&
      !nextSession &&
      !window.confirm(
        `Send the ${joinNow ? '"starting now"' : 'reminder'} email to ${joinNow ? joinNowTargetCount : targetCount} signup(s) for ${roundLabel(effectiveRoundId)}${
          joinNow
            ? onlyUnsentJoinNow
              ? ' (no "starting now" yet)'
              : ''
            : onlyUnsent
              ? ' (not yet reminded)'
              : ''
        }?`,
      )
    ) {
      return;
    }
    if (
      mode === 'all' &&
      nextSession &&
      !window.confirm(
        `Send the "next session" invite to ${nextSessionTargetCount} signup(s)?`,
      )
    ) {
      return;
    }
    setSending(key);
    try {
      const { data, error } = await supabase.functions.invoke('send-smartinsta-reminder', {
        body:
          mode === 'test'
            ? {
                testEmail: testEmail.trim(),
                roundId: nextSession
                  ? undefined
                  : roundChoice === 'auto'
                    ? undefined
                    : roundChoice,
                joinNow,
                nextSession,
              }
            : nextSession
              ? {
                  nextSession: true,
                  audienceRoundId:
                    nextAudienceRound === 'all' ? undefined : nextAudienceRound,
                  onlyUnsent: onlyUnsentNext,
                }
              : {
                roundId: roundChoice === 'auto' ? undefined : roundChoice,
                onlyUnsent: joinNow ? onlyUnsentJoinNow : onlyUnsent,
                joinNow,
              },
      });
      if (error) throw error;
      toast.success(`Sent ${(data as any)?.sent ?? 0} · failed ${(data as any)?.failed ?? 0}`);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total signups</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Full registration</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{registrations}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reminder email (gift workbook + calendar)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sends the Farsi reminder with the gift workbook (PDF) link, an add-to-calendar button, and
            session times for Los Angeles/Vancouver, New York/Toronto, Chicago/Texas and Sydney.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={roundChoice} onValueChange={setRoundChoice}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  Auto (enrollment round){autoRoundId ? ` · ${roundLabel(autoRoundId)}` : ''}
                </SelectItem>
                {(rounds || []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {roundLabel(r.id)} {r.status !== 'active' ? `(${r.status})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyUnsent}
                onChange={(e) => setOnlyUnsent(e.target.checked)}
              />
              Only those who haven't received it
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@email.com"
              className="w-64"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendReminder('test')}
              disabled={sending !== null}
            >
              {sending === 'test' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Send test
            </Button>
            <Button size="sm" onClick={() => sendReminder('all')} disabled={sending !== null}>
              {sending === 'all' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Send to {targetCount}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">“Starting now” email (join link)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Short Farsi email: “وبینار در حال شروع است” with a big join button to the round’s Google
            Meet link. Tracked separately from the reminder email — people who already got the
            reminder still get this one.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyUnsentJoinNow}
              onChange={(e) => setOnlyUnsentJoinNow(e.target.checked)}
            />
            Only those who haven't received it
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendReminder('test', true)}
              disabled={sending !== null}
            >
              {sending === 'join-test' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Send test
            </Button>
            <Button size="sm" onClick={() => sendReminder('all', true)} disabled={sending !== null}>
              {sending === 'join-all' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Send “starting now” to {joinNowTargetCount}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">“Missed it? Next session” invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Farsi email for people who missed the live class: announces the next session (auto-uses
            the next upcoming round and its times per city) with a big button to{' '}
            <span dir="ltr">/smartinstaframework</span> to sign up.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={nextAudienceRound} onValueChange={setNextAudienceRound}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Audience round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All signups (any round)</SelectItem>
                {(rounds || []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Signed up for {roundLabel(r.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyUnsentNext}
                onChange={(e) => setOnlyUnsentNext(e.target.checked)}
              />
              Only those who haven't received it
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendReminder('test', false, true)}
              disabled={sending !== null}
            >
              {sending === 'next-test' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Send test
            </Button>
            <Button
              size="sm"
              onClick={() => sendReminder('all', false, true)}
              disabled={sending !== null}
            >
              {sending === 'next-all' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Send invite to {nextSessionTargetCount}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Smart Instagram Framework Signups</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, name, city"
              className="w-56"
            />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signups found.</p>
          ) : (
            <div className="max-h-[520px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Email</th>
                    <th className="p-2 font-medium">Name</th>
                    <th className="p-2 font-medium">City</th>
                    <th className="p-2 font-medium">Source</th>
                    <th className="p-2 font-medium">Round</th>
                    <th className="p-2 font-medium">Reminder</th>
                    <th className="p-2 font-medium">Starting now</th>
                    <th className="p-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{r.email}</td>
                      <td className="p-2">{r.name || '—'}</td>
                      <td className="p-2">{r.city || '—'}</td>
                      <td className="p-2">
                        <Badge variant="secondary">
                          Registration
                        </Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <Badge variant="outline">{roundLabel(r.round_id)}</Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {r.reminder_sent_at ? (
                          <Badge>
                            Sent · {roundLabel(r.reminder_round_id)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not sent</span>
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {r.join_now_sent_at ? (
                          <Badge>Sent · {roundLabel(r.join_now_round_id)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Not sent</span>
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {new Date(r.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}