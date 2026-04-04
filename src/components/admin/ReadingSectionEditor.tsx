import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import { useAdminReadingSections, useCreateSection, useUpdateSection, useDeleteSection } from '@/hooks/useReading';
import type { ReadingContent, ReadingSection } from '@/hooks/useReading';

interface Props {
  content: ReadingContent;
}

export function ReadingSectionEditor({ content }: Props) {
  const { data: sections = [], isLoading } = useAdminReadingSections(content.id);
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [editingSection, setEditingSection] = useState<ReadingSection | null>(null);
  const [form, setForm] = useState({ heading: '', body: '', quote: '' });

  const openNew = () => {
    setEditingSection(null);
    setForm({ heading: '', body: '', quote: '' });
  };

  const openEdit = (section: ReadingSection) => {
    setEditingSection(section);
    setForm({
      heading: section.heading || '',
      body: section.body || '',
      quote: section.quote || '',
    });
  };

  const handleSave = async () => {
    if (editingSection) {
      await updateSection.mutateAsync({ id: editingSection.id, ...form });
    } else {
      await createSection.mutateAsync({
        content_id: content.id,
        sort_order: sections.length,
        ...form,
      });
    }
    setForm({ heading: '', body: '', quote: '' });
    setEditingSection(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{content.title}</h2>
          <p className="text-sm text-muted-foreground">Manage sections ({sections.length} sections)</p>
        </div>
      </div>

      {/* Section Form */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium">{editingSection ? 'Edit Section' : 'Add New Section'}</h3>
          <div>
            <Label>Heading</Label>
            <Input value={form.heading} onChange={e => setForm(f => ({ ...f, heading: e.target.value }))} placeholder="Section heading" />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Section body text..." rows={6} />
          </div>
          <div>
            <Label>Pull Quote (optional)</Label>
            <Input value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} placeholder="Highlighted quote" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!form.body || createSection.isPending || updateSection.isPending}>
              {editingSection ? 'Update Section' : 'Add Section'}
            </Button>
            {editingSection && (
              <Button variant="outline" onClick={() => { setEditingSection(null); setForm({ heading: '', body: '', quote: '' }); }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading sections...</p>
        ) : sections.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sections yet. Add your first one above.</p>
        ) : (
          sections.map((section, index) => (
            <Card key={section.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <GripVertical className="h-4 w-4" />
                      <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      {section.heading && <h4 className="font-medium mb-1">{section.heading}</h4>}
                      <p className="text-sm text-muted-foreground line-clamp-3">{section.body}</p>
                      {section.quote && (
                        <p className="text-sm italic text-primary mt-1 border-l-2 border-primary pl-2">"{section.quote}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(section)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSection.mutate({ id: section.id, contentId: content.id })}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
