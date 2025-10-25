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
import { Loader2, Trash2, Upload } from "lucide-react";
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

export const AudioManager = () => {
  const queryClient = useQueryClient();
  const { programs } = usePrograms();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "podcast" as "audiobook" | "course_supplement" | "podcast",
    program_slug: "",
    is_free: true,
    sort_order: 0,
  });

  // Fetch existing audio content
  const { data: audioContent } = useQuery({
    queryKey: ['admin-audio-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Upload audio mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile) throw new Error('No audio file selected');

      setIsUploading(true);

      // Upload audio file
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const { error: audioUploadError } = await supabase.storage
        .from('audio_files')
        .upload(audioFileName, audioFile);

      if (audioUploadError) throw audioUploadError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('audio_files')
        .getPublicUrl(audioFileName);

      // Upload cover image if provided
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

      // Get audio duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioFile);
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', resolve);
      });
      const duration = Math.floor(audio.duration);

      // Create database record
      const { error: dbError } = await supabase
        .from('audio_content')
        .insert({
          title: formData.title,
          description: formData.description,
          file_url: audioUrl,
          duration_seconds: duration,
          file_size_mb: audioFile.size / (1024 * 1024),
          cover_image_url: coverUrl,
          category: formData.category,
          program_slug: formData.program_slug || null,
          is_free: formData.is_free,
          sort_order: formData.sort_order,
          published_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Audio uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-audio-content'] });
      setFormData({
        title: "",
        description: "",
        category: "podcast",
        program_slug: "",
        is_free: true,
        sort_order: 0,
      });
      setAudioFile(null);
      setCoverFile(null);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload audio');
      setIsUploading(false);
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
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete audio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error('Please select an audio file');
      return;
    }
    uploadMutation.mutate();
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
      <Card>
        <CardHeader>
          <CardTitle>Upload New Audio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audiobook">Audiobook</SelectItem>
                    <SelectItem value="course_supplement">Course Audio</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="program">Linked Program (Optional)</Label>
                <Select
                  value={formData.program_slug || undefined}
                  onValueChange={(value) => setFormData({ ...formData, program_slug: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None - Free content for everyone" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.slug} value={program.slug}>
                        {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave unselected for free content accessible to everyone
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
              />
              <Label htmlFor="is_free">Free for everyone</Label>
            </div>

            <div>
              <Label htmlFor="audio_file">Audio File * (MP3, M4A)</Label>
              <Input
                id="audio_file"
                type="file"
                accept="audio/mpeg,audio/mp4,audio/x-m4a"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                required
              />
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
                  Uploading...
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
        <CardHeader>
          <CardTitle>Existing Audio Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audioContent?.map((audio) => (
                <TableRow key={audio.id}>
                  <TableCell className="font-medium">{audio.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {audio.category === 'audiobook' ? 'Audiobook' : 
                       audio.category === 'course_supplement' ? 'Course' : 'Podcast'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDuration(audio.duration_seconds)}</TableCell>
                  <TableCell>{formatFileSize(audio.file_size_mb || 0)}</TableCell>
                  <TableCell>
                    {audio.is_free ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      <Badge>Premium</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(audio.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
