import { useMemo } from "react";
import { useTagDimensions } from "@/hooks/useTagDimensions";
import { useAllTags } from "@/hooks/useTags";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}

/**
 * Dimension-grouped tag picker for playlists. Reads from the unified
 * tag schema (tag_dimensions + tags) so admins can tag a playlist across
 * every dimension (Path role, Subject, Language, etc.) in one place.
 */
export const PlaylistTagPicker = ({ value, onChange, hint }: Props) => {
  const { data: dimensions = [], isLoading: dimsLoading } = useTagDimensions();
  const { data: tags = [], isLoading: tagsLoading } = useAllTags();
  const isLoading = dimsLoading || tagsLoading;
  const selected = new Set(value);

  const toggle = (tagId: string) => {
    const next = new Set(selected);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    onChange(Array.from(next));
  };

  const grouped = useMemo(() => {
    return dimensions
      .filter((d) => d.is_active)
      .map((d) => ({
        dim: d,
        tags: tags.filter((t) => t.dimension_id === d.id && t.is_active),
      }))
      .filter((g) => g.tags.length > 0);
  }, [dimensions, tags]);

  return (
    <div className="space-y-3">
      <Label>Tags</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading tags…
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No tags yet. Define dimensions and tags on the Content Tagging admin page.
        </p>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ dim, tags: dimTags }) => (
            <div key={dim.id} className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
                {dim.emoji && <span>{dim.emoji}</span>}
                <span>{dim.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dimTags.map((tag) => {
                  const active = selected.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggle(tag.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border active:bg-muted",
                      )}
                    >
                      {tag.emoji && <span>{tag.emoji}</span>}
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};