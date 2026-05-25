import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  playlistId: string;
}

export const PlaylistTagChips = ({ playlistId }: Props) => {
  const { data: tags = [] } = useQuery({
    queryKey: ["playlist-tag-chips", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_playlist_tag_links")
        .select("playlist_tags(id, label, emoji, sort_order)")
        .eq("playlist_id", playlistId);
      if (error) throw error;
      return (data || [])
        .map((r: any) => r.playlist_tags)
        .filter(Boolean)
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
    enabled: !!playlistId,
    staleTime: 5 * 60 * 1000,
  });

  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag: any) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-peach text-fg-warm-muted"
        >
          {tag.emoji && <span>{tag.emoji}</span>}
          <span>{tag.label}</span>
        </span>
      ))}
    </div>
  );
};