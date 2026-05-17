import { useState } from "react";
import { useMyRecentMoments } from "@/hooks/useMyRecentMoments";
import type { UserMoment } from "@/hooks/useMoments";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind, labelForKind, type MomentKind } from "@/lib/moments";
import { SendMomentToFriendSheet } from "./SendMomentToFriendSheet";
import { Sparkles, Check } from "lucide-react";

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return "today";
}

/** Per-kind halo color (on dark background). */
function haloColorForKind(kind: MomentKind): string {
  switch (kind) {
    case "breathe":    return "rgba(167, 139, 250, 0.55)"; // lavender
    case "mood":       return "rgba(244, 114, 182, 0.55)"; // pink
    case "audio":      return "rgba(94, 234, 212, 0.55)";  // teal
    case "routine":    return "rgba(251, 146, 60, 0.55)";  // peach
    case "reflection": return "rgba(253, 224, 71, 0.55)";  // gold
  }
}

/** A single trophy medallion on the shelf. */
function Trophy({
  moment, onPick,
}: { moment: UserMoment; onPick: (m: UserMoment) => void }) {
  const dedicated = !!moment.dedicated_at;
  const halo = haloColorForKind(moment.kind);
  return (
    <button
      type="button"
      onClick={() => !dedicated && onPick(moment)}
      disabled={dedicated}
      className="shrink-0 w-[88px] flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
      aria-label={`${labelForKind(moment.kind)} — ${moment.title}`}
    >
      <div className="relative w-[72px] h-[72px] grid place-items-center">
        {/* Halo glow */}
        <div
          className="absolute inset-0 rounded-full blur-[14px]"
          style={{
            background: `radial-gradient(circle, ${halo} 0%, transparent 70%)`,
            animation: dedicated ? undefined : "hub-pulse 3.2s ease-in-out infinite",
          }}
        />
        {/* Coin */}
        <div
          className="relative w-[68px] h-[68px] rounded-full grid place-items-center shadow-ios"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
          }}
        >
          <FluentEmoji
            emoji={moment.emoji || defaultEmojiForKind(moment.kind)}
            size={42}
          />
          {dedicated && (
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full grid place-items-center shadow-ios"
              style={{ background: "linear-gradient(135deg, #F5C76A 0%, #D69A2C 100%)" }}
              aria-label="Gifted"
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-white/55">
          {labelForKind(moment.kind)} · {relTime(moment.created_at)}
        </div>
      </div>
    </button>
  );
}

/** Empty trophy slot — faint dotted circle, "waiting" feel. */
function EmptySlot() {
  return (
    <div className="shrink-0 w-[88px] flex flex-col items-center gap-1.5 opacity-50">
      <div
        className="w-[68px] h-[68px] rounded-full"
        style={{ border: "1.5px dashed rgba(255,255,255,0.18)" }}
      />
      <div className="text-[10px] uppercase tracking-wider font-semibold text-white/30">
        —
      </div>
    </div>
  );
}

export function RecentMomentsRow() {
  const { data: moments = [], isLoading } = useMyRecentMoments();
  const [picked, setPicked] = useState<UserMoment | null>(null);

  const slotsToFill = Math.max(0, 3 - moments.length);

  return (
    <div className="px-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-white text-[16px] font-bold tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-white/90" />
          Today's wins
        </h2>
        {moments.length > 0 && (
          <span className="text-[11px] text-white/50">
            Tap to send the spark
          </span>
        )}
      </div>

      <div className="relative">
        {/* Faint shelf line under the trophies */}
        <div
          className="absolute left-2 right-2 bottom-[26px] h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.18) 80%, transparent 100%)",
            boxShadow: "0 6px 18px -6px rgba(255,255,255,0.15)",
          }}
        />

        {isLoading ? (
          <div className="flex gap-1 pt-2 pb-4 justify-center">
            <EmptySlot /><EmptySlot /><EmptySlot />
          </div>
        ) : moments.length === 0 ? (
          <div className="pt-2 pb-1">
            <div className="flex gap-1 justify-center mb-3">
              <EmptySlot /><EmptySlot /><EmptySlot />
            </div>
            <p className="text-center text-[12px] text-white/55 leading-snug px-4 pb-2">
              Your shelf lights up when you finish a breathe, a routine, a playlist or a check-in. ✨
            </p>
          </div>
        ) : (
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 pt-2 pb-3">
            {moments.map((m) => (
              <Trophy key={m.id} moment={m} onPick={setPicked} />
            ))}
            {Array.from({ length: slotsToFill }).map((_, i) => (
              <EmptySlot key={`slot-${i}`} />
            ))}
          </div>
        )}
      </div>

      <SendMomentToFriendSheet
        moment={picked}
        open={!!picked}
        onOpenChange={(v) => !v && setPicked(null)}
      />
    </div>
  );
}
