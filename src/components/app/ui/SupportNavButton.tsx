import { useNavigate } from "react-router-dom";
import { Headset } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { cn } from "@/lib/utils";

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
    <button
      onClick={() => {
        haptic.light();
        navigate("/app/chat");
      }}
      className="relative p-2 -ml-1 active:scale-95 transition-transform"
      aria-label="Support"
    >
      <Headset
        className={cn("h-5 w-5", variant === "dark" ? "text-white" : "text-fg-warm")}
      />
      {unreadCount > 0 && (
        <span
          className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full"
          style={{
            background: "#EF4444",
            boxShadow: "0 0 0 2px rgba(255,248,243,0.95)",
          }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
