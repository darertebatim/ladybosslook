import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Copy, Share2, X } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string | null;
  displayName?: string | null;
}

export function MyCodeSheet({ open, onOpenChange, code, displayName }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !code) return;
    const payload = `https://ladybosslook.com/?friend=${code}`;
    QRCode.toDataURL(payload, {
      margin: 1,
      width: 480,
      color: { dark: "#1a0e2e", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [open, code]);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch { toast.error("Couldn't copy"); }
  };

  const shareLink = async () => {
    if (!code) return;
    const url = "https://ladybosslook.com";
    const text = `Be my friend on Rilo 💝\n\nMy friend code: ${code}\n\n${url}`;
    try {
      if (Capacitor.isNativePlatform()) {
        await CapShare.share({ title: "Add me on Rilo", text, url, dialogTitle: "Share my code" });
        return;
      }
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: "Add me on Rilo", text, url });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Invite copied — paste anywhere");
    } catch (err: any) {
      if (err?.message && !/cancel/i.test(err.message)) {
        try { await navigator.clipboard.writeText(text); toast.success("Invite copied"); }
        catch { toast.error("Couldn't open share sheet"); }
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] [&>button]:hidden"
        style={{ background: "linear-gradient(180deg, #1F1140 0%, #2A1655 100%)" }}
      >
        <div className="p-5 pt-4 pb-8 text-white">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-4" />
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <h2 className="text-[17px] font-bold text-white">My code</h2>
            <div className="w-9" />
          </div>

          <p className="text-center text-sm text-white/70 mt-1 mb-5">
            Have a friend scan this to add you instantly.
          </p>

          <div className="mx-auto bg-white rounded-3xl p-5 shadow-ios" style={{ width: "min(320px, 80vw)" }}>
            <div className="text-center">
              <div className="text-[15px] font-bold text-black">{displayName || "Your code"}</div>
              <button
                onClick={copyCode}
                className="mt-1 inline-flex items-center gap-1.5 text-black/70 active:scale-95"
              >
                <span className="font-mono tracking-[0.25em] text-[13px] font-semibold">{code ?? "————"}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-4 aspect-square w-full grid place-items-center">
              {qrUrl ? (
                <img src={qrUrl} alt="Your friend code QR" className="w-full h-full" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-black/5 animate-pulse" />
              )}
            </div>
          </div>

          <button
            onClick={shareLink}
            className="mt-6 mx-auto flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-ios active:scale-95"
            style={{ color: "#EB5E33" }}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[15px] font-bold">Share link</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}