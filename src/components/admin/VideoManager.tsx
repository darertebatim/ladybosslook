import { useState, useRef } from "react";
import { compressImage } from "@/lib/imageUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, Pencil, Link, X, Image } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { detectVideoType } from "@/lib/videoUtils";

export const VideoManager = () => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const editThumbInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "", description: "", playlist_id: "", url: "", is_vertical: false, thumbnail_url: "",
  });

  const { data: playlists } = useQuery({
    queryKey: ['video-playlists-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlists').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: videoContent } = useQuery({
    queryKey: ['admin-video-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_content')
        .select('*, video_playlist_items(playlist_id, video_playlists(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadThumbnail = async (file: File, videoId?: string): Promise<string> => {
    const compressed = await compressImage(file, { maxSizeMB: 0.3, maxWidthOrHeight: 800 });
    const ext = compressed.type === 'image/webp' ? 'webp' : file.name.split('.').pop();
    const name = `thumb-${videoId || 'new'}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('video_files').upload(name, compressed, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('video_files').getPublicUrl(name).data.publicUrl;
  };

  const handleThumbUpload = async (file: File, isEdit: boolean) => {
    setIsUploadingThumb(true);
    try {
      const url = await uploadThumbnail(file, isEdit ? editingVideo?.id : undefined);
      setFormData(prev => ({ ...prev, thumbnail_url: url }));
      toast.success('Thumbnail uploaded');
    } catch (e: any) { toast.error(e.message || 'Upload failed'); }
    finally { setIsUploadingThumb(false); }
  };

  const ThumbnailField = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-2">
      <Label>Thumbnail</Label>
      {formData.thumbnail_url ? (
        <div className="relative w-24 h-16 group">
          <img src={formData.thumbnail_url} alt="Thumb" className="w-full h-full object-cover rounded-lg border" />
          <Button type="button" variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="w-24 h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">No thumb</div>
      )}
      <input type="file" ref={isEdit ? editThumbInputRef : thumbInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f, isEdit); }} />
      <Button type="button" variant="outline" size="sm" onClick={() => (isEdit ? editThumbInputRef : thumbInputRef).current?.click()} disabled={isUploadingThumb}>
        {isUploadingThumb ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Image className="h-4 w-4 mr-1" />} Upload Thumbnail
      </Button>
    </div>
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (urlMode) {
        if (!formData.url) throw new Error('No URL provided');
        const videoType = detectVideoType(formData.url);
        const { data: newVideo, error } = await supabase
          .from('video_content')
          .insert({
            title: formData.title || 'Untitled Video',
            description: formData.description,
            file_url: formData.url,
            video_type: videoType === 'direct' ? 'direct' : videoType,
            is_vertical: formData.is_vertical,
            thumbnail_url: formData.thumbnail_url || null,
            is_free: true, sort_order: 0,
            published_at: new Date().toISOString(),
          })
          .select().single();
        if (error) throw error;
        if (formData.playlist_id && newVideo) {
          await supabase.from('video_playlist_items').insert({
            playlist_id: formData.playlist_id, video_id: newVideo.id, sort_order: 0,
          });
        }
        return;
      }

      if (videoFiles.length === 0) throw new Error('No files selected');
      setIsUploading(true);
      setUploadProgress({ current: 0, total: videoFiles.length });

      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        setUploadProgress({ current: i + 1, total: videoFiles.length });
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('video_files').upload(fileName, file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('video_files').getPublicUrl(fileName);

        const fileTitle = videoFiles.length > 1 ? file.name.replace(/\.[^/.]+$/, '') : formData.title;

        const { data: newVideo, error: dbErr } = await supabase
          .from('video_content')
          .insert({
            title: fileTitle || 'Untitled',
            description: formData.description,
            file_url: publicUrl,
            video_type: 'direct',
            is_vertical: formData.is_vertical,
            thumbnail_url: formData.thumbnail_url || null,
            file_size_mb: file.size / (1024 * 1024),
            is_free: true, sort_order: 0,
            published_at: new Date().toISOString(),
          })
          .select().single();
        if (dbErr) throw dbErr;

        if (formData.playlist_id && newVideo) {
          await supabase.from('video_playlist_items').insert({
            playlist_id: formData.playlist_id, video_id: newVideo.id, sort_order: 0,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('Video(s) uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-video-content'] });
      queryClient.invalidateQueries({ queryKey: ['video-playlists-admin'] });
      setFormData({ title: '', description: '', playlist_id: '', url: '', is_vertical: false, thumbnail_url: '' });
      setVideoFiles([]);
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    },
    onError: (e: any) => { toast.error(e.message || 'Upload failed'); setIsUploading(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates, playlistId }: { id: string; updates: any; playlistId?: string }) => {
      const { error } = await supabase.from('video_content').update(updates).eq('id', id);
      if (error) throw error;
      if (playlistId !== undefined) {
        await supabase.from('video_playlist_items').delete().eq('video_id', id);
        if (playlistId) {
          await supabase.from('video_playlist_items').insert({ playlist_id: playlistId, video_id: id, sort_order: 0 });
        }
      }
    },
    onSuccess: () => {
      toast.success('Updated'); setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-video-content'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('video_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['admin-video-content'] }); },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const handleEdit = (v: any) => {
    setEditingVideo(v);
    setFormData({
      title: v.title, description: v.description || '',
      playlist_id: v.video_playlist_items?.[0]?.playlist_id || '',
      url: v.file_url, is_vertical: v.is_vertical || false,
      thumbnail_url: v.thumbnail_url || '',
    });
    setIsEditOpen(true);
  };

  const formatDuration = (s: number) => { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; };
  const formatSize = (mb: number) => `${mb.toFixed(1)} MB`;

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = { youtube: 'bg-red-100 text-red-700', vimeo: 'bg-blue-100 text-blue-700', direct: 'bg-green-100 text-green-700' };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Upload / Add Video</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-4">
            <div className="flex items-center gap-4">
              <Button type="button" variant={urlMode ? 'outline' : 'default'} size="sm" onClick={() => setUrlMode(false)}>
                <Upload className="h-4 w-4 mr-1" /> Upload File
              </Button>
              <Button type="button" variant={urlMode ? 'default' : 'outline'} size="sm" onClick={() => setUrlMode(true)}>
                <Link className="h-4 w-4 mr-1" /> Paste URL
              </Button>
            </div>

            <div>
              <Label>Title {videoFiles.length <= 1 && !urlMode && '*'}</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required={videoFiles.length <= 1 && !urlMode}
                placeholder={videoFiles.length > 1 ? 'Filenames used as titles' : ''} />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>

            {urlMode ? (
              <div>
                <Label>Video URL (YouTube, Vimeo, or direct MP4) *</Label>
                <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." required />
              </div>
            ) : (
              <div>
                <Label>Video Files (MP4) *</Label>
                <Input type="file" accept="video/mp4,video/webm,video/quicktime" multiple
                  onChange={(e) => setVideoFiles(Array.from(e.target.files || []))} required />
                {videoFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{videoFiles.length} file(s)</p>}
              </div>
            )}

            <ThumbnailField isEdit={false} />

            <div>
              <Label>Playlist</Label>
              <Select value={formData.playlist_id || undefined} onValueChange={(v) => setFormData({ ...formData, playlist_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a playlist" /></SelectTrigger>
                <SelectContent>
                  {playlists?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch checked={formData.is_vertical} onCheckedChange={(c) => setFormData({ ...formData, is_vertical: c })} />
              <Label>Vertical video (9:16)</Label>
            </div>

            <Button type="submit" disabled={isUploading}>
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading {uploadProgress.current}/{uploadProgress.total}...</> : <><Upload className="mr-2 h-4 w-4" />Add Video</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Video Content</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumb</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Playlist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videoContent?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt="" className="w-12 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {v.is_vertical && <Badge variant="outline" className="text-[10px]">9:16</Badge>}
                      {v.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(v as any).video_playlist_items?.[0]?.video_playlists?.name ? (
                      <Badge variant="secondary">{(v as any).video_playlist_items[0].video_playlists.name}</Badge>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>{typeBadge(v.video_type)}</TableCell>
                  <TableCell>{v.duration_seconds > 0 ? formatDuration(v.duration_seconds) : '—'}</TableCell>
                  <TableCell>{v.file_size_mb ? formatSize(v.file_size_mb) : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(v.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!videoContent?.length && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No videos yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Video</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!editingVideo) return; updateMutation.mutate({ id: editingVideo.id, updates: { title: formData.title, description: formData.description, is_vertical: formData.is_vertical, thumbnail_url: formData.thumbnail_url || null }, playlistId: formData.playlist_id }); }} className="space-y-4">
            <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <ThumbnailField isEdit={true} />
            <div>
              <Label>Playlist</Label>
              <Select value={formData.playlist_id || undefined} onValueChange={(v) => setFormData({ ...formData, playlist_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{playlists?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.is_vertical} onCheckedChange={(c) => setFormData({ ...formData, is_vertical: c })} />
              <Label>Vertical (9:16)</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
