import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Plus, Send, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';

interface ButtonRow {
  label: string;
  url: string;
}

async function fetchProgramEmails(slugs: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  if (!slugs.length) return set;
  const userIds = new Set<string>();
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('user_id, status')
      .in('program_slug', slugs)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const s = (r as any).status;
      if (!s || s === 'active' || s === 'completed') {
        if ((r as any).user_id) userIds.add(String((r as any).user_id));
      }
    }
    if (!data || data.length < 1000) break;
  }
  const ids = Array.from(userIds);
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .in('id', ids.slice(i, i + 500));
    if (error) throw error;
    for (const r of data || []) {
      const e = String((r as any).email || '').trim().toLowerCase();
      if (e.includes('@')) set.add(e);
    }
  }
  return set;
}

async function fetchEmails(sources: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  if (!sources.length) return set;
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('email')
      .in('source', sources)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String((r as any).email || '').trim().toLowerCase();
      if (e.includes('@')) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return set;
}

export function LeadEmailCampaign() {
  const [include, setInclude] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [message, setMessage] = useState('');
  const [rtl, setRtl] = useState(true);
  const [buttons, setButtons] = useState<ButtonRow[]>([{ label: '', url: '' }]);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState<'test' | 'all' | null>(null);
  const [includePrograms, setIncludePrograms] = useState<string[]>([]);
  const [excludePrograms, setExcludePrograms] = useState<string[]>([]);

  const { data: programs = [] } = useQuery({
    queryKey: ['lead-email-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .order('title');
      if (error) throw error;
      return (data || []) as { slug: string; title: string }[];
    },
  });

  const includeSources = useMemo(
    () =>
      LEAD_CAMPAIGNS.filter((c) => include.includes(c.key)).flatMap((c) => [
        c.regSource,
        ...c.extraSources,
      ]),
    [include],
  );
  const excludeSources = useMemo(
    () =>
      LEAD_CAMPAIGNS.filter((c) => exclude.includes(c.key)).flatMap((c) => [
        c.regSource,
        ...c.extraSources,
      ]),
    [exclude],
  );

  const { data: count, isFetching, refetch } = useQuery({
    queryKey: ['lead-email-audience', includeSources, excludeSources, includePrograms, excludePrograms],
    enabled: includeSources.length > 0 || includePrograms.length > 0,
    queryFn: async () => {
      const inc = await fetchEmails(includeSources);
      for (const e of await fetchProgramEmails(includePrograms)) inc.add(e);
      const exc = await fetchEmails(excludeSources);
      for (const e of await fetchProgramEmails(excludePrograms)) exc.add(e);
      for (const e of exc) inc.delete(e);
      return inc.size;
    },
  });

  const toggle = (list: string[], setList: (v: string[]) => void, key: string) =>
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const payload = () => ({
    subject: subject.trim(),
    preheader: preheader.trim(),
    message,
    rtl,
    buttons: buttons.filter((b) => b.label.trim() && b.url.trim()),
    sources: includeSources,
    excludeSources,
    programs: includePrograms,
    excludePrograms,
  });

  async function send(mode: 'test' | 'all') {
    if (!subject.trim() || !message.trim()) {
      toast.error('Add a title and a message first');
      return;
    }
    if (mode === 'test' && !testEmail.trim()) {
      toast.error('Enter a test email first');
      return;
    }
    if (mode === 'all') {
      if (!includeSources.length) {
        toast.error('Pick at least one audience');
        return;
      }
      if (!window.confirm(`Send this email to ${count ?? 0} people?`)) return;
    }
    setSending(mode);
    try {
      const { data, error } = await supabase.functions.invoke('send-lead-email', {
        body: mode === 'test' ? { ...payload(), testEmail: testEmail.trim() } : payload(),
      });
      if (error) throw error;
      const d = data as any;
      toast.success(`Sent ${d?.sent ?? 0}${d?.failed ? ` · failed ${d.failed}` : ''}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Target audience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Send to</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {LEAD_CAMPAIGNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <Checkbox
                    checked={include.includes(c.key)}
                    onCheckedChange={() => toggle(include, setInclude, c.key)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Exclude (already signed up)</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {LEAD_CAMPAIGNS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <Checkbox
                    checked={exclude.includes(c.key)}
                    onCheckedChange={() => toggle(exclude, setExclude, c.key)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {isFetching ? 'Counting…' : `${count ?? 0} recipients`}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-1 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Email content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lead-subject">Title (subject)</Label>
            <Input
              id="lead-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="وبینار رایگان اینستاگرام ادز"
              dir={rtl ? 'rtl' : 'ltr'}
            />
          </div>
          <div>
            <Label htmlFor="lead-preheader">Preview line (optional)</Label>
            <Input
              id="lead-preheader"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              maxLength={160}
              dir={rtl ? 'rtl' : 'ltr'}
            />
          </div>
          <div>
            <Label htmlFor="lead-message">Message</Label>
            <Textarea
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              dir={rtl ? 'rtl' : 'ltr'}
              placeholder="متن ایمیل…"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Right-to-left (Farsi)</p>
              <p className="text-xs text-muted-foreground">Aligns the email for Farsi text</p>
            </div>
            <Switch checked={rtl} onCheckedChange={setRtl} />
          </div>

          <div className="space-y-2">
            <Label>Buttons</Label>
            {buttons.map((b, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={b.label}
                  onChange={(e) =>
                    setButtons(buttons.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Button text"
                  className="w-1/3"
                />
                <Input
                  value={b.url}
                  onChange={(e) =>
                    setButtons(buttons.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                  }
                  placeholder="https://ladybosslook.com/l/igadsfree"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {buttons.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setButtons([...buttons, { label: '', url: '' }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Add button
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          <Input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@email.com"
            className="w-64"
          />
          <Button variant="outline" onClick={() => send('test')} disabled={!!sending}>
            {sending === 'test' ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1 h-4 w-4" />
            )}
            Send test
          </Button>
          <Button onClick={() => send('all')} disabled={!!sending}>
            {sending === 'all' ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1 h-4 w-4" />
            )}
            Send to {count ?? 0}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
