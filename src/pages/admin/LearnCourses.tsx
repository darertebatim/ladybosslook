import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, GraduationCap,
  Play, Headphones, BookOpen, FileText, Search, Copy, ExternalLink, GripVertical,
  EyeOff, Lock, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { LessonEditorDialog } from '@/components/admin/learn/LessonEditorDialog';
import { CourseStudentsPanel } from '@/components/admin/learn/CourseStudentsPanel';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LearnCourse, LearnModule, LearnLesson, LessonType } from '@/hooks/useLearn';
import { formatTotalDuration } from '@/hooks/useLearn';

const LESSON_META: Record<LessonType, { label: string; icon: typeof Play }> = {
  video: { label: 'Video', icon: Play },
  audio: { label: 'Audio', icon: Headphones },
  document: { label: 'Reading', icon: BookOpen },
  pdf: { label: 'PDF', icon: FileText },
};

type CourseWithRounds = LearnCourse & { rounds: { round_id: string; label: string }[] };

// ---------- Data hooks ----------

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
      })) as CourseWithRounds[];
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
        lessons = (data || []) as unknown as LearnLesson[];
      }
      return { modules: (modules || []) as unknown as LearnModule[], lessons };
    },
  });
}

// ---------- Sortable rows ----------

function SortableRow({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const handle = (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 touch-none"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}

// ---------- Page ----------

export default function LearnCourses() {
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useAdminCourses();
  const { data: allRounds } = useAdminRounds();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState('');
  const { data: content } = useAdminCourseContent(selectedId);

  const [courseDialog, setCourseDialog] = useState<{ open: boolean; course?: CourseWithRounds }>({ open: false });
  const [cForm, setCForm] = useState({
    title: '', subtitle: '', description: '', intro_note: '', language: '',
    cover_image_url: '', is_published: false, sort_order: 0,
  });
  const [cRounds, setCRounds] = useState<string[]>([]);
  const [cProgram, setCProgram] = useState<string | null>(null);

  const [moduleDialog, setModuleDialog] = useState<{ open: boolean; module?: LearnModule }>({ open: false });
  const [mForm, setMForm] = useState({ title: '', description: '', is_published: true });

  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; moduleId: string | null; lesson: LearnLesson | null }>({
    open: false, moduleId: null, lesson: null,
  });

  const [confirm, setConfirm] = useState<{ open: boolean; title: string; body: string; action: () => void }>({
    open: false, title: '', body: '', action: () => {},
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-learn-courses'] });
    queryClient.invalidateQueries({ queryKey: ['admin-learn-content'] });
    queryClient.invalidateQueries({ queryKey: ['admin-learn-students'] });
    queryClient.invalidateQueries({ queryKey: ['learn-courses'] });
    queryClient.invalidateQueries({ queryKey: ['learn-course'] });
    queryClient.invalidateQueries({ queryKey: ['learn-course-content'] });
    queryClient.invalidateQueries({ queryKey: ['learn-round-course'] });
  };

  const askConfirm = (title: string, body: string, action: () => void) =>
    setConfirm({ open: true, title, body, action });

  // ---------- Mutations ----------

  const saveCourse = useMutation({
    mutationFn: async () => {
      const payload = {
        title: cForm.title.trim(),
        subtitle: cForm.subtitle.trim() || null,
        description: cForm.description.trim() || null,
        intro_note: cForm.intro_note.trim() || null,
        language: cForm.language.trim() || null,
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
      return courseId!;
    },
    onSuccess: (id) => {
      toast.success('Course saved');
      setCourseDialog({ open: false });
      setSelectedId(id);
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save course'),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learn_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Course deleted'); setSelectedId(null); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const duplicateCourse = useMutation({
    mutationFn: async (course: CourseWithRounds) => {
      const { data: newCourse, error } = await supabase.from('learn_courses').insert({
        title: `${course.title} (copy)`,
        subtitle: (course as any).subtitle ?? null,
        description: course.description,
        intro_note: (course as any).intro_note ?? null,
        language: (course as any).language ?? null,
        cover_image_url: course.cover_image_url,
        is_published: false,
        sort_order: (course.sort_order ?? 0) + 1,
      }).select('id').single();
      if (error) throw error;

      const { data: mods } = await supabase.from('learn_modules').select('*').eq('course_id', course.id).order('sort_order');
      for (const m of mods || []) {
        const { data: newMod, error: mErr } = await supabase.from('learn_modules').insert({
          course_id: newCourse.id,
          title: m.title,
          description: m.description,
          sort_order: m.sort_order,
          is_published: (m as any).is_published ?? true,
        }).select('id').single();
        if (mErr) throw mErr;
        const { data: lessons } = await supabase.from('learn_lessons').select('*').eq('module_id', m.id).order('sort_order');
        if (lessons?.length) {
          const rows = lessons.map((l: any) => {
            const { id, created_at, updated_at, module_id, ...rest } = l;
            return { ...rest, module_id: newMod.id };
          });
          const { error: lErr } = await supabase.from('learn_lessons').insert(rows);
          if (lErr) throw lErr;
        }
      }
      return newCourse.id as string;
    },
    onSuccess: (id) => { toast.success('Course duplicated'); setSelectedId(id); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to duplicate'),
  });

  const saveModule = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      if (moduleDialog.module) {
        const { error } = await supabase
          .from('learn_modules')
          .update({
            title: mForm.title.trim(),
            description: mForm.description.trim() || null,
            is_published: mForm.is_published,
          })
          .eq('id', moduleDialog.module.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(0, ...(content?.modules.map((m) => m.sort_order) || []));
        const { error } = await supabase.from('learn_modules').insert({
          course_id: selectedId,
          title: mForm.title.trim(),
          description: mForm.description.trim() || null,
          is_published: mForm.is_published,
          sort_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success('Module saved'); setModuleDialog({ open: false }); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to save module'),
  });

  const duplicateModule = useMutation({
    mutationFn: async (mod: LearnModule) => {
      const { data: newMod, error } = await supabase.from('learn_modules').insert({
        course_id: mod.course_id,
        title: `${mod.title} (copy)`,
        description: mod.description,
        is_published: mod.is_published ?? true,
        sort_order: (mod.sort_order ?? 0) + 1,
      }).select('id').single();
      if (error) throw error;
      const { data: lessons } = await supabase.from('learn_lessons').select('*').eq('module_id', mod.id).order('sort_order');
      if (lessons?.length) {
        const rows = lessons.map((l: any) => {
          const { id, created_at, updated_at, module_id, ...rest } = l;
          return { ...rest, module_id: newMod.id };
        });
        const { error: lErr } = await supabase.from('learn_lessons').insert(rows);
        if (lErr) throw lErr;
      }
    },
    onSuccess: () => { toast.success('Module duplicated'); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to duplicate'),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learn_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Module deleted'); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learn_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Lesson deleted'); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const persistOrder = useMutation({
    mutationFn: async ({ table, ids }: { table: 'learn_modules' | 'learn_lessons'; ids: string[] }) => {
      for (let i = 0; i < ids.length; i++) {
        const { error } = await supabase.from(table).update({ sort_order: i }).eq('id', ids[i]);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Reorder failed'),
  });

  const moveLessonToModule = useMutation({
    mutationFn: async ({ lessonId, moduleId }: { lessonId: string; moduleId: string }) => {
      const { error } = await supabase.from('learn_lessons').update({ module_id: moduleId }).eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Lesson moved'); invalidate(); },
    onError: (e: any) => toast.error(e.message || 'Move failed'),
  });

  // ---------- Handlers ----------

  const openCourseDialog = (course?: CourseWithRounds) => {
    setCForm({
      title: course?.title || '',
      subtitle: (course as any)?.subtitle || '',
      description: course?.description || '',
      intro_note: (course as any)?.intro_note || '',
      language: (course as any)?.language || '',
      cover_image_url: course?.cover_image_url || '',
      is_published: course?.is_published ?? false,
      sort_order: course?.sort_order ?? (courses?.length || 0),
    });
    setCRounds(course?.rounds.map((r) => r.round_id) || []);
    setCourseDialog({ open: true, course });
  };

  const handleModuleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !content) return;
    const ids = content.modules.map((m) => m.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    persistOrder.mutate({ table: 'learn_modules', ids: next });
  };

  const handleLessonDragEnd = (moduleId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !content) return;
    const ids = content.lessons.filter((l) => l.module_id === moduleId).map((l) => l.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    persistOrder.mutate({ table: 'learn_lessons', ids: next });
  };

  const selectedCourse = courses?.find((c) => c.id === selectedId);
  const filteredCourses = (courses || []).filter(
    (c) => !listSearch.trim() || c.title.toLowerCase().includes(listSearch.toLowerCase())
  );

  const lessonIds = useMemo(() => {
    if (!content) return [];
    return content.modules.flatMap((m) =>
      content.lessons.filter((l) => l.module_id === m.id).map((l) => l.id)
    );
  }, [content]);

  const lessonTitles = useMemo(() => {
    const map: Record<string, string> = {};
    content?.lessons.forEach((l) => { map[l.id] = l.title; });
    return map;
  }, [content]);

  const totalSeconds = useMemo(
    () => (content?.lessons || []).reduce((s, l) => s + (l.duration_seconds || 0), 0),
    [content]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Courses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Structured course player at /app/learn. Access is granted through linked program rounds.
          </p>
        </div>
        <Button onClick={() => openCourseDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> New Course
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* ---- Course list ---- */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search courses..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filteredCourses.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              No courses yet. Create your first one.
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left flex gap-3 p-2.5 rounded-xl border transition-colors hover:bg-muted ${selectedId === c.id ? 'border-primary bg-muted' : ''}`}
                >
                  {c.cover_image_url ? (
                    <img src={c.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant={c.is_published ? 'default' : 'secondary'} className="text-[10px]">
                        {c.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      {c.rounds.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {c.rounds.length} round{c.rounds.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Detail ---- */}
        {!selectedCourse ? (
          <Card><CardContent className="py-20 text-center text-muted-foreground">
            Select a course on the left to edit its curriculum.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 flex items-start gap-4">
                {selectedCourse.cover_image_url && (
                  <img src={selectedCourse.cover_image_url} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                  {(selectedCourse as any).subtitle && (
                    <p className="text-sm text-muted-foreground">{(selectedCourse as any).subtitle}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant={selectedCourse.is_published ? 'default' : 'secondary'}>
                      {selectedCourse.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline">{content?.modules.length || 0} modules</Badge>
                    <Badge variant="outline">{content?.lessons.length || 0} lessons</Badge>
                    {totalSeconds > 0 && <Badge variant="outline">{formatTotalDuration(totalSeconds)}</Badge>}
                    {selectedCourse.rounds.map((r) => (
                      <Badge key={r.round_id} variant="outline">{r.label}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openCourseDialog(selectedCourse)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline" size="sm" className="gap-1.5"
                    onClick={() => window.open(`/app/learn/${selectedCourse.id}`, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button
                    variant="outline" size="sm" className="gap-1.5"
                    disabled={duplicateCourse.isPending}
                    onClick={() => duplicateCourse.mutate(selectedCourse)}
                  >
                    {duplicateCourse.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                    Duplicate
                  </Button>
                  <Button
                    variant="outline" size="sm" className="gap-1.5 text-destructive"
                    onClick={() => askConfirm(
                      'Delete course?',
                      `"${selectedCourse.title}" and all of its modules and lessons will be removed. Student progress for those lessons is lost.`,
                      () => deleteCourse.mutate(selectedCourse.id)
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="curriculum">
              <TabsList>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="students">Students & stats</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Drag to reorder. Use the arrows to move a lesson between modules.</p>
                  <Button
                    size="sm" variant="outline" className="gap-1"
                    onClick={() => { setMForm({ title: '', description: '', is_published: true }); setModuleDialog({ open: true }); }}
                  >
                    <Plus className="h-4 w-4" /> Add Module
                  </Button>
                </div>

                {!content?.modules.length && (
                  <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No modules yet. Add one to start building the curriculum.
                  </CardContent></Card>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
                  <SortableContext items={content?.modules.map((m) => m.id) || []} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {content?.modules.map((mod, mi) => {
                        const lessons = content.lessons.filter((l) => l.module_id === mod.id);
                        return (
                          <SortableRow key={mod.id} id={mod.id}>
                            {(handle) => (
                              <div className="border rounded-xl p-3 space-y-2 bg-background">
                                <div className="flex items-center gap-2">
                                  {handle}
                                  <span className="font-semibold flex-1 min-w-0 truncate">
                                    {mi + 1}. {mod.title}
                                  </span>
                                  {mod.is_published === false && (
                                    <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Draft</Badge>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => duplicateModule.mutate(mod)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="sm"
                                    onClick={() => {
                                      setMForm({
                                        title: mod.title,
                                        description: mod.description || '',
                                        is_published: mod.is_published !== false,
                                      });
                                      setModuleDialog({ open: true, module: mod });
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="sm"
                                    onClick={() => askConfirm(
                                      'Delete module?',
                                      `"${mod.title}" and its ${lessons.length} lesson(s) will be removed.`,
                                      () => deleteModule.mutate(mod.id)
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm" variant="outline" className="gap-1"
                                    onClick={() => setLessonDialog({ open: true, moduleId: mod.id, lesson: null })}
                                  >
                                    <Plus className="h-4 w-4" /> Lesson
                                  </Button>
                                </div>

                                {mod.description && (
                                  <p className="text-xs text-muted-foreground pl-6">{mod.description}</p>
                                )}

                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd(mod.id)}>
                                  <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-1">
                                      {lessons.map((lesson) => {
                                        const meta = LESSON_META[lesson.lesson_type] || LESSON_META.video;
                                        const Icon = meta.icon;
                                        return (
                                          <SortableRow key={lesson.id} id={lesson.id}>
                                            {(lHandle) => (
                                              <div className="flex items-center gap-2 pl-4 py-1.5 pr-1 rounded-lg bg-muted/50">
                                                {lHandle}
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="flex-1 min-w-0 truncate text-sm">{lesson.title}</span>
                                                <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                                                {lesson.is_published === false && (
                                                  <Badge variant="secondary" className="text-[10px] gap-1"><EyeOff className="h-3 w-3" /> Draft</Badge>
                                                )}
                                                {lesson.is_free_preview && (
                                                  <Badge className="text-[10px] gap-1"><Sparkles className="h-3 w-3" /> Free</Badge>
                                                )}
                                                {(lesson.drip_days || lesson.drip_date) && (
                                                  <Badge variant="outline" className="text-[10px] gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    {lesson.drip_days ? `Day ${lesson.drip_days}` : new Date(lesson.drip_date!).toLocaleDateString()}
                                                  </Badge>
                                                )}
                                                <Button
                                                  variant="ghost" size="sm" disabled={mi === 0}
                                                  title="Move to previous module"
                                                  onClick={() => moveLessonToModule.mutate({ lessonId: lesson.id, moduleId: content.modules[mi - 1].id })}
                                                >
                                                  <ChevronUp className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost" size="sm" disabled={mi === content.modules.length - 1}
                                                  title="Move to next module"
                                                  onClick={() => moveLessonToModule.mutate({ lessonId: lesson.id, moduleId: content.modules[mi + 1].id })}
                                                >
                                                  <ChevronDown className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost" size="sm"
                                                  onClick={() => setLessonDialog({ open: true, moduleId: mod.id, lesson })}
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost" size="sm"
                                                  onClick={() => askConfirm(
                                                    'Delete lesson?',
                                                    `"${lesson.title}" will be removed from this module.`,
                                                    () => deleteLesson.mutate(lesson.id)
                                                  )}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </SortableRow>
                                        );
                                      })}
                                      {lessons.length === 0 && (
                                        <p className="text-xs text-muted-foreground pl-6 py-1">No lessons in this module yet.</p>
                                      )}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              </div>
                            )}
                          </SortableRow>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>

              <TabsContent value="students" className="mt-4">
                <CourseStudentsPanel courseId={selectedCourse.id} lessonIds={lessonIds} lessonTitles={lessonTitles} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

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
              <Label>Subtitle (one short line)</Label>
              <Input value={cForm.subtitle} onChange={(e) => setCForm({ ...cForm, subtitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={cForm.description} onChange={(e) => setCForm({ ...cForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Welcome note (shown at the top of the course)</Label>
              <Textarea value={cForm.intro_note} onChange={(e) => setCForm({ ...cForm, intro_note: e.target.value })} rows={2} />
            </div>
            <ImageUploader
              value={cForm.cover_image_url}
              onChange={(url) => setCForm({ ...cForm, cover_image_url: url })}
              bucket="program-covers"
              folder="learn-covers"
              label="Cover image"
              previewHeight="h-36"
            />
            <div className="space-y-1.5">
              <Label>Language</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <Button
                    key={l.code || 'none'}
                    type="button"
                    size="sm"
                    variant={(cForm.language || '') === l.code ? 'default' : 'outline'}
                    onClick={() => setCForm({ ...cForm, language: l.code })}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={cForm.sort_order} onChange={(e) => setCForm({ ...cForm, sort_order: parseInt(e.target.value) || 0 })} className="w-32" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Published (visible to enrolled students)</Label>
              <Switch checked={cForm.is_published} onCheckedChange={(v) => setCForm({ ...cForm, is_published: v })} />
            </div>
            <div className="space-y-2">
              <Label>Access — pick a program, then its rounds</Label>

              {cRounds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cRounds.map((id) => {
                    const r = allRounds?.find((x: any) => x.id === id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCRounds(cRounds.filter((x) => x !== id))}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
                      >
                        {r ? `${r.round_name} · ${r.program_slug}` : 'Round'}
                        <X className="h-3 w-3" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {programGroups.map((g) => (
                  <Button
                    key={g.slug}
                    type="button"
                    size="sm"
                    variant={cProgram === g.slug ? 'default' : 'outline'}
                    onClick={() => setCProgram(cProgram === g.slug ? null : g.slug)}
                  >
                    {g.slug}
                    <span className="ml-1.5 opacity-60">{g.rounds.length}</span>
                  </Button>
                ))}
              </div>

              {cProgram && (
                <div className="rounded-lg border p-2 flex flex-wrap gap-2">
                  {programGroups.find((g) => g.slug === cProgram)?.rounds.map((r: any) => {
                    const on = cRounds.includes(r.id);
                    return (
                      <Button
                        key={r.id}
                        type="button"
                        size="sm"
                        variant={on ? 'default' : 'outline'}
                        onClick={() =>
                          setCRounds(on ? cRounds.filter((x) => x !== r.id) : [...cRounds, r.id])
                        }
                      >
                        {on && <Check className="h-3.5 w-3.5 mr-1" />}
                        {r.round_name}
                      </Button>
                    );
                  })}
                </div>
              )}
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
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">Drafts are hidden from students</p>
              </div>
              <Switch checked={mForm.is_published} onCheckedChange={(v) => setMForm({ ...mForm, is_published: v })} />
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
      <LessonEditorDialog
        open={lessonDialog.open}
        onOpenChange={(o) => setLessonDialog((s) => ({ ...s, open: o }))}
        moduleId={lessonDialog.moduleId}
        lesson={lessonDialog.lesson}
        nextSortOrder={
          Math.max(
            0,
            ...((content?.lessons.filter((l) => l.module_id === lessonDialog.moduleId).map((l) => l.sort_order)) || [0])
          ) + 1
        }
        onSaved={invalidate}
      />

      {/* Confirm dialog */}
      <AlertDialog open={confirm.open} onOpenChange={(o) => setConfirm((c) => ({ ...c, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { confirm.action(); setConfirm((c) => ({ ...c, open: false })); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
