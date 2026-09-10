import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, PenSquare, Search, Check } from "lucide-react";
import { MessageButtonsEditor } from "./MessageButtonsEditor";
import { CannedRepliesPicker } from "./CannedReplies";
import type { MessageButton } from "./supportData";

interface Person {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Props {
  inboxType: "support" | "coach";
  onSent?: (conversationId: string) => void;
}

export function NewMessageDialog({ inboxType, onSent }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Person | null>(null);
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<MessageButton[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(20);
      setResults((data || []) as Person[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  const reset = () => {
    setQ(""); setResults([]); setSelected(null); setMessage(""); setButtons([]);
  };

  const send = async () => {
    if (!selected || !user || !message.trim()) return;
    setSending(true);
    try {
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", selected.id)
        .eq("inbox_type", inboxType)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId = existing?.id as string | undefined;
      if (!conversationId) {
        const { data: created, error } = await supabase
          .from("chat_conversations")
          .insert({ user_id: selected.id, inbox_type: inboxType, status: "open" })
          .select("id")
          .single();
        if (error) throw error;
        conversationId = created.id;
      }

      const clean = buttons.filter((b) => b.label && b.url);
      const { error: msgError } = await (supabase as any).from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: "admin",
        content: message.trim(),
        buttons: clean.length ? clean : null,
      });
      if (msgError) throw msgError;

      await supabase.functions.invoke("send-chat-notification", {
        body: {
          conversationId,
          messageContent: message.trim(),
          senderType: "admin",
          senderId: user.id,
        },
      }).catch(() => undefined);

      toast({ title: "Message sent" });
      onSent?.(conversationId!);
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Could not send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <PenSquare className="h-3.5 w-3.5" />
          New message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>
            {searching && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching…
              </p>
            )}
            <div className="max-h-72 overflow-y-auto space-y-1">
              {results.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left p-2 rounded-lg border hover:bg-muted/50"
                  onClick={() => setSelected(p)}
                >
                  <p className="text-sm font-medium truncate">
                    {p.full_name || p.email?.split("@")[0] || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </button>
              ))}
              {!searching && q.trim().length >= 2 && results.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No one found.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {selected.full_name || selected.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(null)}>
                Change
              </Button>
            </div>

            <CannedRepliesPicker
              onInsert={(r) => {
                setMessage((m) => (m ? `${m}\n${r.body}` : r.body));
                if (r.buttons?.length) setButtons(r.buttons.slice(0, 3));
              }}
              onSend={(r) => {
                setMessage(r.body);
                if (r.buttons?.length) setButtons(r.buttons.slice(0, 3));
              }}
            />

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
              rows={5}
              dir="auto"
            />

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Buttons (optional)</p>
              <MessageButtonsEditor buttons={buttons} onChange={setButtons} compact />
            </div>

            <Button onClick={send} disabled={sending || !message.trim()} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send message
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
