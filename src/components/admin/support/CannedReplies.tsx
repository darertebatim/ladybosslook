import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Zap, Send, Pencil, Trash2, Plus, Search } from "lucide-react";
import { MessageButtonsEditor } from "./MessageButtonsEditor";
import type { MessageButton } from "./supportData";

export interface CannedReply {
  id: string;
  title: string;
  body: string;
  buttons: MessageButton[];
  category: string;
  language: string;
  is_active: boolean;
  sort_order: number;
}

export function useCannedReplies() {
  const [replies, setReplies] = useState<CannedReply[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("support_canned_replies")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setReplies(
      ((data || []) as any[]).map((r) => ({
        ...r,
        buttons: Array.isArray(r.buttons) ? r.buttons : [],
      })) as CannedReply[]
    );
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { replies, loading, refresh };
}

const EMPTY = {
  title: "", body: "", category: "General", language: "en",
  buttons: [] as MessageButton[], is_active: true, sort_order: 0,
};

/** Full manager: create / edit / delete ready messages. */
export function CannedRepliesManager({ onSaved }: { onSaved?: () => void }) {
  const { toast } = useToast();
  const { replies, refresh } = useCannedReplies();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CannedReply | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const startNew = () => { setEditing(null); setForm({ ...EMPTY }); };
  const startEdit = (r: CannedReply) => {
    setEditing(r);
    setForm({
      title: r.title, body: r.body, category: r.category, language: r.language,
      buttons: r.buttons || [], is_active: r.is_active, sort_order: r.sort_order,
    });
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: "Add a title and a message", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      body: form.body,
      category: form.category.trim() || "General",
      language: form.language,
      buttons: form.buttons.filter((b) => b.label && b.url),
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    const { error } = editing
      ? await (supabase as any).from("support_canned_replies").update(payload).eq("id", editing.id)
      : await (supabase as any).from("support_canned_replies").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Ready message updated" : "Ready message added" });
    startNew();
    await refresh();
    onSaved?.();
  };

  const remove = async (r: CannedReply) => {
    await (supabase as any).from("support_canned_replies").delete().eq("id", r.id);
    if (editing?.id === r.id) startNew();
    await refresh();
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Ready messages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ready messages</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Saved ({replies.length})</p>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={startNew}>
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </div>
            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {replies.map((r) => (
                <div key={r.id} className="border rounded-lg p-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.body}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">{r.language}</Badge>
                        {!r.is_active && <Badge variant="secondary" className="text-[10px]">Off</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(r)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{editing ? "Edit message" : "New message"}</p>
            <Input
              placeholder="Title (only you see this)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Textarea
              placeholder="Message… you can use {first_name}"
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              dir="auto"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder="Language (en / fa)"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Buttons (optional)</p>
              <MessageButtonsEditor
                buttons={form.buttons}
                onChange={(buttons) => setForm({ ...form, buttons })}
                compact
              />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {editing ? "Save changes" : "Add ready message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PickerProps {
  onInsert: (reply: CannedReply) => void;
  onSend: (reply: CannedReply) => void;
}

/** Compact picker used above the composer. */
export function CannedRepliesPicker({ onInsert, onSend }: PickerProps) {
  const { replies } = useCannedReplies();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const list = replies.filter(
    (r) =>
      r.is_active &&
      (!q ||
        r.title.toLowerCase().includes(q.toLowerCase()) ||
        r.body.toLowerCase().includes(q.toLowerCase()) ||
        r.category.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
          <Zap className="h-3.5 w-3.5" />
          Ready messages
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {list.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">No ready messages yet.</p>
          )}
          {list.map((r) => (
            <div key={r.id} className="border rounded-lg p-2">
              <p className="text-xs font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2" dir="auto">{r.body}</p>
              <div className="flex gap-1.5 mt-1.5">
                <Button
                  variant="outline" size="sm" className="h-7 text-[11px] px-2"
                  onClick={() => { onInsert(r); setOpen(false); }}
                >
                  <Pencil className="h-3 w-3 mr-1" /> Insert
                </Button>
                <Button
                  size="sm" className="h-7 text-[11px] px-2"
                  onClick={() => { onSend(r); setOpen(false); }}
                >
                  <Send className="h-3 w-3 mr-1" /> Send
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
