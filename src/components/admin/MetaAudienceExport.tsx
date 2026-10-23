import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2 } from 'lucide-react';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';
import { csvCell } from '@/lib/csvSafe';
import { buildMetaAudienceRows } from '@/lib/metaAudienceCsv';

const BUYER_PROGRAMS = [
  { key: 'buyers:casigads', slug: 'casigads', label: 'Customer Acquisition (buyers & students)' },
  { key: 'buyers:smartig', slug: 'smartig', label: 'Smart IG (buyers & students)' },
];

type Person = { email: string | null; name: string | null; city: string | null };

async function fetchProgramPeople(slug: string): Promise<Person[]> {
  const out: Person[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('orders')
      .select('email, name')
      .eq('program_slug', slug)
      .in('status', ['paid', 'completed', 'partially_refunded'])
      .range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []).map((o: any) => ({ email: o.email, name: o.name, city: null })));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const ids: string[] = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('user_id')
      .eq('program_slug', slug)
      .range(from, from + 999);
    if (error) throw error;
    ids.push(...(data || []).map((e: any) => e.user_id).filter(Boolean));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, full_name, city')
      .in('id', unique.slice(i, i + 200));
    if (error) throw error;
    out.unshift(...(data || []).map((p: any) => ({ email: p.email, name: p.full_name, city: p.city })));
  }
  return out;
}

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
      const all: Person[] = [];
      for (const p of BUYER_PROGRAMS) {
        if (selected.includes(p.key)) all.push(...(await fetchProgramPeople(p.slug)));
      }
      let from = 0;
      while (sources.length) {
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
      // Include merged-account emails: when a collected email is an alias (or the
      // primary of one), also add the counterpart address so the person matches
      // under either email in Meta.
      try {
        const { data: aliases } = await supabase
          .from('account_email_aliases')
          .select('email, primary_user_id');
        if (aliases && aliases.length) {
          const ids = [...new Set(aliases.map((a: any) => a.primary_user_id).filter(Boolean))] as string[];
          const profMap = new Map<string, { email: string | null; full_name: string | null; city: string | null }>();
          for (let i = 0; i < ids.length; i += 200) {
            const { data: profs, error } = await supabase
              .from('profiles')
              .select('id, email, full_name, city')
              .in('id', ids.slice(i, i + 200));
            if (error) throw error;
            (profs || []).forEach((p: any) => profMap.set(p.id, p));
          }
          const collected = new Set(
            all.map((p) => (p.email || '').trim().toLowerCase()).filter(Boolean),
          );
          for (const a of aliases) {
            const aliasEmail = (a.email || '').trim().toLowerCase();
            const prof = profMap.get(a.primary_user_id);
            const primaryEmail = (prof?.email || '').trim().toLowerCase();
            if (!aliasEmail || !primaryEmail || aliasEmail === primaryEmail) continue;
            if (collected.has(aliasEmail) && !collected.has(primaryEmail)) {
              all.push({ email: primaryEmail, name: prof?.full_name || null, city: prof?.city || null });
              collected.add(primaryEmail);
            }
            if (collected.has(primaryEmail) && !collected.has(aliasEmail)) {
              all.push({ email: aliasEmail, name: prof?.full_name || null, city: prof?.city || null });
              collected.add(aliasEmail);
            }
          }
        }
      } catch (aliasErr) {
        console.warn('Alias expansion skipped:', aliasErr);
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
              {c.label}
            </Badge>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Program buyers & students</p>
          <div className="flex flex-wrap gap-2">
            {BUYER_PROGRAMS.map((p) => (
              <Badge
                key={p.key}
                variant={selected.includes(p.key) ? 'default' : 'outline'}
                className="cursor-pointer select-none px-3 py-1"
                onClick={() => toggle(p.key)}
              >
                {p.label}
              </Badge>
            ))}
          </div>
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
