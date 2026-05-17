import { useState } from "react";
import { useMyRecentMoments } from "@/hooks/useMyRecentMoments";
import type { UserMoment } from "@/hooks/useMoments";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind, labelForKind } from "@/lib/moments";
import { SendMomentToFriendSheet } from "./SendMomentToFriendSheet";
import { Sparkles, Send } from "lucide-react";

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
  const [picked, setPicked] = useState<UserMoment | null>(null);

  return (
    <div className="px-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-white/80" />
        <h2 className="text-white text-[13px] font-semibold tracking-tight">
          Fresh from you · last 24h
        </h2>
      </div>

      {isLoading ? (
        <div className="text-white/50 text-[12px] py-4">Loading…</div>
      ) : moments.length === 0 ? (
        <div
          className="rounded-2xl p-4 text-[12px] text-white/75 leading-snug"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
        >
          Finish a breathe, reflection, routine or playlist — your moment will land here. Then you can dedicate it to a friend ✨
        </div>
      ) : (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-2">
            {moments.map((m) => {
              const dedicated = !!m.dedicated_at;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => !dedicated && setPicked(m)}
                  disabled={dedicated}
                  className="shrink-0 w-[160px] rounded-2xl p-3 text-left active:scale-[0.97] transition-transform shadow-ios relative"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-11 h-11 rounded-xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]">
                      <FluentEmoji emoji={m.emoji || defaultEmojiForKind(m.kind)} size={28} />
                    </div>
                    {!dedicated ? (
                      <span className="w-7 h-7 rounded-full bg-white/15 grid place-items-center">
                        <Send className="w-3.5 h-3.5 text-white" />
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-white/70 px-2 py-1 rounded-full bg-white/10">
                        Sent
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60">
                    {labelForKind(m.kind)}
                  </div>
                  <div className="text-[13px] font-semibold text-white leading-tight line-clamp-2 mt-0.5">
                    {m.title}
                  </div>
                  <div className="text-[10px] text-white/55 mt-1">{relTime(m.created_at)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SendMomentToFriendSheet
        moment={picked}
        open={!!picked}
        onOpenChange={(v) => !v && setPicked(null)}
      />
    </div>
  );
}