import { usePlaylistTags } from "@/hooks/usePlaylistTags";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}

export const PlaylistTagPicker = ({ value, onChange, hint }: Props) => {
  const { data: tags = [], isLoading } = usePlaylistTags();
  const selected = new Set(value);

  const toggle = (tagId: string) => {
    const next = new Set(selected);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading tags…
        </div>
      ) : tags.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No tags yet. Use "Manage Tags" to create some.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
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
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                {tag.emoji && <span>{tag.emoji}</span>}
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};