import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SubmissionRow {
  email: string | null;
  source: string | null;
  round_id: string | null;
}

interface RoundRow {
  id: string;
  round_name: string | null;
  first_session_date: string | null;
}

const WEBINARS = [
  {
    key: 'sixtraps',
    label: '6 Traps',
    regSource: 'sixtraps_registration',
    interestSource: 'presixtraps_interest',
  },
  {
    key: 'smartig',
    label: 'Smart Instagram Framework',
    regSource: 'smartinsta_registration',
    interestSource: null as string | null,
  },
];

export function WebinarStats() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['webinar-stats-submissions'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const all: SubmissionRow[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('email, source, round_id')
          .in('source', [
            'sixtraps_registration',
            'presixtraps_interest',
            'smartinsta_registration',
          ])
          .range(from, from + 999);
        if (error) throw error;
        all.push(...((data as SubmissionRow[]) || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      return all;
    },
  });

  const { data: rounds } = useQuery({
    queryKey: ['webinar-stats-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, first_session_date')
        .order('first_session_date', { ascending: true });
      if (error) throw error;
      return (data as RoundRow[]) || [];
    },
  });

  const stats = useMemo(() => {
    if (!submissions) return [];
    return WEBINARS.map((w) => {
      const regs = submissions.filter((s) => s.source === w.regSource);
      const interest = w.interestSource
        ? submissions.filter((s) => s.source === w.interestSource)
        : [];

      // unique emails per round (null round_id = untagged)
      const byRound = new Map<string | null, Set<string>>();
      for (const r of regs) {
        const email = (r.email || '').toLowerCase().trim();
        if (!email) continue;
        const key = r.round_id || null;
        if (!byRound.has(key)) byRound.set(key, new Set());
        byRound.get(key)!.add(email);
      }

      const roundEntries = [...byRound.entries()]
        .map(([roundId, emails]) => {
          const round = rounds?.find((r) => r.id === roundId);
          return {
            roundId,
            name: round?.round_name || (roundId ? 'Unknown round' : 'No round tag'),
            date: round?.first_session_date || null,
            count: emails.size,
            interest: w.interestSource
              ? new Set(
                  interest
                    .filter((i) => (i.round_id || null) === roundId)
                    .map((i) => (i.email || '').toLowerCase().trim())
                    .filter(Boolean)
                ).size
              : 0,
          };
        })
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      const total = new Set(
        regs.map((r) => (r.email || '').toLowerCase().trim()).filter(Boolean)
      ).size;

      return { ...w, roundEntries, total };
    });
  }, [submissions, rounds]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webinar Signup Numbers</CardTitle>
        <p className="text-sm text-muted-foreground">
          Unique emails per round, live from form submissions.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        )}
        {stats.map((w) => (
          <div key={w.key} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{w.label}</h3>
              <Badge variant="secondary">Total: {w.total}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Session date</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  {w.interestSource && (
                    <TableHead className="text-right">Prereq video interest</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {w.roundEntries.map((r) => (
                  <TableRow key={r.roundId ?? 'untagged'}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      {r.date
                        ? new Date(r.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{r.count}</TableCell>
                    {w.interestSource && (
                      <TableCell className="text-right">{r.interest}</TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{w.total}</TableCell>
                  {w.interestSource && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
