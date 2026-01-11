import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const variants = {
      default: "bg-white/10 hover:bg-white/20 border-white/20 text-foreground dark:bg-white/10 dark:hover:bg-white/20",
      primary: "bg-primary/90 hover:bg-primary border-primary/50 text-primary-foreground",
      ghost: "bg-transparent hover:bg-white/10 border-transparent text-foreground",
    };

    const sizes = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-14 w-14",
      xl: "h-18 w-18",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "backdrop-blur-md border shadow-lg",
          "transition-all duration-200 ease-out",
          "active:scale-95 hover:scale-105",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";
