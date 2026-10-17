import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLocalDateStr } from '@/lib/localDate';
import { manualPaymentMethods, paymentAmountInCents, shouldEnrollForPayment } from '@/lib/manualPayment';
import { toast } from 'sonner';

type Customer = { email: string; full_name: string | null };
type ExistingEnrollment = { id: string; course_name: string; program_slug: string | null; round_id: string | null; program_rounds: { round_name: string } | null };

export function ManualPaymentDialog({ customer, enrollments = [], initialProgram = '', initialMethod = 'zelle', onSaved }: { customer?: Customer; enrollments?: ExistingEnrollment[]; initialProgram?: string; initialMethod?: string; onSaved?: () => void | Promise<void> }) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [program, setProgram] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [productName, setProductName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [method, setMethod] = useState('zelle');
  const [date, setDate] = useState(getLocalDateStr());
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [enroll, setEnroll] = useState(true);
  const [round, setRound] = useState('auto');
  const [paymentId, setPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['manual-payment-programs'], enabled: open && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from('program_catalog').select('slug,title,is_one_on_one').order('title');
      if (error) throw error;
      return data || [];
    },
  });
  const selectedProgram = programs.find(p => p.slug === program);
  const { data: rounds = [] } = useQuery({
    queryKey: ['manual-payment-rounds', program],
    enabled: open && enroll && !!selectedProgram && !selectedProgram.is_one_on_one,
    queryFn: async () => {
      const { data, error } = await supabase.from('program_rounds').select('id,round_name,round_number')
        .eq('program_slug', program).in('status', ['active', 'upcoming']).is('owner_user_id', null).order('round_number', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  if (!isAdmin) return null;

  const changeOpen = (next: boolean) => {
    if (saving) return;
    if (next) {
      setEmail(customer?.email || ''); setName(customer?.full_name || '');
      setProgram(initialProgram); setEnrollmentId(''); setProductName(''); setAmount(''); setCurrency('usd'); setMethod(initialMethod);
      setDate(getLocalDateStr()); setNotes(''); setReference(''); setEnroll(!initialProgram); setRound('auto');
      setPaymentId(crypto.randomUUID()); setErrorMessage('');
    }
    setOpen(next);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setErrorMessage('');
    try {
      const cents = paymentAmountInCents(amount);
      if (!program) throw new Error('Choose a program or custom product');
      const paidAt = new Date(`${date}T12:00:00`);
      if (!date || Number.isNaN(paidAt.getTime()) || date > getLocalDateStr()) throw new Error('Choose a payment date on or before today');
      setSaving(true);
      const { error } = await supabase.rpc('record_manual_payment', {
        p_payment_id: paymentId, p_email: email.trim().toLowerCase(), p_name: name.trim(),
        p_program_slug: program === 'custom' ? null : program,
        p_product_name: productName.trim(), p_amount: cents, p_currency: currency,
        p_method: method, p_paid_at: paidAt.toISOString(), p_notes: notes.trim(),
        p_reference: reference.trim(), p_enroll: shouldEnrollForPayment(enrollmentId, enroll, program),
        p_round_id: shouldEnrollForPayment(enrollmentId, enroll, program) && !selectedProgram?.is_one_on_one && round !== 'auto' ? round : null,
      });
      if (error) throw error;
      setOpen(false);
      toast.success(!enrollmentId && enroll && program !== 'custom' ? 'Payment recorded and program access enabled' : 'Payment recorded');
      await queryClient.invalidateQueries({ predicate: query => /enroll|learning|booking|round|orders/i.test(String(query.queryKey[0])) });
      await onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (error as { message?: string })?.message || 'Unable to record payment');
    } finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button variant="outline" size={customer ? 'sm' : 'default'}><Receipt className="mr-2 h-4 w-4" />{customer ? 'Record Payment' : 'Add Manual Payment'}</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record Manual Payment</DialogTitle><DialogDescription>{customer ? customer.email : 'Record a payment for an existing customer account.'}</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={saving} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="manual-email">Customer email</Label><Input id="manual-email" type="email" required value={email} readOnly={!!customer} onChange={e => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="manual-name">Customer name</Label><Input id="manual-name" value={name} maxLength={100} onChange={e => setName(e.target.value)} /></div>
            {enrollments.length > 0 && <div className="space-y-2"><Label htmlFor="manual-enrollment">Existing enrollment</Label><Select value={enrollmentId || 'new'} onValueChange={value => {
              const existing = enrollments.find(e => e.id === value);
              setEnrollmentId(existing?.id || ''); setProgram(existing?.program_slug || (existing ? 'custom' : ''));
              setProductName(existing?.course_name || ''); setEnroll(!existing); setRound('auto');
            }}><SelectTrigger id="manual-enrollment"><SelectValue placeholder="Choose an existing enrollment" /></SelectTrigger><SelectContent><SelectItem value="new">Another program / custom product</SelectItem>{enrollments.map(e => <SelectItem key={e.id} value={e.id}>{e.course_name}{e.program_rounds?.round_name ? ` — ${e.program_rounds.round_name}` : ''}</SelectItem>)}</SelectContent></Select></div>}
            {!enrollmentId && <div className="space-y-2"><Label htmlFor="manual-program">Program / product</Label><Select value={program} onValueChange={value => { setProgram(value); setRound('auto'); }} disabled={loadingPrograms}><SelectTrigger id="manual-program"><SelectValue placeholder="Choose a program" /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}<SelectItem value="custom">Custom product</SelectItem></SelectContent></Select></div>}
            {program === 'custom' && <div className="space-y-2"><Label htmlFor="manual-product">Product name</Label><Input id="manual-product" required maxLength={200} value={productName} onChange={e => setProductName(e.target.value)} /></div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="manual-amount">Amount</Label><Input id="manual-amount" required inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="manual-currency">Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger id="manual-currency"><SelectValue /></SelectTrigger><SelectContent>{['usd', 'cad', 'eur', 'gbp'].map(c => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="manual-method">Payment method</Label><Select value={method} onValueChange={setMethod}><SelectTrigger id="manual-method"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(manualPaymentMethods).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="manual-date">Payment date</Label><Input id="manual-date" type="date" required max={getLocalDateStr()} value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="manual-reference">Reference (optional)</Label><Input id="manual-reference" maxLength={200} value={reference} onChange={e => setReference(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="manual-notes">Notes (optional)</Label><Textarea id="manual-notes" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            {!enrollmentId && program !== 'custom' && <div className="flex items-center gap-3 min-h-10"><Checkbox id="manual-enroll" checked={enroll} onCheckedChange={v => setEnroll(v === true)} /><Label htmlFor="manual-enroll">Also enroll student in this program</Label></div>}
            {!enrollmentId && enroll && !selectedProgram?.is_one_on_one && rounds.length > 0 && <div className="space-y-2"><Label htmlFor="manual-round">Round</Label><Select value={round} onValueChange={setRound}><SelectTrigger id="manual-round"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Program default</SelectItem>{rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.round_name}</SelectItem>)}</SelectContent></Select></div>}
          </fieldset>
          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
          <DialogFooter className="gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => changeOpen(false)}>Cancel</Button><Button type="submit" disabled={saving || !program}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? 'Recording…' : 'Record Payment'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}