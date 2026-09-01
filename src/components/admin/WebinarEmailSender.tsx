import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Row {
  email: string;
  round_id: string | null;
  reminder_sent_at: string | null;
  join_now_sent_at: string | null;
  next_session_sent_at: string | null;
  morning_sent_at: string | null;
}

interface RoundRow {
  id: string;
  round_name: string | null;
  first_session_date: string | null;
  status: string | null;
}

type SendKey =
  | 'test'
  | 'all'
  | 'join-test'
  | 'join-all'
  | 'next-test'
  | 'next-all'
  | 'morning-test'
  | 'morning-all'
  | null;

interface Props {
  /** campaign key understood by the send-sixtraps-reminder edge function */
  campaignKey: string;
  programSlug: string;
  sources: string[];
  /** e.g. /l/igadsfree — shown in the "next session" description */
  signupPath: string;
}

export function WebinarEmailSender({ campaignKey, programSlug, sources, signupPath }: Props) {
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState<SendKey>(null);
  const [roundChoice, setRoundChoice] = useState('auto');
  const [onlyUnsent, setOnlyUnsent] = useState(true);
  const [onlyUnsentJoinNow, setOnlyUnsentJoinNow] = useState(true);
  const [onlyUnsentMorning, setOnlyUnsentMorning] = useState(true);
  const [nextAudienceRound, setNextAudienceRound] = useState('all');
  const [onlyUnsentNext, setOnlyUnsentNext] = useState(true);

  const { data: rounds } = useQuery({
    queryKey: ['webinar-email-rounds', programSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, first_session_date, status')
        .eq('program_slug', programSlug)
        .order('first_session_date', { ascending: true });
      if (error) throw error;
      return (data || []) as RoundRow[];
    },
  });

  const { data: autoRoundId } = useQuery({
    queryKey: ['webinar-email-auto-round', programSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from('program_auto_enrollment')
        .select('round_id')
        .eq('program_slug', programSlug)
        .maybeSingle();
      return (data as any)?.round_id ?? null;
    },
  });

  const { data, refetch } = useQuery({
    queryKey: ['webinar-email-signups', campaignKey],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select(
          'email, round_id, reminder_sent_at, join_now_sent_at, next_session_sent_at, morning_sent_at',
        )
        .in('source', sources)
        .order('submitted_at', { ascending: false })
        .limit(5000);
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

  const uniqueEmails = (list: Row[]) =>
    new Set(list.map((r) => String(r.email || '').trim().toLowerCase()).filter(Boolean)).size;

  const targetCount = uniqueEmails(
    rows.filter(
      (r) =>
        (!effectiveRoundId || r.round_id === effectiveRoundId) &&
        (!onlyUnsent || !r.reminder_sent_at),
    ),
  );
  const joinNowTargetCount = uniqueEmails(
    rows.filter(
      (r) =>
        (!effectiveRoundId || r.round_id === effectiveRoundId) &&
        (!onlyUnsentJoinNow || !r.join_now_sent_at),
    ),
  );
  const morningTargetCount = uniqueEmails(
    rows.filter(
      (r) =>
        (!effectiveRoundId || r.round_id === effectiveRoundId) &&
        (!onlyUnsentMorning || !r.morning_sent_at),
    ),
  );
  const nextSessionTargetCount = uniqueEmails(
    rows.filter(
      (r) =>
        (nextAudienceRound === 'all' || r.round_id === nextAudienceRound) &&
        (!onlyUnsentNext || !r.next_session_sent_at),
    ),
  );

  async function send(
    mode: 'test' | 'all',
    joinNow = false,
    nextSession = false,
    morningOf = false,
  ) {
    const key = (nextSession
      ? `next-${mode}`
      : joinNow
        ? `join-${mode}`
        : morningOf
          ? `morning-${mode}`
          : mode) as SendKey;

    if (mode === 'test' && !testEmail.trim()) {
      toast.error('Enter a test email first');
      return;
    }
    if (mode === 'all') {
      const count = nextSession
        ? nextSessionTargetCount
        : morningOf
          ? morningTargetCount
          : joinNow
            ? joinNowTargetCount
            : targetCount;
      const what = nextSession
        ? '"next session" invite'
        : morningOf
          ? '"morning of webinar" email'
          : joinNow
            ? '"starting now" email'
            : 'reminder email';
      if (!window.confirm(`Send the ${what} to ${count} signup(s)?`)) return;
    }

    setSending(key);
    try {
      const { data, error } = await supabase.functions.invoke('send-sixtraps-reminder', {
        body:
          mode === 'test'
            ? {
                campaign: campaignKey,
                testEmail: testEmail.trim(),
                roundId: nextSession || roundChoice === 'auto' ? undefined : roundChoice,
                joinNow,
                nextSession,
                morningOf,
              }
            : nextSession
              ? {
                  campaign: campaignKey,
                  nextSession: true,
                  audienceRoundId: nextAudienceRound === 'all' ? undefined : nextAudienceRound,
                  onlyUnsent: onlyUnsentNext,
                }
              : {
                  campaign: campaignKey,
                  roundId: roundChoice === 'auto' ? undefined : roundChoice,
                  onlyUnsent: joinNow
                    ? onlyUnsentJoinNow
                    : morningOf
                      ? onlyUnsentMorning
                      : onlyUnsent,
                  joinNow,
                  morningOf,
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

  const spinner = (key: SendKey) =>
    sending === key ? (
      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
    ) : (
      <Send className="mr-1 h-4 w-4" />
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reminder email (prerequisite video + calendar)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sends the Farsi reminder with the prerequisite video link, an add-to-calendar button, and
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
            <Button variant="outline" size="sm" onClick={() => send('test')} disabled={!!sending}>
              {spinner('test')} Send test
            </Button>
            <Button size="sm" onClick={() => send('all')} disabled={!!sending}>
              {spinner('all')} Send to {targetCount}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">“Morning of the webinar” email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Long Farsi email with the campaign hook, session times per city, and a big join button to
            the selected round’s Meet link. Uses the round selected above.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyUnsentMorning}
              onChange={(e) => setOnlyUnsentMorning(e.target.checked)}
            />
            Only those who haven't received it
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => send('test', false, false, true)}
              disabled={!!sending}
            >
              {spinner('morning-test')} Send test
            </Button>
            <Button
              size="sm"
              onClick={() => send('all', false, false, true)}
              disabled={!!sending}
            >
              {spinner('morning-all')} Send morning email to {morningTargetCount}
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
            Meet link. Tracked separately from the reminder email.
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
              onClick={() => send('test', true)}
              disabled={!!sending}
            >
              {spinner('join-test')} Send test
            </Button>
            <Button size="sm" onClick={() => send('all', true)} disabled={!!sending}>
              {spinner('join-all')} Send “starting now” to {joinNowTargetCount}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">“Missed it? Next session” invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Farsi email for people who missed the live class: announces the next session (auto-uses
            the next upcoming round and its times per city) with a big button to{' '}
            <span dir="ltr">{signupPath}</span> to sign up.
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
                    {roundLabel(r.id)}
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
              onClick={() => send('test', false, true)}
              disabled={!!sending}
            >
              {spinner('next-test')} Send test
            </Button>
            <Button size="sm" onClick={() => send('all', false, true)} disabled={!!sending}>
              {spinner('next-all')} Send invite to {nextSessionTargetCount}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
