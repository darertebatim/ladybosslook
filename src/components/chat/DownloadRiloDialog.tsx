import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { ONELINK_BASE_URL } from "@/lib/appsflyer";

export const RILO_DOWNLOAD_URL = `${ONELINK_BASE_URL}?pid=web_support&c=support_chat&af_xp=custom`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shown after someone sends a support message from the website,
 * inviting them to continue the conversation inside the Rilo app.
 */
export function DownloadRiloDialog({ open, onOpenChange }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  useEffect(() => {
    if (!open || !isDesktop) return;
    QRCode.toDataURL(RILO_DOWNLOAD_URL, {
      margin: 1,
      width: 420,
      errorCorrectionLevel: "M",
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [open, isDesktop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Get replies faster in the Rilo app</DialogTitle>
          <DialogDescription>
            Download Rilo to get a notification the moment our team answers, and keep your
            programs, lessons and support chat in one place.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <a href={RILO_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
              Download Rilo
            </a>
          </Button>

          {isDesktop && qrUrl && (
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={qrUrl}
                alt="QR code to download the Rilo app"
                className="h-36 w-36 rounded-lg border border-border"
              />
              <p className="text-xs text-muted-foreground">Scan with your phone camera</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Continue here in the browser
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
