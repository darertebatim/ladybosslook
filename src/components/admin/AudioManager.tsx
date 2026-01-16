import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, RefreshCw, Pencil } from "lucide-react";
import { usePrograms } from "@/hooks/usePrograms";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlaylistManager } from "./PlaylistManager";

export const AudioManager = () => {
  const queryClient = useQueryClient();
  const { programs } = usePrograms();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [editingAudio, setEditingAudio] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    playlist_id: "",
    duration_minutes: "",
    duration_seconds: "",
  });

  // Fetch playlists
  const { data: playlists } = useQuery({
    queryKey: ['audio-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing audio content with playlist info
  const { data: audioContent } = useQuery({
    queryKey: ['admin-audio-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select(`
          *,
          audio_playlist_items(
            playlist_id,
            audio_playlists(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Upload audio mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (audioFiles.length === 0) throw new Error('No audio files selected');

      setIsUploading(true);
      setUploadProgress({ current: 0, total: audioFiles.length });

      // Upload cover image once if provided
      let coverUrl = null;
      if (coverFile) {
        const coverFileName = `covers/${Date.now()}-${coverFile.name}`;
        const { error: coverUploadError } = await supabase.storage
          .from('audio_files')
          .upload(coverFileName, coverFile);

        if (!coverUploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('audio_files')
            .getPublicUrl(coverFileName);
          coverUrl = publicUrl;
        }
      }

      // Upload each audio file
      for (let i = 0; i < audioFiles.length; i++) {
        const audioFile = audioFiles[i];
        setUploadProgress({ current: i + 1, total: audioFiles.length });

        // Upload audio file
        const audioFileName = `${Date.now()}-${audioFile.name}`;
        const { error: audioUploadError } = await supabase.storage
          .from('audio_files')
          .upload(audioFileName, audioFile);

        if (audioUploadError) throw audioUploadError;

        const { data: { publicUrl: audioUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(audioFileName);

        // Get audio duration
        const audio = new Audio();
        audio.src = URL.createObjectURL(audioFile);
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', resolve);
        });
        const duration = Math.floor(audio.duration);

        // Extract title from filename if form title is generic
        const fileTitle = audioFiles.length > 1 
          ? audioFile.name.replace(/\.[^/.]+$/, "") 
          : formData.title;

        // Create database record
        const { data: newAudio, error: dbError } = await supabase
          .from('audio_content')
          .insert({
            title: fileTitle,
            description: formData.description,
            file_url: audioUrl,
            duration_seconds: duration,
            file_size_mb: audioFile.size / (1024 * 1024),
            cover_image_url: coverUrl,
            category: 'podcast',
            program_slug: null,
            is_free: true,
            sort_order: 0,
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Add to playlist if selected
        if (formData.playlist_id && newAudio) {
          const { error: playlistError } = await supabase
            .from('audio_playlist_items')
            .insert({
              playlist_id: formData.playlist_id,
              audio_id: newAudio.id,
              sort_order: 0,
            });

          if (playlistError) throw playlistError;
        }
      }
    },
    onSuccess: () => {
      const count = audioFiles.length;
      toast.success(`${count} audio file${count > 1 ? 's' : ''} uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-audio-content'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
      setFormData({
        title: "",
        description: "",
        playlist_id: "",
        duration_minutes: "",
        duration_seconds: "",
      });
      setAudioFiles([]);
      setCoverFile(null);
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload audio');
      setIsUploading(false);
    },
  });

  // Sync storage files mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-audio-files');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Storage synced successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-audio-content'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync storage');
    },
  });

  // Update audio mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates, playlistId }: { id: string; updates: any; playlistId?: string }) => {
      const { error: updateError } = await supabase
        .from('audio_content')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Handle playlist assignment
      if (playlistId !== undefined) {
        // First remove existing playlist assignments
        await supabase
          .from('audio_playlist_items')
          .delete()
          .eq('audio_id', id);

        // Then add new assignment if playlist selected
        if (playlistId) {
          const { error: playlistError } = await supabase
            .from('audio_playlist_items')
            .insert({
              playlist_id: playlistId,
              audio_id: id,
              sort_order: 0,
            });

          if (playlistError) throw playlistError;
        }
      }
    },
    onSuccess: () => {
      toast.success('Audio updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-audio-content'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
      setIsEditDialogOpen(false);
      setEditingAudio(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update audio');
    },
  });

  // Delete audio mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audio_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Audio deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-audio-content'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete audio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (audioFiles.length === 0) {
      toast.error('Please select at least one audio file');
      return;
    }
    uploadMutation.mutate();
  };

  const handleEdit = (audio: any) => {
    setEditingAudio(audio);
    const durationMins = Math.floor(audio.duration_seconds / 60);
    const durationSecs = audio.duration_seconds % 60;
    setFormData({
      title: audio.title,
      description: audio.description || "",
      playlist_id: audio.audio_playlist_items?.[0]?.playlist_id || "",
      duration_minutes: durationMins.toString(),
      duration_seconds: durationSecs.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudio) return;

    const totalSeconds = 
      (parseInt(formData.duration_minutes) || 0) * 60 + 
      (parseInt(formData.duration_seconds) || 0);

    updateMutation.mutate({
      id: editingAudio.id,
      updates: {
        title: formData.title,
        description: formData.description,
        duration_seconds: totalSeconds,
      },
      playlistId: formData.playlist_id,
    });
  };

  const formatFileSize = (mb: number) => {
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <PlaylistManager />
      
      <Card>
        <CardHeader>
          <CardTitle>Upload New Audio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title {audioFiles.length <= 1 && '*'}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required={audioFiles.length <= 1}
                placeholder={audioFiles.length > 1 ? "Filenames will be used as titles" : ""}
              />
              {audioFiles.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uploading multiple files - each will use its filename as the title
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="playlist">Album/Playlist *</Label>
              <Select
                value={formData.playlist_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, playlist_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  {playlists?.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Access control and category are managed at the playlist level. Track order within playlists is managed in the Playlist Tracks Manager.
              </p>
            </div>

            <div>
              <Label htmlFor="audio_file">Audio Files * (MP3, M4A) - Select multiple</Label>
              <Input
                id="audio_file"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/mp4,audio/m4a,audio/x-m4a,audio/aac"
                onChange={(e) => setAudioFiles(Array.from(e.target.files || []))}
                multiple
                required
              />
              {audioFiles.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {audioFiles.length} file{audioFiles.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cover_file">Cover Image (Optional)</Label>
              <Input
                id="cover_file"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading {uploadProgress.current}/{uploadProgress.total}...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Audio
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Existing Audio Content</CardTitle>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
            size="sm"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Storage Files
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Album/Playlist</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audioContent?.map((audio) => (
                <TableRow key={audio.id}>
                  <TableCell className="font-medium">{audio.title}</TableCell>
                  <TableCell>
                    {audio.audio_playlist_items?.[0]?.audio_playlists?.name ? (
                      <Badge variant="secondary">
                        {audio.audio_playlist_items[0].audio_playlists.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No playlist</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDuration(audio.duration_seconds)}</TableCell>
                  <TableCell>{formatFileSize(audio.file_size_mb || 0)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(audio)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(audio.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Audio Content</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit_title">Title *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-20"
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Sec"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                  className="w-20"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Format: minutes : seconds
              </p>
            </div>

            <div>
              <Label htmlFor="edit_playlist">Album/Playlist *</Label>
              <Select
                value={formData.playlist_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, playlist_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  {playlists?.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Access control and category are managed at the playlist level. Track order within playlists is managed in the Playlist Tracks Manager.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Audio'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
