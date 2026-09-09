import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Users, Clock, Globe, Save } from 'lucide-react';
import { timezonesForRoundNumber, getWebinarRoundRouting, WebinarRoundRouting } from '@/lib/webinarRounds';

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
  const queryClient = useQueryClient();

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

  const { data: routing, isLoading: routingLoading } = useQuery({
    queryKey: ['webinar-round-routing', programSlug],
    queryFn: () => getWebinarRoundRouting(programSlug),
  });

  const [draftEast, setDraftEast] = useState<number | ''>('');
  const [draftWest, setDraftWest] = useState<number | ''>('');

  const activeRounds = (rounds || []).filter((r) => r.status === 'active');

  const saveRouting = useMutation({
    mutationFn: async (payload: { east: number; west: number }) => {
      const { error } = await supabase.from('webinar_round_routing').upsert(
        {
          program_slug: programSlug,
          east_round_number: payload.east,
          west_round_number: payload.west,
        },
        { onConflict: 'program_slug' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webinar-round-routing', programSlug] });
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

  const noRoundCount = counts.get('none')?.size || 0;

  const tzFor = (roundNumber: number | null) => timezonesForRoundNumber(roundNumber, routing);

  const currentEast = routing?.east_round_number ?? null;
  const currentWest = routing?.west_round_number ?? null;

  const eastValue = draftEast !== '' ? draftEast : currentEast ?? '';
  const westValue = draftWest !== '' ? draftWest : currentWest ?? '';

  const hasChanges =
    draftEast !== '' && draftEast !== (currentEast ?? '') ||
    draftWest !== '' && draftWest !== (currentWest ?? '');

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
        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Timezone routing</p>
            {routingLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">East / Central timezones → round</label>
              <Select
                value={String(eastValue)}
                onValueChange={(v) => setDraftEast(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a round" />
                </SelectTrigger>
                <SelectContent>
                  {activeRounds.map((r) => (
                    <SelectItem key={`east-${r.id}`} value={String(r.round_number ?? '')}>
                      Round {r.round_number ?? '?'} — {r.round_name || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">West timezones → round</label>
              <Select
                value={String(westValue)}
                onValueChange={(v) => setDraftWest(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a round" />
                </SelectTrigger>
                <SelectContent>
                  {activeRounds.map((r) => (
                    <SelectItem key={`west-${r.id}`} value={String(r.round_number ?? '')}>
                      Round {r.round_number ?? '?'} — {r.round_name || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!hasChanges || saveRouting.isPending || eastValue === '' || westValue === ''}
              onClick={() => {
                if (eastValue === '' || westValue === '') return;
                saveRouting.mutate({ east: Number(eastValue), west: Number(westValue) });
              }}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saveRouting.isPending ? 'Saving…' : 'Save routing'}
            </Button>
            {saveRouting.isSuccess && (
              <span className="text-xs text-green-600">Saved</span>
            )}
            {saveRouting.isError && (
              <span className="text-xs text-destructive">Failed to save</span>
            )}
          </div>
        </div>

        {activeRounds.length === 0 && (
          <p className="text-sm text-muted-foreground">No active rounds for “{programSlug}”.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {activeRounds.map((r) => {
            const zones = tzFor(r.round_number);
            const isEast = r.round_number === currentEast;
            const isWest = r.round_number === currentWest;
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
                    {isEast
                      ? 'East / Central timezones'
                      : isWest
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
