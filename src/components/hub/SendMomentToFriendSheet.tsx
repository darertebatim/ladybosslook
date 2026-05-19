import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useFriendships, type FriendProfile } from "@/hooks/useFriends";
import { useSendDedication } from "@/hooks/useDedications";
import type { UserMoment } from "@/hooks/useMoments";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind, labelForKind } from "@/lib/moments";
import { haptic } from "@/lib/haptics";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Sparkles, X, Check } from "lucide-react";

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
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] flex flex-col [&>button]:hidden"
        style={{
          background: "linear-gradient(180deg, #1F1140 0%, #2A1655 100%)",
        }}
      >
        {/* Decorative stars */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-6 left-8 w-1 h-1 rounded-full bg-white/70" />
          <div className="absolute top-14 right-12 w-1.5 h-1.5 rounded-full bg-white/50" />
          <div className="absolute top-24 left-1/3 w-1 h-1 rounded-full bg-white/40" />
          <div className="absolute top-10 right-1/3 w-0.5 h-0.5 rounded-full bg-white/60" />
        </div>

        <div className="relative flex-1 overflow-y-auto px-5 pt-4 pb-4">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 grid place-items-center rounded-full bg-white/10 backdrop-blur-md active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-[17px] font-bold text-white">Inspire a friend</h2>
            </div>
            <div className="w-9" />
          </div>

          {/* Moment preview — glassy, on-theme */}
          {moment && (
            <div
              className="rounded-2xl p-3.5 flex items-center gap-3 shadow-ios mb-5"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] shrink-0">
                <FluentEmoji emoji={moment.emoji || defaultEmojiForKind(moment.kind)} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-white/65">
                  {labelForKind(moment.kind)}
                </div>
                <div className="text-[15px] font-semibold text-white leading-tight truncate mt-0.5">
                  {moment.title}
                </div>
                <p className="text-[11px] text-white/55 mt-1 leading-snug">
                  Your friend can try the same one.
                </p>
              </div>
            </div>
          )}

          <div className="text-[11px] uppercase tracking-wider font-semibold text-white/55 mb-2 px-1">
            Send to
          </div>

          {friends.length === 0 ? (
            <div
              className="rounded-2xl p-5 text-center text-[13px] text-white/75 leading-snug"
              style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
            >
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
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all active:scale-[0.98] shadow-ios"
                    style={{
                      background: isSel
                        ? "linear-gradient(160deg, rgba(235,94,51,0.28) 0%, rgba(214,67,122,0.20) 100%)"
                        : "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                      border: isSel
                        ? "1px solid rgba(235,94,51,0.7)"
                        : "1px solid rgba(255,255,255,0.10)",
                      backdropFilter: "blur(14px)",
                      opacity: dim ? 0.5 : 1,
                    }}
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
                      <div className="text-[15px] font-semibold text-white truncate">
                        {f.full_name ?? "Friend"}
                      </div>
                    </div>
                    {isSel && (
                      <span className="w-7 h-7 rounded-full grid place-items-center shrink-0" style={{ backgroundColor: "#EB5E33" }}>
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {friends.length > 0 && (
          <div className="relative shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10">
            <button
              onClick={submit}
              disabled={!selected || send.isPending}
              style={{
                backgroundColor: !selected || send.isPending ? "rgba(255,255,255,0.08)" : "#EB5E33",
                color: !selected || send.isPending ? "rgba(255,255,255,0.4)" : "#FFFFFF",
              }}
              className="w-full min-h-12 py-3.5 rounded-2xl font-semibold shadow-ios active:scale-[0.98] transition-transform"
            >
              {send.isPending ? "Sending…" : "Inspire"}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}