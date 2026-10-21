import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTestEmailAddress, isValidEmail } from '@/hooks/useTestEmailAddress';
import { toast } from 'sonner';
import { Loader2, Mail, Send, RefreshCw } from 'lucide-react';

type Kind = 'invite' | 'focus' | 'urgency' | 'proof' | 'freedom';

const EMAILS: { kind: Kind; title: string; when: string; subject: string }[] = [
  { kind: 'invite', title: 'Email 1 — Invitation', when: 'Sunday evening', subject: 'یک دعوت خصوصی (فقط ۵۰ نفر از بچه‌های اینستاگرام) 🎁' },
  { kind: 'focus', title: 'Email 2 — Real Session 1 focus', when: 'Monday afternoon', subject: 'محصول یا خدمتت عالیه، ولی مشتری جدید کجاست؟ 🤔' },
  { kind: 'urgency', title: 'Email 3 — Holiday market / last call', when: 'Wednesday morning', subject: 'بازار آخر سال نزدیکه (چرا جلسه اول رو براتون رایگان کردم؟) 🛍️' },
  { kind: 'proof', title: 'Signups 1 — Why Meta Ads works (WhatsApp: IG link)', when: 'Registrants · Tuesday', subject: 'چرا متا ادز قابل‌اعتمادترین شیر آب مشتریه؟ (با اعداد واقعی) 📊' },
  { kind: 'freedom', title: 'Signups 2 — Escape the hustle cycle (WhatsApp: client goal)', when: 'Registrants · Wednesday', subject: 'چرخه خطرناکی که خیلی از ما توش گیر کردیم... (و راه نجات) 🔄' },
];

const TEST_EMAIL = 'darertebatim@gmail.com';

type Stats = { sent: number; opened: number; clicked: number; remaining: number | null };

async function countEvents(kind: Kind, type: string) {
  const { count } = await supabase
    .from('email_delivery_events')
    .select('id', { count: 'exact', head: true })
    .eq('tags->>campaign', 'startads_launch')
    .eq('tags->>kind', kind)
    .eq('event_type', type)
    .neq('recipient', TEST_EMAIL);
  return count ?? 0;
}

export function StartAdsEmailAutomation() {
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useTestEmailAddress();

  const load = useCallback(async () => {
    setLoading(true);
    const next: Record<string, Stats> = {};
    await Promise.all(
      EMAILS.map(async ({ kind }) => {
        const [sent, opened, clicked, dry] = await Promise.all([
          countEvents(kind, 'sent'),
          countEvents(kind, 'opened'),
          countEvents(kind, 'clicked'),
          supabase.functions.invoke('send-startads-campaign', { body: { kind, dry_run: true } }),
        ]);
        next[kind] = { sent, opened, clicked, remaining: dry.data?.recipients ?? null };
      }),
    );
    setStats(next);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (kind: Kind, mode: 'test' | 'live') => {
    const s = stats[kind];
    if (mode === 'test' && !isValidEmail(testEmail)) { toast.error('Enter a valid test email'); return; }
    if (mode === 'live' && !window.confirm(`Send this email to ${s?.remaining ?? 'all'} people now? Each person gets it only once.`)) return;
    setBusy(`${kind}-${mode}`);
    const { data, error } = await supabase.functions.invoke('send-startads-campaign', {
      body: mode === 'test' ? { kind, test_email: testEmail.trim().toLowerCase() } : { kind },
    });
    setBusy(null);
    if (error || data?.error) {
      toast.error(`Send failed: ${data?.error || error?.message}`);
      return;
    }
    toast.success(mode === 'test' ? `Test sent to ${testEmail.trim()}` : `Sent to ${data?.sent ?? 0} people`);
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" /> Start Ads email automation — past IG Ads signups
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground">Send tests to:</span>
          <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" className="h-9 max-w-xs" dir="ltr" />
        </div>
        {EMAILS.map(({ kind, title, when, subject }) => {
          const s = stats[kind];
          return (
            <div key={kind} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{title}</span>
                <Badge variant="secondary">{when}</Badge>
              </div>
              <p className="text-sm text-foreground" dir="rtl">{subject}</p>
              <div className="flex flex-wrap gap-3 text-xs text-foreground">
                <span>Sent: <b>{s?.sent ?? '—'}</b></span>
                <span>Opened: <b>{s?.opened ?? '—'}</b>{s && s.sent > 0 ? ` (${Math.round((s.opened / s.sent) * 100)}%)` : ''}</span>
                <span>Clicked: <b>{s?.clicked ?? '—'}</b></span>
                <span>Not yet sent: <b>{s?.remaining ?? '—'}</b></span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => run(kind, 'test')} disabled={!!busy}>
                  {busy === `${kind}-test` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send test
                </Button>
                <Button size="sm" onClick={() => run(kind, 'live')} disabled={!!busy || !s?.remaining}>
                  {busy === `${kind}-live` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send to {s?.remaining ?? '…'} people
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
