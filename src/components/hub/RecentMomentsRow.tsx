import { useState } from "react";
import { useMyRecentMoments } from "@/hooks/useMyRecentMoments";
import type { UserMoment } from "@/hooks/useMoments";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind, labelForKind } from "@/lib/moments";
import { SendMomentToFriendSheet } from "@/components/hub/SendMomentToFriendSheet";
import { Sparkles, Gift } from "lucide-react";

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return "today";
}

export function RecentMomentsRow() {
  const { data: moments = [], isLoading } = useMyRecentMoments();
  const [pickerMoment, setPickerMoment] = useState<UserMoment | null>(null);

  return (
    <div className="px-4">
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-white/90" />
          <h2 className="text-white text-[16px] font-bold tracking-tight">
            Your moments today
          </h2>
        </div>
        <p className="text-white text-[15px] mt-1.5 leading-snug font-medium">
          These are your moments of taking better care of yourself in the last 24 hours. Inspire a friend to join in.
        </p>
      </div>

      {isLoading ? (
        <div className="text-white/50 text-[12px] py-4">Loading…</div>
      ) : moments.length === 0 ? (
        <div
          className="rounded-2xl p-4 text-[12px] text-white/75 leading-snug"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
        >
          Finish a breathe, a routine, a playlist or a mood check-in — it will show up here, ready to gift to a friend ✨
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {moments.map((m) => {
            const sentToFriend = !!m.dedicated_at;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPickerMoment(m)}
                className="w-full rounded-2xl p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform shadow-ios disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div className="w-12 h-12 rounded-xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] shrink-0">
                  <FluentEmoji emoji={m.emoji || defaultEmojiForKind(m.kind)} size={30} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60">
                    {labelForKind(m.kind)} · {relTime(m.created_at)}
                    {sentToFriend && " · sent to friend"}
                  </div>
                  <div className="text-[14px] font-semibold text-white leading-tight truncate mt-0.5">
                    {m.title}
                  </div>
                </div>
                {sentToFriend ? (
                  <span className="shrink-0 text-[9px] uppercase tracking-wider font-bold text-white/70 px-2 py-1 rounded-full bg-white/10">
                    Sent
                  </span>
                ) : (
                <span
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-bold"
                  style={{ backgroundColor: "#EB5E33" }}
                >
                  <Gift className="w-3 h-3" /> Gift
                </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <SendMomentToFriendSheet
        moment={pickerMoment}
        open={!!pickerMoment}
        onOpenChange={(v) => !v && setPickerMoment(null)}
      />
    </div>
  );
}
