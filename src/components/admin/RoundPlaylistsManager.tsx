import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Music, Video as VideoIcon, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  roundId: string;
  roundName?: string;
  /** Render as a dialog (table button) or inline inside the Edit Round dialog */
  inline?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

type PlaylistType = "audio" | "video";

export const RoundPlaylistsManager = ({ roundId, roundName, inline = false, isOpen = true, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<PlaylistType>("audio");
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: audioPlaylists = [] } = useQuery({
    queryKey: ["round-playlists-options", "audio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_playlists")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const { data: videoPlaylists = [] } = useQuery({
    queryKey: ["round-playlists-options", "video"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_playlists")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const { data: linked = [], isLoading } = useQuery({
    queryKey: ["round-playlists", roundId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_round_playlists")
        .select("id, playlist_type, playlist_id, sort_order")
        .eq("round_id", roundId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!roundId,
  });

  const nameFor = (row: any) => {
    const list = row.playlist_type === "video" ? videoPlaylists : audioPlaylists;
    return (list as any[]).find((p) => p.id === row.playlist_id)?.name || "(deleted playlist)";
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["round-playlists", roundId] });
    queryClient.invalidateQueries({ queryKey: ["course-round-playlists"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("Pick a playlist first");
      const { error } = await supabase.from("program_round_playlists").insert({
        round_id: roundId,
        playlist_type: type,
        playlist_id: selectedId,
        sort_order: linked.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedId("");
      toast.success("Playlist added");
      invalidate();
    },
    onError: (e: any) =>
      toast.error(
        e?.code === "23505" ? "That playlist is already attached" : e.message || "Failed to add"
      ),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("program_round_playlists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Playlist removed");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (rows: any[]) => {
      for (let i = 0; i < rows.length; i++) {
        const { error } = await supabase
          .from("program_round_playlists")
          .update({ sort_order: i })
          .eq("id", rows[i].id);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || "Failed to reorder"),
  });

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= linked.length) return;
    const arr = [...linked];
    const [m] = arr.splice(index, 1);
    arr.splice(to, 0, m);
    reorderMutation.mutate(arr);
  };

  const options = type === "video" ? videoPlaylists : audioPlaylists;

  const body = (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Type</p>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as PlaylistType);
                  setSelectedId("");
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground">Playlist</p>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${type} playlist`} />
                </SelectTrigger>
                <SelectContent>
                  {(options as any[]).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!selectedId || addMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : linked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No playlists attached yet. Add as many audio or video playlists as you like.
            </p>
          ) : (
            <div className="space-y-2">
              {linked.map((row: any, i: number) => (
                <div key={row.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {row.playlist_type === "video" ? (
                    <VideoIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium flex-1 truncate">{nameFor(row)}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {row.playlist_type}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={i === linked.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeMutation.mutate(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
