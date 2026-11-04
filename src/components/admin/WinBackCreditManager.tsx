import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { WIN_BACK_GRANT, WIN_BACK_REDEEMED, WIN_BACK_VALID_DAYS, parseWinBackCredits, winBackExpiry, paidUsdCents, hasUnconvertedForeignPayment } from '@/lib/winBackCredit';

const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;

export function WinBackCreditManager() {
  const qc = useQueryClient();
  const [slug, setSlug] = useState('');
  const [roundId, setRoundId] = useState('');
  const [cap, setCap] = useState('');
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
      // List everyone who PAID for this program — enrollment status doesn't matter,
      // so students removed from a round (e.g. moved from Smart IG) still show up.
      const { data: allOrders } = await supabase.from('orders')
        .select('user_id, amount, currency, usd_amount, refunded, status')
        .eq('program_slug', slug);
      const payers = [...new Set((allOrders || []).map((o: any) => o.user_id))];
      if (!payers.length) return [];
      // Merged accounts: treat primary + linked accounts as one student.
      const { data: enrProfs } = await supabase.from('profiles').select('id, email').in('id', payers);
      const emails = (enrProfs || []).map((p: any) => (p.email || '').toLowerCase()).filter(Boolean);
      const idList = payers.join(',');
      const { data: aliases } = await supabase.from('account_email_aliases')
        .select('primary_user_id, merged_from_user_id, email')
        .or(`primary_user_id.in.(${idList}),merged_from_user_id.in.(${idList})${emails.length ? `,email.in.(${emails.map((e) => `"${e}"`).join(',')})` : ''}`);
      const primaryOf = (id: string) => {
        const email = ((enrProfs || []).find((p: any) => p.id === id) as any)?.email?.toLowerCase();
        const a = (aliases || []).find((x: any) => x.merged_from_user_id === id || (email && x.email?.toLowerCase() === email));
        return a?.primary_user_id || id;
      };
      const families = new Map<string, Set<string>>();
      payers.forEach((id) => {
        const pid = primaryOf(id);
        const set = families.get(pid) || new Set([pid]);
        set.add(id);
        (aliases || []).filter((x: any) => x.primary_user_id === pid && x.merged_from_user_id)
          .forEach((x: any) => set.add(x.merged_from_user_id));
        families.set(pid, set);
      });
      const ids = [...new Set([...families.values()].flatMap((s) => [...s]))];
      const [{ data: profs }, { data: tx }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', ids),
        supabase.from('credit_transactions').select('id, user_id, amount, description, created_at, transaction_type')
          .in('user_id', ids).in('transaction_type', [WIN_BACK_GRANT, WIN_BACK_REDEEMED]),
      ]);
      return [...families.entries()].map(([id, members]) => {
        const p = (profs || []).find((x: any) => x.id === id) as any;
        const otherEmails = (profs || []).filter((x: any) => members.has(x.id) && x.id !== id).map((x: any) => x.email).filter(Boolean);
        const userOrders = (allOrders || [])
          .filter((o: any) => members.has(o.user_id) && !o.refunded && (o.status ?? 'paid') !== 'failed');
        const paid = paidUsdCents(userOrders as any);
        const needsReview = userOrders.length > 0 && hasUnconvertedForeignPayment(userOrders as any);
        const credits = parseWinBackCredits((tx || []).filter((t: any) => members.has(t.user_id)) as any);
        // One credit per PROGRAM, not per round — a student in rounds 1+2 gets credited once.
        const credit = credits.find((c) => c.program_slug === slug) || null;
        const email = [p?.email, ...otherEmails].filter(Boolean).join(' · ');
        return { id, name: p?.full_name || '—', email, paid, needsReview, credit };
      });
    },
  });

  const capCents = cap.trim() ? Math.max(0, Math.round(parseFloat(cap) * 100)) : null;
  const creditFor = (paid: number) => (capCents != null ? Math.min(paid, capCents) : paid);
  const eligible = useMemo(() => students.filter((s) => s.paid > 0 && !s.credit && !s.needsReview), [students]);
  const now = Date.now();

  const activate = async () => {
    if (!eligible.length) return;
    const capNote = capCents != null ? ` (capped at ${fmt(capCents)} each)` : '';
    if (!confirm(`Issue Win-Your-Money-Back credit to ${eligible.length} students${capNote}? Valid ${WIN_BACK_VALID_DAYS} days.`)) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const expires_at = winBackExpiry();
    const { error } = await supabase.from('credit_transactions').insert(eligible.map((s) => ({
      user_id: s.id,
      amount: creditFor(s.paid),
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
          Lists everyone who paid for the program (even if no longer enrolled). Credit equals what they paid (197 USD or 197 CAD both give 197), optionally capped, valid {WIN_BACK_VALID_DAYS} days, applied automatically at checkout for another program (split over the plan's monthly payments).
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Select value={slug} onValueChange={(v) => { setSlug(v); setRoundId(''); }}>
          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
          <SelectContent>{programs.map((p: any) => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={roundId} onValueChange={setRoundId} disabled={!slug}>
          <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
          <SelectContent>{rounds.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.round_name} (#{r.round_number})</SelectItem>)}</SelectContent>
        </Select>
        <Input
          type="number" min="0" step="1" placeholder="Credit cap $ (optional)"
          value={cap} onChange={(e) => setCap(e.target.value)}
        />
      </div>

      {roundId && (
        isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
          <>
            <Button onClick={activate} disabled={busy || !eligible.length}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Activate credit{capCents != null ? ` (cap ${fmt(capCents)})` : ''} for this round ({eligible.length})
            </Button>
            <div className="divide-y border rounded-lg">
              {students.length === 0 && <p className="p-3 text-sm text-muted-foreground">No payments found for this program.</p>}
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>
                      {s.credit ? fmt(s.credit.amount)
                        : s.needsReview ? 'Foreign payment — review'
                        : s.paid > 0
                          ? (capCents != null && creditFor(s.paid) !== s.paid
                              ? `Paid ${fmt(s.paid)} → credit ${fmt(creditFor(s.paid))}`
                              : `Paid ${fmt(s.paid)}`)
                          : 'No payment'}
                    </span>
                    {s.needsReview && !s.credit ? <Badge variant="outline">Review</Badge> : status(s.credit)}
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
