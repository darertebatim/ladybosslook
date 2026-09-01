import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Clock, Globe } from 'lucide-react';
import { ROUND_1_TIMEZONE_LIST, ROUND_2_TIMEZONE_LIST } from '@/lib/webinarRounds';

interface RoundRow {
  id: string;
  round_number: number | null;
  round_name: string | null;
  first_session_date: string | null;
  status: string | null;
  google_meet_link: string | null;
}

interface Props {
  programSlug: string;
  sources: string[];
}

const tzLabel = (tz: string) => tz.replace('America/', '').replace(/_/g, ' ');

export function WebinarRoundBreakdown({ programSlug, sources }: Props) {
  const {
    data: rounds,
    refetch: refetchRounds,
    isFetching: fetchingRounds,
  } = useQuery({
    queryKey: ['round-breakdown-rounds', programSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_number, round_name, first_session_date, status, google_meet_link')
        .eq('program_slug', programSlug)
        .order('round_number', { ascending: true });
      if (error) throw error;
      return (data || []) as RoundRow[];
    },
  });

  const { data: signups, refetch: refetchSignups } = useQuery({
    queryKey: ['round-breakdown-signups', programSlug, sources.join(',')],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('email, round_id')
        .in('source', sources)
        .limit(5000);
      if (error) throw error;
      return (data || []) as { email: string; round_id: string | null }[];
    },
  });

  const counts = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of signups || []) {
      const key = s.round_id || 'none';
      const email = String(s.email || '').trim().toLowerCase();
      if (!email) continue;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(email);
    }
    return map;
  }, [signups]);

  const totalUnique = useMemo(() => {
    const set = new Set<string>();
    for (const s of signups || []) {
      const e = String(s.email || '').trim().toLowerCase();
      if (e) set.add(e);
    }
    return set.size;
  }, [signups]);

  const activeRounds = (rounds || []).filter((r) => r.status === 'active');
  const noRoundCount = counts.get('none')?.size || 0;

  const tzFor = (roundNumber: number | null) => {
    if (roundNumber === 1) return ROUND_1_TIMEZONE_LIST as readonly string[];
    if (roundNumber === 2) return ROUND_2_TIMEZONE_LIST as readonly string[];
    return [];
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Signups per round (timezone routing)</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalUnique} unique signups</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchRounds();
                refetchSignups();
              }}
              disabled={fetchingRounds}
            >
              <RefreshCw className={`h-4 w-4 ${fetchingRounds ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRounds.length === 0 && (
          <p className="text-sm text-muted-foreground">No active rounds for “{programSlug}”.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {activeRounds.map((r) => {
            const zones = tzFor(r.round_number);
            return (
              <div key={r.id} className="rounded-xl border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      Round {r.round_number ?? '?'} — {r.round_name || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {r.first_session_date
                        ? new Date(r.first_session_date).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'No date set'}
                    </p>
                  </div>
                  <Badge className="shrink-0">
                    <Users className="mr-1 h-3 w-3" />
                    {counts.get(r.id)?.size || 0}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="flex items-center gap-1 font-medium text-foreground">
                    <Globe className="h-3 w-3" />
                    {r.round_number === 1
                      ? 'East / Central timezones'
                      : r.round_number === 2
                        ? 'West timezones'
                        : 'No automatic timezone routing'}
                  </p>
                  {zones.length > 0 && (
                    <p className="mt-1 leading-relaxed">
                      {zones.slice(0, 8).map(tzLabel).join(' · ')}
                      {zones.length > 8 ? ` · +${zones.length - 8} more` : ''}
                    </p>
                  )}
                </div>

                {!r.google_meet_link && (
                  <p className="text-xs text-destructive">⚠ No Google Meet link set on this round.</p>
                )}
              </div>
            );
          })}
        </div>

        {noRoundCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {noRoundCount} signup(s) have no round tag (registered before timezone routing, or an
            unmatched timezone with no manual pick).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
