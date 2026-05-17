import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Send, Search, QrCode, X } from "lucide-react";
import { useSendFriendRequest } from "@/hooks/useFriends";
import { toast } from "sonner";

type View = "menu" | "code";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: () => void;
  onShowMyCode: () => void;
}

export function HubAddFriendSheet({ open, onOpenChange, onInvite, onShowMyCode }: Props) {
  const [view, setView] = useState<View>("menu");
  const [code, setCode] = useState("");
  const send = useSendFriendRequest();

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setView("menu"); setCode(""); }, 200);
  };

  const submit = async () => {
    if (code.trim().length < 4) return;
    try {
      await send.mutateAsync(code);
      close();
    } catch { /* toast handled */ }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[90dvh] [&>button]:hidden"
        style={{
          background:
            "linear-gradient(180deg, #1F1140 0%, #2A1655 100%)",
        }}
      >
        <div className="p-5 pt-4 pb-8 text-white">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-4" />
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={close}
              className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <h2 className="text-[17px] font-bold text-white">
              {view === "menu" ? "Add friends" : "Enter friend code"}
            </h2>
            <div className="w-9" />
          </div>

          {view === "menu" ? (
            <div className="space-y-3">
              <button
                onClick={() => { onInvite(); close(); }}
                className="w-full p-4 rounded-2xl bg-white shadow-ios flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
              >
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: "#FFE4D2" }}>
                  <Send className="w-5 h-5" style={{ color: "#EB5E33" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-black">Invite friends</div>
                  <div className="text-xs text-black/55">Share your invite link anywhere</div>
                </div>
              </button>

              <button
                onClick={() => setView("code")}
                className="w-full p-4 rounded-2xl bg-white shadow-ios flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
              >
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: "#E8DCFF" }}>
                  <Search className="w-5 h-5" style={{ color: "#6A3FCC" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-black">Enter code</div>
                  <div className="text-xs text-black/55">Type a friend's 8-letter code</div>
                </div>
              </button>

              <button
                onClick={() => { onShowMyCode(); close(); }}
                className="w-full p-4 rounded-2xl bg-white shadow-ios flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
              >
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: "#FFD9E5" }}>
                  <QrCode className="w-5 h-5" style={{ color: "#D6437A" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-black">My code</div>
                  <div className="text-xs text-black/55">Show your QR + friend code</div>
                </div>
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-white/70 mb-4">
                Ask for their 8-letter friend code and type it below.
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD2345"
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-5 rounded-2xl bg-white text-black placeholder:text-black/25 outline-none shadow-ios"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setView("menu")}
                  className="flex-1 min-h-12 rounded-2xl font-semibold bg-white/10 text-white active:scale-[0.98] transition-transform"
                >
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={code.trim().length < 4 || send.isPending}
                  style={{
                    backgroundColor: code.trim().length < 4 || send.isPending ? "#3A2566" : "#EB5E33",
                    color: code.trim().length < 4 || send.isPending ? "rgba(255,255,255,0.4)" : "#FFFFFF",
                  }}
                  className="flex-[1.4] min-h-12 rounded-2xl font-semibold shadow-ios active:scale-[0.98] transition-transform"
                >
                  {send.isPending ? "Sending…" : "Send request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}