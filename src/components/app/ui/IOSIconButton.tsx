import { forwardRef, ButtonHTMLAttributes, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * iOS 18 / Liquid Glass icon button.
 *
 * Light variant: white circle, brand-orange icon, soft layered shadow, no ring.
 * Dark variant : translucent white-on-glass for dark/photographic backgrounds.
 *
 * Use this in place of `bg-white shadow-sm border …` floating buttons.
 */
export interface IOSIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

export const IOSIconButton = forwardRef<HTMLButtonElement, IOSIconButtonProps>(
  ({ className, variant = "light", size = "md", children, loading = false, disabled, onClick, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, style: styleProp, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-full shadow-ios transition-all";
    const variants = {
      light: "bg-white text-[hsl(var(--brand-primary))]",
      dark: "bg-white/15 backdrop-blur-md text-white",
    };
    const [pressed, setPressed] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const lockRef = useRef(false);
    useEffect(() => {
      if (typeof window === "undefined" || !window.matchMedia) return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = () => setReduceMotion(mq.matches);
      apply();
      mq.addEventListener?.("change", apply);
      return () => mq.removeEventListener?.("change", apply);
    }, []);
    const inactive = loading || !!disabled;
    const pressActive = pressed && !inactive;
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizeMap[size], className)}
        style={{
          transform: pressActive && !reduceMotion ? "scale(0.94)" : undefined,
          filter: pressActive ? "brightness(0.92)" : undefined,
          pointerEvents: inactive ? "none" : undefined,
          opacity: disabled && !loading ? 0.55 : undefined,
          cursor: inactive ? (loading ? "progress" : "not-allowed") : undefined,
          ...styleProp,
        }}
        onPointerDown={(e) => { if (!inactive) setPressed(true); onPointerDown?.(e); }}
        onPointerUp={(e) => { setPressed(false); onPointerUp?.(e); }}
        onPointerLeave={(e) => { setPressed(false); onPointerLeave?.(e); }}
        onPointerCancel={(e) => { setPressed(false); onPointerCancel?.(e); }}
        onClick={(e) => {
          if (inactive) return;
          if (lockRef.current) return;
          lockRef.current = true;
          try { onClick?.(e); }
          finally { setTimeout(() => { lockRef.current = false; }, 350); }
        }}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden
            style={{
              width: 14, height: 14, borderRadius: 999,
              border: "1.75px solid currentColor",
              borderTopColor: "transparent",
              display: "inline-block",
              animation: "iosBtnSpin 0.7s linear infinite",
            }}
          />
        ) : children}
        {loading && (<style>{`@keyframes iosBtnSpin { to { transform: rotate(360deg); } }`}</style>)}
      </button>
    );
  }
);
IOSIconButton.displayName = "IOSIconButton";