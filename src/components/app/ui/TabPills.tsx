import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated 2-3 pill switcher (iOS 18 / Liquid Glass).
 * Knob slides between options. Matches Home view-switcher.
 *
 * Light: track = bg-tint-peach, knob = bg-brand-primary text white.
 * Dark : track = bg-white/10,  knob = bg-white/95 text fg-warm.
 */
export interface TabPillOption<V extends string = string> {
  value: V;
  label: string;
}

interface TabPillsProps<V extends string = string> {
  options: TabPillOption<V>[];
  value: V;
  onChange: (v: V) => void;
  variant?: "light" | "dark";
  className?: string;
}

export function TabPills<V extends string = string>({
  options,
  value,
  onChange,
  variant = "light",
  className,
}: TabPillsProps<V>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [knob, setKnob] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = btnRefs.current[value];
    const wrap = containerRef.current;
    if (!el || !wrap) return;
    const wrapBox = wrap.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    setKnob({ left: elBox.left - wrapBox.left, width: elBox.width });
  }, [value, options.length]);

  const trackCls =
    variant === "dark"
      ? "bg-white/10 backdrop-blur-md"
      : "bg-[hsl(var(--tint-peach))]";
  const knobCls =
    variant === "dark"
      ? "bg-white/95 text-[hsl(var(--fg-warm))]"
      : "bg-[hsl(var(--brand-primary))] text-white";
  const inactiveTextCls =
    variant === "dark"
      ? "text-white/70"
      : "text-[hsl(var(--fg-warm-muted))]";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex items-center rounded-full p-1 shadow-ios",
        trackCls,
        className
      )}
    >
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded-full shadow-ios transition-all duration-300 ease-out",
          knobCls
        )}
        style={{ left: knob.left, width: knob.width }}
        aria-hidden
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => (btnRefs.current[opt.value] = el)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 px-4 h-9 text-sm font-semibold rounded-full transition-colors active:scale-95",
              active ? "" : inactiveTextCls
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}