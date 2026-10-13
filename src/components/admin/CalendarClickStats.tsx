import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Row { calendar: string; page: string; round_id: string | null; email: string | null }

export function CalendarClickStats() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['webinar-calendar-clicks'],
    queryFn: async () => {
      const all: Row[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await (supabase as any)
          .from('webinar_calendar_clicks')
          .select('calendar, page, round_id, email')
          .range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      return all;
    },
  });

  const { data: rounds = [] } = useQuery({
    queryKey: ['webinar-stats-rounds-names'],
    queryFn: async () => {
      const { data } = await supabase.from('program_rounds').select('id, round_name, first_session_date');
      return data || [];
    },
  });

  const groups = useMemo(() => {
    const m = new Map<string, { page: string; roundId: string | null; google: number; apple: number; people: Set<string> }>();
    for (const r of rows) {
      const key = `${r.page}|${r.round_id || ''}`;
      if (!m.has(key)) m.set(key, { page: r.page, roundId: r.round_id, google: 0, apple: 0, people: new Set() });
      const g = m.get(key)!;
      if (r.calendar === 'google') g.google++; else g.apple++;
      if (r.email) g.people.add(r.email);
    }
    return [...m.values()].map((g) => {
      const round = rounds.find((x: any) => x.id === g.roundId) as any;
      return { ...g, roundName: round?.round_name || (g.roundId ? 'Unknown round' : 'No round'), date: round?.first_session_date || '' };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [rows, rounds]);

  const google = rows.filter((r) => r.calendar === 'google').length;
  const people = new Set(rows.map((r) => r.email).filter(Boolean)).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Adds</CardTitle>
        <p className="text-sm text-muted-foreground">
          Taps on "Add to calendar" buttons on thank-you pages. Total {rows.length} · Google {google} · Apple {rows.length - google} · {people} unique people.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No calendar taps recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Round</TableHead>
                <TableHead className="text-right">Google</TableHead>
                <TableHead className="text-right">Apple</TableHead>
                <TableHead className="text-right">Unique people</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={`${g.page}|${g.roundId}`}>
                  <TableCell className="font-mono text-xs">{g.page}</TableCell>
                  <TableCell>{g.roundName}</TableCell>
                  <TableCell className="text-right">{g.google}</TableCell>
                  <TableCell className="text-right">{g.apple}</TableCell>
                  <TableCell className="text-right font-semibold">{g.people.size}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
