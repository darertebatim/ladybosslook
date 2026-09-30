import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ALL = '__all__';

interface Props {
  program: string;
  round: string;
  onChange: (program: string, round: string) => void;
  allowAllPrograms?: boolean;
}

/** Program + round dropdowns. Only lists programs that have enrollments. */
export function ProgramRoundFilter({ program, round, onChange, allowAllPrograms }: Props) {
  const [programs, setPrograms] = useState<{ slug: string; title: string }[]>([]);
  const [rounds, setRounds] = useState<{ id: string; round_name: string; start_date: string | null }[]>([]);

  useEffect(() => {
    supabase
      .from('program_catalog')
      .select('slug, title')
      .order('title')
      .then(({ data }) => setPrograms((data || []) as any));
  }, []);

  useEffect(() => {
    if (!program || program === ALL) return setRounds([]);
    supabase
      .from('program_rounds')
      .select('id, round_name, start_date')
      .eq('program_slug', program)
      .order('start_date', { ascending: false })
      .then(({ data }) => setRounds((data || []) as any));
  }, [program]);

  return (
    <div className="flex gap-2">
      <Select value={program} onValueChange={(v) => onChange(v, ALL)}>
        <SelectTrigger className="w-56"><SelectValue placeholder="Program" /></SelectTrigger>
        <SelectContent>
          {allowAllPrograms && <SelectItem value={ALL}>All programs</SelectItem>}
          {programs.map((p) => (
            <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={round} onValueChange={(v) => onChange(program, v)} disabled={program === ALL}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Round" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All rounds</SelectItem>
          {rounds.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.round_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Returns user ids actively enrolled in the program (and round), or null when no filter. */
export async function fetchEnrolledUserIds(program: string, round: string): Promise<string[] | null> {
  if (!program || program === ALL) return null;
  let q = supabase.from('course_enrollments').select('user_id').eq('program_slug', program).eq('status', 'active');
  if (round && round !== ALL) q = q.eq('round_id', round);
  const { data } = await q.limit(5000);
  return Array.from(new Set((data || []).map((e: any) => e.user_id).filter(Boolean)));
}
