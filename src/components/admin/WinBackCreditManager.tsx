import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { WIN_BACK_GRANT, WIN_BACK_REDEEMED, WIN_BACK_VALID_DAYS, parseWinBackCredits, winBackExpiry } from '@/lib/winBackCredit';

const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;

export function WinBackCreditManager() {
  const qc = useQueryClient();
  const [slug, setSlug] = useState('');
  const [roundId, setRoundId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ['winback-programs'],
    queryFn: async () => {
      const { data } = await supabase.from('program_catalog').select('slug, title').order('title');
      return data || [];
    },
  });

  const { data: rounds = [] } = useQuery({
    queryKey: ['winback-rounds', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase.from('program_rounds').select('id, round_name, round_number, start_date')
        .eq('program_slug', slug).order('start_date', { ascending: false });
      return data || [];
    },
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['winback-students', slug, roundId],
    enabled: !!slug && !!roundId,
    queryFn: async () => {
      const { data: enr } = await supabase.from('course_enrollments').select('user_id')
        .eq('round_id', roundId).eq('status', 'active');
      const ids = [...new Set((enr || []).map((e) => e.user_id))];
      if (!ids.length) return [];
      const [{ data: profs }, { data: orders }, { data: tx }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', ids),
        supabase.from('orders').select('user_id, amount, usd_amount, refunded, status')
          .eq('program_slug', slug).in('user_id', ids),
        supabase.from('credit_transactions').select('id, user_id, amount, description, created_at, transaction_type')
          .in('user_id', ids).in('transaction_type', [WIN_BACK_GRANT, WIN_BACK_REDEEMED]),
      ]);
      return ids.map((id) => {
        const p = (profs || []).find((x: any) => x.id === id) as any;
        const paid = (orders || [])
          .filter((o: any) => o.user_id === id && !o.refunded && (o.status ?? 'paid') !== 'failed')
          .reduce((s: number, o: any) => s + (o.usd_amount ?? o.amount ?? 0), 0);
        const credits = parseWinBackCredits((tx || []).filter((t: any) => t.user_id === id) as any);
        const credit = credits.find((c) => c.round_id === roundId) || null;
        return { id, name: p?.full_name || '—', email: p?.email || '', paid, credit };
      });
    },
  });

  const eligible = useMemo(() => students.filter((s) => s.paid > 0 && !s.credit), [students]);
  const now = Date.now();

  const activate = async () => {
    if (!eligible.length) return;
    if (!confirm(`Issue Win-Your-Money-Back credit to ${eligible.length} students? Valid ${WIN_BACK_VALID_DAYS} days.`)) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const expires_at = winBackExpiry();
    const { error } = await supabase.from('credit_transactions').insert(eligible.map((s) => ({
      user_id: s.id,
      amount: s.paid,
      transaction_type: WIN_BACK_GRANT,
      admin_id: user?.id ?? null,
      description: JSON.stringify({ program_slug: slug, round_id: roundId, expires_at }),
    })));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Credit issued to ${eligible.length} students`);
    qc.invalidateQueries({ queryKey: ['winback-students', slug, roundId] });
  };

  const status = (c: (typeof students)[number]['credit']) => {
    if (!c) return <Badge variant="outline">Not issued</Badge>;
    if (c.redeemed) return <Badge variant="secondary">Used</Badge>;
    if (new Date(c.expires_at).getTime() <= now) return <Badge variant="outline">Expired</Badge>;
    return <Badge>Active until {new Date(c.expires_at).toLocaleDateString()}</Badge>;
  };

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2"><Gift className="w-5 h-5" /> Win-Your-Money-Back Credit</h3>
        <p className="text-sm text-muted-foreground">
          Gives each paid student in a round credit equal to what they paid, valid {WIN_BACK_VALID_DAYS} days, applied automatically at checkout for another program (split over 3 payments on monthly plans).
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Select value={slug} onValueChange={(v) => { setSlug(v); setRoundId(''); }}>
          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
          <SelectContent>{programs.map((p: any) => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={roundId} onValueChange={setRoundId} disabled={!slug}>
          <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
          <SelectContent>{rounds.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.round_name} (#{r.round_number})</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {roundId && (
        isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
          <>
            <Button onClick={activate} disabled={busy || !eligible.length}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Activate credit for this round ({eligible.length})
            </Button>
            <div className="divide-y border rounded-lg">
              {students.length === 0 && <p className="p-3 text-sm text-muted-foreground">No active students in this round.</p>}
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>{s.credit ? fmt(s.credit.amount) : s.paid > 0 ? `Paid ${fmt(s.paid)}` : 'No payment'}</span>
                    {status(s.credit)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </Card>
  );
}
