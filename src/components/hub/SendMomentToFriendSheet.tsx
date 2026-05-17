import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useFriendships, type FriendProfile } from "@/hooks/useFriends";
import { useSendDedication } from "@/hooks/useDedications";
import type { UserMoment } from "@/hooks/useMoments";
import { MomentCard } from "@/components/friends/MomentCard";
import { haptic } from "@/lib/haptics";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface Props {
  moment: UserMoment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendMomentToFriendSheet({ moment, open, onOpenChange }: Props) {
  const { data: friendships = [] } = useFriendships();
  const friends: FriendProfile[] = friendships
    .filter((f) => f.friendship.status === "accepted")
    .map((f) => f.other);

  const [selected, setSelected] = useState<FriendProfile | null>(null);
  const send = useSendDedication();

  useEffect(() => {
    if (open) { setSelected(null); }
  }, [open]);

  const submit = async () => {
    if (!selected || !moment) return;
    try {
      // No message — UGC between users is not allowed.
      await send.mutateAsync({ momentId: moment.id, recipientId: selected.id });
      haptic.success();
      confetti({
        particleCount: 80, spread: 70, origin: { y: 0.7 },
        colors: ["#FF8FA3", "#C4B5FD", "#8B5CF6", "#34D399"],
      });
      toast.success(`Dedicated to ${selected.full_name ?? "your friend"} 💝`);
      onOpenChange(false);
    } catch { /* toast handled in hook */ }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] flex flex-col"
      >
        <div className="flex-1 overflow-y-auto p-6 pt-5 pb-4">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-black/15 mb-4" />
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
            <h2 className="text-xl font-bold text-black dark:text-white">Dedicate this</h2>
          </div>
          <p className="text-sm text-[hsl(var(--fg-warm-muted))] mb-4">
            Send it to a friend — they can try it too.
          </p>

          {moment && (
            <MomentCard
              kind={moment.kind}
              title={moment.title}
              emoji={moment.emoji}
              createdAt={moment.created_at}
            />
          )}

          <div className="mt-5 mb-2 text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--fg-warm-muted))]">
            Send to
          </div>

          {friends.length === 0 ? (
            <div className="py-8 text-center text-sm text-[hsl(var(--fg-warm-muted))]">
              Add a friend first to dedicate moments.
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => {
                const isSel = selected?.id === f.id;
                const dim = selected !== null && !isSel;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelected(f)}
                    className={[
                      "w-full flex items-center gap-3 p-3 rounded-2xl text-left",
                      "bg-white/70 dark:bg-white/10 backdrop-blur-xl shadow-ios",
                      "transition-all active:scale-[0.98]",
                      isSel ? "ring-2 ring-[hsl(var(--brand-primary))] scale-[1.01]" : "",
                      dim ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] grid place-items-center shrink-0 overflow-hidden">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-bold text-black/70">
                          {(f.full_name ?? "?").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-black dark:text-white truncate">
                        {f.full_name ?? "Friend"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
        {friends.length > 0 && (
          <div className="shrink-0 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background border-t border-black/5">
            <button
              onClick={submit}
              disabled={!selected || send.isPending}
              style={{
                backgroundColor: !selected || send.isPending ? "#E5E5E5" : "#EB5E33",
                color: !selected || send.isPending ? "#8A8A8A" : "#FFFFFF",
              }}
              className="w-full min-h-12 py-3.5 rounded-2xl font-semibold shadow-ios active:scale-[0.98] transition-transform"
            >
              {send.isPending ? "Sending…" : "Send dedication"}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}