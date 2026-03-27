import { useState, useRef } from "react";
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
import { Loader2, Trash2, Plus, Pencil, List, Eye, EyeOff, Upload, X, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { VideoTracksManager } from "./VideoTracksManager";
import { usePrograms } from "@/hooks/usePrograms";
import { useMediaCategories } from "@/hooks/useMediaCategories";
import { CategorySelect } from "./CategorySelect";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PlaylistLanguage = 'american' | 'persian' | 'turkish' | 'spanish';

interface PlaylistFormData {
  name: string;
  description: string;
  program_slug: string;
  is_free: boolean;
  requires_subscription: boolean;
  available_on_mobile: boolean;
  category: string;
  sort_order: number;
  display_mode: string;
  cover_image_url: string;
  language: PlaylistLanguage;
}

const defaultFormData: PlaylistFormData = {
  name: "", description: "", program_slug: "", is_free: true,
  requires_subscription: false, available_on_mobile: true,
  category: "tutorial", sort_order: 0, display_mode: "tracks",
  cover_image_url: "", language: "american",
};

interface FormProps {
  formData: PlaylistFormData;
  setFormData: (d: PlaylistFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  programs: any[];
  isUploadingCover: boolean;
  isGeneratingCover: boolean;
  isImprovingDescription: boolean;
  onUploadCover: (file: File) => void;
  onRemoveCover: () => void;
  onGenerateCover: () => void;
  onImproveDescription: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const PlaylistForm = ({ formData, setFormData, onSubmit, onCancel, isSubmitting, submitLabel, programs, isUploadingCover, isGeneratingCover, isImprovingDescription, onUploadCover, onRemoveCover, onGenerateCover, onImproveDescription, fileInputRef }: FormProps) => (
  <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
    <div>
      <Label>Playlist Name *</Label>
      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
    </div>

    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>Description</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onImproveDescription} disabled={isImprovingDescription || !formData.name} className="h-7 text-xs">
          {isImprovingDescription ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
          Improve with AI
        </Button>
      </div>
      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
    </div>

    {/* Cover Image */}
    <div className="space-y-2">
      <Label>Cover Image</Label>
      {formData.cover_image_url ? (
        <div className="relative w-32 h-32 group">
          <img src={formData.cover_image_url} alt="Cover" className="w-full h-full object-cover rounded-lg border" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onRemoveCover}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">No cover</div>
      )}
      <div className="flex gap-2">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadCover(f); }} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingCover || isGeneratingCover}>
          {isUploadingCover ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />} Upload
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onGenerateCover} disabled={isUploadingCover || isGeneratingCover || !formData.name}>
          {isGeneratingCover ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />} Generate with AI
        </Button>
      </div>
    </div>

    <CategorySelect value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })} type="video" />

    <div>
      <Label>Display Mode *</Label>
      <Select value={formData.display_mode} onValueChange={(v) => setFormData({ ...formData, display_mode: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="tracks">Show Tracks</SelectItem>
          <SelectItem value="modules">Show Modules</SelectItem>
          <SelectItem value="both">Show Both</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label>Linked Program (Optional)</Label>
      <Select value={formData.program_slug || undefined} onValueChange={(v) => setFormData({ ...formData, program_slug: v })}>
        <SelectTrigger><SelectValue placeholder="None - Free content" /></SelectTrigger>
        <SelectContent>
          {programs.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    <div className="flex items-center space-x-2">
      <Switch checked={formData.is_free} onCheckedChange={(c) => setFormData({ ...formData, is_free: c })} />
      <Label>Free for everyone</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Switch checked={formData.requires_subscription} onCheckedChange={(c) => setFormData({ ...formData, requires_subscription: c })} />
      <Label>Requires Ladybosslook+ (Plus plan)</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Switch checked={formData.available_on_mobile} onCheckedChange={(c) => setFormData({ ...formData, available_on_mobile: c })} />
      <Label>Show in iOS app</Label>
    </div>

    <div>
      <Label>Language</Label>
      <Select value={formData.language} onValueChange={(v: PlaylistLanguage) => setFormData({ ...formData, language: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">🌐 All</SelectItem>
          <SelectItem value="american">🇺🇸 American</SelectItem>
          <SelectItem value="persian">🇮🇷 Persian</SelectItem>
          <SelectItem value="turkish">🇹🇷 Turkish</SelectItem>
          <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label>Sort Order</Label>
      <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
    </div>

    <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{submitLabel}...</> : submitLabel}
      </Button>
    </div>
  </form>
);

export const VideoPlaylistManager = () => {
  const queryClient = useQueryClient();
  const { programs } = usePrograms();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [isTracksOpen, setIsTracksOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [createForm, setCreateForm] = useState<PlaylistFormData>({ ...defaultFormData });
  const [editForm, setEditForm] = useState<PlaylistFormData>({ ...defaultFormData });

  const { data: playlists } = useQuery({
    queryKey: ['video-playlists-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_playlists')
        .select('*, video_playlist_items(count)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const uploadCover = async (file: File, id?: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const name = `video-${id || 'new'}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('playlist-covers').upload(name, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('playlist-covers').getPublicUrl(name).data.publicUrl;
  };

  const handleCoverUpload = async (file: File, isEdit: boolean) => {
    setIsUploadingCover(true);
    try {
      const url = await uploadCover(file, isEdit ? editingPlaylist?.id : undefined);
      if (isEdit) setEditForm({ ...editForm, cover_image_url: url });
      else setCreateForm({ ...createForm, cover_image_url: url });
      toast.success('Cover uploaded');
    } catch (e: any) { toast.error(e.message || 'Upload failed'); }
    finally { setIsUploadingCover(false); }
  };

  const handleGenerateCover = async (isEdit: boolean) => {
    const form = isEdit ? editForm : createForm;
    if (!form.name) { toast.error('Enter a name first'); return; }
    setIsGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-playlist-cover', {
        body: { playlistName: form.name, playlistId: isEdit ? editingPlaylist?.id : `new-${Date.now()}`, playlistDescription: form.description, playlistCategory: form.category },
      });
      if (error) throw error;
      if (data?.coverUrl) {
        if (isEdit) setEditForm({ ...editForm, cover_image_url: data.coverUrl });
        else setCreateForm({ ...createForm, cover_image_url: data.coverUrl });
        toast.success('Cover generated!');
      } else throw new Error(data?.error || 'Failed');
    } catch (e: any) { toast.error(e.message || 'Failed to generate'); }
    finally { setIsGeneratingCover(false); }
  };

  const handleImproveDescription = async (isEdit: boolean) => {
    const form = isEdit ? editForm : createForm;
    if (!form.name) { toast.error('Enter a name first'); return; }
    setIsImprovingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-playlist-description', {
        body: { playlistName: form.name, currentDescription: form.description, category: form.category },
      });
      if (error) throw error;
      if (data?.description) {
        if (isEdit) setEditForm({ ...editForm, description: data.description });
        else setCreateForm({ ...createForm, description: data.description });
        toast.success('Description improved!');
      } else throw new Error(data?.error || 'Failed');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setIsImprovingDescription(false); }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('video_playlists').insert({
        name: createForm.name, description: createForm.description,
        category: createForm.category, program_slug: createForm.program_slug || null,
        is_free: createForm.is_free, requires_subscription: createForm.requires_subscription,
        available_on_mobile: createForm.available_on_mobile, sort_order: createForm.sort_order,
        display_mode: createForm.display_mode, cover_image_url: createForm.cover_image_url || null,
        language: createForm.language,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Playlist created');
      queryClient.invalidateQueries({ queryKey: ['video-playlists-admin'] });
      setIsCreateOpen(false);
      setCreateForm({ ...defaultFormData });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from('video_playlists').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Playlist updated');
      queryClient.invalidateQueries({ queryKey: ['video-playlists-admin'] });
      setIsEditOpen(false);
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('video_playlists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['video-playlists-admin'] }); },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const toggleHiddenMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const { error } = await supabase.from('video_playlists').update({ is_hidden: !isHidden }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Visibility updated'); queryClient.invalidateQueries({ queryKey: ['video-playlists-admin'] }); },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const handleEdit = (p: any) => {
    setEditingPlaylist(p);
    setEditForm({
      name: p.name, description: p.description || '', program_slug: p.program_slug || '',
      is_free: p.is_free, requires_subscription: p.requires_subscription,
      available_on_mobile: p.available_on_mobile, category: p.category || 'tutorial',
      sort_order: p.sort_order, display_mode: p.display_mode || 'tracks',
      cover_image_url: p.cover_image_url || '', language: p.language || 'american',
    });
    setIsEditOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Video Playlists</CardTitle>
        <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />New Playlist</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Videos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists?.map((p) => (
              <TableRow key={p.id} className={p.is_hidden ? 'opacity-50' : ''}>
                <TableCell>
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">—</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{(p as any).video_playlist_items?.[0]?.count ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {p.is_free && <Badge variant="secondary">Free</Badge>}
                    {p.requires_subscription && <Badge className="bg-amber-200 text-amber-700">Plus</Badge>}
                    {p.is_hidden && <Badge variant="outline">Hidden</Badge>}
                    {p.program_slug && <Badge variant="outline">{p.program_slug}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPlaylist(p); setIsTracksOpen(true); }} title="Manage Videos">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleHiddenMutation.mutate({ id: p.id, isHidden: p.is_hidden })} title={p.is_hidden ? 'Show' : 'Hide'}>
                      {p.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this playlist?')) deleteMutation.mutate(p.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!playlists?.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No video playlists yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Video Playlist</DialogTitle></DialogHeader>
          <PlaylistForm
            formData={createForm} setFormData={setCreateForm}
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
            onCancel={() => setIsCreateOpen(false)} isSubmitting={createMutation.isPending}
            submitLabel="Create" programs={programs || []}
            isUploadingCover={isUploadingCover} isGeneratingCover={isGeneratingCover}
            isImprovingDescription={isImprovingDescription}
            onUploadCover={(f) => handleCoverUpload(f, false)}
            onRemoveCover={() => setCreateForm({ ...createForm, cover_image_url: '' })}
            onGenerateCover={() => handleGenerateCover(false)}
            onImproveDescription={() => handleImproveDescription(false)}
            fileInputRef={createFileRef}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Video Playlist</DialogTitle></DialogHeader>
          <PlaylistForm
            formData={editForm} setFormData={setEditForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingPlaylist) return;
              updateMutation.mutate({
                id: editingPlaylist.id,
                updates: {
                  name: editForm.name, description: editForm.description,
                  category: editForm.category, program_slug: editForm.program_slug || null,
                  is_free: editForm.is_free, requires_subscription: editForm.requires_subscription,
                  available_on_mobile: editForm.available_on_mobile, sort_order: editForm.sort_order,
                  display_mode: editForm.display_mode, cover_image_url: editForm.cover_image_url || null,
                  language: editForm.language,
                },
              });
            }}
            onCancel={() => setIsEditOpen(false)} isSubmitting={updateMutation.isPending}
            submitLabel="Update" programs={programs || []}
            isUploadingCover={isUploadingCover} isGeneratingCover={isGeneratingCover}
            isImprovingDescription={isImprovingDescription}
            onUploadCover={(f) => handleCoverUpload(f, true)}
            onRemoveCover={() => setEditForm({ ...editForm, cover_image_url: '' })}
            onGenerateCover={() => handleGenerateCover(true)}
            onImproveDescription={() => handleImproveDescription(true)}
            fileInputRef={editFileRef}
          />
        </DialogContent>
      </Dialog>

      {/* Tracks Manager */}
      {selectedPlaylist && (
        <VideoTracksManager
          playlistId={selectedPlaylist.id}
          playlistName={selectedPlaylist.name}
          isOpen={isTracksOpen}
          onClose={() => { setIsTracksOpen(false); setSelectedPlaylist(null); }}
        />
      )}
    </Card>
  );
};
