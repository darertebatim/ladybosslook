import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, ExternalLink, RefreshCw, Instagram } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

export function ProfileAnalysisManager() {
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const igHref = (url: string) => (url.startsWith('http') ? url : `https://${url.replace(/^\/+/, '')}`);

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
                  <div className="flex gap-2 pt-1">
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
