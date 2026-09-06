import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, GraduationCap,
  FolderOpen, Play, Headphones, BookOpen, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { LearnCourse, LearnModule, LearnLesson, LessonType } from '@/hooks/useLearn';

const LESSON_TYPE_OPTIONS: { value: LessonType; label: string; icon: typeof Play }[] = [
  { value: 'video', label: 'Video', icon: Play },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'document', label: 'Document (Reading)', icon: BookOpen },
  { value: 'pdf', label: 'PDF (link)', icon: FileText },
];

// ---------- Data hooks (admin sees everything via admin RLS) ----------

function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-learn-courses'],
    queryFn: async () => {
      const { data: courses, error } = await supabase
        .from('learn_courses')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      const { data: links, error: lErr } = await supabase
        .from('learn_course_rounds')
        .select('course_id, round_id, program_rounds(round_name, program_slug)');
      if (lErr) throw lErr;
      return (courses || []).map((c) => ({
        ...c,
        rounds: (links || [])
          .filter((l) => l.course_id === c.id)
          .map((l: any) => ({
            round_id: l.round_id,
            label: `${l.program_rounds?.round_name || 'Round'} (${l.program_rounds?.program_slug || '?'})`,
          })),
      })) as (LearnCourse & { rounds: { round_id: string; label: string }[] })[];
    },
  });
}

function useAdminRounds() {
  return useQuery({
    queryKey: ['admin-learn-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, program_slug')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useMediaList(kind: 'video' | 'audio' | 'reading', enabled: boolean) {
  return useQuery({
    queryKey: ['admin-learn-media', kind],
    enabled,
    queryFn: async () => {
      if (kind === 'video') {
        const { data, error } = await supabase.from('video_content').select('id, title').order('title');
        if (error) throw error;
        return data || [];
      }
      if (kind === 'audio') {
        const { data, error } = await supabase.from('audio_content').select('id, title').order('title');
        if (error) throw error;
        return data || [];
      }
      const { data, error } = await supabase.from('reading_content').select('id, title').order('title');
      if (error) throw error;
      return data || [];
    },
  });
}

function useAdminCourseContent(courseId: string | null) {
  return useQuery({
    queryKey: ['admin-learn-content', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data: modules, error: mErr } = await supabase
        .from('learn_modules')
        .select('*')
        .eq('course_id', courseId!)
        .order('sort_order');
      if (mErr) throw mErr;
      const ids = (modules || []).map((m) => m.id);
      let lessons: LearnLesson[] = [];
      if (ids.length) {
        const { data, error } = await supabase
          .from('learn_lessons')
          .select('*')
          .in('module_id', ids)
          .order('sort_order');
        if (error) throw error;
        lessons = (data || []) as LearnLesson[];
      }
      return { modules: (modules || []) as LearnModule[], lessons };
    },
  });
}

// ---------- Component ----------

export default function LearnCourses() {
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useAdminCourses();
  const { data: allRounds } = useAdminRounds();

  const [contentCourseId, setContentCourseId] = useState<string | null>(null);
  const { data: content } = useAdminCourseContent(contentCourseId);

  // Course dialog state
  const [courseDialog, setCourseDialog] = useState<{ open: boolean; course?: LearnCourse & { rounds: { round_id: string }[] } }>({ open: false });
  const [cForm, setCForm] = useState({ title: '', description: '', cover_image_url: '', is_published: false, sort_order: 0 });
  const [cRounds, setCRounds] = useState<string[]>([]);

  // Module dialog state
  const [moduleDialog, setModuleDialog] = useState<{ open: boolean; module?: LearnModule }>({ open: false });
  const [mForm, setMForm] = useState({ title: '', description: '' });

  // Lesson dialog state
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; moduleId?: string; lesson?: LearnLesson }>({ open: false });
  const [lForm, setLForm] = useState({
    title: '', description: '', lesson_type: 'video' as LessonType,
    video_id: '', audio_id: '', reading_id: '', pdf_url: '', duration_minutes: '',
  });

  const { data: videos } = useMediaList('video', lessonDialog.open && lForm.lesson_type === 'video');
  const { data: audios } = useMediaList('audio', lessonDialog.open && lForm.lesson_type === 'audio');
  const { data: readings } = useMediaList('reading', lessonDialog.open && lForm.lesson_type === 'document');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-learn-courses'] });
    queryClient.invalidateQueries({ queryKey: ['admin-learn-content'] });
    queryClient.invalidateQueries({ queryKey: ['learn-courses'] });
    queryClient.invalidateQueries({ queryKey: ['learn-course-content'] });
    queryClient.invalidateQueries({ queryKey: ['learn-round-course'] });
  };

  // ---------- Course save ----------
  const saveCourse = useMutation({
    mutationFn: async () => {
      const payload = {
        title: cForm.title.trim(),
        description: cForm.description.trim() || null,
        cover_image_url: cForm.cover_image_url.trim() || null,
        is_published: cForm.is_published,
        sort_order: cForm.sort_order,
      };
      let courseId = courseDialog.course?.id;
      if (courseId) {
        const { error } = await supabase.from('learn_courses').update(payload).eq('id', courseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('learn_courses').insert(payload).select('id').single();
        if (error) throw error;
        courseId = data.id;
      }
      // Sync round links: delete removed, insert new
      const existing = courseDialog.course?.rounds.map((r) => r.round_id) || [];
      const toRemove = existing.filter((r) => !cRounds.includes(r));
      const toAdd = cRounds.filter((r) => !existing.includes(r));
      if (toRemove.length) {
        const { error } = await supabase.from('learn_course_rounds').delete().eq('course_id', courseId!).in('round_id', toRemove);
        if (error) throw error;
      }
      if (toAdd.length) {
        const { error } = await supabase.from('learn_course_rounds').insert(
          toAdd.map((r) => ({ course_id: courseId!, round_id: r }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Course saved');
      setCourseDialog({ open: false });
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save course'),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learn_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course deleted');
      setContentCourseId(null);
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  // ---------- Module save ----------
  const saveModule = useMutation({
    mutationFn: async () => {
      if (!contentCourseId) return;
      if (moduleDialog.module) {
        const { error } = await supabase
          .from('learn_modules')
          .update({ title: mForm.title.trim(), description: mForm.description.trim() || null })
          .eq('id', moduleDialog.module.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(0, ...(content?.modules.map((m) => m.sort_order) || []));
        const { error } = await supabase.from('learn_modules').insert({
          course_id: contentCourseId,
          title: mForm.title.trim(),
          description: mForm.description.trim() || null,
          sort_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Module saved');
      setModuleDialog({ open: false });
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save module'),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learn_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Module deleted'); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  // ---------- Lesson save ----------
  const saveLesson = useMutation({
    mutationFn: async () => {
      const durationSeconds = lForm.duration_minutes ? Math.round(parseFloat(lForm.duration_minutes) * 60) : null;
      const payload: any = {
        title: lForm.title.trim(),
        description: lForm.description.trim() || null,
        lesson_type: lForm.lesson_type,
        video_id: lForm.lesson_type === 'video' ? lForm.video_id || null : null,
        audio_id: lForm.lesson_type === 'audio' ? lForm.audio_id || null : null,
        reading_id: lForm.lesson_type === 'document' ? lForm.reading_id || null : null,
        pdf_url: lForm.lesson_type === 'pdf' ? lForm.pdf_url.trim() || null : null,
        duration_seconds: durationSeconds,
      };
      if (lessonDialog.lesson) {
        const { error } = await supabase.from('learn_lessons').update(payload).eq('id', lessonDialog.lesson.id);
        if (error) throw error;
      } else {
        const moduleLessons = content?.lessons.filter((l) => l.module_id === lessonDialog.moduleId) || [];
        const maxOrder = Math.max(0, ...moduleLessons.map((l) => l.sort_order));
        const { error } = await supabase.from('learn_lessons').insert({
          ...payload,
          module_id: lessonDialog.moduleId!,
          sort_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Lesson saved');
      setLessonDialog({ open: false });
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save lesson'),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learn_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Lesson deleted'); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  // ---------- Reordering ----------
  const reorder = useMutation({
    mutationFn: async ({ table, a, b }: { table: 'learn_modules' | 'learn_lessons'; a: { id: string; sort_order: number }; b: { id: string; sort_order: number } }) => {
      const { error: e1 } = await supabase.from(table).update({ sort_order: b.sort_order }).eq('id', a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from(table).update({ sort_order: a.sort_order }).eq('id', b.id);
      if (e2) throw e2;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Reorder failed'),
  });

  const openCourseDialog = (course?: LearnCourse & { rounds: { round_id: string }[] }) => {
    setCForm({
      title: course?.title || '',
      description: course?.description || '',
      cover_image_url: course?.cover_image_url || '',
      is_published: course?.is_published ?? false,
      sort_order: course?.sort_order ?? (courses?.length || 0),
    });
    setCRounds(course?.rounds.map((r) => r.round_id) || []);
    setCourseDialog({ open: true, course });
  };

  const openLessonDialog = (moduleId: string, lesson?: LearnLesson) => {
    setLForm({
      title: lesson?.title || '',
      description: lesson?.description || '',
      lesson_type: lesson?.lesson_type || 'video',
      video_id: lesson?.video_id || '',
      audio_id: lesson?.audio_id || '',
      reading_id: lesson?.reading_id || '',
      pdf_url: lesson?.pdf_url || '',
      duration_minutes: lesson?.duration_seconds ? String(Math.round(lesson.duration_seconds / 60)) : '',
    });
    setLessonDialog({ open: true, moduleId, lesson });
  };

  const contentCourse = courses?.find((c) => c.id === contentCourseId);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Learn Courses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Structured course player at /app/learn. Access is granted through linked program rounds.
          </p>
        </div>
        <Button onClick={() => openCourseDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> New Course
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !courses?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No courses yet. Create your first one.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <Card key={c.id} className={contentCourseId === c.id ? 'border-primary' : ''}>
              <CardHeader className="py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-lg flex-1 min-w-0 truncate">{c.title}</CardTitle>
                  <Badge variant={c.is_published ? 'default' : 'secondary'}>
                    {c.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  {c.rounds.map((r) => (
                    <Badge key={r.round_id} variant="outline">{r.label}</Badge>
                  ))}
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setContentCourseId(contentCourseId === c.id ? null : c.id)} className="gap-1">
                      <FolderOpen className="h-4 w-4" /> Content
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openCourseDialog(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { if (confirm(`Delete course "${c.title}" and all its modules/lessons?`)) deleteCourse.mutate(c.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {contentCourseId === c.id && content && (
                <CardContent className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Modules & Lessons</h3>
                    <Button
                      size="sm" variant="outline" className="gap-1"
                      onClick={() => { setMForm({ title: '', description: '' }); setModuleDialog({ open: true }); }}
                    >
                      <Plus className="h-4 w-4" /> Add Module
                    </Button>
                  </div>

                  {content.modules.length === 0 && (
                    <p className="text-sm text-muted-foreground">No modules yet. Add one to start building the curriculum.</p>
                  )}

                  {content.modules.map((mod, mi) => {
                    const lessons = content.lessons.filter((l) => l.module_id === mod.id);
                    return (
                      <div key={mod.id} className="border rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold flex-1 min-w-0 truncate">{mi + 1}. {mod.title}</span>
                          <Button variant="ghost" size="sm" disabled={mi === 0}
                            onClick={() => reorder.mutate({ table: 'learn_modules', a: mod, b: content.modules[mi - 1] })}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" disabled={mi === content.modules.length - 1}
                            onClick={() => reorder.mutate({ table: 'learn_modules', a: mod, b: content.modules[mi + 1] })}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm"
                            onClick={() => { setMForm({ title: mod.title, description: mod.description || '' }); setModuleDialog({ open: true, module: mod }); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm"
                            onClick={() => { if (confirm(`Delete module "${mod.title}" and its lessons?`)) deleteModule.mutate(mod.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openLessonDialog(mod.id)}>
                            <Plus className="h-4 w-4" /> Lesson
                          </Button>
                        </div>
                        {lessons.map((lesson, li) => {
                          const opt = LESSON_TYPE_OPTIONS.find((o) => o.value === lesson.lesson_type);
                          const Icon = opt?.icon || Play;
                          return (
                            <div key={lesson.id} className="flex items-center gap-2 pl-4 py-1.5 rounded-lg bg-muted/50">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="flex-1 min-w-0 truncate text-sm">{lesson.title}</span>
                              <Badge variant="outline" className="text-xs">{opt?.label}</Badge>
                              <Button variant="ghost" size="sm" disabled={li === 0}
                                onClick={() => reorder.mutate({ table: 'learn_lessons', a: lesson, b: lessons[li - 1] })}>
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" disabled={li === lessons.length - 1}
                                onClick={() => reorder.mutate({ table: 'learn_lessons', a: lesson, b: lessons[li + 1] })}>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openLessonDialog(mod.id, lesson)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm"
                                onClick={() => { if (confirm(`Delete lesson "${lesson.title}"?`)) deleteLesson.mutate(lesson.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Course Dialog */}
      <Dialog open={courseDialog.open} onOpenChange={(o) => setCourseDialog({ open: o })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{courseDialog.course ? 'Edit Course' : 'New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={cForm.title} onChange={(e) => setCForm({ ...cForm, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={cForm.description} onChange={(e) => setCForm({ ...cForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Cover image URL</Label>
              <Input value={cForm.cover_image_url} onChange={(e) => setCForm({ ...cForm, cover_image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={cForm.sort_order} onChange={(e) => setCForm({ ...cForm, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Published (visible to enrolled students)</Label>
              <Switch checked={cForm.is_published} onCheckedChange={(v) => setCForm({ ...cForm, is_published: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>Linked rounds (students enrolled in these get access)</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                {allRounds?.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cRounds.includes(r.id)}
                      onChange={(e) =>
                        setCRounds(e.target.checked ? [...cRounds, r.id] : cRounds.filter((x) => x !== r.id))
                      }
                    />
                    <span>{r.round_name}</span>
                    <span className="text-muted-foreground">({r.program_slug})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveCourse.mutate()} disabled={!cForm.title.trim() || saveCourse.isPending}>
              {saveCourse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialog.open} onOpenChange={(o) => setModuleDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{moduleDialog.module ? 'Edit Module' : 'New Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={mForm.title} onChange={(e) => setMForm({ ...mForm, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={mForm.description} onChange={(e) => setMForm({ ...mForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveModule.mutate()} disabled={!mForm.title.trim() || saveModule.isPending}>
              {saveModule.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog.open} onOpenChange={(o) => setLessonDialog({ open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{lessonDialog.lesson ? 'Edit Lesson' : 'New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={lForm.title} onChange={(e) => setLForm({ ...lForm, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={lForm.lesson_type} onValueChange={(v) => setLForm({ ...lForm, lesson_type: v as LessonType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LESSON_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lForm.lesson_type === 'video' && (
              <div className="space-y-1.5">
                <Label>Video</Label>
                <Select value={lForm.video_id} onValueChange={(v) => setLForm({ ...lForm, video_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a video..." /></SelectTrigger>
                  <SelectContent>
                    {videos?.map((v) => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {lForm.lesson_type === 'audio' && (
              <div className="space-y-1.5">
                <Label>Audio</Label>
                <Select value={lForm.audio_id} onValueChange={(v) => setLForm({ ...lForm, audio_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select an audio track..." /></SelectTrigger>
                  <SelectContent>
                    {audios?.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {lForm.lesson_type === 'document' && (
              <div className="space-y-1.5">
                <Label>Reading content</Label>
                <Select value={lForm.reading_id} onValueChange={(v) => setLForm({ ...lForm, reading_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a reading..." /></SelectTrigger>
                  <SelectContent>
                    {readings?.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {lForm.lesson_type === 'pdf' && (
              <div className="space-y-1.5">
                <Label>PDF URL</Label>
                <Input value={lForm.pdf_url} onChange={(e) => setLForm({ ...lForm, pdf_url: e.target.value })} placeholder="https://..." />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={lForm.description} onChange={(e) => setLForm({ ...lForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration in minutes (optional — auto-detected for video/audio)</Label>
              <Input type="number" value={lForm.duration_minutes} onChange={(e) => setLForm({ ...lForm, duration_minutes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveLesson.mutate()} disabled={!lForm.title.trim() || saveLesson.isPending}>
              {saveLesson.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
