import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, BookOpen, Layers, Sparkles, ArrowLeft } from 'lucide-react';
import { useAdminReadingLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from '@/hooks/useReadingLessons';
import { ReadingCardEditor } from '@/components/admin/ReadingCardEditor';
import type { ReadingLesson } from '@/hooks/useReadingLessons';

const CATEGORIES = ['general', 'money', 'mindset', 'business', 'wellness', 'relationships', 'productivity'];

export default function ReadingManager() {
  const { data: lessons = [], isLoading } = useAdminReadingLessons();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [editingLesson, setEditingLesson] = useState<ReadingLesson | null>(null);
  const [cardEditorLesson, setCardEditorLesson] = useState<ReadingLesson | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    emoji: '📖',
    category: 'general',
    is_published: false,
  });

  const openCreate = () => {
    setEditingLesson(null);
    setForm({ title: '', subtitle: '', description: '', emoji: '📖', category: 'general', is_published: false });
    setShowForm(true);
  };

  const openEdit = (lesson: ReadingLesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      subtitle: lesson.subtitle || '',
      description: lesson.description || '',
      emoji: lesson.emoji || '📖',
      category: lesson.category || 'general',
      is_published: lesson.is_published,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editingLesson) {
      await updateLesson.mutateAsync({ id: editingLesson.id, ...form });
    } else {
      await createLesson.mutateAsync(form);
    }
    setShowForm(false);
  };

  if (cardEditorLesson) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Button variant="ghost" onClick={() => setCardEditorLesson(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Lessons
        </Button>
        <ReadingCardEditor lesson={cardEditorLesson} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Reading Lessons
          </h1>
          <p className="text-muted-foreground">Manage micro-learning card lessons</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Lesson
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-20">
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
              </div>
              <div className="flex-1">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Lesson title" />
              </div>
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Short tagline" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief summary" rows={3} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
              <Label>Published</Label>
            </div>
            <Button onClick={handleSave} disabled={!form.title || createLesson.isPending || updateLesson.isPending} className="w-full">
              {editingLesson ? 'Update' : 'Create'} Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : lessons.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No lessons yet. Create your first one!</TableCell></TableRow>
              ) : (
                lessons.map(lesson => (
                  <TableRow key={lesson.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{lesson.emoji}</span>
                        <div>
                          <div className="font-medium">{lesson.title}</div>
                          {lesson.subtitle && <div className="text-sm text-muted-foreground">{lesson.subtitle}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lesson.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
                        {lesson.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setCardEditorLesson(lesson)}>
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(lesson)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteLesson.mutate(lesson.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
