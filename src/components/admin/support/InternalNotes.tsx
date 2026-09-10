import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
}

export function InternalNotes({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("chat_internal_notes")
      .select("id,content,created_at,author_id")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });
    setNotes((data || []) as Note[]);
  }, [conversationId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async () => {
    if (!draft.trim() || !user) return;
    setSaving(true);
    await (supabase as any).from("chat_internal_notes").insert({
      conversation_id: conversationId,
      author_id: user.id,
      content: draft.trim(),
    });
    setDraft("");
    setSaving(false);
    refresh();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("chat_internal_notes").delete().eq("id", id);
    refresh();
  };

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <StickyNote className="h-3 w-3" />
        Private notes (customer can't see these)
      </h4>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a note…"
        rows={2}
        className="text-xs"
      />
      <Button size="sm" className="h-7 text-xs mt-1.5 w-full" onClick={add} disabled={saving || !draft.trim()}>
        Save note
      </Button>
      <div className="space-y-1.5 mt-2">
        {notes.map((n) => (
          <div key={n.id} className="text-xs p-2 rounded border bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap break-words">{n.content}</p>
              <button onClick={() => remove(n.id)} aria-label="Delete note">
                <Trash2 className="h-3 w-3 text-destructive shrink-0" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {format(new Date(n.created_at), "MMM d, h:mm a")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
