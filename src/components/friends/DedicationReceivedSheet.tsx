import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { DedicationWithRelations } from "@/hooks/useDedications";
import { useMarkDedicationSeen, useMarkDedicationTried } from "@/hooks/useDedications";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind, labelForKind } from "@/lib/moments";
import { Sparkles, Play, Send, X } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { tryDeepLinkForMoment } from "@/lib/momentDeepLink";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

interface Props {
  dedication: DedicationWithRelations | null;
  onOpenChange: (open: boolean) => void;
  onSendBack: (recipientId: string, recipientName: string | null) => void;
}

export function DedicationReceivedSheet({ dedication, onOpenChange, onSendBack }: Props) {
  const open = !!dedication;
  const markSeen = useMarkDedicationSeen();
  const markTried = useMarkDedicationTried();
  const navigate = useNavigate();

  useEffect(() => {
    if (dedication && !dedication.dedication.seen_at) {
      markSeen.mutate(dedication.dedication.id);
    }
    if (open) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ["#FF8FA3", "#C4B5FD", "#34D399"] });
    }
  }, [open]); // eslint-disable-line

  const handleTryIt = async () => {
    if (!dedication?.moment) return;
    haptic.success();
    // Fire-and-forget nudge to sender ("liked")
    markTried.mutate(dedication.dedication.id);
    const senderName = dedication.other?.full_name || "your friend";
    toast.success(`Nudge sent to ${senderName} 💛`);
    const href = tryDeepLinkForMoment(
      dedication.moment.kind,
      dedication.moment.payload,
    );
    onOpenChange(false);
    setTimeout(() => navigate(href), 200);
  };

  const senderFirst = dedication?.other?.full_name?.split(" ")[0] || "A friend";
  const moment = dedication?.moment;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] overflow-hidden text-white [&>button]:text-white [&>button]:opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, #3A1E66 0%, #1A0E2E 60%, #0E0820 100%)",
        }}
      >
        {/* Decorative stars */}
        <style>{`
          @keyframes ded-twinkle { 0%,100% { opacity: 0.25; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        `}</style>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { l: "12%", t: "18%", s: 2, d: "0s" },
            { l: "78%", t: "12%", s: 3, d: "1.2s" },
            { l: "42%", t: "8%", s: 2, d: "0.6s" },
            { l: "88%", t: "32%", s: 2, d: "1.8s" },
            { l: "22%", t: "44%", s: 2, d: "2.4s" },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: s.l, top: s.t, width: s.s, height: s.s,
                animation: `ded-twinkle 3s ease-in-out ${s.d} infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/20 mb-4" />
          <div className="flex items-center gap-1.5 mb-4">
            <Sparkles className="w-4 h-4 text-white/90" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-white/80">
              A dedication for you
            </span>
          </div>

          {dedication && (
            <>
              <h2 className="text-white text-[22px] leading-tight font-bold tracking-tight">
                {senderFirst} dedicated this to you
              </h2>
              <p className="text-white/65 text-[13px] mt-1.5 leading-snug">
                Try it now — they'll feel your spark back instantly.
              </p>

              {moment && (
                <div
                  className="mt-5 rounded-2xl p-4 flex items-center gap-4 shadow-ios"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl grid place-items-center shrink-0 bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]">
                    <FluentEmoji
                      emoji={moment.emoji || defaultEmojiForKind(moment.kind as any)}
                      size={40}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60">
                      {labelForKind(moment.kind as any)}
                    </div>
                    <div className="text-[16px] font-bold text-white leading-tight truncate mt-0.5">
                      {moment.title}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleTryIt}
                className="mt-5 w-full min-h-12 py-3.5 rounded-2xl font-semibold shadow-ios active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                style={{ background: "#EB5E33", color: "#FFFFFF" }}
              >
                <Play className="w-4 h-4 fill-white" />
                Try it
              </button>
              <button
                onClick={() => {
                  if (dedication.other) {
                    onSendBack(dedication.other.id, dedication.other.full_name);
                  }
                }}
                className="mt-2 w-full min-h-12 py-3 rounded-2xl font-semibold text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Send className="w-4 h-4" />
                Inspire one back
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}