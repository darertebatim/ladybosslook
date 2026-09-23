import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, ExternalLink, RefreshCw, Instagram, MessageCircle, MessageSquare, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AnalysisRequest {
  id: string;
  user_id: string | null;
  instagram_url: string;
  business_field: string;
  business_name: string | null;
  product_service: string;
  target_audience: string;
  offer_includes: string;
  conversion_action: string;
  question: string | null;
  status: string;
  created_at: string;
}

interface ProfileInfo {
  full_name: string | null;
  email: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  in_progress: 'In progress',
  done: 'Done',
};

const waLink = (phone?: string | null) => {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}`;
};

export function ProfileAnalysisManager() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [whatsapps, setWhatsapps] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [videoTarget, setVideoTarget] = useState<AnalysisRequest | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [videoSending, setVideoSending] = useState(false);

  const normalizeVideoUrl = (raw: string): string | null => {
    const v = raw.trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v.replace(/^\/+/, '')}`;
  };

  const sendAnalysisVideo = async () => {
    if (!videoTarget?.user_id) return;
    const url = normalizeVideoUrl(videoLink);
    if (!url) {
      toast({ title: 'Missing link', description: 'Paste the Google Drive video link first.', variant: 'destructive' });
      return;
    }
    setVideoSending(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminId = authData.user?.id;
      if (!adminId) throw new Error('Not signed in.');

      // Find or create the student's support conversation
      let conversationId: string | null = null;
      let unread = 0;
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id, unread_count_user')
        .eq('user_id', videoTarget.user_id)
        .eq('inbox_type', 'support')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        conversationId = (existing as { id: string }).id;
        unread = (existing as { unread_count_user: number | null }).unread_count_user || 0;
      } else {
        const { data: created, error: convErr } = await supabase
          .from('chat_conversations')
          .insert({ user_id: videoTarget.user_id, status: 'open' })
          .select('id')
          .single();
        if (convErr) throw convErr;
        conversationId = (created as { id: string }).id;
      }

      const content =
        '🎬 تحلیل پیج اینستاگرام شما آماده شد!\nویدیوی تحلیل پیجتان را از دکمه زیر تماشا کنید 👇';
      const { error: msgErr } = await (supabase as any)
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: adminId,
          sender_type: 'admin',
          content,
          buttons: [{ label: 'تماشای ویدیوی تحلیل 🎥', url }],
        });
      if (msgErr) throw msgErr;

      await (supabase as any)
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString(), unread_count_user: unread + 1 })
        .eq('id', conversationId);

      try {
        await supabase.functions.invoke('send-chat-notification', {
          body: {
            conversationId,
            messageContent: '🎬 تحلیل پیج اینستاگرام شما آماده شد!',
            senderType: 'admin',
            senderId: adminId,
          },
        });
      } catch (e) {
        console.error('notify failed', e);
      }

      toast({ title: 'Sent 🎉', description: 'The video link was delivered to their in-app chat.' });
      setVideoTarget(null);
      setVideoLink('');
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Send failed', description: e?.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setVideoSending(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_analysis_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as AnalysisRequest[];
      setRequests(rows);

      const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ids);
        const map: Record<string, ProfileInfo> = {};
        for (const p of profileRows || []) {
          map[(p as { id: string }).id] = {
            full_name: (p as { full_name: string | null }).full_name,
            email: (p as { email: string | null }).email,
          };
        }
        setProfiles(map);

        const { data: noteRows } = await supabase
          .from('student_admin_notes')
          .select('user_id, whatsapp_number')
          .in('user_id', ids);
        const wa: Record<string, string | null> = {};
        for (const n of noteRows || []) {
          const row = n as { user_id: string; whatsapp_number: string | null };
          wa[row.user_id] = row.whatsapp_number;
        }
        setWhatsapps(wa);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not load analysis requests.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const previous = requests;
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from('profile_analysis_requests').update({ status }).eq('id', id);
    if (error) {
      setRequests(previous);
      toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      const p = r.user_id ? profiles[r.user_id] : undefined;
      return [r.instagram_url, r.business_name, r.business_field, p?.full_name, p?.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [requests, profiles, search, statusFilter]);

  const igHref = (url: string) => {
    const v = url.trim();
    if (!v) return '#';
    if (v.startsWith('http')) return v;
    if (/^@?[A-Za-z0-9._]+$/.test(v)) return `https://instagram.com/${v.replace(/^@/, '')}`;
    return `https://${v.replace(/^\/+/, '')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, email, page, business…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {['all', 'new', 'in_progress', 'done'].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} requests</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No requests yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const p = r.user_id ? profiles[r.user_id] : undefined;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={igHref(r.instagram_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {r.instagram_url}
                      </a>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === 'done' ? 'secondary' : 'default'}>
                        {STATUS_LABEL[r.status] || r.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p?.full_name || 'Unknown student'}
                    {p?.email ? ` · ${p.email}` : ''}
                    {r.business_name ? ` · ${r.business_name}` : ''}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Field label="Business field" value={r.business_field} />
                  <Field label="Product / service to advertise" value={r.product_service} />
                  <Field label="Target audience" value={r.target_audience} />
                  <Field label="Offer includes" value={r.offer_includes} />
                  <Field label="Action & conversion point" value={r.conversion_action} />
                  {r.question && <Field label="Their question" value={r.question} />}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['new', 'in_progress', 'done'].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={r.status === s ? 'default' : 'outline'}
                        onClick={() => updateStatus(r.id, s)}
                      >
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                    {r.user_id && waLink(whatsapps[r.user_id]) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-700"
                        onClick={() => window.open(waLink(whatsapps[r.user_id])!, '_blank', 'noreferrer')}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {r.user_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/support?userId=${r.user_id}`)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message in app
                      </Button>
                    )}
                    {r.user_id && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setVideoTarget(r);
                          setVideoLink('');
                        }}
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Send analysis video
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap" dir="auto">
        {value}
      </p>
    </div>
  );
}

export default ProfileAnalysisManager;
