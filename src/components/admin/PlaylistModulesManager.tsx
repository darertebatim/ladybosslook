import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  ArrowUp, 
  ArrowDown, 
  Music, 
  Calendar,
  Zap,
  Save,
  GripVertical,
  ListPlus
} from "lucide-react";
import { DRIP_SCHEDULE_TEMPLATES } from "@/lib/dripContent";

interface PlaylistModulesManagerProps {
  playlistId: string;
  playlistName: string;
  isOpen: boolean;
  onClose: () => void;
}

type ModuleType = "video" | "pdf" | "link" | "audio";

interface ModuleFormData {
  title: string;
  type: ModuleType;
  url: string;
  description: string;
  sort_order: number;
  drip_delay_days: number;
  audio_id: string | null;
}

export const PlaylistModulesManager = ({
  playlistId,
  playlistName,
  isOpen,
  onClose,
}: PlaylistModulesManagerProps) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localModules, setLocalModules] = useState<any[]>([]);
  const [formData, setFormData] = useState<ModuleFormData>({
    title: "",
    type: "video",
    url: "",
    description: "",
    sort_order: 0,
    drip_delay_days: 0,
    audio_id: null,
  });

  // Fetch available audio content for audio type modules
  const { data: audioContent } = useQuery({
    queryKey: ['audio-content-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select('id, title, duration_seconds')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch playlist tracks to enable "Import All Tracks"
  const { data: playlistTracks } = useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          id,
          sort_order,
          drip_delay_days,
          audio_content (
            id,
            title,
            duration_seconds
          )
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!playlistId,
  });

  // Handle PDF file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `supplements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, url: publicUrl }));
      toast.success('PDF uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setUploadingFile(false);
    }
  };

  // Fetch modules (supplements)
  const { data: modules, isLoading } = useQuery({
    queryKey: ['playlist-modules', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlist_supplements')
        .select(`
          *,
          audio_content (
            id,
            title,
            duration_seconds
          )
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!playlistId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Sync localModules with query data
  useEffect(() => {
    if (modules) {
      setLocalModules(modules);
      setHasChanges(false);
    }
  }, [modules]);

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setLocalModules([]);
      setHasChanges(false);
    }
  }, [isOpen]);

  // Add module mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const moduleData: any = {
        playlist_id: playlistId,
        title: formData.title,
        type: formData.type,
        url: formData.type === 'audio' ? '' : formData.url,
        description: formData.description,
        sort_order: formData.sort_order,
        drip_delay_days: formData.drip_delay_days,
        audio_id: formData.type === 'audio' ? formData.audio_id : null,
      };

      const { error } = await supabase
        .from('playlist_supplements')
        .insert(moduleData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Module added successfully');
      queryClient.invalidateQueries({ queryKey: ['playlist-modules', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlist-supplements', playlistId] });
      handleCloseAdd();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add module');
    },
  });

  // Delete module mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('playlist_supplements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Module deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['playlist-modules', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlist-supplements', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete module');
    },
  });

  // Save all changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      const updates = localModules.map((module, index) => ({
        id: module.id,
        sort_order: index,
        drip_delay_days: module.drip_delay_days || 0,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('playlist_supplements')
          .update({ 
            sort_order: update.sort_order,
            drip_delay_days: update.drip_delay_days,
          })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Module order updated successfully');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['playlist-modules', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlist-supplements', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update modules');
    },
  });

  // Import all tracks as audio modules
  const importAllTracksMutation = useMutation({
    mutationFn: async () => {
      if (!playlistTracks || playlistTracks.length === 0) {
        throw new Error('No tracks to import');
      }

      // Get existing audio_ids in modules to avoid duplicates
      const existingAudioIds = new Set(
        localModules
          .filter(m => m.type === 'audio' && m.audio_id)
          .map(m => m.audio_id)
      );

      // Filter out tracks that are already in modules
      const tracksToImport = playlistTracks.filter(
        track => track.audio_content && !existingAudioIds.has(track.audio_content.id)
      );

      if (tracksToImport.length === 0) {
        throw new Error('All tracks are already added as modules');
      }

      const startSortOrder = localModules.length;

      const modulesToInsert = tracksToImport.map((track, index) => ({
        playlist_id: playlistId,
        title: track.audio_content!.title,
        type: 'audio',
        url: '',
        description: '',
        sort_order: startSortOrder + index,
        drip_delay_days: track.drip_delay_days || 0,
        audio_id: track.audio_content!.id,
      }));

      const { error } = await supabase
        .from('playlist_supplements')
        .insert(modulesToInsert);

      if (error) throw error;
      return tracksToImport.length;
    },
    onSuccess: (count) => {
      toast.success(`Imported ${count} tracks as modules`);
      queryClient.invalidateQueries({ queryKey: ['playlist-modules', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import tracks');
    },
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const newOrder = [...localModules];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setLocalModules(newOrder);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localModules.length - 1) return;
    
    const newOrder = [...localModules];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setLocalModules(newOrder);
    setHasChanges(true);
  };

  const handleDripDelayChange = (index: number, value: string) => {
    const delay = parseInt(value) || 0;
    const newModules = [...localModules];
    newModules[index] = { ...newModules[index], drip_delay_days: Math.max(0, delay) };
    setLocalModules(newModules);
    setHasChanges(true);
  };

  const applyDripTemplate = (templateId: string) => {
    const template = DRIP_SCHEDULE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newModules = localModules.map((module, index) => ({
      ...module,
      drip_delay_days: template.getDays(index),
    }));
    setLocalModules(newModules);
    setHasChanges(true);
    toast.success(`Applied "${template.name}" schedule`);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: "video",
      url: "",
      description: "",
      sort_order: localModules.length,
      drip_delay_days: 0,
      audio_id: null,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      video: "bg-blue-500",
      pdf: "bg-red-500",
      link: "bg-green-500",
      audio: "bg-purple-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Modules - {playlistName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                {localModules.length} modules total
              </p>
              <div className="flex items-center gap-2">
                {playlistTracks && playlistTracks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => importAllTracksMutation.mutate()}
                    disabled={importAllTracksMutation.isPending}
                  >
                    {importAllTracksMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ListPlus className="h-4 w-4 mr-2" />
                    )}
                    Import All Tracks ({playlistTracks.length})
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Quick Schedule
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DRIP_SCHEDULE_TEMPLATES.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => applyDripTemplate(template.id)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleOpenAdd} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : localModules.length > 0 ? (
              <div className="space-y-2">
                {localModules.map((module, index) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    
                    <Badge variant="outline" className="min-w-[2rem] justify-center flex-shrink-0">
                      {index + 1}
                    </Badge>

                    <Badge className={`flex-shrink-0 ${getTypeBadgeColor(module.type)}`}>
                      {getTypeIcon(module.type)}
                      <span className="ml-1">{module.type.toUpperCase()}</span>
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{module.title}</p>
                      {module.type === 'audio' && module.audio_content && (
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(module.audio_content.duration_seconds)}
                        </p>
                      )}
                      {module.description && module.type !== 'audio' && (
                        <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={module.drip_delay_days || 0}
                        onChange={(e) => handleDripDelayChange(index, e.target.value)}
                        className="w-14 h-8 text-center"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || saveChangesMutation.isPending}
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localModules.length - 1 || saveChangesMutation.isPending}
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(module.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No modules added yet
              </div>
            )}

            {hasChanges && (
              <div className="sticky bottom-0 bg-background pt-4 border-t">
                <Button 
                  onClick={() => saveChangesMutation.mutate()} 
                  disabled={saveChangesMutation.isPending} 
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveChangesMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course Module</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="module_type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ModuleType) => 
                  setFormData({ ...formData, type: value, audio_id: null, url: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'audio' && (
              <div>
                <Label htmlFor="audio_select">Select Audio Track *</Label>
                <Select
                  value={formData.audio_id || undefined}
                  onValueChange={(value) => {
                    const audio = audioContent?.find(a => a.id === value);
                    setFormData({ 
                      ...formData, 
                      audio_id: value,
                      title: formData.title || audio?.title || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an audio track..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {audioContent?.map((audio) => (
                      <SelectItem key={audio.id} value={audio.id}>
                        {audio.title} ({formatDuration(audio.duration_seconds)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="module_title">Title *</Label>
              <Input
                id="module_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder={formData.type === 'audio' ? "Module title (or use audio title)" : "e.g., Session Recording, Workbook PDF"}
              />
            </div>

            {formData.type !== 'audio' && (
              <div>
                <Label htmlFor="module_url">URL *</Label>
                {formData.type === 'pdf' ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={uploadingFile}
                        className="cursor-pointer"
                      />
                      {uploadingFile && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading PDF...
                        </p>
                      )}
                      {formData.url && !uploadingFile && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                          ✓ PDF uploaded successfully
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Or paste URL directly:</Label>
                      <Input
                        id="module_url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://..."
                        disabled={uploadingFile}
                      />
                    </div>
                  </div>
                ) : (
                  <Input
                    id="module_url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    placeholder="https://..."
                  />
                )}
              </div>
            )}

            <div>
              <Label htmlFor="module_description">Description</Label>
              <Textarea
                id="module_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Optional description"
              />
            </div>

            <div>
              <Label htmlFor="module_drip_delay">Drip Delay (Days)</Label>
              <Input
                id="module_drip_delay"
                type="number"
                min="0"
                value={formData.drip_delay_days}
                onChange={(e) => setFormData({ ...formData, drip_delay_days: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = available immediately, 7 = available 1 week after enrollment
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseAdd}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addMutation.isPending || (formData.type === 'audio' && !formData.audio_id)}
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Module'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};