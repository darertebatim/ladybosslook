import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw } from 'lucide-react';

const SOURCES = ['sixtraps_registration', 'presixtraps_interest'];

interface Row {
  id: string;
  email: string;
  name: string | null;
  city: string | null;
  source: string | null;
  submitted_at: string;
}

export function SixTrapsSignups() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sixtraps-signups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, email, name, city, source, submitted_at')
        .in('source', SOURCES)
        .order('submitted_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const rows = data || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const registrations = rows.filter((r) => r.source === 'sixtraps_registration').length;
  const preInterest = rows.filter((r) => r.source === 'presixtraps_interest').length;

  function exportCsv() {
    const header = 'email,name,city,source,submitted_at';
    const body = filtered
      .map((r) =>
        [r.email, r.name || '', r.city || '', r.source || '', r.submitted_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sixtraps-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total signups</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Full registration</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{registrations}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pre-webinar email</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{preInterest}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>6 Traps Webinar Signups</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, name, city"
              className="w-56"
            />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signups found.</p>
          ) : (
            <div className="max-h-[520px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Email</th>
                    <th className="p-2 font-medium">Name</th>
                    <th className="p-2 font-medium">City</th>
                    <th className="p-2 font-medium">Source</th>
                    <th className="p-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{r.email}</td>
                      <td className="p-2">{r.name || '—'}</td>
                      <td className="p-2">{r.city || '—'}</td>
                      <td className="p-2">
                        <Badge variant="secondary">
                          {r.source === 'sixtraps_registration' ? 'Registration' : 'Pre-webinar'}
                        </Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {new Date(r.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}