import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send } from "lucide-react";
import { format } from "date-fns";

const LABELS: Record<string, string> = {
  webinar_details: "Webinar details (auto-reply)",
  webinar_missed_bulk: "Webinar – missed it, next session",
};

interface Row {
  id: string;
  content: string;
  created_at: string;
  automation_key: string;
  conversation_id: string;
  user_id?: string;
  name?: string;
}

export function AutomatedMessagesPanel({ onOpenConversation }: { onOpenConversation: (conversationId: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("id, content, created_at, automation_key, conversation_id, chat_conversations(user_id)")
      .not("automation_key", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    const list: Row[] = (data || []).map((m: any) => ({ ...m, user_id: m.chat_conversations?.user_id }));
    const ids = [...new Set(list.map((r) => r.user_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p.full_name || p.email]));
      list.forEach((r) => (r.name = (r.user_id && map.get(r.user_id)) || "Unknown"));
    }
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const backfill = async () => {
    if (!confirm("Send the webinar details reply to everyone from the last 4 days who asked and didn't get it?")) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("webinar-auto-reply", { body: { backfill: true } });
    setBusy(false);
    alert(error ? `Failed: ${error.message}` : `Done: ${data?.results?.sent || 0} sent (${JSON.stringify(data?.results || {})})`);
    load();
  };

  const keys = [...new Set(rows.map((r) => r.automation_key))];
  const shown = filter === "all" ? rows : rows.filter((r) => r.automation_key === filter);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All ({rows.length})
        </Button>
        {keys.map((k) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
            {LABELS[k] || k} ({rows.filter((r) => r.automation_key === k).length})
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={backfill} disabled={busy} className="gap-2">
            <Send className="h-4 w-4" /> Send to anyone missed
          </Button>
          <Button size="icon" variant="ghost" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No automated messages sent yet.</p>
        ) : (
          shown.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenConversation(r.conversation_id)}
              className="w-full text-left p-4 active:bg-muted"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{r.name}</span>
                <Badge variant="secondary">{LABELS[r.automation_key] || r.automation_key}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</span>
              </div>
              <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">{r.content}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
