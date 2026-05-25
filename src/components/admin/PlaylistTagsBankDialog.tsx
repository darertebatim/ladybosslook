import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlaylistTags, PlaylistTag } from "@/hooks/usePlaylistTags";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

export const PlaylistTagsBankDialog = ({ open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const { data: tags = [], isLoading } = usePlaylistTags();

  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["playlist-tags"] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const label = newLabel.trim();
      if (!label) throw new Error("Label required");
      const slug = slugify(label);
      if (!slug) throw new Error("Invalid label");
      const nextOrder = (tags[tags.length - 1]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("playlist_tags").insert({
        slug,
        label,
        emoji: newEmoji.trim() || null,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewLabel("");
      setNewEmoji("");
      toast.success("Tag added");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add tag"),
  });

  const updateMutation = useMutation({
    mutationFn: async (tag: PlaylistTag) => {
      const label = editLabel.trim();
      if (!label) throw new Error("Label required");
      const { error } = await supabase
        .from("playlist_tags")
        .update({
          label,
          emoji: editEmoji.trim() || null,
        })
        .eq("id", tag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      toast.success("Tag updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update tag"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("playlist_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      invalidate();
      qc.invalidateQueries({ queryKey: ["playlist-tag-links"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete tag"),
  });

  const startEdit = (tag: PlaylistTag) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditEmoji(tag.emoji || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Playlist Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 space-y-2">
            <Label className="text-sm">Add new tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Emoji"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-20"
                maxLength={4}
              />
              <Input
                placeholder="Label (e.g. For Immigrants)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newLabel.trim()}
                size="sm"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : tags.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No tags yet. Add one above.
              </div>
            ) : (
              tags.map((tag) => {
                const isEditing = editingId === tag.id;
                return (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
                  >
                    {isEditing ? (
                      <>
                        <Input
                          value={editEmoji}
                          onChange={(e) => setEditEmoji(e.target.value)}
                          className="w-16 h-8"
                          maxLength={4}
                        />
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-8 flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateMutation.mutate(tag)}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="w-6 text-center">{tag.emoji || "🏷️"}</span>
                        <span className="flex-1 text-sm">{tag.label}</span>
                        <span className="text-xs text-muted-foreground">{tag.slug}</span>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(tag)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete tag "${tag.label}"? It will be removed from all playlists.`)) {
                              deleteMutation.mutate(tag.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};