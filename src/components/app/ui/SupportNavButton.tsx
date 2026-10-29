import { useNavigate } from "react-router-dom";
import { Headset } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Header support shortcut — headset icon that opens the support chat.
 * Shows a red dot when the student has unread replies.
 *
 * Kept as its own component so the unread-chat realtime subscription only
 * exists on pages that actually render it.
 */
export function SupportNavButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const navigate = useNavigate();
  const { unreadCount } = useUnreadChat("support");

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        haptic.light();
        navigate("/app/chat");
      }}
      className="relative h-11 w-11 shrink-0 bg-transparent active:bg-transparent active:scale-95 transition-transform [&_svg]:size-5"
      aria-label="Support"
    >
      <Headset
        className={cn("h-5 w-5", variant === "dark" ? "text-background" : "text-fg-warm")}
      />
      {unreadCount > 0 && (
        <span
          className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive"
          aria-hidden="true"
        />
      )}
    </Button>
  );
}
