import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2 } from 'lucide-react';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';
import { csvCell } from '@/lib/csvSafe';
import { buildMetaAudienceRows } from '@/lib/metaAudienceCsv';

export function MetaAudienceExport() {
  const [selected, setSelected] = useState<string[]>(LEAD_CAMPAIGNS.map((c) => c.key));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) => {
    setResult(null);
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  };

  const prepare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const sources = LEAD_CAMPAIGNS.filter((c) => selected.includes(c.key)).flatMap((c) => [
        c.regSource,
        ...c.extraSources,
      ]);
      const all: { email: string | null; name: string | null; city: string | null }[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('email, name, city')
          .in('source', sources)
          .order('submitted_at', { ascending: false })
          .range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      const rows = buildMetaAudienceRows(all);
      const header = 'email,fn,ln,ct\n';
      const body = rows.map((r) => [r.email, r.fn, r.ln, r.ct].map((v) => csvCell(v)).join(',')).join('\n');
      setResult({ blob: new Blob([header + body], { type: 'text/csv;charset=utf-8' }), count: rows.length });
    } catch (e: any) {
      setError(e?.message || 'Could not load signups');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta-webinar-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export for Meta Ads (Customer List)</CardTitle>
        <CardDescription>
          One deduplicated CSV of webinar signups, formatted for Meta Custom Audiences. Test emails are removed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {LEAD_CAMPAIGNS.map((c) => (
            <Badge
              key={c.key}
              variant={selected.includes(c.key) ? 'default' : 'outline'}
              className="cursor-pointer select-none px-3 py-1"
              onClick={() => toggle(c.key)}
            >
              {c.label ?? c.key}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={prepare} disabled={loading || selected.length === 0} variant="outline">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Prepare list
          </Button>
          {result && (
            <Button onClick={download}>
              <Download className="mr-2 h-4 w-4" /> Download CSV ({result.count.toLocaleString()} people)
            </Button>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
