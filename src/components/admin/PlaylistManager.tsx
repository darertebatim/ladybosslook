import { useState, useRef, useEffect } from "react";
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
import { Loader2, Trash2, Plus, Pencil, List, Layers, Eye, EyeOff, Upload, X, Sparkles, RefreshCw, Wand2, Zap, ArrowUp, ArrowDown, Save } from "lucide-react";
import { optimizeCoversForTable } from '@/lib/imageUtils';
import { PlaylistTracksManager } from "./PlaylistTracksManager";
import { PlaylistModulesManager } from "./PlaylistModulesManager";
import { usePrograms } from "@/hooks/usePrograms";
import { CategorySelect } from "./CategorySelect";
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
} from "@/components/ui/dialog";
import { HostPicker, HostAssignment, saveContentHosts, loadContentHosts } from "@/components/admin/HostPicker";
import { PlaylistTagsBankDialog } from "@/components/admin/PlaylistTagsBankDialog";
import { PlaylistTagPicker } from "@/components/admin/PlaylistTagPicker";
import { useSavePlaylistTagLinks } from "@/hooks/usePlaylistTags";
import { Tag } from "lucide-react";

type DisplayMode = 'tracks' | 'modules' | 'both';

type PlaylistLanguage = 'american' | 'persian' | 'turkish' | 'spanish';

interface PlaylistFormData {
  name: string;
  description: string;
  program_slug: string;
  is_free: boolean;
  requires_subscription: boolean;
  available_on_mobile: boolean;
  category: 'audiobook' | 'course' | 'podcast' | 'meditate' | 'workout' | 'soundscape' | 'affirmations';
  sort_order: number;
  display_mode: DisplayMode;
  cover_image_url: string;
  language: PlaylistLanguage;
}

interface PlaylistFormProps {
  formData: PlaylistFormData;
  setFormData: (data: PlaylistFormData) => void;
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
  hosts: HostAssignment[];
  setHosts: (hosts: HostAssignment[]) => void;
  tagIds: string[];
  setTagIds: (ids: string[]) => void;
}

const PlaylistForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isSubmitting, 
  submitLabel,
  programs,
  isUploadingCover,
  isGeneratingCover,
  isImprovingDescription,
  onUploadCover,
  onRemoveCover,
  onGenerateCover,
  onImproveDescription,
  fileInputRef,
  hosts,
  setHosts,
  tagIds,
  setTagIds,
}: PlaylistFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
    <div>
      <Label htmlFor="playlist_name">Playlist/Album Name *</Label>
      <Input
        id="playlist_name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
    </div>

    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="playlist_description">Description</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onImproveDescription}
          disabled={isImprovingDescription || !formData.name}
          className="h-7 text-xs"
        >
          {isImprovingDescription ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3 mr-1" />
          )}
          Improve with AI
        </Button>
      </div>
      <Textarea
        id="playlist_description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
      />
    </div>

    {/* Cover Image Section */}
    <div className="space-y-2">
      <Label>Cover Image</Label>
      {formData.cover_image_url ? (
        <div className="relative w-32 h-32 group">
          <img
            src={formData.cover_image_url}
            alt="Playlist cover"
            className="w-full h-full object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemoveCover}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">
          No cover
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadCover(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingCover || isGeneratingCover}
        >
          {isUploadingCover ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onGenerateCover}
          disabled={isUploadingCover || isGeneratingCover || !formData.name}
        >
          {isGeneratingCover ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Generate with AI
        </Button>
      </div>
    </div>

    <CategorySelect value={formData.category} onChange={(v) => setFormData({ ...formData, category: v as any })} type="audio" />

    <div>
      <Label htmlFor="playlist_display_mode">Display Mode *</Label>
      <Select
        value={formData.display_mode}
        onValueChange={(value: DisplayMode) => 
          setFormData({ ...formData, display_mode: value })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tracks">Show Tracks (Traditional playlist)</SelectItem>
          <SelectItem value="modules">Show Modules (Course mode)</SelectItem>
          <SelectItem value="both">Show Both</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        "Modules" mode shows a unified list of audio, video, PDF, and links with drip scheduling
      </p>
    </div>

    <div>
      <Label htmlFor="playlist_program">Linked Program (Optional)</Label>
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
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="playlist_is_free"
        checked={formData.is_free}
        onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
      />
      <Label htmlFor="playlist_is_free">Free for everyone</Label>
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="playlist_requires_subscription"
        checked={formData.requires_subscription}
        onCheckedChange={(checked) => setFormData({ ...formData, requires_subscription: checked })}
      />
      <Label htmlFor="playlist_requires_subscription">Requires Simora Plus (Plus plan)</Label>
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="playlist_available_mobile"
        checked={formData.available_on_mobile}
        onCheckedChange={(checked) => setFormData({ ...formData, available_on_mobile: checked })}
      />
      <Label htmlFor="playlist_available_mobile">Show in iOS app (Player tab)</Label>
    </div>

    <div>
      <Label htmlFor="playlist_language">Language</Label>
      <Select
        value={formData.language}
        onValueChange={(value: PlaylistLanguage) => 
          setFormData({ ...formData, language: value })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">🌐 All / Multilanguage</SelectItem>
          <SelectItem value="american">🇺🇸 American</SelectItem>
          <SelectItem value="persian">🇮🇷 Persian</SelectItem>
          <SelectItem value="turkish">🇹🇷 Turkish</SelectItem>
          <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label htmlFor="playlist_sort_order">Sort Order</Label>
      <Input
        id="playlist_sort_order"
        type="number"
        value={formData.sort_order}
        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
      />
    </div>

    <HostPicker
      value={hosts}
      onChange={setHosts}
      hint="Who presents this playlist? Shown to users on the playlist page."
    />

    <PlaylistTagPicker
      value={tagIds}
      onChange={setTagIds}
      hint="Group playlists by subject (e.g. For Immigrants, Self-Care)."
    />

    <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitLabel}...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  </form>
);

export const PlaylistManager = () => {
  const queryClient = useQueryClient();
  const { programs } = usePrograms();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [isTracksDialogOpen, setIsTracksDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingPrograms, setIsGeneratingPrograms] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [isOptimizingCovers, setIsOptimizingCovers] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Reorder mode (local list state for drag-free up/down reordering)
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedPlaylists, setOrderedPlaylists] = useState<any[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [createFormData, setCreateFormData] = useState<PlaylistFormData>({
    name: "",
    description: "",
    program_slug: "",
    is_free: true,
    requires_subscription: false,
    available_on_mobile: true,
    category: "audiobook",
    sort_order: 0,
    display_mode: "tracks",
    cover_image_url: "",
    language: "american",
  });

  const [editFormData, setEditFormData] = useState<PlaylistFormData>({
    name: "",
    description: "",
    program_slug: "",
    is_free: true,
    requires_subscription: false,
    available_on_mobile: true,
    category: "audiobook",
    sort_order: 0,
    display_mode: "tracks",
    cover_image_url: "",
    language: "american",
  });

  const [createHosts, setCreateHosts] = useState<HostAssignment[]>([]);
  const [editHosts, setEditHosts] = useState<HostAssignment[]>([]);

  const [createTagIds, setCreateTagIds] = useState<string[]>([]);
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [isTagsBankOpen, setIsTagsBankOpen] = useState(false);
  const saveTagLinks = useSavePlaylistTagLinks();

  // Fetch playlists with item count
  const { data: playlists } = useQuery({
    queryKey: ['audio-playlists-with-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select(`
          *,
          audio_playlist_items(count)
        `)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Keep local ordered copy in sync when not actively reordering
  useEffect(() => {
    if (!orderDirty && playlists) {
      setOrderedPlaylists(playlists);
    }
  }, [playlists, orderDirty]);

  const movePlaylist = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedPlaylists.length) return;
    const next = [...orderedPlaylists];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedPlaylists(next);
    setOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      for (let i = 0; i < orderedPlaylists.length; i++) {
        const p = orderedPlaylists[i];
        const newOrder = i + 1;
        if (p.sort_order === newOrder) continue;
        const { error } = await supabase
          .from('audio_playlists')
          .update({ sort_order: newOrder })
          .eq('id', p.id);
        if (error) throw error;
      }
      toast.success('Playlist order updated');
      setOrderDirty(false);
      setReorderMode(false);
      queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to save order');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setOrderedPlaylists(playlists || []);
    setOrderDirty(false);
    setReorderMode(false);
  };

  // Upload cover image helper
  const uploadCoverImage = async (file: File, playlistId?: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${playlistId || 'new'}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('playlist-covers')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('playlist-covers')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Handle cover upload for create form
  const handleCreateCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const url = await uploadCoverImage(file);
      setCreateFormData({ ...createFormData, cover_image_url: url });
      toast.success('Cover image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle cover upload for edit form
  const handleEditCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const url = await uploadCoverImage(file, editingPlaylist?.id);
      setEditFormData({ ...editFormData, cover_image_url: url });
      toast.success('Cover image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Generate cover with AI for create form
  const handleCreateGenerateCover = async () => {
    if (!createFormData.name) {
      toast.error('Please enter a playlist name first');
      return;
    }

    setIsGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-playlist-cover', {
        body: {
          playlistName: createFormData.name,
          playlistId: `new-${Date.now()}`,
          playlistDescription: createFormData.description,
          playlistCategory: createFormData.category,
        },
      });

      if (error) throw error;

      if (data?.coverUrl) {
        setCreateFormData({ ...createFormData, cover_image_url: data.coverUrl });
        toast.success('Cover generated successfully!');
      } else {
        throw new Error(data?.error || 'Failed to generate cover');
      }
    } catch (error: any) {
      console.error('Generate cover error:', error);
      toast.error(error.message || 'Failed to generate cover');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Generate cover with AI for edit form
  const handleEditGenerateCover = async () => {
    if (!editFormData.name) {
      toast.error('Please enter a playlist name first');
      return;
    }

    setIsGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-playlist-cover', {
        body: {
          playlistName: editFormData.name,
          playlistId: editingPlaylist?.id || `edit-${Date.now()}`,
          playlistDescription: editFormData.description,
          playlistCategory: editFormData.category,
        },
      });

      if (error) throw error;

      if (data?.coverUrl) {
        setEditFormData({ ...editFormData, cover_image_url: data.coverUrl });
        toast.success('Cover generated successfully!');
      } else {
        throw new Error(data?.error || 'Failed to generate cover');
      }
    } catch (error: any) {
      console.error('Generate cover error:', error);
      toast.error(error.message || 'Failed to generate cover');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Improve description with AI for create form
  const handleCreateImproveDescription = async () => {
    if (!createFormData.name) {
      toast.error('Please enter a playlist name first');
      return;
    }

    setIsImprovingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-playlist-description', {
        body: {
          playlistName: createFormData.name,
          currentDescription: createFormData.description,
          category: createFormData.category,
        },
      });

      if (error) throw error;

      if (data?.description) {
        setCreateFormData({ ...createFormData, description: data.description });
        toast.success('Description improved!');
      } else {
        throw new Error(data?.error || 'Failed to improve description');
      }
    } catch (error: any) {
      console.error('Improve description error:', error);
      toast.error(error.message || 'Failed to improve description');
    } finally {
      setIsImprovingDescription(false);
    }
  };

  // Improve description with AI for edit form
  const handleEditImproveDescription = async () => {
    if (!editFormData.name) {
      toast.error('Please enter a playlist name first');
      return;
    }

    setIsImprovingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-playlist-description', {
        body: {
          playlistName: editFormData.name,
          currentDescription: editFormData.description,
          category: editFormData.category,
        },
      });

      if (error) throw error;

      if (data?.description) {
        setEditFormData({ ...editFormData, description: data.description });
        toast.success('Description improved!');
      } else {
        throw new Error(data?.error || 'Failed to improve description');
      }
    } catch (error: any) {
      console.error('Improve description error:', error);
      toast.error(error.message || 'Failed to improve description');
    } finally {
      setIsImprovingDescription(false);
    }
  };

  // Create playlist mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: created, error } = await supabase
        .from('audio_playlists')
        .insert({
          name: createFormData.name,
          description: createFormData.description,
          category: createFormData.category,
          program_slug: createFormData.program_slug || null,
          is_free: createFormData.is_free,
          requires_subscription: createFormData.requires_subscription,
          available_on_mobile: createFormData.available_on_mobile,
          sort_order: createFormData.sort_order,
          display_mode: createFormData.display_mode,
          cover_image_url: createFormData.cover_image_url || null,
          language: createFormData.language,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (created?.id) await saveContentHosts('playlist', created.id, createHosts);
    },
    onSuccess: () => {
      toast.success('Playlist created successfully');
      queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
      handleCloseCreate();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create playlist');
    },
  });

  // Update playlist mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('audio_playlists')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await saveContentHosts('playlist', id, editHosts);
    },
    onSuccess: () => {
      toast.success('Playlist updated successfully');
      queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
      handleCloseEdit();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update playlist');
    },
  });

  // Delete playlist mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audio_playlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Playlist deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete playlist');
    },
  });

  // Toggle hidden status mutation
  const toggleHiddenMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const { error } = await supabase
        .from('audio_playlists')
        .update({ is_hidden: !isHidden })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Visibility updated successfully');
      queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update visibility');
    },
  });

  const resetCreateForm = () => {
    setCreateFormData({
      name: "",
      description: "",
      program_slug: "",
      is_free: true,
      requires_subscription: false,
      available_on_mobile: true,
      category: "audiobook",
      sort_order: 0,
      display_mode: "tracks",
      cover_image_url: "",
      language: "american",
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
      program_slug: "",
      is_free: true,
      requires_subscription: false,
      available_on_mobile: true,
      category: "audiobook",
      sort_order: 0,
      display_mode: "tracks",
      cover_image_url: "",
      language: "american",
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateDialogOpen(true);
  };

  // Generate program description based on playlist info
  const generateProgramDescription = (playlist: any): string => {
    const categoryDescriptions: Record<string, string> = {
      audiobook: 'An immersive audiobook experience',
      course_supplement: 'Supplementary audio content to enhance your learning',
      meditate: 'Guided meditation sessions for inner peace and mindfulness',
      workout: 'Energizing audio to power your workout sessions',
      soundscape: 'Relaxing ambient sounds for focus and relaxation',
      affirmations: 'Powerful affirmations to transform your mindset',
    };
    
    const categoryText = categoryDescriptions[playlist.category] || 'Premium audio content';
    const trackCount = playlist.audio_playlist_items?.[0]?.count || 0;
    
    let description = playlist.description || '';
    if (!description) {
      description = `${categoryText}: "${playlist.name}".`;
      if (trackCount > 0) {
        description += ` Includes ${trackCount} track${trackCount > 1 ? 's' : ''} of curated content.`;
      }
      description += ' Listen anytime, anywhere in the Ladyboss Look app.';
    }
    
    return description;
  };

  // Auto-generate free programs for unlinked free playlists (excluding podcasts)
  const handleGenerateFreePrograms = async () => {
    if (!playlists) return;

    setIsGeneratingPrograms(true);
    let created = 0;
    let errors = 0;

    try {
      // Get all existing program slugs to check which playlists are truly unlinked
      const { data: existingPrograms } = await supabase
        .from('program_catalog')
        .select('slug');
      
      const existingSlugs = new Set(existingPrograms?.map(p => p.slug) || []);

      // Find free playlists that don't have a matching program (not podcasts)
      const unlinkedFreePlaylists = playlists.filter(
        (p) => p.is_free && p.category !== 'podcast' && (!p.program_slug || !existingSlugs.has(p.program_slug))
      );

      if (unlinkedFreePlaylists.length === 0) {
        toast.info('No unlinked free playlists found (excluding podcasts)');
        return;
      }

      for (const playlist of unlinkedFreePlaylists) {
        // Generate a slug from the playlist name
        const slug = playlist.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50);

        // Check if program with this slug already exists
        const { data: existing } = await supabase
          .from('program_catalog')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existing) {
          // Link the playlist to the existing program and mark as not free
          await supabase
            .from('audio_playlists')
            .update({ program_slug: slug, is_free: false })
            .eq('id', playlist.id);
          created++;
          continue;
        }

        // Generate description based on playlist info
        const description = generateProgramDescription(playlist);

        // Map playlist category to program type
        const categoryToType: Record<string, string> = {
          audiobook: 'audiobook',
          meditate: 'meditate',
          workout: 'workout',
          soundscape: 'soundscape',
          affirmations: 'affirmations',
          course: 'course',
        };
        const programType = categoryToType[playlist.category] || 'audiobook';

        // Create new free program with matching type
        const { error: programError } = await supabase
          .from('program_catalog')
          .insert({
            title: playlist.name,
            slug: slug,
            type: programType,
            payment_type: 'free',
            price_amount: 0,
            description: description,
            is_active: true,
            available_on_mobile: true,
            available_on_web: false,
            cover_image_url: playlist.cover_image_url,
            audio_playlist_id: playlist.id,
          });

        if (programError) {
          console.error('Error creating program:', programError);
          errors++;
          continue;
        }

        // Link playlist to the new program and mark as NOT free
        const { error: linkError } = await supabase
          .from('audio_playlists')
          .update({ program_slug: slug, is_free: false })
          .eq('id', playlist.id);

        if (linkError) {
          console.error('Error linking playlist:', linkError);
          errors++;
        } else {
          created++;
        }
      }

      if (created > 0) {
        toast.success(`Created ${created} free program(s) for playlists`);
        queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
        queryClient.invalidateQueries({ queryKey: ['programs'] });
      }
      if (errors > 0) {
        toast.error(`${errors} error(s) occurred during generation`);
      }
    } catch (error: any) {
      console.error('Error generating programs:', error);
      toast.error(error.message || 'Failed to generate programs');
    } finally {
      setIsGeneratingPrograms(false);
    }
  };

  const handleEdit = async (playlist: any) => {
    setEditingPlaylist(playlist);
    setEditFormData({
      name: playlist.name,
      description: playlist.description || "",
      program_slug: playlist.program_slug || "",
      is_free: playlist.is_free,
      requires_subscription: playlist.requires_subscription ?? false,
      available_on_mobile: playlist.available_on_mobile ?? true,
      category: playlist.category || "audiobook",
      sort_order: playlist.sort_order,
      display_mode: playlist.display_mode || "tracks",
      cover_image_url: playlist.cover_image_url || "",
      language: playlist.language || "american",
    });
    try {
      setEditHosts(await loadContentHosts('playlist', playlist.id));
    } catch {
      setEditHosts([]);
    }
    setIsEditDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateDialogOpen(false);
    resetCreateForm();
    setCreateHosts([]);
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    resetEditForm();
    setEditingPlaylist(null);
    setEditHosts([]);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;

    updateMutation.mutate({
      id: editingPlaylist.id,
      updates: {
        name: editFormData.name,
        description: editFormData.description,
        category: editFormData.category,
        program_slug: editFormData.program_slug || null,
        is_free: editFormData.is_free,
        requires_subscription: editFormData.requires_subscription,
        available_on_mobile: editFormData.available_on_mobile,
        sort_order: editFormData.sort_order,
        display_mode: editFormData.display_mode,
        cover_image_url: editFormData.cover_image_url || null,
        language: editFormData.language,
      },
    });
  };

  const handleOpenTracks = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setIsTracksDialogOpen(true);
  };

  const handleCloseTracks = () => {
    setIsTracksDialogOpen(false);
    setSelectedPlaylist(null);
  };

  const handleOpenModules = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setIsModulesDialogOpen(true);
  };

  const handleCloseModules = () => {
    setIsModulesDialogOpen(false);
    setSelectedPlaylist(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Playlists/Albums</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 px-2 py-1 rounded-md border">
            <Switch
              id="playlist_reorder_mode"
              checked={reorderMode}
              onCheckedChange={(checked) => {
                if (!checked && orderDirty) {
                  handleCancelOrder();
                } else {
                  setReorderMode(checked);
                }
              }}
            />
            <Label htmlFor="playlist_reorder_mode" className="text-xs cursor-pointer">
              Reorder
            </Label>
          </div>
          {reorderMode && orderDirty && (
            <>
              <Button size="sm" variant="outline" onClick={handleCancelOrder} disabled={isSavingOrder}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveOrder} disabled={isSavingOrder}>
                {isSavingOrder ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Order
              </Button>
            </>
          )}
          <Button 
            onClick={handleGenerateFreePrograms} 
            size="sm" 
            variant="outline"
            disabled={isGeneratingPrograms}
          >
            {isGeneratingPrograms ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            AI: Free Programs
          </Button>
          {(playlists || []).some((p: any) => p.cover_image_url && !p.cover_image_url.endsWith('.webp')) && (
            <Button variant="outline" size="sm" onClick={async () => {
              const items = (playlists || [])
                .filter((p: any) => p.cover_image_url && !p.cover_image_url.endsWith('.webp'))
                .map((p: any) => ({ id: p.id, coverUrl: p.cover_image_url }));
              setIsOptimizingCovers(true);
              const { done, failed } = await optimizeCoversForTable(items, 'audio_playlists', 'cover_image_url');
              setIsOptimizingCovers(false);
              toast.success(`Optimized ${done} covers${failed ? `, ${failed} failed` : ''}`);
              queryClient.invalidateQueries({ queryKey: ['audio-playlists-with-count'] });
            }} disabled={isOptimizingCovers}>
              {isOptimizingCovers ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Optimize Covers
            </Button>
          )}
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Playlist
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">#</TableHead>
              <TableHead className="w-16">Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tracks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedPlaylists?.map((playlist, index) => (
              <TableRow key={playlist.id} className={playlist.is_hidden ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                      {index + 1}
                    </span>
                    {reorderMode && (
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => movePlaylist(index, index - 1)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => movePlaylist(index, index + 1)}
                          disabled={index === orderedPlaylists.length - 1}
                          title="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {playlist.cover_image_url ? (
                    <img
                      src={playlist.cover_image_url}
                      alt={playlist.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                      No cover
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{playlist.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {playlist.description || <span className="text-muted-foreground">No description</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {playlist.audio_playlist_items?.[0]?.count || 0} tracks
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {playlist.is_free ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      <Badge>Premium</Badge>
                    )}
                    {playlist.requires_subscription && (
                      <Badge className="bg-amber-200 text-amber-800">Plus</Badge>
                    )}
                    {playlist.is_hidden && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Hidden
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleHiddenMutation.mutate({ id: playlist.id, isHidden: playlist.is_hidden })}
                      title={playlist.is_hidden ? "Show playlist" : "Hide playlist"}
                    >
                      {playlist.is_hidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenTracks(playlist)}
                      title="Manage tracks"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModules(playlist)}
                      title="Manage modules"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(playlist)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(playlist.id)}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <PlaylistForm
            formData={createFormData}
            setFormData={setCreateFormData}
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Playlist"
            programs={programs}
            isUploadingCover={isUploadingCover}
            isGeneratingCover={isGeneratingCover}
            isImprovingDescription={isImprovingDescription}
            onUploadCover={handleCreateCoverUpload}
            onRemoveCover={() => setCreateFormData({ ...createFormData, cover_image_url: "" })}
            onGenerateCover={handleCreateGenerateCover}
            onImproveDescription={handleCreateImproveDescription}
            fileInputRef={createFileInputRef}
            hosts={createHosts}
            setHosts={setCreateHosts}
            tagIds={createTagIds}
            setTagIds={setCreateTagIds}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          <PlaylistForm
            formData={editFormData}
            setFormData={setEditFormData}
            onSubmit={handleUpdate}
            onCancel={handleCloseEdit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update Playlist"
            programs={programs}
            isUploadingCover={isUploadingCover}
            isGeneratingCover={isGeneratingCover}
            isImprovingDescription={isImprovingDescription}
            onUploadCover={handleEditCoverUpload}
            onRemoveCover={() => setEditFormData({ ...editFormData, cover_image_url: "" })}
            onGenerateCover={handleEditGenerateCover}
            onImproveDescription={handleEditImproveDescription}
            fileInputRef={editFileInputRef}
            hosts={editHosts}
            setHosts={setEditHosts}
          />
        </DialogContent>
      </Dialog>

      {selectedPlaylist && (
        <>
          <PlaylistTracksManager
            playlistId={selectedPlaylist.id}
            playlistName={selectedPlaylist.name}
            isOpen={isTracksDialogOpen}
            onClose={handleCloseTracks}
          />
          <PlaylistModulesManager
            playlistId={selectedPlaylist.id}
            playlistName={selectedPlaylist.name}
            isOpen={isModulesDialogOpen}
            onClose={handleCloseModules}
          />
        </>
      )}
    </Card>
  );
};
