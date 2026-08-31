import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Link2, Mail, Target } from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_CAMPAIGNS, ALL_LEAD_SOURCES } from '@/lib/leadCampaigns';

interface SubRow {
  email: string | null;
  source: string | null;
  submitted_at: string | null;
  round_id: string | null;
}

interface RoundRow {
  id: string;
  program_slug: string | null;
  round_name: string | null;
  round_number: number | null;
  first_session_date: string | null;
  status: string | null;
}

function origin() {
  return 'https://ladybosslook.com';
}

export function LeadCampaignDirectory() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['lead-center-submissions'],
    staleTime: 60_000,
    queryFn: async () => {
      const all: SubRow[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('email, source, submitted_at, round_id')
          .in('source', ALL_LEAD_SOURCES)
          .range(from, from + 999);
        if (error) throw error;
        all.push(...((data as SubRow[]) || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      return all;
    },
  });

  const { data: rounds } = useQuery({
    queryKey: ['lead-center-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, program_slug, round_name, round_number, first_session_date, status')
        .order('first_session_date', { ascending: true });
      if (error) throw error;
      return (data as RoundRow[]) || [];
    },
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const cards = useMemo(() => {
    const now = Date.now();
    const week = now - 7 * 24 * 60 * 60 * 1000;
    return LEAD_CAMPAIGNS.map((c) => {
      const regs = (submissions || []).filter((s) => s.source === c.regSource);
      const uniq = new Set(
        regs.map((r) => (r.email || '').toLowerCase().trim()).filter(Boolean)
      );
      const last7 = new Set(
        regs
          .filter((r) => r.submitted_at && new Date(r.submitted_at).getTime() >= week)
          .map((r) => (r.email || '').toLowerCase().trim())
          .filter(Boolean)
      );
      const extras = (submissions || []).filter((s) =>
        c.extraSources.includes(s.source || '')
      ).length;
      const programRounds = (rounds || []).filter((r) => r.program_slug === c.programSlug);
      const nextRound = programRounds.find(
        (r) =>
          r.status === 'active' &&
          r.first_session_date &&
          new Date(r.first_session_date).getTime() > now
      );
      return { c, total: uniq.size, last7: last7.size, extras, programRounds, nextRound };
    });
  }, [submissions, rounds]);

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading campaigns…</p>}
      {cards.map(({ c, total, last7, extras, programRounds, nextRound }) => {
        const landing = `${origin()}${c.landingPath}`;
        const thankyou = `${origin()}${c.thankYouPath}`;
        return (
          <Card key={c.key}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-lg">{c.label}</CardTitle>
                {c.labelFa && (
                  <span className="text-sm text-muted-foreground" dir="rtl">
                    {c.labelFa}
                  </span>
                )}
                <Badge variant="secondary">{total} leads</Badge>
                <Badge variant="outline">{last7} last 7d</Badge>
                {extras > 0 && <Badge variant="outline">{extras} extra sources</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  { label: 'Landing page', url: landing },
                  { label: 'Thank-you page', url: thankyou },
                ].map((l) => (
                  <div
                    key={l.label}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{l.label}</p>
                      <p className="truncate font-mono text-xs">{l.url}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copy(l.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                      <a href={l.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" /> Meta event: {c.metaEvent}
                </Badge>
                <Badge variant="outline">Standard: Lead</Badge>
                {c.confirmationFunction && (
                  <Badge variant="outline" className="gap-1">
                    <Mail className="h-3 w-3" /> {c.confirmationFunction}
                  </Badge>
                )}
                <Badge variant="outline">source: {c.regSource}</Badge>
                {c.extraSources.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
                {c.emailOnly && <Badge variant="outline">email only</Badge>}
              </div>

              <div className="rounded-md border p-3 text-sm">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Rounds ({programRounds.length})
                </p>
                {programRounds.length === 0 && (
                  <p className="text-muted-foreground">No rounds configured.</p>
                )}
                <div className="space-y-1">
                  {programRounds.map((r) => {
                    const pinned = `${landing}?round=${r.round_number ?? r.id}`;
                    const isNext = nextRound?.id === r.id;
                    return (
                      <div key={r.id} className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {r.round_name || `Round ${r.round_number ?? '?'}`}
                        </span>
                        <span className="text-muted-foreground">
                          {r.first_session_date
                            ? new Date(r.first_session_date).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : '—'}
                        </span>
                        {isNext && <Badge className="h-5">next</Badge>}
                        {r.status !== 'active' && (
                          <Badge variant="outline" className="h-5">
                            {r.status}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => copy(pinned)}
                        >
                          <Copy className="mr-1 h-3 w-3" /> pinned link
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
