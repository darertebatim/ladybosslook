import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, RefreshCw, Apple, Smartphone } from 'lucide-react';

type Row = {
  id: string;
  user_id: string | null;
  platform: 'ios' | 'android' | 'web';
  trigger_source: string | null;
  success: boolean;
  forced: boolean;
  app_version: string | null;
  error_message: string | null;
  created_at: string;
};

type Stats = {
  total: number;
  success: number;
  forced: number;
  uniqueUsers: number;
  last7d: number;
  last30d: number;
};

function emptyStats(): Stats {
  return { total: 0, success: 0, forced: 0, uniqueUsers: 0, last7d: 0, last30d: 0 };
}

function buildStats(rows: Row[]): Stats {
  const now = Date.now();
  const d7 = now - 7 * 86400000;
  const d30 = now - 30 * 86400000;
  const users = new Set<string>();
  let success = 0, forced = 0, last7 = 0, last30 = 0;
  for (const r of rows) {
    if (r.user_id) users.add(r.user_id);
    if (r.success) success++;
    if (r.forced) forced++;
    const t = new Date(r.created_at).getTime();
    if (t >= d7) last7++;
    if (t >= d30) last30++;
  }
  return {
    total: rows.length,
    success,
    forced,
    uniqueUsers: users.size,
    last7d: last7,
    last30d: last30,
  };
}

export function AppReviewKPIPanel() {
  const [loading, setLoading] = useState(true);
  const [ios, setIos] = useState<Stats>(emptyStats());
  const [android, setAndroid] = useState<Stats>(emptyStats());
  const [recent, setRecent] = useState<Row[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_review_prompts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      toast.error(`Failed to load review KPIs: ${error.message}`);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Row[];
    setIos(buildStats(rows.filter(r => r.platform === 'ios')));
    setAndroid(buildStats(rows.filter(r => r.platform === 'android')));
    setRecent(rows.slice(0, 25));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const StatBlock = ({
    title,
    icon,
    stats,
    accent,
  }: {
    title: string;
    icon: React.ReactNode;
    stats: Stats;
    accent: string;
  }) => {
    const acceptRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className={accent}>{icon}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total prompts</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.success}</div>
              <div className="text-xs text-muted-foreground">Successful ({acceptRate}%)</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <div className="text-xs text-muted-foreground">Unique users</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{stats.last7d}</div>
              <div className="text-xs text-muted-foreground">Last 7 days</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{stats.last30d}</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{stats.forced}</div>
              <div className="text-xs text-muted-foreground">Forced (admin tests)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            App Store Review Prompts
          </h3>
          <p className="text-sm text-muted-foreground">
            Tracks every native review request fired by the app. Note: native APIs do not report
            whether the user actually rated — "successful" means the prompt was triggered without error.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatBlock
          title="iOS (App Store)"
          icon={<Apple className="h-5 w-5" />}
          stats={ios}
          accent="text-zinc-700"
        />
        <StatBlock
          title="Android (Play Store)"
          icon={<Smartphone className="h-5 w-5" />}
          stats={android}
          accent="text-emerald-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent prompts</CardTitle>
          <CardDescription>Latest 25 review requests across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No review prompts logged yet.</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              {recent.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={r.platform === 'ios' ? 'secondary' : 'default'}>
                      {r.platform}
                    </Badge>
                    {r.success ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                        success
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        failed
                      </Badge>
                    )}
                    {r.forced && <Badge variant="outline">forced</Badge>}
                    <span className="truncate text-muted-foreground">
                      {r.trigger_source ?? '—'}
                      {r.app_version ? ` · v${r.app_version}` : ''}
                      {r.error_message ? ` · ${r.error_message}` : ''}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
