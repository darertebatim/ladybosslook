import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, BookOpen, Layers, ArrowLeft, Clock } from 'lucide-react';
import { useAdminReadingContent, useCreateContent, useUpdateContent, useDeleteContent } from '@/hooks/useReading';
import { ReadingSectionEditor } from '@/components/admin/ReadingSectionEditor';
import type { ReadingContent } from '@/hooks/useReading';

const CATEGORIES = ['general', 'money', 'mindset', 'business', 'wellness', 'relationships', 'productivity', 'story'];

export default function ReadingManager() {
  const { data: allContent = [], isLoading } = useAdminReadingContent();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  const [editingContent, setEditingContent] = useState<ReadingContent | null>(null);
  const [sectionEditorContent, setSectionEditorContent] = useState<ReadingContent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('story');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    author: '',
    category: 'general',
    type: 'story' as 'story' | 'lesson',
    reading_time_minutes: 5,
    theme_color: '#F0E3FF',
    is_published: false,
    is_premium: false,
  });

  const filteredContent = allContent.filter(c => c.type === activeTab);

  const openCreate = () => {
    setEditingContent(null);
    setForm({
      title: '', subtitle: '', description: '', author: '',
      category: 'general', type: activeTab as 'story' | 'lesson',
      reading_time_minutes: 5, theme_color: '#F0E3FF',
      is_published: false, is_premium: false,
    });
    setShowForm(true);
  };

  const openEdit = (content: ReadingContent) => {
    setEditingContent(content);
    setForm({
      title: content.title,
      subtitle: content.subtitle || '',
      description: content.description || '',
      author: content.author || '',
      category: content.category || 'general',
      type: content.type,
      reading_time_minutes: content.reading_time_minutes || 5,
      theme_color: content.theme_color || '#F0E3FF',
      is_published: content.is_published,
      is_premium: content.is_premium,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editingContent) {
      await updateContent.mutateAsync({ id: editingContent.id, ...form });
    } else {
      await createContent.mutateAsync(form);
    }
    setShowForm(false);
  };

  if (sectionEditorContent) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Button variant="ghost" onClick={() => setSectionEditorContent(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Content
        </Button>
        <ReadingSectionEditor content={sectionEditorContent} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Reading Content
          </h1>
          <p className="text-muted-foreground">Manage stories and lessons</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New {activeTab === 'story' ? 'Story' : 'Lesson'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="story">Stories</TabsTrigger>
          <TabsTrigger value="lesson">Lessons</TabsTrigger>
        </TabsList>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit' : 'New'} {form.type === 'story' ? 'Story' : 'Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Content title" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Short tagline" />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief summary" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reading Time (min)</Label>
                <Input type="number" value={form.reading_time_minutes} onChange={e => setForm(f => ({ ...f, reading_time_minutes: parseInt(e.target.value) || 5 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Theme Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.theme_color} onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={form.theme_color} onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'story' | 'lesson' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="lesson">Lesson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_premium} onCheckedChange={v => setForm(f => ({ ...f, is_premium: v }))} />
                <Label>Premium</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={!form.title || createContent.isPending || updateContent.isPending} className="w-full">
              {editingContent ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filteredContent.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No {activeTab === 'story' ? 'stories' : 'lessons'} yet.</TableCell></TableRow>
              ) : (
                filteredContent.map(content => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{content.title}</div>
                        {content.subtitle && <div className="text-sm text-muted-foreground">{content.subtitle}</div>}
                        {content.author && <div className="text-xs text-muted-foreground">by {content.author}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{content.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" /> {content.reading_time_minutes}m
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={content.is_published ? 'default' : 'secondary'}>
                          {content.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {content.is_premium && <Badge variant="outline">Premium</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSectionEditorContent(content)}>
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(content)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteContent.mutate(content.id)}>
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
