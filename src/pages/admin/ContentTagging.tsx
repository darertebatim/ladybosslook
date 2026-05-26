import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface ContentRow {
  id: string;
  title: string;
  emoji?: string | null;
  subtitle?: string | null;
  groupName?: string | null;
}

const TYPE_TABS: { value: ContentType; label: string }[] = [
  { value: "playlist", label: "Playlists" },
  { value: "reflection", label: "Reflections" },
  { value: "breathing", label: "Breathes" },
];

export default function ContentTagging() {
  const [tab, setTab] = useState<ContentType>("playlist");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Content Tagging</h1>
        <p className="text-sm text-muted-foreground">
          Review and edit tags on every piece of content.
        </p>
      </div>

      <PendingReview />

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
            {t.value === "playlist" ? (
              <PlaylistList />
            ) : (
              <ContentList contentType={t.value} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function usePlaylistsWithTracks() {
  return useQuery({
    queryKey: ["admin-playlists-with-tracks"],
    queryFn: async () => {
      const { data: playlists, error: pErr } = await supabase
        .from("audio_playlists")
        .select("id, name, description")
        .order("name", { ascending: true })
        .limit(1000);
      if (pErr) throw pErr;

      const { data: items, error: iErr } = await supabase
        .from("audio_playlist_items")
        .select("playlist_id, sort_order, audio:audio_content(id, title, description)")
        .order("sort_order", { ascending: true })
        .limit(5000);
      if (iErr) throw iErr;

      const tracksByPlaylist: Record<string, ContentRow[]> = {};
      (items || []).forEach((it: any) => {
        if (!it.audio) return;
        (tracksByPlaylist[it.playlist_id] ||= []).push({
          id: it.audio.id,
          title: it.audio.title,
          subtitle: it.audio.description,
        });
      });

      return (playlists || []).map((p: any) => ({
        id: p.id as string,
        title: p.name as string,
        subtitle: p.description as string | null,
        tracks: tracksByPlaylist[p.id] || [],
      }));
    },
  });
}

function PlaylistList() {
  const { data: playlists = [], isLoading } = usePlaylistsWithTracks();
  const { data: playlistLinks = [] } = useContentTagsByType("playlist");
  const { data: audioLinks = [] } = useContentTagsByType("audio");
  const { data: tags = [] } = useAllTags();
  const { data: dimensions = [] } = useTagDimensions();

  const [search, setSearch] = useState("");
  const [untaggedOnly, setUntaggedOnly] = useState(false);
  const [filterTagId, setFilterTagId] = useState<string>("");
  const [editing, setEditing] = useState<
    | { contentType: ContentType; item: ContentRow }
    | null
  >(null);

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
    [...playlistLinks, ...audioLinks].forEach((l) => {
      (m[l.content_id] ||= []).push(l.tag_id);
    });
    return m;
  }, [playlistLinks, audioLinks]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return playlists.filter((p) => {
      const hasTags = (linksByContentId[p.id] || []).length > 0;
      if (untaggedOnly && hasTags) return false;
      if (filterTagId && !(linksByContentId[p.id] || []).includes(filterTagId))
        return false;
      if (s && !p.title.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [playlists, search, untaggedOnly, filterTagId, linksByContentId]);

  const renderTagChips = (id: string) => {
    const ids = linksByContentId[id] || [];
    if (ids.length === 0)
      return <span className="text-[11px] text-muted-foreground italic">untagged</span>;
    return ids.map((tid) => {
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
    });
  };

  const initialTagIds = editing
    ? linksByContentId[editing.item.id] || []
    : [];

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Search playlist</Label>
          <Input
            placeholder="Search title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[200px]">
          <Label className="text-xs">Filter by tag (playlist)</Label>
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
          {filtered.length} / {playlists.length}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="border rounded-md max-h-[70vh] overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            {filtered.map((p) => (
              <AccordionItem key={p.id} value={p.id} className="border-b last:border-b-0">
                <div className="flex items-center gap-2 px-3">
                  <AccordionTrigger className="flex-1 py-2.5 hover:no-underline">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-semibold truncate">
                        {p.title}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {p.tracks.length} tracks
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {renderTagChips(p.id)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing({ contentType: "playlist", item: p });
                    }}
                  >
                    Edit
                  </Button>
                </div>
                <AccordionContent className="bg-muted/20 pb-0">
                  {p.tracks.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground italic">
                      No tracks in this playlist.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {p.tracks.map((tr) => (
                        <div
                          key={tr.id}
                          className="pl-8 pr-3 py-2 flex items-center justify-between gap-2 hover:bg-muted/40"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm truncate">{tr.title}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {renderTagChips(tr.id)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditing({ contentType: "audio", item: tr })
                            }
                          >
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No playlists.
            </p>
          )}
        </div>
      )}

      <EditDrawer
        contentType={editing?.contentType ?? "playlist"}
        item={editing?.item ?? null}
        initialTagIds={initialTagIds}
        onClose={() => setEditing(null)}
      />
    </Card>
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

  const grouped = useMemo(() => {
    if (contentType !== "audio") return null;
    const map = new Map<string, ContentRow[]>();
    filtered.forEach((it) => {
      const g = it.groupName || "— No playlist —";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(it);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, contentType]);

  const editingItem = items.find((i) => i.id === editingId);

  const renderRow = (it: ContentRow) => {
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
  };

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
          {grouped
            ? grouped.map(([groupName, rows]) => (
                <div key={groupName}>
                  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
                    {groupName} <span className="opacity-60">· {rows.length}</span>
                  </div>
                  <div className="divide-y">{rows.map(renderRow)}</div>
                </div>
              ))
            : filtered.map(renderRow)}
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

function usePendingUntagged() {
  const cutoff =
    typeof window !== "undefined"
      ? localStorage.getItem("admin-pending-cutoff") || ""
      : "";
  return useQuery({
    queryKey: ["admin-pending-untagged", cutoff],
    queryFn: async () => {
      const [pl, au, re, br, links] = await Promise.all([
        supabase
          .from("audio_playlists")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("audio_content")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("reflections")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("breathing_exercises")
          .select("id, name, emoji, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("content_tags")
          .select("content_type, content_id"),
      ]);

      const tagged = new Set<string>();
      (links.data || []).forEach((l: any) =>
        tagged.add(`${l.content_type}:${l.content_id}`)
      );

      type Pending = {
        contentType: ContentType;
        id: string;
        title: string;
        emoji?: string | null;
        created_at: string;
      };
      const rows: Pending[] = [];
      (pl.data || []).forEach((r: any) => {
        if (!tagged.has(`playlist:${r.id}`))
          rows.push({ contentType: "playlist", id: r.id, title: r.name, created_at: r.created_at });
      });
      (au.data || []).forEach((r: any) => {
        if (!tagged.has(`audio:${r.id}`))
          rows.push({ contentType: "audio", id: r.id, title: r.title, created_at: r.created_at });
      });
      (re.data || []).forEach((r: any) => {
        if (!tagged.has(`reflection:${r.id}`))
          rows.push({ contentType: "reflection", id: r.id, title: r.title, created_at: r.created_at });
      });
      (br.data || []).forEach((r: any) => {
        if (!tagged.has(`breathing:${r.id}`))
          rows.push({
            contentType: "breathing",
            id: r.id,
            title: r.name,
            emoji: r.emoji,
            created_at: r.created_at,
          });
      });
      rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return cutoff ? rows.filter((r) => r.created_at > cutoff) : rows;
    },
    staleTime: 30 * 1000,
  });
}

const TYPE_BADGE: Record<ContentType, { label: string; cls: string }> = {
  playlist: { label: "Playlist", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  audio: { label: "Audio", cls: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  reflection: { label: "Reflection", cls: "bg-pink-500/15 text-pink-700 dark:text-pink-300" },
  breathing: { label: "Breathe", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
};

function PendingReview() {
  const { data: pending = [], isLoading } = usePendingUntagged();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<
    | { contentType: ContentType; item: ContentRow }
    | null
  >(null);

  const visible = expanded ? pending : pending.slice(0, 8);

  if (isLoading) return null;

  const dismissAll = () => {
    if (!confirm("Mark all current items as reviewed? Only future additions will appear here.")) return;
    localStorage.setItem("admin-pending-cutoff", new Date().toISOString());
    qc.invalidateQueries({ queryKey: ["admin-pending-untagged"] });
  };

  return (
    <Card className="p-4 space-y-3 border-amber-500/40 bg-amber-50/40 dark:bg-amber-500/5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            ⏳ Waiting to be tagged
            <span className="text-xs font-normal text-muted-foreground">
              ({pending.length})
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            New playlists, audios, reflections and breathes appear here until you tag them.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {pending.length > 0 && (
            <Button size="sm" variant="ghost" onClick={dismissAll}>
              Mark all reviewed
            </Button>
          )}
          {pending.length > 8 && (
            <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : `Show all (${pending.length})`}
            </Button>
          )}
        </div>
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          🎉 Everything is tagged. Nothing waiting.
        </p>
      ) : (
        <div className="border rounded-md divide-y bg-background">
          {visible.map((p) => {
            const badge = TYPE_BADGE[p.contentType];
            return (
              <div
                key={`${p.contentType}:${p.id}`}
                className="p-2.5 flex items-center justify-between gap-2 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  {p.emoji && <span className="text-base">{p.emoji}</span>}
                  <div className="text-sm font-medium truncate">{p.title}</div>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditing({
                      contentType: p.contentType,
                      item: { id: p.id, title: p.title, emoji: p.emoji },
                    })
                  }
                >
                  Tag now
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <EditDrawer
        contentType={editing?.contentType ?? "playlist"}
        item={editing?.item ?? null}
        initialTagIds={[]}
        onClose={() => setEditing(null)}
      />
    </Card>
  );
}