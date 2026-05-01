import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

const DISMISSED_KEY = "simora_spotlight_banner_dismissed";

interface Props {
  onStart: () => void;
  onVisibilityChange?: (visible: boolean) => void;
  className?: string;
}

/**
 * Welcome Spotlight banner — invites the user to take the 3-step starter tour
 * (tap a task → add a task → complete a task). Shown on Home until the user
 * either starts the tour or dismisses it.
 */
export function WelcomeSpotlightBanner({
  onStart,
  onVisibilityChange,
  className,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    setVisible(!dismissed);
  }, []);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  const handleStart = () => {
    haptic.success();
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    onStart();
  };

  if (!visible) return null;

  return (
    <div
      role="button"
      onClick={handleStart}
      className={cn(
        "relative w-full rounded-3xl p-3.5 overflow-hidden active:scale-[0.98] transition-transform mb-2",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d4f 100%)",
        boxShadow: "0 4px 14px rgba(26,26,46,0.25)",
      }}
    >
      {/* Decorative blob */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-50 blur-2xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #FFD9A8 0%, transparent 70%)" }}
      />

      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-white active:bg-white/80 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
      </button>

      <div className="relative flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-white text-[13px] font-bold leading-tight">
            Want a quick tour?
          </p>
          <div
            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.22)" }}
          >
            <Sparkles className="w-2.5 h-2.5 text-white" />
            <span className="text-white text-[9px] font-semibold tracking-wide">
              Show me around
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}