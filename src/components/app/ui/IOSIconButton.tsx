import { forwardRef, ButtonHTMLAttributes } from "react";
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
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

export const IOSIconButton = forwardRef<HTMLButtonElement, IOSIconButtonProps>(
  ({ className, variant = "light", size = "md", children, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-full shadow-ios active:scale-95 transition-all";
    const variants = {
      light: "bg-white text-[hsl(var(--brand-primary))]",
      dark: "bg-white/15 backdrop-blur-md text-white",
    };
    return (
      <button
        ref={ref}
        type="button"
        className={cn(base, variants[variant], sizeMap[size], className)}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
IOSIconButton.displayName = "IOSIconButton";