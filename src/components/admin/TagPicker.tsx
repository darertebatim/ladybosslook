import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTagDimensions } from "@/hooks/useTagDimensions";
import { useAllTags } from "@/hooks/useTags";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** Hide certain dimension slugs */
  hideDimensions?: string[];
}

/** Generic chip picker grouped by dimension. */
export const TagPicker = ({ value, onChange, hideDimensions = [] }: Props) => {
  const { data: dimensions = [] } = useTagDimensions();
  const { data: tags = [] } = useAllTags();
  const selected = new Set(value);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const grouped = useMemo(() => {
    return dimensions
      .filter((d) => d.is_active && !hideDimensions.includes(d.slug))
      .map((d) => ({
        dim: d,
        tags: tags.filter((t) => t.dimension_id === d.id && t.is_active),
      }))
      .filter((g) => g.tags.length > 0);
  }, [dimensions, tags, hideDimensions]);

  return (
    <div className="space-y-4">
      {grouped.map(({ dim, tags: dimTags }) => (
        <div key={dim.id} className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {dim.emoji} {dim.label}
          </Label>
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
                      : "bg-background text-foreground border-border hover:bg-muted"
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
  );
};