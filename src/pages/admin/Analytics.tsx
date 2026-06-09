import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, MessageSquare, Activity, BookOpen, Wind, Brain, Heart, Timer, Sparkles, Globe, Languages, CheckCircle2, Headphones, CalendarCheck, ShoppingBag, Crown, RefreshCw, Smartphone, LogIn, ListChecks, DoorOpen } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

  const funnelMax = funnel?.installs || funnel?.onboardingStarts || 1;

  // ===== User breakdown (manual refresh, server-side aggregation) =====
  // We do NOT fetch automatically — the RPC scans every table, so we let the
  // admin trigger it explicitly to keep page load fast and numbers fresh.
  const {
    data: userBreakdown,
    isFetching: userBreakdownLoading,
    refetch: refetchUserBreakdown,
    dataUpdatedAt: userBreakdownUpdatedAt,
    error: userBreakdownError,
  } = useQuery<any>({
    queryKey: ['admin-analytics-user-breakdown-rpc'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_breakdown' as any);
      if (error) throw error;
      return data as any;
    },
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const handleRefreshUserBreakdown = async () => {
    try {
      await refetchUserBreakdown({ throwOnError: true });
      toast.success('Analytics refreshed');
    } catch (e: any) {
      toast.error(`Failed: ${e?.message || 'unknown error'}`);
    }
  };

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
          <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <h2 className="font-semibold text-base">User breakdown</h2>
              <p className="text-xs text-muted-foreground">
                Server-side aggregation across every table — bulletproof but heavy. Refresh on demand.
                {userBreakdownUpdatedAt > 0 && (
                  <> Last refreshed: {new Date(userBreakdownUpdatedAt).toLocaleTimeString()}.</>
                )}
              </p>
            </div>
            <Button
              onClick={handleRefreshUserBreakdown}
              disabled={userBreakdownLoading}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${userBreakdownLoading ? 'animate-spin' : ''}`} />
              {userBreakdownLoading ? 'Loading…' : (userBreakdown ? 'Refresh' : 'Load breakdown')}
            </Button>
          </Card>

          {userBreakdownError && (
            <Card className="p-4 border-destructive/40 bg-destructive/5">
              <p className="text-sm text-destructive">
                Failed to load: {(userBreakdownError as any)?.message || 'unknown error'}
              </p>
            </Card>
          )}

          {userBreakdownLoading && !userBreakdown && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          )}

          {userBreakdown && (() => {
            const total: number = userBreakdown.total ?? 0;
            const m = userBreakdown.milestones || {};
            const l = userBreakdown.lifetime || {};
            const moodSources: Array<{ source: string; logs: number; users: number }> = userBreakdown.mood_sources || [];

            const milestones = [
              { label: 'Completed 10+ tasks', count: m.tasks_10 ?? 0, icon: CheckCircle2 },
              { label: 'Logged mood 5+ times', count: m.mood_5 ?? 0, icon: Heart },
              { label: 'Listened 30+ min (event-based)', count: m.audio_30m ?? 0, icon: Headphones },
              { label: 'Played 5+ audio sessions', count: m.audio_5plays ?? 0, icon: Headphones },
              { label: 'Listened 30+ min (legacy progress)', count: m.audio_30m_legacy ?? 0, icon: Headphones },
              { label: 'Wrote 3+ free-form reflections', count: m.reflection_3 ?? 0, icon: BookOpen },
              { label: 'Wrote 3+ guided reflections', count: m.guided_reflection_3 ?? 0, icon: BookOpen },
              { label: 'Wrote 3+ journal entries', count: m.journal_3 ?? 0, icon: BookOpen },
              { label: 'Did 3+ breathing sessions', count: m.breath_3 ?? 0, icon: Wind },
              { label: 'Did 3+ focus sessions', count: m.focus_3 ?? 0, icon: Timer },
              { label: 'Active 7+ different days', count: m.active_7d ?? 0, icon: CalendarCheck },
            ];
            const lifetime = [
              { label: 'Any audio listened (events)', count: l.any_audio_event ?? 0, icon: Headphones },
              { label: 'Any audio progress (legacy)', count: l.any_audio_legacy ?? 0, icon: Headphones },
              { label: 'Any breathing session', count: l.any_breath ?? 0, icon: Wind },
              { label: 'Any focus session', count: l.any_focus ?? 0, icon: Timer },
              { label: 'Any mood check-in', count: l.any_mood ?? 0, icon: Heart },
              { label: 'Any emotion log (tool)', count: l.any_emotion ?? 0, icon: Heart },
              { label: 'Any free-form reflection', count: l.any_reflection ?? 0, icon: BookOpen },
              { label: 'Any guided reflection', count: l.any_guided_reflection ?? 0, icon: BookOpen },
              { label: 'Any journal entry', count: l.any_journal ?? 0, icon: BookOpen },
              { label: 'Answered onboarding', count: l.answered_onboarding ?? 0, icon: Brain },
              { label: 'Has subscription', count: l.has_subscription ?? 0, icon: Crown },
              { label: 'Made a purchase', count: l.made_purchase ?? 0, icon: ShoppingBag },
            ];

            const sourceLabel = (s: string) =>
              s === 'banner' ? 'Planner top banner (quick check-in)'
              : s === 'path' ? 'Mood page / My Rilo path'
              : 'Unknown / older logs';

            return (
              <>
                <Card className="p-6 space-y-3">
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Activation milestones
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Users who hit each meaningful threshold. Out of {total.toLocaleString()} total users.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {milestones.map((mi) => (
                      <FunnelBar key={mi.label} label={mi.label} count={mi.count} max={total} />
                    ))}
                  </div>
                </Card>

                <Card className="p-6 space-y-3">
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5" /> Mood check-in sources
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Where users logged their mood. Older check-ins (before this tag was added) show as Unknown.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {moodSources.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No mood check-ins yet.</p>
                    ) : (
                      moodSources.map((s) => (
                        <div key={s.source} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                          <span className="font-medium">{sourceLabel(s.source)}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {s.logs.toLocaleString()} logs · {s.users.toLocaleString()} users
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="p-6 space-y-3">
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" /> Lifetime engagement
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Distinct users who ever did each action.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {lifetime.map((e) => (
                      <FunnelBar key={e.label} label={e.label} count={e.count} max={total} />
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FacetCard title="By timezone" icon={Globe} rows={userBreakdown.by_timezone || []} total={total} />
                  <FacetCard title="By preferred language" icon={Languages} rows={userBreakdown.by_language || []} total={total} />
                  <FacetCard title="By country" icon={Globe} rows={userBreakdown.by_country || []} total={total} />
                  <FacetCard title="By gender" icon={Users} rows={userBreakdown.by_gender || []} total={total} />
                  <FacetCard title="By platform (iOS / Android / Web)" icon={Smartphone} rows={userBreakdown.by_platform || []} total={total} />
                  <FacetCard title="By sign-in provider" icon={LogIn} rows={userBreakdown.by_provider || []} total={total} />
                  <FacetCard title="By onboarding flow (users who answered)" icon={ListChecks} rows={userBreakdown.by_onboarding_flow || []} total={total} />
                  <FacetCard title="Rilo Doors — primary door" icon={DoorOpen} rows={userBreakdown.by_rilo_door_primary || []} total={total} />
                  <FacetCard title="Rilo Doors — secondary door" icon={DoorOpen} rows={userBreakdown.by_rilo_door_secondary || []} total={total} />
                </div>
              </>
            );
          })()}
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
          {top.map(([label, count]) => {
            const pct = max > 0 ? (count / max) * 100 : 0;
            const sharePct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={label} className="space-y-1">
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
          })}
        </div>
      )}
    </Card>
  );
}
