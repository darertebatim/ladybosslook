import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, MessageSquare, Activity, BookOpen, Wind, Brain, Heart, Timer, Sparkles, Globe, Languages } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Range = '24h' | '7d' | '30d' | '90d';

const rangeToHours: Record<Range, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  '90d': 24 * 90,
};

function sinceDate(range: Range) {
  return new Date(Date.now() - rangeToHours[range] * 60 * 60 * 1000).toISOString();
}

function StatCard({ icon: Icon, label, value, sub, accent = 'primary' }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-${accent}/10 text-${accent} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-2xl font-bold leading-tight">{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

function FunnelBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {count.toLocaleString()} <span className="text-xs">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState<Range>('30d');
  const since = sinceDate(range);

  // ===== Onboarding Funnel =====
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['admin-analytics-funnel', range],
    queryFn: async () => {
      const [installs, onboardingStarts, onboardingDones, signups, subs] = await Promise.all([
        supabase.from('app_installations').select('id', { count: 'exact', head: true }).gte('installed_at', since),
        supabase.from('onboarding_answers').select('user_id', { count: 'exact', head: true }).gte('created_at', since),
        // Approximate "completed" = users who answered the LAST step (we use distinct count of users with answers)
        supabase.from('onboarding_answers').select('user_id').gte('created_at', since),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .gte('created_at', since)
          .eq('status', 'completed'),
      ]);

      const distinctOnboardingUsers = new Set(
        (onboardingDones.data || []).map((r: any) => r.user_id)
      ).size;

      return {
        installs: installs.count ?? 0,
        onboardingStarts: onboardingStarts.count ?? 0,
        onboardingUsers: distinctOnboardingUsers,
        signups: signups.count ?? 0,
        purchases: subs.count ?? 0,
      };
    },
  });

  // ===== Active Users / Engagement =====
  const { data: engagement, isLoading: engLoading } = useQuery({
    queryKey: ['admin-analytics-engagement', range],
    queryFn: async () => {
      const day1 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const day30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [dau, wau, mau, returns, totalUsers] = await Promise.all([
        supabase.from('app_return_events').select('user_id').gte('created_at', day1),
        supabase.from('app_return_events').select('user_id').gte('created_at', day7),
        supabase.from('app_return_events').select('user_id').gte('created_at', day30),
        supabase.from('app_return_events').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      return {
        dau: new Set((dau.data || []).map((r: any) => r.user_id)).size,
        wau: new Set((wau.data || []).map((r: any) => r.user_id)).size,
        mau: new Set((mau.data || []).map((r: any) => r.user_id)).size,
        returnsInRange: returns.count ?? 0,
        totalUsers: totalUsers.count ?? 0,
      };
    },
  });

  // ===== Tool Usage =====
  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ['admin-analytics-tools', range],
    queryFn: async () => {
      const [breath, focus, emotions, journal, fasting, audio] = await Promise.all([
        supabase.from('breathing_sessions').select('id', { count: 'exact', head: true }).gte('completed_at', since),
        supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).gte('started_at', since),
        supabase.from('emotion_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('fasting_sessions').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('audio_progress').select('id', { count: 'exact', head: true }).gte('last_played_at', since),
      ]);

      return [
        { label: 'Breathe sessions', count: breath.count ?? 0, icon: Wind },
        { label: 'Focus sessions', count: focus.count ?? 0, icon: Timer },
        { label: 'Emotion logs', count: emotions.count ?? 0, icon: Heart },
        { label: 'Journal entries', count: journal.count ?? 0, icon: BookOpen },
        { label: 'Fasting sessions', count: fasting.count ?? 0, icon: Sparkles },
        { label: 'Audio plays', count: audio.count ?? 0, icon: Activity },
      ].sort((a, b) => b.count - a.count);
    },
  });

  // ===== Quiz answer breakdown (Self-Care Quiz) =====
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['admin-analytics-quiz', range],
    queryFn: async () => {
      const { data } = await supabase
        .from('onboarding_answers')
        .select('flow_id, step_id, answer, user_id')
        .eq('flow_id', 'selfcare-quiz')
        .gte('created_at', since)
        .limit(1000);

      const byStep: Record<string, Record<string, number>> = {};
      const usersByStep: Record<string, Set<string>> = {};
      (data || []).forEach((row: any) => {
        const step = row.step_id;
        const ans = Array.isArray(row.answer) ? row.answer : [row.answer];
        if (!byStep[step]) byStep[step] = {};
        if (!usersByStep[step]) usersByStep[step] = new Set();
        usersByStep[step].add(row.user_id);
        ans.forEach((a: any) => {
          const key = String(a).slice(0, 60);
          byStep[step][key] = (byStep[step][key] || 0) + 1;
        });
      });

      return Object.entries(byStep).map(([step, answers]) => ({
        step,
        users: usersByStep[step].size,
        top: Object.entries(answers)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
      }));
    },
  });

  // ===== User breakdown (facets) =====
  const { data: userBreakdown, isLoading: userBreakdownLoading } = useQuery({
    queryKey: ['admin-analytics-user-breakdown'],
    queryFn: async () => {
      // Page through profiles to get facet fields
      const pageSize = 1000;
      let from = 0;
      const all: Array<{ id: string; timezone: string | null; preferred_language: string | null; country: string | null; gender: string | null }> = [];
      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, timezone, preferred_language, country, gender')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as any));
        if (data.length < pageSize) break;
        from += pageSize;
      }

      const tally = (key: 'timezone' | 'preferred_language' | 'country' | 'gender') => {
        const map = new Map<string, number>();
        for (const r of all) {
          const v = (r[key] || '— unknown —').toString().trim() || '— unknown —';
          map.set(v, (map.get(v) || 0) + 1);
        }
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      };

      // Engagement signals — distinct user_ids per table
      const fetchDistinctUsers = async (table: string, column = 'user_id') => {
        const ids = new Set<string>();
        let f = 0;
        while (true) {
          const { data, error } = await supabase
            .from(table as any)
            .select(column)
            .range(f, f + pageSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          for (const row of data as any[]) if (row[column]) ids.add(row[column]);
          if (data.length < pageSize) break;
          f += pageSize;
          if (f > 100000) break; // safety
        }
        return ids;
      };

      const [audio, breath, focus, emo, reflections, fasting, journal, subs, orders, onb] = await Promise.all([
        fetchDistinctUsers('audio_progress'),
        fetchDistinctUsers('breathing_sessions'),
        fetchDistinctUsers('focus_sessions'),
        fetchDistinctUsers('emotion_logs'),
        fetchDistinctUsers('free_form_reflections'),
        fetchDistinctUsers('fasting_sessions'),
        fetchDistinctUsers('journal_entries'),
        fetchDistinctUsers('user_subscriptions'),
        fetchDistinctUsers('orders'),
        fetchDistinctUsers('onboarding_answers'),
      ]);

      return {
        total: all.length,
        byTimezone: tally('timezone'),
        byLanguage: tally('preferred_language'),
        byCountry: tally('country'),
        byGender: tally('gender'),
        engagement: [
          { label: 'Listened to any audio', count: audio.size, icon: Activity },
          { label: 'Did a breathing session', count: breath.size, icon: Wind },
          { label: 'Did a focus session', count: focus.size, icon: Timer },
          { label: 'Logged an emotion', count: emo.size, icon: Heart },
          { label: 'Wrote a reflection', count: reflections.size, icon: BookOpen },
          { label: 'Wrote a journal entry', count: journal.size, icon: BookOpen },
          { label: 'Tracked fasting', count: fasting.size, icon: Sparkles },
          { label: 'Had a subscription', count: subs.size, icon: Sparkles },
          { label: 'Placed an order', count: orders.size, icon: TrendingUp },
          { label: 'Answered onboarding', count: onb.size, icon: Brain },
        ],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const funnelMax = funnel?.installs || funnel?.onboardingStarts || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            User behavior, onboarding funnel, and engagement — pulled from your own database.
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {engLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <StatCard icon={Users} label="Total users" value={(engagement?.totalUsers ?? 0).toLocaleString()} />
            <StatCard icon={Activity} label="DAU" value={engagement?.dau ?? 0} sub="active in last 24h" />
            <StatCard icon={TrendingUp} label="WAU" value={engagement?.wau ?? 0} sub="active in last 7d" />
            <StatCard icon={MessageSquare} label="MAU" value={engagement?.mau ?? 0} sub="active in last 30d" />
          </>
        )}
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Onboarding funnel</TabsTrigger>
          <TabsTrigger value="tools">Tool usage</TabsTrigger>
          <TabsTrigger value="quiz">Self-care quiz</TabsTrigger>
          <TabsTrigger value="users">User breakdown</TabsTrigger>
        </TabsList>

        {/* === Funnel === */}
        <TabsContent value="funnel" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Acquisition → Activation funnel</h2>
              <p className="text-sm text-muted-foreground">
                How users move from install to paid subscriber.
              </p>
            </div>
            {funnelLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <FunnelBar label="App installs" count={funnel?.installs ?? 0} max={funnelMax} />
                <FunnelBar label="Onboarding events" count={funnel?.onboardingStarts ?? 0} max={funnelMax} />
                <FunnelBar label="Users who answered onboarding" count={funnel?.onboardingUsers ?? 0} max={funnelMax} />
                <FunnelBar label="Signups (new profiles)" count={funnel?.signups ?? 0} max={funnelMax} />
                <FunnelBar label="Completed purchases" count={funnel?.purchases ?? 0} max={funnelMax} />
              </div>
            )}
          </Card>

          <Card className="p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              💡 For attribution (which ad source brought the user) check <strong>AppsFlyer</strong>.
              For detailed event-by-event funnels with drop-off per step, check <strong>Firebase Analytics</strong>.
              This page shows what's stored directly in your Supabase database.
            </p>
          </Card>
        </TabsContent>

        {/* === Tool usage === */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {toolsLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : (
              tools?.map((t) => (
                <StatCard key={t.label} icon={t.icon} label={t.label} value={t.count.toLocaleString()} />
              ))
            )}
          </div>
        </TabsContent>

        {/* === Quiz === */}
        <TabsContent value="quiz" className="space-y-4">
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" /> Self-Care Quiz answers
              </h2>
              <p className="text-sm text-muted-foreground">
                Top 5 answers per question (last {range}).
              </p>
            </div>
            {quizLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : !quiz || quiz.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No quiz answers in this period yet.</p>
            ) : (
              <div className="space-y-5">
                {quiz.map((q) => {
                  const stepMax = q.top[0]?.[1] ?? 1;
                  return (
                    <div key={q.step} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{q.step}</h3>
                        <span className="text-xs text-muted-foreground">{q.users} users</span>
                      </div>
                      <div className="space-y-1.5">
                        {q.top.map(([answer, count]) => (
                          <FunnelBar key={answer} label={answer} count={count as number} max={stepMax} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* === User breakdown === */}
        <TabsContent value="users" className="space-y-4">
          {userBreakdownLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : !userBreakdown ? null : (
            <>
              <Card className="p-6 space-y-3">
                <div>
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Engagement
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Distinct users who ever used each feature. Total users: {userBreakdown.total.toLocaleString()}.
                  </p>
                </div>
                <div className="space-y-2">
                  {userBreakdown.engagement.map((e) => (
                    <FunnelBar
                      key={e.label}
                      label={e.label}
                      count={e.count}
                      max={userBreakdown.total}
                    />
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FacetCard title="By timezone" icon={Globe} rows={userBreakdown.byTimezone} total={userBreakdown.total} />
                <FacetCard title="By preferred language" icon={Languages} rows={userBreakdown.byLanguage} total={userBreakdown.total} />
                <FacetCard title="By country" icon={Globe} rows={userBreakdown.byCountry} total={userBreakdown.total} />
                <FacetCard title="By gender" icon={Users} rows={userBreakdown.byGender} total={userBreakdown.total} />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FacetCard({
  title,
  icon: Icon,
  rows,
  total,
  limit = 15,
}: {
  title: string;
  icon: any;
  rows: Array<[string, number]>;
  total: number;
  limit?: number;
}) {
  const top = rows.slice(0, limit);
  const max = top[0]?.[1] ?? 1;
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
        </h3>
        <span className="text-xs text-muted-foreground">{rows.length} groups</span>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No data.</p>
      ) : (
        <div className="space-y-1.5">
          {top.map(([label, count]) => (
            <FunnelBarSmall key={label} label={label} count={count} max={max} total={total} />
          ))}
        </div>
      )}
    </Card>
  );
}

function FunnelBarSmall({ label, count, max, total }: { label: string; count: number; max: number; total: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const sharePct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="font-medium truncate">{label}</span>
        <span className="tabular-nums text-muted-foreground shrink-0">
          {count.toLocaleString()} <span className="opacity-70">({sharePct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
