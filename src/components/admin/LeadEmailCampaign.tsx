import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Loader2, Mail, Plus, Send, Trash2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';

interface ButtonRow {
  label: string;
  url: string;
}

interface Option {
  value: string; // "lead:key" | "prog:slug"
  label: string;
  group: 'Lead lists' | 'Programs';
}

const CHUNK = 500;

/** Handoff key used by the Email Opens tab ("Resend to who didn't get it"). */
export const RESEND_HANDOFF_KEY = 'lead_email_resend_subject';

/** Everyone who already received an email with this subject. */
async function fetchAlreadySent(subject: string): Promise<Set<string>> {
  const set = new Set<string>();
  if (!subject) return set;
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from('email_delivery_events')
      .select('recipient')
      .eq('subject', subject)
      .in('event_type', ['sent', 'delivered'])
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String((r as any).recipient || '').trim().toLowerCase();
      if (e) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return set;
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

async function fetchUnsubscribed(): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .select('email')
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) set.add(String((r as any).email || '').trim().toLowerCase());
    if (!data || data.length < 1000) break;
  }
  return set;
}

function AudiencePicker({
  placeholder,
  options,
  selected,
  onChange,
  tone,
}: {
  placeholder: string;
  options: Option[];
  selected: string[];
  onChange: (v: string[]) => void;
  tone: 'default' | 'destructive';
}) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => {
    const g: Record<string, Option[]> = {};
    for (const o of options) (g[o.group] ||= []).push(o);
    return g;
  }, [options]);
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="truncate">
              {selected.length ? `${selected.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search lists and programs…" />
            <CommandList className="max-h-72">
              <CommandEmpty>Nothing found.</CommandEmpty>
              {Object.entries(groups).map(([name, opts]) => (
                <CommandGroup key={name} heading={name}>
                  {opts.map((o) => (
                    <CommandItem key={o.value} value={`${name} ${o.label}`} onSelect={() => toggle(o.value)}>
                      <Check
                        className={`mr-2 h-4 w-4 ${selected.includes(o.value) ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <span className="truncate">{o.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <Badge
              key={v}
              variant={tone === 'destructive' ? 'destructive' : 'secondary'}
              className="gap-1 max-w-[260px]"
            >
              <span className="truncate">{labelOf(v)}</span>
              <button type="button" onClick={() => toggle(v)} aria-label="Remove">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onChange([])}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export function LeadEmailCampaign() {
  const [includeSel, setIncludeSel] = useState<string[]>([]);
  const [excludeSel, setExcludeSel] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [fromName, setFromName] = useState('Ali Lotfi');
  const [address, setAddress] = useState('');
  const [rtl, setRtl] = useState(true);
  const [buttons, setButtons] = useState<ButtonRow[]>([{ label: '', url: '' }]);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState<'test' | 'all' | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

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

  const options: Option[] = useMemo(
    () => [
      ...LEAD_CAMPAIGNS.map((c) => ({
        value: `lead:${c.key}`,
        label: c.label,
        group: 'Lead lists' as const,
      })),
      ...programs.map((p) => ({
        value: `prog:${p.slug}`,
        label: p.title,
        group: 'Programs' as const,
      })),
    ],
    [programs],
  );

  const split = (sel: string[]) => {
    const leadKeys = sel.filter((v) => v.startsWith('lead:')).map((v) => v.slice(5));
    const slugs = sel.filter((v) => v.startsWith('prog:')).map((v) => v.slice(5));
    const sources = LEAD_CAMPAIGNS.filter((c) => leadKeys.includes(c.key)).flatMap((c) => [
      c.regSource,
      ...c.extraSources,
    ]);
    return { sources, slugs };
  };

  const inc = useMemo(() => split(includeSel), [includeSel]);
  const exc = useMemo(() => split(excludeSel), [excludeSel]);

  const { data: count, isFetching, refetch } = useQuery({
    queryKey: ['lead-email-audience', inc, exc],
    enabled: inc.sources.length > 0 || inc.slugs.length > 0,
    queryFn: async () => {
      const set = await fetchEmails(inc.sources);
      for (const e of await fetchProgramEmails(inc.slugs)) set.add(e);
      const out = await fetchEmails(exc.sources);
      for (const e of await fetchProgramEmails(exc.slugs)) out.add(e);
      for (const e of await fetchUnsubscribed()) out.add(e);
      for (const e of out) set.delete(e);
      return set.size;
    },
  });

  const payload = () => ({
    subject: subject.trim(),
    preheader: preheader.trim(),
    message,
    signature,
    fromName: fromName.trim(),
    address: address.trim(),
    rtl,
    buttons: buttons.filter((b) => b.label.trim() && b.url.trim()),
    sources: inc.sources,
    excludeSources: exc.sources,
    programs: inc.slugs,
    excludePrograms: exc.slugs,
  });

  async function send(mode: 'test' | 'all') {
    const plain = message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!subject.trim() || !plain) {
      toast.error('Add a title and a message first');
      return;
    }
    if (mode === 'test') {
      if (!testEmail.trim()) {
        toast.error('Enter a test email first');
        return;
      }
      setSending('test');
      try {
        const { data, error } = await supabase.functions.invoke('send-lead-email', {
          body: { ...payload(), testEmail: testEmail.trim() },
        });
        if (error) throw error;
        toast.success(`Test sent (${(data as any)?.sent ?? 0})`);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to send');
      } finally {
        setSending(null);
      }
      return;
    }

    if (!inc.sources.length && !inc.slugs.length) {
      toast.error('Pick at least one audience');
      return;
    }
    if (!window.confirm(`Send this email to ${count ?? 0} people?`)) return;

    setSending('all');
    setProgress({ done: 0, total: count ?? 0, failed: 0 });
    let offset = 0;
    let sent = 0;
    let failed = 0;
    try {
      // Sent in parts so a very large list (10k+) never times out.
      for (;;) {
        const { data, error } = await supabase.functions.invoke('send-lead-email', {
          body: { ...payload(), offset, limit: CHUNK },
        });
        if (error) throw error;
        const d = data as any;
        sent += d?.sent ?? 0;
        failed += d?.failed ?? 0;
        offset += d?.processed ?? 0;
        setProgress({ done: offset, total: d?.total ?? count ?? 0, failed });
        if (d?.done || !d?.processed) break;
      }
      toast.success(`Sent ${sent}${failed ? ` · failed ${failed}` : ''}`);
    } catch (e: any) {
      toast.error(`${e?.message || 'Failed to send'} — stopped after ${sent} emails`);
    } finally {
      setSending(null);
    }
  }

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Target audience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm">Send to</Label>
              <div className="mt-2">
                <AudiencePicker
                  placeholder="Pick lead lists or programs"
                  options={options}
                  selected={includeSel}
                  onChange={setIncludeSel}
                  tone="default"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Don't send to</Label>
              <div className="mt-2">
                <AudiencePicker
                  placeholder="Pick lists or programs to skip"
                  options={options}
                  selected={excludeSel}
                  onChange={setExcludeSel}
                  tone="destructive"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {isFetching ? 'Counting…' : `${count ?? 0} recipients`}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <span className="text-xs text-muted-foreground">
              People who unsubscribed are always removed.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Email content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-from">Sender name</Label>
              <Input
                id="lead-from"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                maxLength={60}
                placeholder="Ali Lotfi"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Shown as “{fromName || 'Ali Lotfi'} &lt;support@ladybosslook.com&gt;”
              </p>
            </div>
            <div>
              <Label htmlFor="lead-address">Business address (shown in footer)</Label>
              <Input
                id="lead-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={200}
                placeholder="123 Main St, Irvine, CA 92618, USA"
              />
            </div>
          </div>
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
            <Label>Message</Label>
            <div dir={rtl ? 'rtl' : 'ltr'}>
              <RichTextEditor
                value={message}
                onChange={setMessage}
                placeholder="متن ایمیل…"
                imageBucket="routine-images"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Bold, lists, links and images are supported. Images are uploaded and hosted for you.
            </p>
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

          <div>
            <Label>Signature (under the buttons)</Label>
            <div dir={rtl ? 'rtl' : 'ltr'}>
              <RichTextEditor
                value={signature}
                onChange={setSignature}
                placeholder="با احترام، علی لطفی"
                imageBucket="routine-images"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>

          {progress && (
            <div className="space-y-1">
              <Progress value={pct} />
              <p className="text-xs text-muted-foreground">
                {pct}% · {progress.done} of {progress.total} sent
                {progress.failed ? ` · ${progress.failed} failed` : ''}
                {sending === 'all' ? ' — keep this page open' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
