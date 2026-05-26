import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTagDimensions,
  useSaveTagDimension,
  useDeleteTagDimension,
  type TagDimension,
} from "@/hooks/useTagDimensions";
import {
  useAllTags,
  useSaveTag,
  useDeleteTag,
  type Tag,
} from "@/hooks/useTags";
import { cn } from "@/lib/utils";

export default function TagSchema() {
  const { data: dimensions = [], isLoading: dimsLoading } = useTagDimensions();
  const { data: tags = [] } = useAllTags();
  const saveDim = useSaveTagDimension();
  const delDim = useDeleteTagDimension();
  const saveTag = useSaveTag();
  const delTag = useDeleteTag();

  const [activeDimId, setActiveDimId] = useState<string | null>(null);
  const [editingDim, setEditingDim] = useState<Partial<TagDimension> | null>(null);
  const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);

  const activeDim = dimensions.find((d) => d.id === activeDimId) ?? dimensions[0];
  const activeId = activeDim?.id;
  const activeTags = useMemo(
    () => tags.filter((t) => t.dimension_id === activeId),
    [tags, activeId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tag Schema</h1>
        <p className="text-sm text-muted-foreground">
          Manage the tag dimensions and tags that label all audios, playlists, reflections, and breathing exercises.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Dimensions pane */}
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Dimensions</h2>
            <Button size="sm" variant="ghost" onClick={() => setEditingDim({ slug: "", label: "", is_multi_select: true, is_active: true, sort_order: dimensions.length + 1 })}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {dimsLoading ? (
            <p className="text-xs text-muted-foreground px-2">Loading…</p>
          ) : (
            <ul className="space-y-1">
              {dimensions.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setActiveDimId(d.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-md text-sm flex items-center justify-between group",
                      activeId === d.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {d.emoji && <span>{d.emoji}</span>}
                      <span>{d.label}</span>
                      {!d.is_active && (
                        <span className="text-[10px] text-muted-foreground">(hidden)</span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {tags.filter((t) => t.dimension_id === d.id).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {editingDim && (
            <DimensionEditor
              value={editingDim}
              onCancel={() => setEditingDim(null)}
              onSave={async (v) => {
                await saveDim.mutateAsync(v);
                setEditingDim(null);
              }}
            />
          )}
        </Card>

        {/* Tags pane */}
        <Card className="p-4 space-y-3">
          {!activeDim ? (
            <p className="text-sm text-muted-foreground">Select a dimension to edit its tags.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    {activeDim.emoji} {activeDim.label}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({activeDim.slug})
                    </span>
                  </h2>
                  {activeDim.description && (
                    <p className="text-xs text-muted-foreground">{activeDim.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingDim(activeDim)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit dimension
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete dimension "${activeDim.label}" and all its tags?`)) {
                        delDim.mutate(activeDim.id);
                        setActiveDimId(null);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditingTag({
                        dimension_id: activeDim.id,
                        slug: "",
                        label: "",
                        is_active: true,
                        sort_order: activeTags.length + 1,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add tag
                  </Button>
                </div>
              </div>

              {editingTag && editingTag.dimension_id === activeDim.id && (
                <TagEditor
                  value={editingTag}
                  parents={tags.filter((t) => t.dimension_id !== activeDim.id)}
                  onCancel={() => setEditingTag(null)}
                  onSave={async (v) => {
                    await saveTag.mutateAsync(v);
                    setEditingTag(null);
                  }}
                />
              )}

              <div className="border rounded-md divide-y">
                {activeTags.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No tags yet.
                  </p>
                )}
                {activeTags.map((t) => {
                  const parent = tags.find((x) => x.id === t.parent_tag_id);
                  return (
                    <div
                      key={t.id}
                      className="p-2 flex items-center justify-between gap-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{t.emoji || "🏷️"}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{t.label}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {t.slug}
                            {parent && ` → ${parent.label}`}
                            {!t.is_active && " · hidden"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTag(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete tag "${t.label}"?`)) delTag.mutate(t.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function DimensionEditor({
  value,
  onCancel,
  onSave,
}: {
  value: Partial<TagDimension>;
  onCancel: () => void;
  onSave: (v: Partial<TagDimension>) => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/30">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Slug</Label>
          <Input
            value={v.slug || ""}
            onChange={(e) => setV({ ...v, slug: e.target.value })}
            placeholder="emotion"
          />
        </div>
        <div>
          <Label className="text-xs">Label</Label>
          <Input
            value={v.label || ""}
            onChange={(e) => setV({ ...v, label: e.target.value })}
            placeholder="Emotion"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Emoji</Label>
          <Input value={v.emoji || ""} onChange={(e) => setV({ ...v, emoji: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Sort order</Label>
          <Input
            type="number"
            value={v.sort_order ?? 0}
            onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Input
          value={v.description || ""}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          <Switch
            checked={!!v.is_multi_select}
            onCheckedChange={(c) => setV({ ...v, is_multi_select: c })}
          />
          Multi-select
        </label>
        <label className="flex items-center gap-2">
          <Switch
            checked={v.is_active !== false}
            onCheckedChange={(c) => setV({ ...v, is_active: c })}
          />
          Active
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(v)}>
          <Check className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

function TagEditor({
  value,
  parents,
  onCancel,
  onSave,
}: {
  value: Partial<Tag>;
  parents: Tag[];
  onCancel: () => void;
  onSave: (v: Partial<Tag> & { dimension_id: string }) => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/30">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Emoji</Label>
          <Input value={v.emoji || ""} onChange={(e) => setV({ ...v, emoji: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Slug</Label>
          <Input
            value={v.slug || ""}
            onChange={(e) => setV({ ...v, slug: e.target.value })}
            placeholder="anxiety"
          />
        </div>
        <div>
          <Label className="text-xs">Sort</Label>
          <Input
            type="number"
            value={v.sort_order ?? 0}
            onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Label</Label>
        <Input
          value={v.label || ""}
          onChange={(e) => setV({ ...v, label: e.target.value })}
          placeholder="Anxiety"
        />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Input
          value={v.description || ""}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Parent tag (optional)</Label>
        <Select
          value={v.parent_tag_id || "__none__"}
          onValueChange={(val) => setV({ ...v, parent_tag_id: val === "__none__" ? null : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {parents.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.emoji} {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <Switch
          checked={v.is_active !== false}
          onCheckedChange={(c) => setV({ ...v, is_active: c })}
        />
        Active
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(v as Partial<Tag> & { dimension_id: string })}
        >
          <Check className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}