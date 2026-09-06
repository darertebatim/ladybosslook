import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Play, Headphones, BookOpen, FileText, Upload, X, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import type { LearnLesson, LessonType, LessonAttachment } from '@/hooks/useLearn';

export const LESSON_TYPE_OPTIONS: { value: LessonType; label: string; icon: typeof Play }[] = [
  { value: 'video', label: 'Video', icon: Play },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'document', label: 'Document (Reading)', icon: BookOpen },
  { value: 'pdf', label: 'PDF / file', icon: FileText },
];

const FILES_BUCKET = 'documents';

async function uploadFile(file: File, folder: string) {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(FILES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(FILES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string | null;
  lesson: LearnLesson | null;
  nextSortOrder: number;
  onSaved: () => void;
}

interface FormState {
  title: string;
  description: string;
  content_html: string;
  lesson_type: LessonType;
  video_id: string;
  audio_id: string;
  reading_id: string;
  media_label: string;
  pdf_url: string;
  duration_minutes: string;
  is_published: boolean;
  is_free_preview: boolean;
  drip_days: string;
  drip_date: string;
  attachments: LessonAttachment[];
}

const emptyForm: FormState = {
  title: '', description: '', content_html: '', lesson_type: 'video',
  video_id: '', audio_id: '', reading_id: '', media_label: '', pdf_url: '',
  duration_minutes: '', is_published: true, is_free_preview: false,
  drip_days: '', drip_date: '', attachments: [],
};

export function LessonEditorDialog({ open, onOpenChange, moduleId, lesson, nextSortOrder, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (lesson) {
      setForm({
        title: lesson.title || '',
        description: lesson.description || '',
        content_html: lesson.content_html || '',
        lesson_type: lesson.lesson_type || 'video',
        video_id: lesson.video_id || '',
        audio_id: lesson.audio_id || '',
        reading_id: lesson.reading_id || '',
        media_label: '',
        pdf_url: lesson.pdf_url || '',
        duration_minutes: lesson.duration_seconds ? String(Math.round(lesson.duration_seconds / 60)) : '',
        is_published: lesson.is_published !== false,
        is_free_preview: !!lesson.is_free_preview,
        drip_days: lesson.drip_days != null ? String(lesson.drip_days) : '',
        drip_date: lesson.drip_date ? lesson.drip_date.slice(0, 10) : '',
        attachments: Array.isArray(lesson.attachments) ? lesson.attachments : [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, lesson]);

  const save = useMutation({
    mutationFn: async () => {
      const durationSeconds = form.duration_minutes
        ? Math.round(parseFloat(form.duration_minutes) * 60)
        : null;
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        content_html: form.content_html.trim() || null,
        lesson_type: form.lesson_type,
        video_id: form.lesson_type === 'video' ? form.video_id || null : null,
        audio_id: form.lesson_type === 'audio' ? form.audio_id || null : null,
        reading_id: form.lesson_type === 'document' ? form.reading_id || null : null,
        pdf_url: form.lesson_type === 'pdf' ? form.pdf_url.trim() || null : null,
        duration_seconds: durationSeconds,
        is_published: form.is_published,
        is_free_preview: form.is_free_preview,
        drip_days: form.drip_days ? parseInt(form.drip_days) : null,
        drip_date: form.drip_date ? new Date(form.drip_date).toISOString() : null,
        attachments: form.attachments,
      };
      if (lesson) {
        const { error } = await supabase.from('learn_lessons').update(payload).eq('id', lesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('learn_lessons').insert({
          ...payload,
          module_id: moduleId!,
          sort_order: nextSortOrder,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Lesson saved');
      onOpenChange(false);
      onSaved();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save lesson'),
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const url = await uploadFile(file, 'learn/lessons');
      setForm((f) => ({ ...f, pdf_url: url, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const url = await uploadFile(file, 'learn/attachments');
      setForm((f) => ({ ...f, attachments: [...f.attachments, { name: file.name, url }] }));
      toast.success('Attachment added');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAttachment(false);
      if (attachInputRef.current) attachInputRef.current.value = '';
    }
  };

  const currentMediaId =
    form.lesson_type === 'video' ? form.video_id
      : form.lesson_type === 'audio' ? form.audio_id
        : form.lesson_type === 'document' ? form.reading_id : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'New Lesson'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.lesson_type}
              onValueChange={(v) => setForm({ ...form, lesson_type: v as LessonType, media_label: '' })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LESSON_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Media picker */}
          {(form.lesson_type === 'video' || form.lesson_type === 'audio' || form.lesson_type === 'document') && (
            <div className="space-y-2">
              <Label>
                {form.lesson_type === 'video' ? 'Video' : form.lesson_type === 'audio' ? 'Audio track' : 'Reading'}
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                <MediaLibraryPicker
                  kind={form.lesson_type === 'document' ? 'reading' : form.lesson_type}
                  triggerLabel={currentMediaId ? 'Change selection' : 'Choose from library'}
                  onPick={(item) => {
                    setForm((f) => ({
                      ...f,
                      video_id: f.lesson_type === 'video' ? item.id : f.video_id,
                      audio_id: f.lesson_type === 'audio' ? item.id : f.audio_id,
                      reading_id: f.lesson_type === 'document' ? item.id : f.reading_id,
                      media_label: item.title,
                      title: f.title || item.title,
                      duration_minutes:
                        item.duration_seconds && !f.duration_minutes
                          ? String(Math.round(item.duration_seconds / 60))
                          : f.duration_minutes,
                    }));
                  }}
                />
                {currentMediaId ? (
                  <Badge variant="secondary" className="max-w-[280px] truncate">
                    {form.media_label || 'Selected'}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Nothing selected yet</span>
                )}
              </div>
            </div>
          )}

          {form.lesson_type === 'pdf' && (
            <div className="space-y-2">
              <Label>PDF / file</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={form.pdf_url}
                  onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                  placeholder="https://... or upload"
                />
                <input ref={pdfInputRef} type="file" className="hidden" onChange={handlePdfUpload} />
                <Button
                  type="button" variant="outline"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={uploadingPdf}
                  className="gap-2 shrink-0"
                >
                  {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Short summary (shown under the title)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Lesson notes (rich text, shown in the app)</Label>
            <RichTextEditor
              value={form.content_html}
              onChange={(v) => setForm({ ...form, content_html: v })}
              placeholder="Add notes, steps, links or images for this lesson..."
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments (worksheets, handouts)</Label>
            <div className="space-y-2">
              {form.attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 border rounded-lg p-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={a.name}
                    onChange={(e) => {
                      const next = [...form.attachments];
                      next[i] = { ...next[i], name: e.target.value };
                      setForm({ ...form, attachments: next });
                    }}
                    className="h-8"
                  />
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, x) => x !== i) })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <input ref={attachInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => attachInputRef.current?.click()}
                disabled={uploadingAttachment}
                className="gap-2"
              >
                {uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Add attachment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                placeholder="Auto-filled from media"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unlock after (days from enrolment)</Label>
              <Input
                type="number"
                value={form.drip_days}
                onChange={(e) => setForm({ ...form, drip_days: e.target.value })}
                placeholder="Leave empty = available now"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Or unlock on a fixed date</Label>
            <Input
              type="date"
              value={form.drip_date}
              onChange={(e) => setForm({ ...form, drip_date: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-muted-foreground">Drafts are hidden from students</p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Free preview</p>
              <p className="text-xs text-muted-foreground">Viewable without enrolment</p>
            </div>
            <Switch checked={form.is_free_preview} onCheckedChange={(v) => setForm({ ...form, is_free_preview: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={!form.title.trim() || save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
