import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { startOfMonth } from 'date-fns';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDateStr } from '@/lib/localDate';
import { csvCell } from '@/lib/csvSafe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ExpenseReport {
  account: { name: string; currency: string; timezone_name: string };
  campaigns: { campaign_id: string; campaign_name: string; spend: string }[];
  total: number;
  since: string;
  until: string;
  fetchedAt: string;
}

export function MetaAdExpenses() {
  const [since, setSince] = useState(() => getLocalDateStr(startOfMonth(new Date())));
  const [until, setUntil] = useState(() => getLocalDateStr());
  const validRange = Boolean(since && until && since <= until);
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['meta-ad-expenses', since, until],
    enabled: validRange,
    staleTime: 15 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<ExpenseReport> => {
      const { data: report, error: failure } = await supabase.functions.invoke('meta-ad-expenses', { body: { since, until } });
      if (failure) {
        if (failure instanceof FunctionsHttpError) {
          const body = await failure.context.json().catch(() => null);
          throw new Error(body?.error ?? failure.message);
        }
        throw failure;
      }
      return report;
    },
  });
  const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: data?.account.currency ?? 'USD' }).format(amount);
  const exportCsv = () => {
    if (!data) return;
    const rows = [['Campaign', 'Spend', 'Currency', 'From', 'To'], ...data.campaigns.map(row => [row.campaign_name, row.spend, data.account.currency, data.since, data.until])];
    const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad-expenses-${data.since}-${data.until}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5"><Label htmlFor="expense-since">From</Label><Input id="expense-since" type="date" value={since} onChange={e => setSince(e.target.value)} className="w-44" /></div>
        <div className="space-y-1.5"><Label htmlFor="expense-until">To</Label><Input id="expense-until" type="date" value={until} onChange={e => setUntil(e.target.value)} className="w-44" /></div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" aria-label="Refresh expenses" title="Refresh expenses" disabled={isFetching || !validRange} onClick={() => refetch()}><RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /></Button>
        <Button variant="outline" disabled={!data || !!error || isFetching} onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>
    </div>
    {!validRange && <p className="text-destructive" role="alert">Choose a start date on or before the end date.</p>}
    {error && <div role="alert" className="space-y-2"><p className="text-destructive">{error.message}</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>}
    {isFetching && !data && <div className="flex items-center gap-2 py-8"><Loader2 className="h-5 w-5 animate-spin" />Loading ad expenses…</div>}
    {data && !error && validRange && <>
      <div className="border-b pb-6">
        <p className="text-sm text-muted-foreground">Facebook & Instagram ad spend</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{money(data.total)} <span className="text-sm font-normal text-muted-foreground">{data.account.currency}</span></p>
        <p className="mt-2 text-sm text-muted-foreground">{data.account.name} · {data.account.timezone_name}</p>
        <p className="mt-1 text-sm text-muted-foreground">Reported ad spend, not billing charges or taxes. Updated {new Date(data.fetchedAt).toLocaleString()}.</p>
      </div>
      <div className="overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead className="text-right">Ad spend ({data.account.currency})</TableHead></TableRow></TableHeader>
        <TableBody>{data.campaigns.length === 0 ? <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No ad spend recorded for these dates.</TableCell></TableRow> : data.campaigns.map(row => <TableRow key={row.campaign_id}><TableCell className="font-medium">{row.campaign_name}</TableCell><TableCell className="text-right tabular-nums">{money(Number(row.spend))}</TableCell></TableRow>)}</TableBody>
      </Table></div>
    </>}
  </div>;
}