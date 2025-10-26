import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, ArrowUp, ArrowDown, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlaylistTracksManagerProps {
  playlistId: string;
  playlistName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistTracksManager = ({
  playlistId,
  playlistName,
  isOpen,
  onClose,
}: PlaylistTracksManagerProps) => {
  const queryClient = useQueryClient();
  const [tracks, setTracks] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch playlist tracks
  const { isLoading } = useQuery({
    queryKey: ['playlist-tracks-admin', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          id,
          sort_order,
          audio_id,
          audio_content (
            id,
            title,
            duration_seconds
          )
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setTracks(data || []);
      setHasChanges(false);
      return data;
    },
    enabled: isOpen && !!playlistId,
  });

  // Update tracks mutation
  const updateTracksMutation = useMutation({
    mutationFn: async () => {
      const updates = tracks.map((track, index) => ({
        id: track.id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('audio_playlist_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Track order updated successfully');
      setHasChanges(false);
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks-admin'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-all-tracks'] });
      queryClient.invalidateQueries({ queryKey: ['audio-playlists'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update track order');
    },
  });

  const moveTrack = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= tracks.length) return;
    
    const newTracks = [...tracks];
    const [movedTrack] = newTracks.splice(fromIndex, 1);
    newTracks.splice(toIndex, 0, movedTrack);
    
    setTracks(newTracks);
    setHasChanges(true);
  };

  const handleSortOrderChange = (index: number, value: string) => {
    const newOrder = parseInt(value);
    if (isNaN(newOrder) || newOrder < 1) return;
    
    const newTracks = [...tracks];
    const [movedTrack] = newTracks.splice(index, 1);
    newTracks.splice(newOrder - 1, 0, movedTrack);
    
    setTracks(newTracks);
    setHasChanges(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    updateTracksMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tracks: {playlistName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading tracks...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tracks in this playlist
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tracks.length} tracks total
              </p>
              {hasChanges && (
                <Button onClick={handleSave} disabled={updateTracksMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Order
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 cursor-move" />
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Input
                      type="number"
                      min="1"
                      max={tracks.length}
                      value={index + 1}
                      onChange={(e) => handleSortOrderChange(index, e.target.value)}
                      className="w-16 h-8 text-center"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {track.audio_content.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(track.audio_content.duration_seconds)}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveTrack(index, index - 1)}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveTrack(index, index + 1)}
                      disabled={index === tracks.length - 1}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {hasChanges && (
              <div className="sticky bottom-0 bg-background pt-4 border-t">
                <Button onClick={handleSave} disabled={updateTracksMutation.isPending} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {updateTracksMutation.isPending ? 'Saving...' : 'Save Track Order'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
