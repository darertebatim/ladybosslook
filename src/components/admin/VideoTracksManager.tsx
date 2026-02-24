import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, ArrowUp, ArrowDown, Save, Calendar, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DRIP_SCHEDULE_TEMPLATES } from "@/lib/dripContent";

interface VideoTracksManagerProps {
  playlistId: string;
  playlistName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoTracksManager = ({ playlistId, playlistName, isOpen, onClose }: VideoTracksManagerProps) => {
  const queryClient = useQueryClient();
  const [tracks, setTracks] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['video-playlist-tracks-admin', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_playlist_items')
        .select('id, sort_order, drip_delay_days, video_id, video_content(id, title, duration_seconds, video_type)')
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setTracks(data || []);
      setHasChanges(false);
      return data;
    },
    enabled: isOpen && !!playlistId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < tracks.length; i++) {
        const { error } = await supabase
          .from('video_playlist_items')
          .update({ sort_order: i + 1, drip_delay_days: tracks[i].drip_delay_days || 0 })
          .eq('id', tracks[i].id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Track order updated');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['video-playlist-tracks-admin'] });
      queryClient.invalidateQueries({ queryKey: ['video-playlists-admin'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const moveTrack = (from: number, to: number) => {
    if (to < 0 || to >= tracks.length) return;
    const arr = [...tracks];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setTracks(arr);
    setHasChanges(true);
  };

  const handleDripChange = (index: number, value: string) => {
    const arr = [...tracks];
    arr[index] = { ...arr[index], drip_delay_days: Math.max(0, parseInt(value) || 0) };
    setTracks(arr);
    setHasChanges(true);
  };

  const applyTemplate = (id: string) => {
    const t = DRIP_SCHEDULE_TEMPLATES.find(t => t.id === id);
    if (!t) return;
    setTracks(tracks.map((track, i) => ({ ...track, drip_delay_days: t.getDays(i) })));
    setHasChanges(true);
    toast.success(`Applied "${t.name}"`);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Manage Videos: {playlistName}</DialogTitle></DialogHeader>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No videos in this playlist</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">{tracks.length} videos</p>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm"><Zap className="h-4 w-4 mr-2" />Quick Schedule</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DRIP_SCHEDULE_TEMPLATES.map((t) => (
                      <DropdownMenuItem key={t.id} onClick={() => applyTemplate(t.id)}>
                        <div className="flex flex-col"><span className="font-medium">{t.name}</span><span className="text-xs text-muted-foreground">{t.description}</span></div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {hasChanges && <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Save className="h-4 w-4 mr-2" />Save</Button>}
              </div>
            </div>
            <div className="space-y-2">
              {tracks.map((track, i) => (
                <div key={track.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.video_content?.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{track.video_content?.video_type}</Badge>
                      {track.video_content?.duration_seconds > 0 && <span>{formatDuration(track.video_content.duration_seconds)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input type="number" min="0" value={track.drip_delay_days || 0} onChange={(e) => handleDripChange(i, e.target.value)} className="w-14 h-8 text-center" />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => moveTrack(i, i - 1)} disabled={i === 0} className="h-8 w-8"><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveTrack(i, i + 1)} disabled={i === tracks.length - 1} className="h-8 w-8"><ArrowDown className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {hasChanges && (
              <div className="sticky bottom-0 bg-background pt-4 border-t">
                <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full">
                  <Save className="h-4 w-4 mr-2" />{updateMutation.isPending ? 'Saving...' : 'Save Order'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
