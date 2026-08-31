import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, RefreshCw } from 'lucide-react';
import type { LeadCampaign } from '@/lib/leadCampaigns';

interface Row {
  id: string;
  email: string;
  name: string | null;
  city: string | null;
  source: string | null;
  submitted_at: string;
  round_id: string | null;
}

interface RoundRow {
  id: string;
  round_name: string | null;
  first_session_date: string | null;
}

export function GenericWebinarSignups({ campaign }: { campaign: LeadCampaign }) {
  const [search, setSearch] = useState('');
  const [roundFilter, setRoundFilter] = useState('all');

  const sources = [campaign.regSource, ...campaign.extraSources];

  const { data: rows, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['generic-signups', campaign.key],
    queryFn: async () => {
      const all: Row[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('id, email, name, city, source, submitted_at, round_id')
          .in('source', sources)
          .order('submitted_at', { ascending: false })
          .range(from, from + 999);
        if (error) throw error;
        all.push(...((data as Row[]) || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      return all;
    },
  });

  const { data: rounds } = useQuery({
    queryKey: ['generic-signups-rounds', campaign.programSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, first_session_date')
        .eq('program_slug', campaign.programSlug)
        .order('first_session_date', { ascending: true });
      if (error) throw error;
      return (data as RoundRow[]) || [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (rows || []).filter((r) => {
      if (roundFilter !== 'all' && (r.round_id || 'none') !== roundFilter) return false;
      if (!q) return true;
      return (
        (r.email || '').toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, roundFilter]);

  const exportCsv = () => {
    const header = 'email,name,city,source,round,submitted_at\n';
    const body = filtered
      .map((r) => {
        const round = rounds?.find((x) => x.id === r.round_id)?.round_name || '';
        return [r.email, r.name || '', r.city || '', r.source || '', round, r.submitted_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      })
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.key}-signups.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{campaign.label} signups</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filtered.length} rows</Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search email, name, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={roundFilter} onValueChange={setRoundFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rounds</SelectItem>
              <SelectItem value="none">No round tag</SelectItem>
              {(rounds || []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.round_name || r.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 500).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.email}</TableCell>
                  <TableCell>{r.name || '—'}</TableCell>
                  <TableCell>{r.city || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.source}</TableCell>
                  <TableCell className="text-xs">
                    {rounds?.find((x) => x.id === r.round_id)?.round_name || '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(r.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 500 && (
          <p className="text-xs text-muted-foreground">
            Showing first 500 rows — export CSV for the full list.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
