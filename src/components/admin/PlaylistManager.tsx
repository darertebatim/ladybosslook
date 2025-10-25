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
import { Loader2, Trash2, Plus, Pencil } from "lucide-react";
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
} from "@/components/ui/dialog";

export const PlaylistManager = () => {
  const queryClient = useQueryClient();
  const { programs } = usePrograms();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);

  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    program_slug: "",
    is_free: true,
    sort_order: 0,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    program_slug: "",
    is_free: true,
    sort_order: 0,
  });

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

  // Create playlist mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('audio_playlists')
        .insert({
          name: createFormData.name,
          description: createFormData.description,
          program_slug: createFormData.program_slug || null,
          is_free: createFormData.is_free,
          sort_order: createFormData.sort_order,
        });

      if (error) throw error;
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

  const resetCreateForm = () => {
    setCreateFormData({
      name: "",
      description: "",
      program_slug: "",
      is_free: true,
      sort_order: 0,
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
      program_slug: "",
      is_free: true,
      sort_order: 0,
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

  const handleEdit = (playlist: any) => {
    setEditingPlaylist(playlist);
    setEditFormData({
      name: playlist.name,
      description: playlist.description || "",
      program_slug: playlist.program_slug || "",
      is_free: playlist.is_free,
      sort_order: playlist.sort_order,
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateDialogOpen(false);
    resetCreateForm();
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    resetEditForm();
    setEditingPlaylist(null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;

    updateMutation.mutate({
      id: editingPlaylist.id,
      updates: {
        name: editFormData.name,
        description: editFormData.description,
        program_slug: editFormData.program_slug || null,
        is_free: editFormData.is_free,
        sort_order: editFormData.sort_order,
      },
    });
  };

  const CreateForm = ({ 
    onSubmit, 
    isSubmitting,
    onCancel 
  }: { 
    onSubmit: (e: React.FormEvent) => void; 
    isSubmitting: boolean;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="create_playlist_name">Playlist/Album Name *</Label>
        <Input
          id="create_playlist_name"
          value={createFormData.name}
          onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="create_playlist_description">Description</Label>
        <Textarea
          id="create_playlist_description"
          value={createFormData.description}
          onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="create_playlist_program">Linked Program (Optional)</Label>
        <Select
          value={createFormData.program_slug || undefined}
          onValueChange={(value) => setCreateFormData({ ...createFormData, program_slug: value })}
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
          id="create_playlist_is_free"
          checked={createFormData.is_free}
          onCheckedChange={(checked) => setCreateFormData({ ...createFormData, is_free: checked })}
        />
        <Label htmlFor="create_playlist_is_free">Free for everyone</Label>
      </div>

      <div>
        <Label htmlFor="create_playlist_sort_order">Sort Order</Label>
        <Input
          id="create_playlist_sort_order"
          type="number"
          value={createFormData.sort_order}
          onChange={(e) => setCreateFormData({ ...createFormData, sort_order: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Playlist'
          )}
        </Button>
      </div>
    </form>
  );

  const EditForm = ({ 
    onSubmit, 
    isSubmitting,
    onCancel 
  }: { 
    onSubmit: (e: React.FormEvent) => void; 
    isSubmitting: boolean;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit_playlist_name">Playlist/Album Name *</Label>
        <Input
          id="edit_playlist_name"
          value={editFormData.name}
          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="edit_playlist_description">Description</Label>
        <Textarea
          id="edit_playlist_description"
          value={editFormData.description}
          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="edit_playlist_program">Linked Program (Optional)</Label>
        <Select
          value={editFormData.program_slug || undefined}
          onValueChange={(value) => setEditFormData({ ...editFormData, program_slug: value })}
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
          id="edit_playlist_is_free"
          checked={editFormData.is_free}
          onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_free: checked })}
        />
        <Label htmlFor="edit_playlist_is_free">Free for everyone</Label>
      </div>

      <div>
        <Label htmlFor="edit_playlist_sort_order">Sort Order</Label>
        <Input
          id="edit_playlist_sort_order"
          type="number"
          value={editFormData.sort_order}
          onChange={(e) => setEditFormData({ ...editFormData, sort_order: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Playlist'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Playlists/Albums</CardTitle>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Playlist
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tracks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists?.map((playlist) => (
              <TableRow key={playlist.id}>
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
                  {playlist.is_free ? (
                    <Badge variant="secondary">Free</Badge>
                  ) : (
                    <Badge>Premium</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <CreateForm 
            onSubmit={handleCreate} 
            isSubmitting={createMutation.isPending}
            onCancel={handleCloseCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          <EditForm 
            onSubmit={handleUpdate} 
            isSubmitting={updateMutation.isPending}
            onCancel={handleCloseEdit}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
