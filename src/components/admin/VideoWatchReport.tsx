import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface Row {
  id: string; user_id: string | null; email: string | null; video_key: string; video_title: string | null;
  page_path: string | null; platform: string; source: string; seconds_watched: number;
  max_position_seconds: number; duration_seconds: number | null; percent_watched: number; completed: boolean; updated_at: string;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VideoWatchReport() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["video-watch-sessions"],
    queryFn: async () => {
      const all: Row[] = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error } = await (supabase.from as any)("video_watch_sessions")
          .select("*").order("updated_at", { ascending: false }).range(from, from + 999);
        if (error) throw error;
        all.push(...data);
        if (data.length < 1000) break;
      }
      return all;
    },
  });

  const userIds = useMemo(() => [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[], [rows]);
  const { data: profiles = {} } = useQuery({
    queryKey: ["video-watch-profiles", userIds.length],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const map: Record<string, { name: string | null; email: string | null }> = {};
      for (let i = 0; i < userIds.length; i += 200) {
        const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds.slice(i, i + 200));
        data?.forEach((p: any) => (map[p.id] = { name: p.full_name, email: p.email }));
      }
      return map;
    },
  });

  const videos = useMemo(() => {
    const m: Record<string, { key: string; title: string; views: number; viewers: Set<string>; seconds: number; completed: number; pctSum: number; last: string }> = {};
    rows.forEach((r) => {
      const v = (m[r.video_key] ??= { key: r.video_key, title: r.video_title || r.video_key, views: 0, viewers: new Set(), seconds: 0, completed: 0, pctSum: 0, last: r.updated_at });
      v.views++;
      v.viewers.add(r.user_id || r.email || r.id);
      v.seconds += r.seconds_watched;
      v.pctSum += r.percent_watched;
      if (r.completed) v.completed++;
      if (r.video_title && v.title === v.key) v.title = r.video_title;
    });
    return Object.values(m).sort((a, b) => b.last.localeCompare(a.last));
  }, [rows]);

  const viewerRows = useMemo(() => {
    if (!selected) return [];
    const q = search.toLowerCase();
    return rows.filter((r) => r.video_key === selected).filter((r) => {
      if (!q) return true;
      const p = r.user_id ? profiles[r.user_id] : null;
      return [r.email, p?.email, p?.name].some((x) => x?.toLowerCase().includes(q));
    });
  }, [rows, selected, search, profiles]);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Videos watched</CardTitle></CardHeader>
        <CardContent>
          {videos.length === 0 ? <p className="text-sm text-muted-foreground">No views recorded yet.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Video</TableHead><TableHead>Views</TableHead><TableHead>Viewers</TableHead>
                <TableHead>Avg watched</TableHead><TableHead>Finished</TableHead><TableHead>Total time</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {videos.map((v) => (
                  <TableRow key={v.key} className={`cursor-pointer ${selected === v.key ? "bg-muted" : ""}`} onClick={() => setSelected(v.key)}>
                    <TableCell className="max-w-[320px] truncate font-medium">{v.title}</TableCell>
                    <TableCell>{v.views}</TableCell>
                    <TableCell>{v.viewers.size}</TableCell>
                    <TableCell>{Math.round(v.pctSum / v.views)}%</TableCell>
                    <TableCell>{v.completed}</TableCell>
                    <TableCell>{fmt(v.seconds)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="truncate">Who watched</CardTitle>
            <Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Viewer</TableHead><TableHead>Watched</TableHead><TableHead>Reached</TableHead>
                <TableHead>Where</TableHead><TableHead>When</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {viewerRows.map((r) => {
                  const p = r.user_id ? profiles[r.user_id] : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{p?.name || r.email || p?.email || "Anonymous visitor"}</div>
                        <div className="text-xs text-muted-foreground">{p?.email || r.email || ""}</div>
                      </TableCell>
                      <TableCell>{fmt(r.seconds_watched)}</TableCell>
                      <TableCell>
                        {r.percent_watched}%{r.duration_seconds ? ` of ${fmt(r.duration_seconds)}` : ""}{" "}
                        {r.completed && <Badge variant="secondary">Finished</Badge>}
                      </TableCell>
                      <TableCell className="text-xs">{r.platform} · {r.page_path}</TableCell>
                      <TableCell className="text-xs">{new Date(r.updated_at).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
