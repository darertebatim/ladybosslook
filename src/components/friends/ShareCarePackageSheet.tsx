import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { MessageCircle, Send, Link2, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import {
  dedicationUrl, whatsappLink, smsLink, telegramLink,
  nativeShare, copyLink, type SharePayload,
} from "@/lib/dedicationShare";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SharePayload | null;
  momentEmoji?: string | null;
}

export function ShareCarePackageSheet({ open, onOpenChange, payload, momentEmoji }: Props) {
  const [copied, setCopied] = useState(false);
  if (!payload) return null;
  const url = dedicationUrl(payload.token);
  const hint = payload.recipientHint;

  const handleCopy = async () => {
    const ok = await copyLink(payload);
    if (ok) {
      setCopied(true);
      haptic.success();
      toast.success("Link copied ✨");
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const open_ = (href: string) => { window.open(href, "_blank"); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] overflow-y-auto"
        style={{
          background: "linear-gradient(160deg, hsl(var(--tint-peach)) 0%, hsl(var(--tint-lavender)) 60%, hsl(var(--tint-mint)) 100%)",
        }}
      >
        <div className="p-6 pt-5">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-black/15 mb-5" />

          <div className="text-center">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-black/70">
              Your Care Package is ready
            </div>
            <h2 className="mt-1 text-[24px] leading-tight font-bold text-black px-2">
              Send it {hint ? `to ${hint}` : "to someone you love"}
            </h2>
          </div>

          {/* Preview card */}
          <div className="mt-5 rounded-3xl p-5 bg-white/70 backdrop-blur-xl shadow-ios text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]">
              <FluentEmoji emoji={momentEmoji || "💝"} size={56} />
            </div>
            <div className="mt-3 text-[15px] font-semibold text-black">
              {payload.momentTitle}
            </div>
            <div className="mt-1 text-[12px] text-black/60 break-all">{url}</div>
          </div>

          {/* Share buttons */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ShareBtn
              icon={<MessageCircle className="w-5 h-5" />}
              label="WhatsApp"
              onClick={() => open_(whatsappLink(payload))}
            />
            <ShareBtn
              icon={<MessageCircle className="w-5 h-5" />}
              label="Messages"
              onClick={() => { window.location.href = smsLink(payload); }}
            />
            <ShareBtn
              icon={<Send className="w-5 h-5" />}
              label="Telegram"
              onClick={() => open_(telegramLink(payload))}
            />
            <ShareBtn
              icon={<Share2 className="w-5 h-5" />}
              label="More…"
              onClick={async () => {
                const ok = await nativeShare(payload);
                if (!ok) handleCopy();
              }}
            />
          </div>

          <button
            onClick={handleCopy}
            className="mt-3 w-full py-3.5 rounded-2xl bg-black text-white font-semibold shadow-ios active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>

          <button
            onClick={() => onOpenChange(false)}
            className="mt-2 w-full py-3 rounded-2xl text-black/70 font-medium active:scale-[0.98] transition-transform"
          >
            Done
          </button>

          <p className="mt-3 text-center text-[11px] text-black/50 px-4">
            Anyone with this link can open your Care Package. It expires in 30 days.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShareBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/80 backdrop-blur-xl text-black font-semibold shadow-ios active:scale-95 transition-transform"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}