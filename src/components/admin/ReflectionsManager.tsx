import { useState, useMemo } from 'react';
import {
  useAllReflections,
  useCreateReflection,
  useUpdateReflection,
  useDeleteReflection,
  useAdminReflectionPages,
  useSaveReflectionPages,
  Reflection,
  REFLECTION_CATEGORIES,
} from '@/hooks/useReflections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { EmojiPicker } from '@/components/app/EmojiPicker';

interface PageDraft {
  id?: string;
  page_order: number;
  type: string;
  content: string;
  description?: string;
}

export function ReflectionsManager() {
  const { data: reflections, isLoading } = useAllReflections();
  const createMutation = useCreateReflection();
  const updateMutation = useUpdateReflection();
  const deleteMutation = useDeleteReflection();

  const [editing, setEditing] = useState<Partial<Reflection> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    if (!reflections) return [];
    const cats = new Set(reflections.map(r => r.category).filter(Boolean));
    return REFLECTION_CATEGORIES.filter(c => cats.has(c.value));
  }, [reflections]);

  const filtered = selectedCategory
    ? reflections?.filter(r => r.category === selectedCategory)
    : reflections;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const openCreate = () => {
    setIsNew(true);
    setEditing({ title: '', subtitle: '', cover_image_url: '', emoji: '', is_active: true, is_featured: false, is_free: true, sort_order: 0, category: 'deep-dives' });
  };

  const openEdit = (r: Reflection) => {
    setIsNew(false);
    setEditing({ ...r });
  };

  const handleSave = async () => {
    if (!editing?.title) { toast.error('Title is required'); return; }
    if (isNew) {
      await createMutation.mutateAsync(editing);
    } else {
      await updateMutation.mutateAsync(editing as Reflection & { id: string });
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reflection and all its pages?')) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reflections</h3>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCategory ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCategory === cat.value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <FluentEmoji emoji={cat.emoji} size={16} /> {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered?.map((r) => (
          <Card key={r.id} className="flex items-center gap-3 p-3">
            {r.cover_image_url ? (
              <img src={r.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
            ) : r.emoji ? (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FluentEmoji emoji={r.emoji} size={28} />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">📝</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{r.subtitle || '—'} · {REFLECTION_CATEGORIES.find(c => c.value === r.category)?.label || r.category || '—'}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {r.is_active ? 'Active' : 'Inactive'}
            </span>
            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'New Reflection' : 'Edit Reflection'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={editing.subtitle || ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Emoji (shown when no cover image)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(true)}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors"
                  >
                    {editing.emoji ? (
                      <FluentEmoji emoji={editing.emoji} size={36} />
                    ) : (
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {editing.emoji && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ ...editing, emoji: '' })}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editing.category || 'deep-dives'} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REFLECTION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <FluentEmoji emoji={cat.emoji} size={16} className="mr-1" /> {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ImageUploader
                value={editing.cover_image_url || ''}
                onChange={(url) => setEditing({ ...editing, cover_image_url: url })}
                label="Cover Image (square)"
              />
              <div>
                <Label>Cover Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={editing.cover_color || '#ffffff'}
                    onChange={(e) => setEditing({ ...editing, cover_color: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={editing.cover_color || '#ffffff'}
                    onChange={(e) => setEditing({ ...editing, cover_color: e.target.value })}
                    className="w-32"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div className="flex gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_featured ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })} />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_free ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_free: v })} />
                  <Label>Free</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.shuffle_mode ?? false} onCheckedChange={(v) => setEditing({ ...editing, shuffle_mode: v })} />
                  <Label>Shuffle Mode</Label>
                </div>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="w-24" />
              </div>

              {/* Pages editor (only when editing existing) */}
              {!isNew && editing.id && <PagesEditor reflectionId={editing.id} />}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {isNew ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PagesEditor({ reflectionId }: { reflectionId: string }) {
  const { data: existingPages, isLoading } = useAdminReflectionPages(reflectionId);
  const saveMutation = useSaveReflectionPages();
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize pages from DB once
  if (existingPages && !initialized) {
    setPages(existingPages.map((p) => ({ id: p.id, page_order: p.page_order, type: p.type, content: p.content, description: p.description || '' })));
    setInitialized(true);
  }

  const addPage = () => {
    setPages([...pages, { page_order: pages.length, type: 'question', content: '', description: '' }]);
  };

  const removePage = (idx: number) => {
    setPages(pages.filter((_, i) => i !== idx).map((p, i) => ({ ...p, page_order: i })));
  };

  const updatePage = (idx: number, field: string, value: string) => {
    setPages(pages.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleSave = () => {
    saveMutation.mutate({ reflectionId, pages: pages.map((p, i) => ({ ...p, page_order: i })) });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading pages…</p>;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Pages ({pages.length})</Label>
        <Button size="sm" variant="outline" onClick={addPage}><Plus className="h-3 w-3 mr-1" /> Add Page</Button>
      </div>

      {pages.map((page, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Page {idx + 1}</span>
            <Select value={page.type} onValueChange={(v) => updatePage(idx, 'type', v)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="message">Message</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePage(idx)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            value={page.content}
            onChange={(e) => updatePage(idx, 'content', e.target.value)}
            placeholder={page.type === 'question' ? 'Enter the question…' : 'Enter the message text…'}
            className="min-h-[60px]"
          />
          <Textarea
            value={page.description || ''}
            onChange={(e) => updatePage(idx, 'description', e.target.value)}
            placeholder="Description (optional)…"
            className="min-h-[40px] text-sm"
          />
        </div>
      ))}

      {pages.length > 0 && (
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
          Save Pages
        </Button>
      )}
    </div>
  );
}
