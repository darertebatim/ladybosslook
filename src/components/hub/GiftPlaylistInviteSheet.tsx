import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Gift, X, Loader2, Music, Crown, Lock } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";
import { toast } from "sonner";
import {
  useGiftablePlaylists,
  useMonthlyGiftCount,
  useCreatePlaylistGift,
  type GiftablePlaylist,
} from "@/hooks/usePlaylistGifts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myCode: string | null;
}

const MAX_GIFTS_PER_MONTH = 3;

function giftUrl(token: string): string {
  return `https://ladybosslook.com/g/${encodeURIComponent(token)}`;
}

function buildMessage(name: string, url: string, code: string | null) {
  const codeLine = code
    ? `\n\n(My friend code on Rilo is ${code} if you need it.)`
    : "";
  return `I'm gifting you "${name}" on Rilo — a playlist that's been helping me. It's yours to keep, forever ✨\n\n${url}${codeLine}`;
}

export function GiftPlaylistInviteSheet({ open, onOpenChange, myCode }: Props) {
  const { data: playlists = [], isLoading } = useGiftablePlaylists();
  const { data: monthCount = 0 } = useMonthlyGiftCount();
  const create = useCreatePlaylistGift();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const remaining = Math.max(0, MAX_GIFTS_PER_MONTH - monthCount);
  const close = () => onOpenChange(false);

  const giftPlaylist = async (p: GiftablePlaylist) => {
    if (pendingId) return;
    if (remaining <= 0) {
      toast.error("You've used all 3 gifts this month.");
      return;
    }
    setPendingId(p.id);
    try {
      const { token } = await create.mutateAsync(p.id);
      const url = giftUrl(token);
      const text = buildMessage(p.name, url, myCode);
      try {
        if (Capacitor.isNativePlatform()) {
          await CapShare.share({ title: "A gift from Rilo", text, url, dialogTitle: "Gift this playlist" });
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
      /* toast in hook */
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
          background: "linear-gradient(180deg, #0E2A3D 0%, #07131E 100%)",
        }}
      >
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
            <h2 className="text-[17px] font-bold text-white">Gift a playlist</h2>
            <div className="w-9" />
          </div>

          {/* Hero */}
          <div
            className="rounded-3xl p-5 mb-5 relative overflow-hidden text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(45,212,168,0.95) 0%, rgba(56,140,222,0.92) 100%)",
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15" />
            <div className="absolute -bottom-8 -left-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center bg-white/20 backdrop-blur-md mb-2.5">
                <Music className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white text-[18px] font-bold leading-tight">
                Pass on a playlist
              </h3>
              <p className="text-white/85 text-[12px] mt-1.5 leading-snug max-w-[280px] mx-auto">
                Pick one you love — your friend keeps it forever, even without Plus.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold">
                {remaining} of {MAX_GIFTS_PER_MONTH} gifts left this month
              </div>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-white/50 text-[12px] py-6 text-center">Loading…</div>
          ) : playlists.length === 0 ? (
            <div
              className="rounded-2xl p-4 text-[12px] text-white/75 leading-snug text-center"
              style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
            >
              You don't have any playlists to gift yet — save or unlock one first ✨
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {playlists.map((p) => {
                const isPending = pendingId === p.id;
                const disabled = !!pendingId || remaining <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => giftPlaylist(p)}
                    disabled={disabled}
                    className="w-full rounded-2xl p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform shadow-ios disabled:opacity-50"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
                      backdropFilter: "blur(14px)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0 overflow-hidden grid place-items-center">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-6 h-6 text-white/70" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {p.requires_subscription && (
                          <Crown className="w-3 h-3 text-[#F4C430] shrink-0" />
                        )}
                        <div className="text-[14px] font-semibold text-white leading-tight truncate">
                          {p.name}
                        </div>
                      </div>
                      <div className="text-[11px] text-white/60 mt-0.5">
                        {p.trackCount} {p.trackCount === 1 ? "track" : "tracks"}
                      </div>
                    </div>
                    <span
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-bold"
                      style={{
                        backgroundColor: isPending
                          ? "rgba(255,255,255,0.15)"
                          : remaining <= 0
                          ? "rgba(255,255,255,0.15)"
                          : "#2DD4A8",
                      }}
                    >
                      {isPending ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Preparing…</>
                      ) : remaining <= 0 ? (
                        <><Lock className="w-3 h-3" /> Out</>
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