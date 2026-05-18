import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Gift, X, Sparkles, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";
import { toast } from "sonner";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { useMyRecentMoments } from "@/hooks/useMyRecentMoments";
import { useSendTokenDedication } from "@/hooks/useDedications";
import { defaultEmojiForKind, labelForKind } from "@/lib/moments";
import { dedicationUrl } from "@/lib/dedicationShare";
import type { UserMoment } from "@/hooks/useMoments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myCode: string | null;
}

function buildMessage(title: string, url: string, code: string | null) {
  const codeLine = code
    ? `\n\nOr use my friend code ${code} for a little welcome gift.`
    : "";
  return `Come take care of yourself with me on Rilo 💝\n\nI just finished "${title}" — try it too:\n${url}${codeLine}`;
}

export function GiftMomentInviteSheet({ open, onOpenChange, myCode }: Props) {
  const { data: moments = [], isLoading } = useMyRecentMoments();
  const sendToken = useSendTokenDedication();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const close = () => onOpenChange(false);

  const giftMoment = async (m: UserMoment) => {
    if (pendingId) return;
    setPendingId(m.id);
    try {
      const { token } = await sendToken.mutateAsync({ momentId: m.id });
      const url = dedicationUrl(token);
      const text = buildMessage(m.title, url, myCode);
      try {
        if (Capacitor.isNativePlatform()) {
          await CapShare.share({ title: "A gift from Rilo", text, url, dialogTitle: "Gift this moment" });
        } else if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({ title: "A gift from Rilo", text, url });
        } else {
          await navigator.clipboard.writeText(text);
          toast.success("Copied — paste anywhere ✨");
        }
        close();
      } catch (err: any) {
        if (err?.message && !/cancel/i.test(err.message)) {
          try { await navigator.clipboard.writeText(text); toast.success("Copied — paste anywhere ✨"); close(); }
          catch { toast.error("Couldn't share"); }
        }
      }
    } catch {
      // toast handled in hook
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[90dvh] [&>button]:hidden"
        style={{
          background: "linear-gradient(180deg, #2A1655 0%, #150A30 100%)",
        }}
      >
        {/* Twinkles */}
        <style>{`
          @keyframes gm-twinkle { 0%,100%{opacity:.3;transform:scale(.9)} 50%{opacity:1;transform:scale(1.1)} }
        `}</style>
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-[28px]">
          <div className="absolute top-6 left-8 w-1 h-1 rounded-full bg-white" style={{ animation: "gm-twinkle 3s ease-in-out infinite" }} />
          <div className="absolute top-14 right-12 w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "gm-twinkle 4s ease-in-out infinite .5s" }} />
          <div className="absolute top-24 left-1/3 w-1 h-1 rounded-full bg-white" style={{ animation: "gm-twinkle 3.5s ease-in-out infinite 1s" }} />
          <div className="absolute top-32 right-1/4 w-1 h-1 rounded-full bg-white" style={{ animation: "gm-twinkle 5s ease-in-out infinite 1.5s" }} />
        </div>

        <div className="relative p-5 pt-4 pb-8 text-white overflow-y-auto max-h-[90dvh]">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-4" />

          <div className="flex items-center justify-between mb-5">
            <button
              onClick={close}
              className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <h2 className="text-[17px] font-bold text-white">Gift a moment</h2>
            <div className="w-9" />
          </div>

          {/* Hero */}
          <div
            className="rounded-3xl p-5 mb-5 relative overflow-hidden text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(235,94,51,0.95) 0%, rgba(214,67,122,0.92) 100%)",
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
            <div className="absolute -bottom-8 -left-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center bg-white/20 backdrop-blur-md mb-2.5">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white text-[18px] font-bold leading-tight">
                Share what worked for you
              </h3>
              <p className="text-white/85 text-[12px] mt-1.5 leading-snug max-w-[280px] mx-auto">
                Pick one of your moments from the last 24h.
                Your friend will land on it — ready to try, no signup needed.
              </p>
            </div>
          </div>

          {/* Moments list */}
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
            <div className="text-white/80 text-[11px] uppercase tracking-wider font-semibold">
              Your moments today
            </div>
          </div>

          {isLoading ? (
            <div className="text-white/50 text-[12px] py-6 text-center">Loading…</div>
          ) : moments.length === 0 ? (
            <div
              className="rounded-2xl p-4 text-[12px] text-white/75 leading-snug text-center"
              style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
            >
              Finish a breathe, routine, playlist or mood check-in first — it'll show up here, ready to gift ✨
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {moments.map((m) => {
                const isPending = pendingId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => giftMoment(m)}
                    disabled={isPending || !!pendingId}
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
                        {labelForKind(m.kind)}
                      </div>
                      <div className="text-[14px] font-semibold text-white leading-tight truncate mt-0.5">
                        {m.title}
                      </div>
                    </div>
                    <span
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-bold"
                      style={{ backgroundColor: isPending ? "rgba(255,255,255,0.15)" : "#EB5E33" }}
                    >
                      {isPending ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Preparing…</>
                      ) : (
                        <><Gift className="w-3 h-3" /> Gift</>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
