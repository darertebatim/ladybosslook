import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, RefreshCw, Download, Search, MessageCircle, MessagesSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Program { slug: string; title: string; }
interface Round { id: string; round_name: string; round_number: number; status: string; }

interface Student {
  enrollmentId: string;
  userId: string;
  enrolledAt: string;
  roundId: string | null;
  roundName: string | null;
  email: string;
  aliases: string[];
  fullName: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;
  occupation: string | null;
  instagram: string | null;
  bio: string | null;
  language: string | null;
  goals: string[] | null;
  referralSource: string | null;
  dateOfBirth: string | null;
  profileCreatedAt: string | null;
  lastActiveDate: string | null;
  totalActiveDays: number | null;
  platforms: string[];
  lastSignInAt: string | null;
  returnEvents: number;
  everOpened: boolean;
  plusStatus: string | null;
  orderStatus: string | null;
  orderAmount: number | null;
  orderCurrency: string | null;
  orderDate: string | null;
  hasSupportChat: boolean;
  supportLastMessageAt: string | null;
  otherEnrollments: string[];
}

const waLink = (phone?: string | null) => {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
};

const chunk = <T,>(arr: T[], size = 200): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export function ProgramStudentsManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<Student | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .eq('is_active', true)
        .order('title');
      setPrograms(data || []);
    })();
  }, []);

  useEffect(() => {
    setSelectedRound('all');
    setStudents([]);
    if (selectedProgram) loadAll(selectedProgram, 'all');
    else setRounds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedProgram) loadAll(selectedProgram, selectedRound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound]);

  const loadAll = async (slug: string, roundFilter: string) => {
    setIsLoading(true);
    try {
      const { data: roundsData, error: rErr } = await supabase
        .from('program_rounds')
        .select('id, round_name, round_number, status')
        .eq('program_slug', slug)
        .order('round_number', { ascending: false });
      if (rErr) throw rErr;
      setRounds(roundsData || []);
      const roundMap = new Map((roundsData || []).map(r => [r.id, r.round_name]));

      let q = supabase
        .from('course_enrollments')
        .select('id, user_id, enrolled_at, round_id')
        .eq('program_slug', slug)
        .eq('status', 'active');
      if (roundFilter === 'none') q = q.is('round_id', null);
      else if (roundFilter !== 'all') q = q.eq('round_id', roundFilter);

      const { data: enrollments, error: eErr } = await q;
      if (eErr) throw eErr;

      if (!enrollments?.length) { setStudents([]); return; }

      const userIds = [...new Set(enrollments.map(e => e.user_id))];

      const fetchIn = async (table: string, cols: string, col = 'user_id') => {
        const results: any[] = [];
        for (const part of chunk(userIds)) {
          const { data, error } = await (supabase.from(table as any) as any).select(cols).in(col, part);
          if (error) throw error;
          results.push(...(data || []));
        }
        return results;
      };

      const fetchActivity = async () => {
        const results: any[] = [];
        for (const part of chunk(userIds)) {
          const { data, error } = await (supabase.rpc as any)('admin_get_user_activity', { _ids: part });
          if (error) throw error;
          results.push(...(data || []));
        }
        return results;
      };

      const [profiles, aliases, installs, subs, orders, allEnroll, activity, chats] = await Promise.all([
        fetchIn('profiles', 'id, email, full_name, phone, city, state, country, timezone, occupation, social_instagram, bio, preferred_language, goals, referral_source, date_of_birth, created_at, last_active_date, total_active_days', 'id'),
        fetchIn('account_email_aliases', 'primary_user_id, email', 'primary_user_id'),
        fetchIn('app_installations', 'user_id, platform, last_seen_at'),
        fetchIn('user_subscriptions', 'user_id, status, expires_at, trial_ends_at'),
        fetchIn('orders', 'user_id, program_slug, status, amount, currency, created_at'),
        fetchIn('course_enrollments', 'user_id, program_slug, status'),
        fetchActivity(),
        fetchIn('chat_conversations', 'user_id, inbox_type, last_message_at, updated_at'),
      ]);

      const chatMap = new Map<string, any>();
      chats.forEach((c: any) => {
        const at = c.last_message_at || c.updated_at || null;
        const prev = chatMap.get(c.user_id);
        if (!prev || (at && new Date(at) > new Date(prev.at || 0))) chatMap.set(c.user_id, { at });
      });

      const actMap = new Map<string, any>(activity.map((a: any) => [a.user_id, a]));

      const pMap = new Map(profiles.map((p: any) => [p.id, p]));
      const aliasMap = new Map<string, string[]>();
      aliases.forEach((a: any) => {
        const list = aliasMap.get(a.primary_user_id) || [];
        list.push(a.email);
        aliasMap.set(a.primary_user_id, list);
      });
      const platMap = new Map<string, Set<string>>();
      installs.forEach((i: any) => {
        const s = platMap.get(i.user_id) || new Set<string>();
        if (i.platform) s.add(i.platform);
        platMap.set(i.user_id, s);
      });
      const subMap = new Map<string, any>();
      subs.forEach((s: any) => { if (s.status === 'active' || s.status === 'trial' || !subMap.has(s.user_id)) subMap.set(s.user_id, s); });
      const orderMap = new Map<string, any>();
      orders.filter((o: any) => o.program_slug === slug).forEach((o: any) => {
        const prev = orderMap.get(o.user_id);
        if (!prev || new Date(o.created_at) > new Date(prev.created_at)) orderMap.set(o.user_id, o);
      });
      const otherMap = new Map<string, string[]>();
      allEnroll.filter((e: any) => e.program_slug !== slug).forEach((e: any) => {
        const l = otherMap.get(e.user_id) || [];
        l.push(e.program_slug);
        otherMap.set(e.user_id, l);
      });

      const list: Student[] = enrollments.map((e) => {
        const p: any = pMap.get(e.user_id) || {};
        const plats = [...(platMap.get(e.user_id) || new Set<string>())];
        const sub = subMap.get(e.user_id);
        const order = orderMap.get(e.user_id);
        const act = actMap.get(e.user_id);
        const lastSignIn = act?.last_sign_in_at || null;
        const returnEvents = act?.return_events ?? 0;
        const lastSeen = [lastSignIn, act?.last_return_at, p.last_active_date]
          .filter(Boolean)
          .sort((x: string, y: string) => new Date(y).getTime() - new Date(x).getTime())[0] || null;
        return {
          enrollmentId: e.id,
          userId: e.user_id,
          enrolledAt: e.enrolled_at,
          roundId: e.round_id,
          roundName: e.round_id ? roundMap.get(e.round_id) || null : null,
          email: p.email || 'Unknown',
          aliases: aliasMap.get(e.user_id) || [],
          fullName: p.full_name || null,
          phone: p.phone || null,
          city: p.city || null,
          state: p.state || null,
          country: p.country || null,
          timezone: p.timezone || null,
          occupation: p.occupation || null,
          instagram: p.social_instagram || null,
          bio: p.bio || null,
          language: p.preferred_language || null,
          goals: Array.isArray(p.goals) ? p.goals : null,
          referralSource: p.referral_source || null,
          dateOfBirth: p.date_of_birth || null,
          profileCreatedAt: p.created_at || null,
          lastActiveDate: lastSeen ? String(lastSeen).slice(0, 10) : null,
          totalActiveDays: p.total_active_days ?? null,
          platforms: plats,
          lastSignInAt: lastSignIn,
          returnEvents,
          everOpened: !!lastSignIn || returnEvents > 0 || plats.length > 0 || !!p.last_active_date,
          plusStatus: sub?.status || null,
          orderStatus: order?.status || null,
          orderAmount: order?.amount ?? null,
          orderCurrency: order?.currency || null,
          orderDate: order?.created_at || null,
          hasSupportChat: chatMap.has(e.user_id),
          supportLastMessageAt: chatMap.get(e.user_id)?.at || null,
          otherEnrollments: [...new Set(otherMap.get(e.user_id) || [])],
        };
      }).sort((a, b) => (a.fullName || a.email).localeCompare(b.fullName || b.email));

      setStudents(list);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to load students', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return students;
    return students.filter(u =>
      (u.fullName || '').toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.aliases.some(a => a.toLowerCase().includes(s)) ||
      (u.phone || '').toLowerCase().includes(s)
    );
  }, [students, search]);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Other emails', 'Phone', 'WhatsApp', 'City', 'State', 'Country', 'Timezone', 'Occupation', 'Instagram', 'Ever signed in', 'Last seen', 'Active days', 'Platforms', 'Plus', 'Order status', 'Payment date', 'Support chat', 'Round', 'Enrolled'];
    const rows = filtered.map(u => [
      u.fullName || '', u.email, u.aliases.join(' | '), u.phone || '', waLink(u.phone) || '', u.city || '', u.state || '', u.country || '',
      u.timezone || '', u.occupation || '', u.instagram || '', u.everOpened ? 'Yes' : 'No', u.lastActiveDate || '',
      String(u.totalActiveDays ?? ''), u.platforms.join('/'), u.plusStatus || '', u.orderStatus || '',
      u.orderDate ? format(new Date(u.orderDate), 'yyyy-MM-dd') : '',
      u.hasSupportChat ? (u.supportLastMessageAt ? format(new Date(u.supportLastMessageAt), 'yyyy-MM-dd') : 'Yes') : '',
      u.roundName || '', u.enrolledAt ? format(new Date(u.enrolledAt), 'yyyy-MM-dd') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${selectedProgram}-${selectedRound}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loc = (u: Student) => [u.city, u.state, u.country].filter(Boolean).join(', ') || '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Students
        </CardTitle>
        <CardDescription>Pick a program and round to see who is enrolled and what we know about them</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium mb-2 block">Program</label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger><SelectValue placeholder="Choose a program..." /></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Round</label>
            <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedProgram}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rounds</SelectItem>
                <SelectItem value="none">No round assigned</SelectItem>
                {rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.round_name} ({r.status})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedProgram && (
            <>
              <Button variant="outline" onClick={() => loadAll(selectedProgram, selectedRound)} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </>
          )}
        </div>

        {selectedProgram && (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="text-sm text-muted-foreground">
              {filtered.length} student{filtered.length === 1 ? '' : 's'}
              {students.length > 0 && ` · ${students.filter(s => !s.everOpened).length} never signed in`}
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone / WhatsApp</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Support chat</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Plus</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Payment date</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
                  ) : filtered.map(u => (
                    <TableRow
                      key={u.enrollmentId}
                      className={`cursor-pointer ${!u.everOpened ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
                      onClick={() => setDetail(u)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">{u.fullName || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{u.email}</div>
                        {u.aliases.length > 0 && (
                          <Badge variant="outline" className="mt-1">+{u.aliases.length} email{u.aliases.length > 1 ? 's' : ''}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {u.phone ? (
                          <div className="space-y-1">
                            <div>{u.phone}</div>
                            {waLink(u.phone) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={(e) => { e.stopPropagation(); window.open(waLink(u.phone)!, '_blank', 'noopener'); }}
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {u.everOpened ? (
                          <div>
                            <div>{u.lastActiveDate ? `Seen ${u.lastActiveDate}` : 'Signed in'}</div>
                            <div className="text-xs text-muted-foreground">
                              {[
                                u.returnEvents ? `${u.returnEvents} visits` : null,
                                u.totalActiveDays ? `${u.totalActiveDays} days` : null,
                                u.platforms.length ? u.platforms.join('/') : null,
                              ].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="destructive">Never signed in</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {u.hasSupportChat ? (
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={(e) => { e.stopPropagation(); window.open(`/admin/support?userId=${u.userId}`, '_blank', 'noopener'); }}
                            >
                              <MessagesSquare className="h-3.5 w-3.5 mr-1" />
                              Open chat
                            </Button>
                            {u.supportLastMessageAt && (
                              <div className="text-xs text-muted-foreground">{format(new Date(u.supportLastMessageAt), 'MMM d, yyyy')}</div>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-sm">{loc(u)}</TableCell>
                      <TableCell className="text-sm max-w-[200px]">
                        <div className="truncate">{u.occupation || '-'}</div>
                        {u.instagram && <div className="text-xs text-muted-foreground truncate">@{u.instagram.replace('@', '')}</div>}
                      </TableCell>
                      <TableCell>{u.plusStatus ? <Badge variant="secondary">{u.plusStatus}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {u.orderStatus ? (
                          <Badge variant={u.orderStatus === 'paid' || u.orderStatus === 'completed' ? 'secondary' : 'outline'}>{u.orderStatus}</Badge>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{u.orderDate ? format(new Date(u.orderDate), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {u.roundName ? <Badge variant="secondary">{u.roundName}</Badge> : <Badge variant="outline" className="text-muted-foreground">No round</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{u.enrolledAt ? format(new Date(u.enrolledAt), 'MMM d, yyyy') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
            {detail && (
              <>
                <SheetHeader>
                  <SheetTitle>{detail.fullName || detail.email}</SheetTitle>
                  <SheetDescription>{detail.email}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 text-sm">
                  <Field label="All emails" value={[detail.email, ...detail.aliases].join(', ')} />
                  <Field label="Phone" value={detail.phone} />
                  <Field label="Location" value={loc(detail)} />
                  <Field label="Timezone" value={detail.timezone} />
                  <Field label="Occupation / business" value={detail.occupation} />
                  <Field label="Instagram" value={detail.instagram} />
                  <Field label="Bio" value={detail.bio} />
                  <Field label="Language" value={detail.language} />
                  <Field label="Goals" value={detail.goals?.join(', ') || null} />
                  <Field label="Referral source" value={detail.referralSource} />
                  <Field label="Date of birth" value={detail.dateOfBirth} />
                  <Field label="Account created" value={detail.profileCreatedAt ? format(new Date(detail.profileCreatedAt), 'MMM d, yyyy') : null} />
                  <Field
                    label="App activity"
                    value={detail.everOpened
                      ? [
                          detail.lastSignInAt ? `Last sign-in ${format(new Date(detail.lastSignInAt), 'MMM d, yyyy')}` : null,
                          detail.lastActiveDate ? `Last seen ${detail.lastActiveDate}` : null,
                          `${detail.returnEvents} app visits`,
                          `${detail.totalActiveDays ?? 0} active days`,
                          detail.platforms.length ? detail.platforms.join('/') : 'no native install record',
                        ].filter(Boolean).join(' · ')
                      : 'Never signed in'} />
                  <Field label="Rilo Plus" value={detail.plusStatus} />
                  <Field label="Payment for this program" value={detail.orderStatus ? `${detail.orderStatus}${detail.orderAmount ? ` · ${(detail.orderAmount / 100).toFixed(2)} ${(detail.orderCurrency || '').toUpperCase()}` : ''}` : 'No order record'} />
                  <Field label="Payment date" value={detail.orderDate ? format(new Date(detail.orderDate), 'MMM d, yyyy') : null} />
                  <Field label="Support chat" value={detail.hasSupportChat ? (detail.supportLastMessageAt ? `Active · last message ${format(new Date(detail.supportLastMessageAt), 'MMM d, yyyy')}` : 'Active') : 'No conversation'} />
                  <Field label="Round" value={detail.roundName} />
                  <Field label="Enrolled" value={detail.enrolledAt ? format(new Date(detail.enrolledAt), 'MMM d, yyyy') : null} />
                  <Field label="Other enrollments" value={detail.otherEnrollments.join(', ') || null} />
                  <Field label="User ID" value={detail.userId} />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="break-words">{value || '-'}</div>
    </div>
  );
}

export default ProgramStudentsManager;
