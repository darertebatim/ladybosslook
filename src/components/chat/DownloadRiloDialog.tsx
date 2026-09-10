import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Check, Smartphone } from "lucide-react";
import { ONELINK_BASE_URL } from "@/lib/appsflyer";

export const RILO_DOWNLOAD_URL = `${ONELINK_BASE_URL}?pid=web_support&c=support_chat&af_xp=custom`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shown a moment after someone sends a support message from the website,
 * inviting them to continue the conversation inside the Rilo app.
 */
export function DownloadRiloDialog({ open, onOpenChange }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open || !isDesktop || qrUrl) return;
    let cancelled = false;
    QRCode.toDataURL(RILO_DOWNLOAD_URL, { margin: 1, width: 480, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch((err) => {
        console.error("QR generation failed", err);
        if (!cancelled) {
          setQrUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(RILO_DOWNLOAD_URL)}`
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, isDesktop, qrUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>

          <DialogHeader className="mt-4 space-y-1.5 text-center sm:text-center">
            <DialogTitle className="text-lg leading-snug">Your message is on its way</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Get the Rilo app so you never miss our reply.
            </DialogDescription>
          </DialogHeader>

          <ul className="mt-5 w-full space-y-2.5 text-left">
            <li className="flex items-start gap-2.5 text-sm">
              <Bell className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-muted-foreground">Instant notification the moment our team answers</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-muted-foreground">Your programs, lessons and support chat in one place</span>
            </li>
          </ul>

          {isDesktop && qrUrl && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <img
                src={qrUrl}
                alt="QR code to download the Rilo app"
                className="h-40 w-40 rounded-xl border border-border bg-card p-2"
              />
              <p className="text-xs text-muted-foreground">Scan with your phone camera</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 space-y-3">
          <Button asChild size="lg" className="w-full">
            <a href={RILO_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
              Download Rilo
            </a>
          </Button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-muted-foreground underline underline-offset-4"
          >
            Continue here in the browser
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
