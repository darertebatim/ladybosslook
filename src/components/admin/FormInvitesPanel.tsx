import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  lastInvite: string | null;
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

  const load = async () => {
    setLoading(true);
    try {
      const { data: enr } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('program_slug', programSlug)
        .eq('status', 'active');
      const ids = Array.from(new Set((enr || []).map((e: any) => e.user_id).filter(Boolean))) as string[];
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
          .filter((id) => !submitted.has(id))
          .map((id) => ({
            user_id: id,
            full_name: pmap[id]?.full_name ?? null,
            email: pmap[id]?.email ?? null,
            lastInvite: last[id] ?? null,
          }))
          .sort((a, b) => (a.lastInvite ? 1 : 0) - (b.lastInvite ? 1 : 0)),
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
  }, [formKey, programSlug]);

  const send = async (ids: string[], key: string) => {
    setSending(key);
    try {
      const { data, error } = await supabase.functions.invoke('send-form-invite', {
        body: { form: formKey, user_ids: ids },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const results = ((data as any)?.results || []) as { chat: boolean; email: boolean }[];
      const chats = results.filter((r) => r.chat).length;
      const emails = results.filter((r) => r.email).length;
      toast({ title: 'Sent', description: `In-app messages: ${chats} · Sign-in emails: ${emails}` });
      await load();
    } catch (e: any) {
      toast({ title: 'Send failed', description: e?.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  const notInvited = useMemo(() => rows.filter((r) => !r.lastInvite).map((r) => r.user_id), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Active students who haven't submitted yet. They get an in-app message with a form button, plus an email
          with a one-time sign-in link that opens the form in their own account.
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
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">Everyone has submitted 🎉</p>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {rows.map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.full_name || 'Unknown'}</p>
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
