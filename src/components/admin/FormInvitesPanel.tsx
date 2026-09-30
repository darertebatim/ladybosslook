import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProgramRoundFilter, fetchEnrolledUserIds, ALL } from './ProgramRoundFilter';

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  lastInvite: string | null;
  submitted: boolean;
}

interface Props {
  formKey: string;
  programSlug: string;
  submissionTable: 'profile_analysis_requests';
}

export function FormInvitesPanel({ formKey, programSlug, submissionTable }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [program, setProgram] = useState(programSlug);
  const [round, setRound] = useState(ALL);
  const [scope, setScope] = useState<'pending' | 'all'>('pending');

  const load = async () => {
    setLoading(true);
    try {
      const ids = (await fetchEnrolledUserIds(program, round)) || [];
      if (!ids.length) return setRows([]);
      const [{ data: subs }, { data: profs }, { data: invites }] = await Promise.all([
        supabase.from(submissionTable).select('user_id').in('user_id', ids),
        supabase.from('profiles').select('id, full_name, email').in('id', ids),
        (supabase as any)
          .from('form_invites')
          .select('user_id, sent_at')
          .eq('form_key', formKey)
          .in('user_id', ids)
          .order('sent_at', { ascending: false }),
      ]);
      const submitted = new Set((subs || []).map((s: any) => s.user_id));
      const last: Record<string, string> = {};
      for (const i of invites || []) if (!last[i.user_id]) last[i.user_id] = i.sent_at;
      const pmap = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
      setRows(
        ids
          .map((id) => ({
            user_id: id,
            full_name: pmap[id]?.full_name ?? null,
            email: pmap[id]?.email ?? null,
            lastInvite: last[id] ?? null,
            submitted: submitted.has(id),
          }))
          .sort((a, b) => Number(a.submitted) - Number(b.submitted) || (a.lastInvite ? 1 : 0) - (b.lastInvite ? 1 : 0)),
      );
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not load students.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [formKey, program, round]);

  const send = async (ids: string[], key: string) => {
    setSending(key);
    try {
      const { data, error } = await supabase.functions.invoke('send-form-invite', {
        body: { form: formKey, user_ids: ids },
      });
      if (error) {
        const ctx = (error as any)?.context;
        const details = ctx?.text ? await ctx.text().catch(() => '') : '';
        throw new Error(details || error.message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      const results = ((data as any)?.results || []) as { chat: boolean; email: boolean; error?: string }[];
      const chats = results.filter((r) => r.chat).length;
      const emails = results.filter((r) => r.email).length;
      const failed = results.filter((r) => r.error);
      toast({
        title: failed.length ? 'Sent with problems' : 'Sent',
        description: `In-app messages: ${chats} · Sign-in emails: ${emails}${failed.length ? ` · Failed: ${failed.length} (${failed[0].error})` : ''}`,
        variant: failed.length && !chats ? 'destructive' : undefined,
      });
      await load();
    } catch (e: any) {
      toast({ title: 'Send failed', description: e?.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  const visible = useMemo(() => (scope === 'pending' ? rows.filter((r) => !r.submitted) : rows), [rows, scope]);
  const notInvited = useMemo(() => visible.filter((r) => !r.lastInvite).map((r) => r.user_id), [visible]);
  const everyone = visible.map((r) => r.user_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ProgramRoundFilter program={program} round={round} onChange={(p, r) => { setProgram(p); setRound(r); }} />
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as 'pending' | 'all')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pending">Haven't submitted yet</option>
          <option value="all">All students</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={!everyone.length || !!sending}
          onClick={() => {
            if (confirm(`Send the form link to all ${everyone.length} students in this ${round === ALL ? 'program' : 'round'}?`))
              send(everyone, 'everyone');
          }}
        >
          {sending === 'everyone' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Send to whole {round === ALL ? 'program' : 'round'} ({everyone.length})
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {scope === 'pending'
            ? "Active students who haven't submitted yet."
            : 'All active students, including those who already submitted.'}{' '}
          They get an in-app message with a form button, plus an email with a one-time sign-in link that opens the
          form in their own account.
        </p>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            disabled={!notInvited.length || !!sending}
            onClick={() => {
              if (confirm(`Send the form link to ${notInvited.length} students who were never invited?`))
                send(notInvited, 'all');
            }}
          >
            {sending === 'all' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Send to all never invited ({notInvited.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          {scope === 'pending' ? 'Everyone has submitted 🎉' : 'No students in this selection.'}
        </p>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {visible.map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {r.full_name || 'Unknown'}
                    {r.submitted && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        Submitted
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {r.lastInvite ? `Invited ${new Date(r.lastInvite).toLocaleString()}` : 'Never invited'}
                </span>
                <Button
                  size="sm"
                  variant={r.lastInvite ? 'outline' : 'default'}
                  disabled={!!sending}
                  onClick={() => send([r.user_id], r.user_id)}
                >
                  {sending === r.user_id && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {r.lastInvite ? 'Resend' : 'Send form link'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
