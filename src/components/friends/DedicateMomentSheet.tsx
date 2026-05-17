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
    ? (sendToken.isPending ? "Creating…" : "Create share link →")
    : (send.isPending ? "Sending…" : "Dedicate 💝");
  const pending = tokenMode ? sendToken.isPending : send.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[90dvh] overflow-y-auto"
      >
        <div className="p-6 pt-5">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-black/15 mb-4" />
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
            <h2 className="text-xl font-bold text-black dark:text-white">
              {heading}
            </h2>
          </div>
          <p className="text-sm text-[hsl(var(--fg-warm-muted))] mb-5">
            {subheading}
          </p>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-[hsl(var(--fg-warm-muted))]">Loading…</div>
          ) : moments.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-5xl mb-3">🌱</div>
              <p className="text-sm text-[hsl(var(--fg-warm-muted))] max-w-[28ch] mx-auto">
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
                  className="mt-4 w-full p-4 rounded-2xl bg-[hsl(var(--tint-lavender))] text-black placeholder:text-black/40 outline-none shadow-ios text-[15px]"
                />
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                placeholder="Add a note (optional) — this one's for you…"
                rows={2}
                className="mt-3 w-full p-4 rounded-2xl bg-[hsl(var(--tint-peach))] text-black placeholder:text-black/40 outline-none shadow-ios resize-none text-[15px]"
              />
              <div className="text-right text-[11px] text-[hsl(var(--fg-warm-muted))] mt-1">
                {message.length}/140
              </div>

              <button
                onClick={submit}
                disabled={!selectedId || pending}
                className="mt-3 w-full py-3.5 rounded-2xl bg-[hsl(var(--brand-primary))] text-white font-semibold shadow-ios active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {ctaLabel}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}