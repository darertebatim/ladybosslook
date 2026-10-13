import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface Booking {
  id: string;
  invitee_name: string;
  invitee_email: string;
  start_time: string | null;
  status: string;
  user_id: string | null;
  program_slug: string | null;
}

/**
 * Booked Calendly meetings. Lives in the 1:1 Clients tab of Programs
 * Management, so the program editor stays focused on settings.
 * Without `programSlug` it lists bookings across every program.
 */
export function OneOnOneBookingsPanel({
  programSlug,
  included,
  className = "space-y-2 border-t pt-3",
}: {
  programSlug?: string;
  included?: number;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const { data: bookings = [], refetch } = useQuery({
    queryKey: ["admin-1on1-bookings", programSlug ?? "all"],
    queryFn: async () => {
      let query = (supabase as any)
        .from("one_on_one_bookings")
        .select("id, invitee_name, invitee_email, start_time, status, user_id, program_slug");
      if (programSlug) query = query.eq("program_slug", programSlug);
      const { data } = await query.order("start_time", { ascending: false }).limit(100);
      return (data || []) as Booking[];
    },
  });

  // Program names for the all-programs view
  const { data: titles = [] } = useQuery({
    queryKey: ["admin-1on1-bookings-titles"],
    enabled: !programSlug,
    queryFn: async () => {
      const { data } = await supabase.from("program_catalog").select("slug, title");
      return (data || []) as { slug: string; title: string }[];
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
  const titleFor = (slug: string | null) =>
    titles.find((t) => t.slug === slug)?.title || slug || "";

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Booked meetings ({active.length})</p>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={activate}>
          {busy ? "Connecting…" : "Turn on Calendly sync"}
        </Button>
      </div>
      {bookings.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No bookings yet. Meetings booked through Calendly appear here automatically.
        </p>
      ) : (
        <ul className="space-y-1 max-h-56 overflow-auto">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="text-xs flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5"
            >
              <span className="truncate">
                {b.invitee_name || b.invitee_email}
                {!b.user_id && <span className="ml-1 text-destructive">(no matching account)</span>}
                {!programSlug && b.program_slug && (
                  <span className="ml-1 text-muted-foreground">· {titleFor(b.program_slug)}</span>
                )}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {b.start_time ? format(new Date(b.start_time), "MMM d, h:mm a") : "—"}
                {b.status !== "active"
                  ? ` · ${b.status}`
                  : included
                    ? ` · ${counts.get(b.invitee_email) || 0}/${included}`
                    : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
