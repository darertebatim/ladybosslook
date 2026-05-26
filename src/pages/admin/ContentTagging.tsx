import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import {
  useContentTagsByType,
  useSaveContentTags,
  type ContentType,
} from "@/hooks/useContentTags";
import { useAllTags } from "@/hooks/useTags";
import { useTagDimensions } from "@/hooks/useTagDimensions";
import { TagPicker } from "@/components/admin/TagPicker";

interface ContentRow {
  id: string;
  title: string;
  emoji?: string | null;
  subtitle?: string | null;
  groupName?: string | null;
}

const TYPE_TABS: { value: ContentType; label: string }[] = [
  { value: "audio", label: "Audios" },
  { value: "playlist", label: "Playlists" },
  { value: "reflection", label: "Reflections" },
  { value: "breathing", label: "Breathes" },
];

export default function ContentTagging() {
  const [tab, setTab] = useState<ContentType>("audio");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Content Tagging</h1>
        <p className="text-sm text-muted-foreground">
          Review and edit tags on every piece of content.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ContentType)}>
        <TabsList>
          {TYPE_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TYPE_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <ContentList contentType={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function useContentList(contentType: ContentType) {
  return useQuery({
    queryKey: ["admin-content-list", contentType],
    queryFn: async (): Promise<ContentRow[]> => {
      if (contentType === "audio") {
        const { data, error } = await supabase
          .from("audio_content")
          .select(
            "id, title, description, sort_order, audio_playlist_items(playlist:audio_playlists(name))"
          )
          .order("title", { ascending: true })
          .limit(2000);
        if (error) throw error;
        return (data || []).map((r: any) => {
          const names: string[] = (r.audio_playlist_items || [])
            .map((api: any) => api?.playlist?.name)
            .filter(Boolean);
          return {
            id: r.id,
            title: r.title,
            subtitle: r.description,
            groupName: names[0] || "— No playlist —",
          };
        });
      }
      if (contentType === "playlist") {
        const { data, error } = await supabase
          .from("audio_playlists")
          .select("id, name, description")
          .order("name", { ascending: true })
          .limit(1000);
        if (error) throw error;
        return (data || []).map((r: any) => ({ id: r.id, title: r.name, subtitle: r.description }));
      }
      if (contentType === "reflection") {
        const { data, error } = await supabase
          .from("reflections")
          .select("id, title, subtitle")
          .order("title", { ascending: true })
          .limit(1000);
        if (error) throw error;
        return (data || []).map((r: any) => ({ id: r.id, title: r.title, subtitle: r.subtitle }));
      }
      // breathing
      const { data, error } = await supabase
        .from("breathing_exercises")
        .select("id, name, emoji, subtitle")
        .order("name", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        title: r.name,
        emoji: r.emoji,
        subtitle: r.subtitle,
      }));
    },
  });
}

function ContentList({ contentType }: { contentType: ContentType }) {
  const { data: items = [], isLoading } = useContentList(contentType);
  const { data: links = [] } = useContentTagsByType(contentType);
  const { data: tags = [] } = useAllTags();
  const { data: dimensions = [] } = useTagDimensions();

  const [search, setSearch] = useState("");
  const [untaggedOnly, setUntaggedOnly] = useState(false);
  const [filterTagId, setFilterTagId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const tagsById = useMemo(() => {
    const m: Record<string, (typeof tags)[number]> = {};
    tags.forEach((t) => (m[t.id] = t));
    return m;
  }, [tags]);

  const dimsById = useMemo(() => {
    const m: Record<string, (typeof dimensions)[number]> = {};
    dimensions.forEach((d) => (m[d.id] = d));
    return m;
  }, [dimensions]);

  const linksByContentId = useMemo(() => {
    const m: Record<string, string[]> = {};
    links.forEach((l) => {
      m[l.content_id] = m[l.content_id] || [];
      m[l.content_id].push(l.tag_id);
    });
    return m;
  }, [links]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const hasTags = (linksByContentId[it.id] || []).length > 0;
      if (untaggedOnly && hasTags) return false;
      if (filterTagId && !(linksByContentId[it.id] || []).includes(filterTagId)) return false;
      if (s && !it.title.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [items, search, untaggedOnly, filterTagId, linksByContentId]);

  const editingItem = items.find((i) => i.id === editingId);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Search title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[200px]">
          <Label className="text-xs">Filter by tag</Label>
          <select
            value={filterTagId}
            onChange={(e) => setFilterTagId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Any —</option>
            {dimensions.map((d) => (
              <optgroup key={d.id} label={`${d.emoji ?? ""} ${d.label}`}>
                {tags
                  .filter((t) => t.dimension_id === d.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <Switch checked={untaggedOnly} onCheckedChange={setUntaggedOnly} />
          Untagged only
        </label>
        <div className="text-xs text-muted-foreground pb-2">
          {filtered.length} / {items.length}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="border rounded-md divide-y max-h-[70vh] overflow-y-auto">
          {filtered.map((it) => {
            const itemTagIds = linksByContentId[it.id] || [];
            return (
              <div
                key={it.id}
                className="p-2.5 flex items-center justify-between gap-2 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {it.emoji && <span className="text-lg">{it.emoji}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{it.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {itemTagIds.length === 0 && (
                        <span className="text-[11px] text-muted-foreground italic">
                          untagged
                        </span>
                      )}
                      {itemTagIds.map((tid) => {
                        const t = tagsById[tid];
                        if (!t) return null;
                        const d = dimsById[t.dimension_id];
                        return (
                          <span
                            key={tid}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-muted"
                            title={d?.label}
                          >
                            {t.emoji} {t.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingId(it.id)}>
                  Edit
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">No content.</p>
          )}
        </div>
      )}

      <EditDrawer
        contentType={contentType}
        item={editingItem || null}
        initialTagIds={editingItem ? linksByContentId[editingItem.id] || [] : []}
        onClose={() => setEditingId(null)}
      />
    </Card>
  );
}

function EditDrawer({
  contentType,
  item,
  initialTagIds,
  onClose,
}: {
  contentType: ContentType;
  item: ContentRow | null;
  initialTagIds: string[];
  onClose: () => void;
}) {
  const save = useSaveContentTags();
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);

  // Reset on open
  useMemo(() => {
    setTagIds(initialTagIds);
  }, [item?.id]);

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {item && (
          <>
            <SheetHeader>
              <SheetTitle>
                {item.emoji} {item.title}
              </SheetTitle>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground line-clamp-3">{item.subtitle}</p>
              )}
            </SheetHeader>
            <div className="py-4">
              <TagPicker value={tagIds} onChange={setTagIds} />
            </div>
            <SheetFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await save.mutateAsync({
                    contentType,
                    contentId: item.id,
                    tagIds,
                  });
                  onClose();
                }}
              >
                Save
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}