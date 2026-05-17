import { Check, X, Sparkles } from "lucide-react";
import type { FriendshipWithProfile } from "@/hooks/useFriends";
import { useRespondToFriendRequest } from "@/hooks/useFriends";
import type { DedicationWithRelations } from "@/hooks/useDedications";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind } from "@/lib/moments";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  incoming: FriendshipWithProfile[];
  unseenDedications: DedicationWithRelations[];
  onOpenDedication: (d: DedicationWithRelations) => void;
}

export function PendingBanners({ incoming, unseenDedications, onOpenDedication }: Props) {
  const { user } = useAuth();
  const respond = useRespondToFriendRequest();
  if (!user) return null;
  if (incoming.length === 0 && unseenDedications.length === 0) return null;

  return (
    <div className="px-3 mt-3 space-y-2">
      {unseenDedications.map((d) => (
        <button
          key={d.dedication.id}
          onClick={() => onOpenDedication(d)}
          className="w-full text-left rounded-3xl p-4 flex items-center gap-3 shadow-ios active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(120deg, hsl(var(--tint-lavender)) 0%, hsl(var(--tint-peach)) 100%)",
          }}
        >
          <div className="shrink-0 grid place-items-center w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-md">
            <FluentEmoji
              emoji={d.moment?.emoji || (d.moment ? defaultEmojiForKind(d.moment.kind as any) : "💝")}
              size={40}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-black/70">
              <Sparkles className="w-3 h-3" /> New dedication
            </div>
            <div className="text-[15px] font-semibold text-black truncate">
              {d.other?.full_name || "A friend"} dedicated {d.moment?.title || "a moment"} to you
            </div>
          </div>
        </button>
      ))}

      {incoming.map((f) => (
        <div
          key={f.friendship.id}
          className="rounded-3xl p-4 flex items-center gap-3 shadow-ios bg-white/70 dark:bg-white/10 backdrop-blur-2xl"
        >
          <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] grid place-items-center text-lg font-semibold text-black">
            {(f.other.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--fg-warm-muted))]">
              Friend request
            </div>
            <div className="text-[15px] font-semibold text-black dark:text-white truncate">
              {f.other.full_name || "A new friend"}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => respond.mutate({ id: f.friendship.id, accept: false })}
              disabled={respond.isPending}
              className="h-10 min-w-10 px-3 rounded-full bg-black/5 text-black/70 text-sm font-semibold active:scale-95 transition-transform inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              aria-label="Decline"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => respond.mutate({ id: f.friendship.id, accept: true })}
              disabled={respond.isPending}
              style={{ backgroundColor: "#EB5E33", color: "#FFFFFF" }}
              className="h-10 min-w-[92px] px-4 rounded-full text-sm font-semibold shadow-ios active:scale-95 transition-transform inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60"
              aria-label="Accept"
            >
              <Check className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}