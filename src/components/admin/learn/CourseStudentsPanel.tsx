import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, Search, Trophy, TrendingUp } from 'lucide-react';

interface Props {
  courseId: string;
  lessonIds: string[];
  lessonTitles: Record<string, string>;
}

interface StudentRow {
  userId: string;
  name: string;
  email: string;
  done: number;
  lastActivity: string | null;
}

export function CourseStudentsPanel({ courseId, lessonIds, lessonTitles }: Props) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-learn-students', courseId, lessonIds.length],
    enabled: !!courseId,
    queryFn: async () => {
      const { data: links, error: lErr } = await supabase
        .from('learn_course_rounds')
        .select('round_id')
        .eq('course_id', courseId);
      if (lErr) throw lErr;
      const roundIds = (links || []).map((l) => l.round_id);
      if (!roundIds.length) return { students: [] as StudentRow[], perLesson: {} as Record<string, number> };

      const { data: enrollments, error: eErr } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .in('round_id', roundIds);
      if (eErr) throw eErr;
      const userIds = Array.from(new Set((enrollments || []).map((e) => e.user_id).filter(Boolean)));
      if (!userIds.length) return { students: [] as StudentRow[], perLesson: {} as Record<string, number> };

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      let progress: { user_id: string; lesson_id: string; completed_at: string | null }[] = [];
      if (lessonIds.length) {
        const { data: pr, error: pErr } = await supabase
          .from('learn_lesson_progress')
          .select('user_id, lesson_id, completed_at')
          .in('lesson_id', lessonIds);
        if (pErr) throw pErr;
        progress = (pr || []) as any;
      }

      const perLesson: Record<string, number> = {};
      const byUser = new Map<string, { done: number; last: string | null }>();
      for (const p of progress) {
        perLesson[p.lesson_id] = (perLesson[p.lesson_id] || 0) + 1;
        const cur = byUser.get(p.user_id) || { done: 0, last: null };
        cur.done += 1;
        if (p.completed_at && (!cur.last || p.completed_at > cur.last)) cur.last = p.completed_at;
        byUser.set(p.user_id, cur);
      }

      const students: StudentRow[] = userIds.map((id) => {
        const prof = (profiles || []).find((p) => p.id === id);
        const agg = byUser.get(id);
        return {
          userId: id,
          name: prof?.full_name || 'Unnamed',
          email: prof?.email || '',
          done: agg?.done || 0,
          lastActivity: agg?.last || null,
        };
      }).sort((a, b) => b.done - a.done);

      return { students, perLesson };
    },
  });

  const total = lessonIds.length;
  const students = data?.students || [];
  const perLesson = data?.perLesson || {};

  const stats = useMemo(() => {
    if (!students.length || !total) return { avg: 0, finished: 0 };
    const avg = Math.round(
      students.reduce((s, st) => s + st.done / total, 0) / students.length * 100
    );
    const finished = students.filter((s) => s.done >= total).length;
    return { avg, finished };
  }, [students, total]);

  const filtered = students.filter(
    (s) => !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="h-3.5 w-3.5" /> Students</div>
          <p className="text-2xl font-bold mt-1">{students.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="h-3.5 w-3.5" /> Avg. completion</div>
          <p className="text-2xl font-bold mt-1">{stats.avg}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Trophy className="h-3.5 w-3.5" /> Finished</div>
          <p className="text-2xl font-bold mt-1">{stats.finished}</p>
        </CardContent></Card>
      </div>

      {total > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Completions per lesson</h4>
          <div className="border rounded-xl divide-y">
            {lessonIds.map((id) => {
              const count = perLesson[id] || 0;
              const pct = students.length ? Math.round((count / students.length) * 100) : 0;
              return (
                <div key={id} className="flex items-center gap-3 p-2.5">
                  <span className="flex-1 min-w-0 truncate text-sm">{lessonTitles[id] || 'Lesson'}</span>
                  <Progress value={pct} className="h-1.5 w-28" />
                  <span className="text-xs text-muted-foreground w-16 text-right">{count} / {students.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold flex-1">Students</h4>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="pl-8 h-8" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No students enrolled in the linked rounds yet.</p>
        ) : (
          <div className="border rounded-xl divide-y">
            {filtered.map((s) => {
              const pct = total ? Math.round((s.done / total) * 100) : 0;
              return (
                <div key={s.userId} className="flex items-center gap-3 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  {pct === 100 && <Badge variant="default">Completed</Badge>}
                  <Progress value={pct} className="h-1.5 w-28" />
                  <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    {s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
