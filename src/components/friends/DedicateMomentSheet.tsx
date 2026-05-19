import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useGiftableMoments } from "@/hooks/useMoments";
import { useSendDedication, useSendTokenDedication } from "@/hooks/useDedications";
import { MomentCard } from "./MomentCard";
import { haptic } from "@/lib/haptics";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string | null;
  recipientName: string | null;
  /** Token (non-user) flow: no recipientId; collect hint + create share token. */
  tokenMode?: boolean;
  onTokenCreated?: (args: { token: string; momentTitle: string; momentEmoji: string | null; recipientHint: string | null }) => void;
}

export function DedicateMomentSheet({
  open, onOpenChange, recipientId, recipientName, tokenMode, onTokenCreated,
}: Props) {
  const { data: moments = [], isLoading } = useGiftableMoments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState("");
  const send = useSendDedication();
  const sendToken = useSendTokenDedication();

  useEffect(() => {
    if (open) { setSelectedId(null); setMessage(""); setHint(""); }
  }, [open]);

  const submit = async () => {
    if (!selectedId) return;
    const moment = moments.find((m) => m.id === selectedId);
    try {
      if (tokenMode) {
        const { token } = await sendToken.mutateAsync({
          momentId: selectedId, message, recipientHint: hint,
        });
        haptic.success();
        confetti({
          particleCount: 80, spread: 70, origin: { y: 0.7 },
          colors: ["#FF8FA3", "#C4B5FD", "#8B5CF6", "#34D399"],
        });
        onTokenCreated?.({
          token,
          momentTitle: moment?.title ?? "A moment",
          momentEmoji: moment?.emoji ?? null,
          recipientHint: hint.trim() || null,
        });
        onOpenChange(false);
        return;
      }
      if (!recipientId) return;
      await send.mutateAsync({ momentId: selectedId, recipientId, message });
      haptic.success();
      confetti({
        particleCount: 80, spread: 70, origin: { y: 0.7 },
        colors: ["#FF8FA3", "#C4B5FD", "#8B5CF6", "#34D399"],
      });
      toast.success(`Sent to ${recipientName ?? "your friend"} 💝`);
      onOpenChange(false);
    } catch { /* toast handled */ }
  };

  const heading = tokenMode
    ? "Send to someone not on Rilo"
    : `Dedicate to ${recipientName ?? "your friend"}`;
  const subheading = tokenMode
    ? "Pick a moment, then we'll create a shareable link."
    : "Pick a moment from the last 72 hours.";
  const ctaLabel = tokenMode
    ? (sendToken.isPending ? "Creating…" : "Create share link")
    : (send.isPending ? "Sending…" : "Send dedication");
  const pending = tokenMode ? sendToken.isPending : send.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dark rounded-t-[28px] border-0 p-0 max-h-[92dvh] flex flex-col text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, #3A1E66 0%, #1A0E2E 55%, #0E0820 100%)",
        }}
      >
        {/* Aurora nebula glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 35% at 25% 10%, rgba(235,94,51,0.20), transparent 65%), radial-gradient(ellipse 55% 35% at 80% 50%, rgba(178,140,255,0.22), transparent 65%)",
          }}
        />
        {/* Twinkle stars */}
        <svg className="pointer-events-none absolute inset-0 w-full h-full" aria-hidden>
          {Array.from({ length: 22 }).map((_, i) => {
            const seed = (i * 9301 + 49297) % 233280;
            const x = (seed % 97) / 97;
            const y = ((seed * 7) % 89) / 89;
            const r = 0.6 + ((seed % 13) / 13) * 1.2;
            const o = 0.3 + ((seed % 11) / 11) * 0.5;
            return <circle key={i} cx={`${x * 100}%`} cy={`${y * 60}%`} r={r} fill="#fff" opacity={o} />;
          })}
        </svg>

        <div className="relative flex-1 overflow-y-auto p-6 pt-5 pb-4">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-4" />
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#FFE0B8]" />
            <h2 className="text-xl font-bold text-white">
              {heading}
            </h2>
          </div>
          <p className="text-sm text-white/65 mb-5">
            {subheading}
          </p>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-white/60">Loading…</div>
          ) : moments.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-5xl mb-3">🌱</div>
              <p className="text-sm text-white/70 max-w-[28ch] mx-auto">
                Finish a breathe, reflection or routine to earn a moment to give.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {moments.map((m) => (
                <MomentCard
                  key={m.id}
                  kind={m.kind}
                  title={m.title}
                  emoji={m.emoji}
                  createdAt={m.created_at}
                  selected={selectedId === m.id}
                  dimmed={selectedId !== null && selectedId !== m.id}
                  onClick={() => setSelectedId(m.id)}
                />
              ))}
            </div>
          )}

          {moments.length > 0 && (
            <>
              {tokenMode && (
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value.slice(0, 40))}
                  placeholder="Their first name (optional)"
                  className="mt-4 w-full p-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 outline-none backdrop-blur-md text-[15px]"
                />
              )}
              {/* No user-written messages — UGC between users is not allowed. */}
            </>
          )}
        </div>
        {moments.length > 0 && (
          <div
            className="relative shrink-0 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10"
            style={{ background: "rgba(14,8,32,0.85)", backdropFilter: "blur(14px)" }}
          >
            <button
              onClick={submit}
              disabled={!selectedId || pending}
              style={{
                background: !selectedId || pending
                  ? "rgba(255,255,255,0.10)"
                  : "linear-gradient(135deg, #FFE0B8 0%, #FFB088 50%, #EB5E33 100%)",
                color: !selectedId || pending ? "rgba(255,255,255,0.45)" : "#000000",
                boxShadow: !selectedId || pending ? "none" : "0 8px 24px -8px rgba(235,94,51,0.55)",
              }}
              className="w-full min-h-12 py-3.5 rounded-2xl font-semibold active:scale-[0.98] transition-transform"
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}