import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export function OneOnOneBookingsPanel({ programSlug, included }: { programSlug?: string; included: number }) {
  const [busy, setBusy] = useState(false);
  const { data: bookings = [], refetch } = useQuery({
    queryKey: ["admin-1on1-bookings", programSlug],
    enabled: !!programSlug,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("one_on_one_bookings")
        .select("id, invitee_name, invitee_email, start_time, status, user_id")
        .eq("program_slug", programSlug)
        .order("start_time", { ascending: false })
        .limit(50);
      return (data || []) as any[];
    },
  });

  const activate = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("calendly-setup-webhook");
    setBusy(false);
    if (error) {
      const d = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
      toast.error(`Calendly sync failed: ${d}`);
    } else {
      toast.success("Calendly sync is on — new bookings will appear here.");
      refetch();
    }
  };

  const active = bookings.filter((b) => b.status === "active");
  const counts = new Map<string, number>();
  active.forEach((b) => counts.set(b.invitee_email, (counts.get(b.invitee_email) || 0) + 1));

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Booked meetings ({active.length})</p>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={activate}>
          {busy ? "Connecting…" : "Turn on Calendly sync"}
        </Button>
      </div>
      {!programSlug ? (
        <p className="text-xs text-muted-foreground">Save the program first.</p>
      ) : bookings.length === 0 ? (
        <p className="text-xs text-muted-foreground">No bookings yet.</p>
      ) : (
        <ul className="space-y-1 max-h-56 overflow-auto">
          {bookings.map((b) => (
            <li key={b.id} className="text-xs flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5">
              <span className="truncate">
                {b.invitee_name || b.invitee_email}
                {!b.user_id && <span className="ml-1 text-destructive">(no matching account)</span>}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {b.start_time ? format(new Date(b.start_time), "MMM d, h:mm a") : "—"}
                {b.status !== "active" ? ` · ${b.status}` : ` · ${counts.get(b.invitee_email)}/${included}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
