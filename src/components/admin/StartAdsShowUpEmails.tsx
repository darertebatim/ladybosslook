import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useTestEmailAddress, isValidEmail } from '@/hooks/useTestEmailAddress';
import { Loader2, Mail, CalendarClock } from 'lucide-react';

type Kind = 'confirm' | 'reminder' | 'morning' | 'onehour' | 'start' | 'after3h' | 'after24h' | 'nurture1' | 'nurture2';
const EMAILS: { kind: Kind; title: string; when: string }[] = [
  { kind: 'confirm', title: '0. Confirmation', when: 'Right at signup' },
  { kind: 'reminder', title: '1. Reminder', when: '2–3h after signup' },
  { kind: 'morning', title: '2. Morning of', when: '9 AM their local time' },
  { kind: 'onehour', title: '3. One hour before', when: '60 min before start' },
  { kind: 'start', title: '4. Starting now', when: 'At start time' },
  { kind: 'after3h', title: '5. Follow-up', when: '3h after start' },
  { kind: 'after24h', title: '6. Follow-up', when: '24h after start' },
];
const POWERFREE_EXTRA: { kind: Kind; title: string; when: string }[] = [
  { kind: 'nurture1', title: 'Signups 1 — Suitcase story (reply email)', when: 'Day after signup' },
  { kind: 'nurture2', title: 'Signups 2 — Tomorrow: 6-month decision (reply email)', when: 'Day before webinar' },
];

interface Round { id: string; round_number: number | null; first_session_date: string }

export function StartAdsShowUpEmails({ programSlug = 'startads', label = 'Start Ads', basePath = '/l/startads', source = 'startads_registration' }: { programSlug?: string; label?: string; basePath?: string; source?: string } = {}) {
  const [round, setRound] = useState<Round | null>(null);
  const [sent, setSent] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<Kind | null>(null);
  const [testTo, setTestTo] = useTestEmailAddress();

  useEffect(() => {
    (async () => {
      const { data: r } = await (supabase as any)
        .from('program_rounds')
        .select('id, round_number, first_session_date')
        .eq('program_slug', programSlug)
        .gt('first_session_date', new Date(Date.now() - 30 * 3600_000).toISOString())
        .order('first_session_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      setRound(r ?? null);
      if (!r) return;
      const { data: ev } = await (supabase as any)
        .from('email_delivery_events')
        .select('recipient, tags')
        .eq('tags->>campaign', 'webinar_day')
        .eq('tags->>round', `${programSlug}-${r.round_number ?? r.id}`)
        .eq('event_type', 'sent')
        .limit(5000);
      const m: Record<string, Set<string>> = {};
      for (const e of ev || []) (m[e.tags?.kind] ??= new Set()).add(String(e.recipient).toLowerCase());
      setSent(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.size])));
    })();
  }, [programSlug]);

  const test = async (kind: Kind) => {
    if (!round) return;
    if (!isValidEmail(testTo)) { toast.error('Enter a valid test email'); return; }
    const TEST_EMAIL = testTo.trim().toLowerCase();
    setBusy(kind);
    const { error } =
      kind === 'confirm'
        ? await supabase.functions.invoke('send-sixtraps-confirmation', {
            body: {
              name: 'دوست عزیز',
              email: TEST_EMAIL,
              programSlug,
              roundId: round.id,
              sources: [source],
              prereqUrl: `https://ladybosslook.com${basePath}/thankyou?round=${round.round_number}&email=${encodeURIComponent(TEST_EMAIL)}`,
            },
          })
        : await supabase.functions.invoke('send-webinar-day-emails', {
            body: { round_id: round.id, kind, testEmail: TEST_EMAIL },
          });
    setBusy(null);
    if (error) toast.error(`Test failed: ${error.message}`);
    else toast.success(`Test sent to ${TEST_EMAIL}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" /> {label} show-up emails — signups
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {round
            ? `Round ${round.round_number} · ${new Date(round.first_session_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. Sent automatically.`
            : `No upcoming ${label} round.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Send tests to:</span>
          <Input type="email" dir="ltr" value={testTo} onChange={(e) => setTestTo(e.target.value)} className="h-9 max-w-xs" placeholder="you@example.com" />
        </div>
        {EMAILS.map(({ kind, title, when }) => (
          <div key={kind} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="secondary">{when}</Badge>
            {kind !== 'confirm' && <span className="text-xs text-foreground">Sent: <b>{sent[kind] ?? 0}</b></span>}
            <Button size="sm" variant="outline" className="ms-auto" onClick={() => test(kind)} disabled={!round || !!busy}>
              {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send test
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
