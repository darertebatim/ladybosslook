import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Sparkles, GripVertical, Eye } from 'lucide-react';
import { useAdminReadingCards, useCreateCard, useUpdateCard, useDeleteCard, type ReadingCard, type ReadingLesson } from '@/hooks/useReadingLessons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const BG_COLORS = ['#F0E3FF', '#D7E9FF', '#E2F9F0', '#FFF3D6', '#FFE0F5', '#FFF492', '#FFE6C9', '#DBEAFE', '#FEE2E2', '#E0FBB8'];

interface Props {
  lesson: ReadingLesson;
}

export function ReadingCardEditor({ lesson }: Props) {
  const { data: cards = [], isLoading } = useAdminReadingCards(lesson.id);
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<ReadingCard | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [form, setForm] = useState({
    title: '',
    content: '',
    key_point: '',
    bg_color: '#F0E3FF',
  });

  const openCreate = () => {
    setEditingCard(null);
    setForm({ title: '', content: '', key_point: '', bg_color: '#F0E3FF' });
    setShowForm(true);
  };

  const openEdit = (card: ReadingCard) => {
    setEditingCard(card);
    setForm({
      title: card.title,
      content: card.content,
      key_point: card.key_point || '',
      bg_color: card.bg_color || '#F0E3FF',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editingCard) {
      await updateCard.mutateAsync({ id: editingCard.id, ...form });
    } else {
      await createCard.mutateAsync({ lesson_id: lesson.id, sort_order: cards.length, ...form });
    }
    setShowForm(false);
  };

  const handleGenerateAI = async () => {
    if (!lesson.source_document_id) {
      toast({ title: 'No source document', description: 'Link a document to this lesson first, or create cards manually.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-reading-cards', {
        body: { document_id: lesson.source_document_id, lesson_id: lesson.id },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-reading-cards', lesson.id] });
      toast({ title: 'Cards generated!', description: `${data?.count || 0} cards created from the document.` });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">{lesson.emoji}</span> {lesson.title} — Cards
          </h2>
          <p className="text-sm text-muted-foreground">{cards.length} cards</p>
        </div>
        <div className="flex gap-2">
          {cards.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setPreviewIndex(0); setShowPreview(true); }}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleGenerateAI} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-1" /> {generating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Add Card
          </Button>
        </div>
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading cards...</p>
        ) : cards.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No cards yet. Add manually or generate with AI.</CardContent></Card>
        ) : (
          cards.map((card, i) => (
            <Card key={card.id} className="overflow-hidden">
              <div className="flex items-start">
                <div className="w-2 self-stretch" style={{ backgroundColor: card.bg_color }} />
                <CardContent className="flex-1 py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                        <span className="font-medium">{card.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{card.content}</p>
                      {card.key_point && (
                        <p className="text-xs font-medium mt-1 text-primary">💡 {card.key_point}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(card)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteCard.mutate({ id: card.id, lessonId: lesson.id })}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Card form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Edit Card' : 'Add Card'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Card headline" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Main text (2-4 sentences)" rows={4} />
            </div>
            <div>
              <Label>Key Takeaway</Label>
              <Input value={form.key_point} onChange={e => setForm(f => ({ ...f, key_point: e.target.value }))} placeholder="Bold takeaway line" />
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {BG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, bg_color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.bg_color === c ? 'border-primary scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={!form.title || !form.content} className="w-full">
              {editingCard ? 'Update' : 'Add'} Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {cards[previewIndex] && (
            <div className="min-h-[400px] flex flex-col justify-between p-6" style={{ backgroundColor: cards[previewIndex].bg_color }}>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="outline" className="bg-white/60">{previewIndex + 1} / {cards.length}</Badge>
                  <span className="text-2xl">{lesson.emoji}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{cards[previewIndex].title}</h3>
                <p className="text-gray-700 leading-relaxed">{cards[previewIndex].content}</p>
              </div>
              {cards[previewIndex].key_point && (
                <div className="mt-4 p-3 rounded-lg bg-white/50 border border-white/30">
                  <p className="font-semibold text-sm text-gray-800">💡 {cards[previewIndex].key_point}</p>
                </div>
              )}
              <div className="flex justify-between mt-4">
                <Button variant="outline" size="sm" disabled={previewIndex === 0} onClick={() => setPreviewIndex(i => i - 1)}>← Prev</Button>
                <Button variant="outline" size="sm" disabled={previewIndex === cards.length - 1} onClick={() => setPreviewIndex(i => i + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
