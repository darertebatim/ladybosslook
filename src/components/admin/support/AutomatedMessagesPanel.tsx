import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Send, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const SETTING_KEY = "automation_webinar_details_enabled";

interface Sent { id: string; created_at: string; conversation_id: string; name: string }

export function AutomatedMessagesPanel({ onOpenConversation }: { onOpenConversation: (conversationId: string) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [sent, setSent] = useState<Sent[]>([]);
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await supabase.from("app_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
    setEnabled(s?.value !== "false");
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("id, created_at, conversation_id, chat_conversations(user_id)")
      .eq("automation_key", "webinar_details")
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = data || [];
    const ids = [...new Set(rows.map((m: any) => m.chat_conversations?.user_id).filter(Boolean))] as string[];
    const map = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      (profs || []).forEach((p: any) => map.set(p.id, p.full_name || p.email));
    }
    setSent(rows.map((m: any) => ({ ...m, name: map.get(m.chat_conversations?.user_id) || "Unknown" })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", SETTING_KEY).maybeSingle();
    const { error } = existing
      ? await supabase.from("app_settings").update({ value: String(v), updated_at: new Date().toISOString() }).eq("key", SETTING_KEY)
      : await supabase.from("app_settings").insert({ key: SETTING_KEY, value: String(v), description: "Webinar details auto-reply in support chat" });
    if (error) { setEnabled(!v); alert(`Could not save: ${error.message}`); }
  };

  const backfill = async () => {
    if (!confirm("Send the webinar details reply to everyone from the last 4 days who asked and didn't get it?")) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("webinar-auto-reply", { body: { backfill: true } });
    setBusy(false);
    alert(error ? `Failed: ${error.message}` : `${data?.results?.sent || 0} sent`);
    load();
  };

  const today = sent.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="h-full overflow-y-auto p-4">
      <Card className="p-5 max-w-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Webinar details auto-reply</h3>
              <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "On" : "Off"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              When someone sends the message from the webinar thank-you page, they instantly get their session day and time in their own city, plus the app link and calendar button.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={toggle} aria-label="Turn auto-reply on or off" />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted p-3"><div className="text-xl font-bold">{sent.length}</div><div className="text-xs text-muted-foreground">Sent total</div></div>
          <div className="rounded-lg bg-muted p-3"><div className="text-xl font-bold">{today}</div><div className="text-xs text-muted-foreground">Sent today</div></div>
          <div className="rounded-lg bg-muted p-3"><div className="text-sm font-bold pt-1">{sent[0] ? format(new Date(sent[0].created_at), "MMM d, h:mm a") : "—"}</div><div className="text-xs text-muted-foreground">Last sent</div></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={backfill} disabled={busy} className="gap-2">
            <Send className="h-4 w-4" /> {busy ? "Sending…" : "Send to anyone missed"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowList((v) => !v)} className="gap-1">
            {showList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Who received it
          </Button>
        </div>

        {showList && (
          <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
            {sent.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Nobody yet.</p>
            ) : sent.map((s) => (
              <button key={s.id} onClick={() => onOpenConversation(s.conversation_id)} className="w-full flex justify-between p-3 text-sm text-left active:bg-muted">
                <span>{s.name}</span>
                <span className="text-muted-foreground">{format(new Date(s.created_at), "MMM d, h:mm a")}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
