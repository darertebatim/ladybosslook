import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, BookOpen, Layers, ArrowLeft, Clock, Image as ImageIcon, Smile } from 'lucide-react';
import { useAdminReadingContent, useCreateContent, useUpdateContent, useDeleteContent } from '@/hooks/useReading';
import { ReadingSectionEditor } from '@/components/admin/ReadingSectionEditor';
import { EmojiPicker } from '@/components/app/EmojiPicker';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import type { ReadingContent } from '@/hooks/useReading';


const CATEGORIES = ['general', 'money', 'mindset', 'business', 'wellness', 'relationships', 'productivity', 'story'];

const COLOR_PALETTE = [
  { name: 'pink', value: '#FFE0F5' },
  { name: 'peach', value: '#FFE6C9' },
  { name: 'yellow', value: '#FFF492' },
  { name: 'lime', value: '#E2F9F0' },
  { name: 'sky', value: '#D7E9FF' },
  { name: 'mint', value: '#E0FBB8' },
  { name: 'lavender', value: '#F0E3FF' },
];

type CoverType = 'emoji' | 'image';

export default function ReadingManager() {
  const { data: allContent = [], isLoading } = useAdminReadingContent();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  const [editingContent, setEditingContent] = useState<ReadingContent | null>(null);
  const [sectionEditorContent, setSectionEditorContent] = useState<ReadingContent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [coverType, setCoverType] = useState<CoverType>('emoji');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    author: '',
    category: 'general',
    type: 'story' as 'story' | 'lesson',
    reading_time_minutes: 5,
    theme_color: '#F0E3FF',
    emoji: '📖',
    cover_url: '',
    cover_aspect: 'square' as string,
    is_published: false,
    is_premium: false,
  });

  const openCreate = () => {
    setEditingContent(null);
    setCoverType('emoji');
    setForm({
      title: '', subtitle: '', description: '', author: '',
      category: 'general', type: 'story',
      reading_time_minutes: 5, theme_color: '#F0E3FF',
      emoji: '📖', cover_url: '', cover_aspect: 'square',
      is_published: false, is_premium: false,
    });
    setShowForm(true);
  };

  const openEdit = (content: ReadingContent) => {
    setEditingContent(content);
    setCoverType(content.cover_url ? 'image' : 'emoji');
    setForm({
      title: content.title,
      subtitle: content.subtitle || '',
      description: content.description || '',
      author: content.author || '',
      category: content.category || 'general',
      type: content.type,
      reading_time_minutes: content.reading_time_minutes || 5,
      theme_color: content.theme_color || '#F0E3FF',
      emoji: content.emoji || '📖',
      cover_url: content.cover_url || '',
      is_published: content.is_published,
      is_premium: content.is_premium,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      cover_url: coverType === 'image' ? form.cover_url : null,
      emoji: coverType === 'emoji' ? form.emoji : null,
    };
    if (editingContent) {
      await updateContent.mutateAsync({ id: editingContent.id, ...payload });
    } else {
      await createContent.mutateAsync(payload);
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
          <Plus className="h-4 w-4 mr-2" /> New Content
        </Button>
      </div>

      {/* Content Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit' : 'New'} Content</DialogTitle>
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

            {/* Type + Category */}
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reading time is auto-calculated from section content */}

            {/* Theme Color Palette */}
            <div>
              <Label>Theme Color</Label>
              <div className="flex gap-2 mt-1.5">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setForm(f => ({ ...f, theme_color: c.value }))}
                    className="w-9 h-9 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c.value,
                      borderColor: form.theme_color === c.value ? '#000' : 'transparent',
                      transform: form.theme_color === c.value ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Cover Type Toggle */}
            <div>
              <Label>Cover</Label>
              <div className="flex gap-2 mt-1.5 mb-3">
                <button
                  onClick={() => setCoverType('emoji')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    coverType === 'emoji' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Smile className="h-3.5 w-3.5" /> Emoji
                </button>
                <button
                  onClick={() => setCoverType('image')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    coverType === 'image' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Image
                </button>
              </div>

              {coverType === 'emoji' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-14 text-2xl"
                  onClick={() => setEmojiPickerOpen(true)}
                >
                  <FluentEmoji emoji={form.emoji} size={32} />
                  <span className="ml-2 text-sm text-muted-foreground font-normal">Tap to change emoji</span>
                </Button>
              )}

              {coverType === 'image' && (
                <ImageUploader
                  value={form.cover_url}
                  onChange={(url) => setForm(f => ({ ...f, cover_url: url }))}
                  bucket="reading-covers"
                  folder="covers"
                  label=""
                />
              )}
            </div>

            {/* Toggles */}
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

      {/* Emoji Picker */}
      <EmojiPicker
        open={emojiPickerOpen}
        onOpenChange={setEmojiPickerOpen}
        selectedEmoji={form.emoji}
        onSelect={(emoji) => {
          setForm(f => ({ ...f, emoji }));
          setEmojiPickerOpen(false);
        }}
      />

      {/* Content Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : allContent.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No content yet</p>
          <p className="text-sm">Create your first story or lesson</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allContent.map(content => (
            <div
              key={content.id}
              className="flex items-center gap-3 p-3 rounded-2xl border"
              style={{ backgroundColor: content.theme_color || '#F0E3FF' }}
            >
              {/* Cover preview */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
              >
                {content.cover_url ? (
                  <img src={content.cover_url} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <FluentEmoji emoji={content.emoji || '📖'} size={32} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{content.title}</h3>
                  {!content.is_published && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Draft</Badge>}
                  {content.is_premium && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Pro</Badge>}
                </div>
                {content.subtitle && <p className="text-xs text-gray-600 truncate">{content.subtitle}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500 capitalize">{content.type}</span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-500 capitalize">{content.category}</span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />{content.reading_time_minutes}m
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 flex-shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSectionEditorContent(content)}>
                  <Layers className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(content)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteContent.mutate(content.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
