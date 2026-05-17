import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { cn } from "@/lib/utils";
import { labelForKind, defaultEmojiForKind, type MomentKind } from "@/lib/moments";
import { Sparkles } from "lucide-react";

interface MomentCardProps {
  kind: MomentKind;
  title: string;
  emoji?: string | null;
  createdAt?: string;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  trailing?: React.ReactNode;
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function MomentCard({
  kind, title, emoji, createdAt,
  selected, dimmed, onClick, size = "md", className, trailing,
}: MomentCardProps) {
  const emojiSize = size === "lg" ? 72 : size === "sm" ? 40 : 56;
  const padding = size === "lg" ? "p-5" : size === "sm" ? "p-3" : "p-4";
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-3xl",
        padding,
        "bg-white/60 dark:bg-white/10 backdrop-blur-2xl",
        "shadow-ios transition-all duration-300",
        "active:scale-[0.98]",
        selected && "ring-2 ring-[hsl(var(--brand-primary))] scale-[1.02]",
        dimmed && "opacity-40 scale-[0.97]",
        className,
      )}
    >
      {selected && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(var(--brand-primary))] text-white shadow-ios">
          <Sparkles className="w-4 h-4" />
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="shrink-0 grid place-items-center rounded-2xl bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]"
             style={{ width: emojiSize + 12, height: emojiSize + 12 }}>
          <FluentEmoji emoji={emoji || defaultEmojiForKind(kind)} size={emojiSize} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-warm-muted))]">
            {labelForKind(kind)}
          </div>
          <div className="text-[15px] font-semibold text-black dark:text-white leading-snug truncate">
            {title}
          </div>
          {createdAt && (
            <div className="text-xs text-[hsl(var(--fg-warm-muted))] mt-0.5">
              {relativeTime(createdAt)}
            </div>
          )}
        </div>
        {trailing}
      </div>
    </Comp>
  );
}