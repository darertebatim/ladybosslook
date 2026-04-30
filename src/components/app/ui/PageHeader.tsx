import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoBack } from "@/hooks/useGoBack";
import { IOSIconButton } from "./IOSIconButton";

/**
 * Standard page header for app pages (iOS 18 / Liquid Glass).
 *
 * Light variant — warm translucent bar over `bg-bg-warm`.
 * Dark  variant — translucent black-on-photo bar (Listen / cinematic pages).
 *
 * Layout: [back?]  Title  [right slot?]
 * Floats with `shadow-ios`, no rings/borders.
 */
export interface PageHeaderProps {
  title: ReactNode;
  /** Show a back chevron (uses safe history). */
  back?: boolean;
  /** Override the back handler (default: useGoBack). */
  onBack?: () => void;
  /** Right-side content (icons/buttons). */
  right?: ReactNode;
  /** Sub-row below the title (e.g. TabPills). */
  subRow?: ReactNode;
  variant?: "light" | "dark";
  /** Sticky vs static. Default: sticky to top. */
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  back,
  onBack,
  right,
  subRow,
  variant = "light",
  sticky = true,
  className,
}: PageHeaderProps) {
  const goBack = useGoBack();
  const handleBack = onBack ?? goBack;

  const surface =
    variant === "dark"
      ? "bg-black/20 backdrop-blur-xl text-white shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
      : "bg-white/35 dark:bg-black/20 backdrop-blur-xl text-[hsl(var(--fg-warm))] shadow-[0_2px_10px_rgba(0,0,0,0.06)]";

  return (
    <header
      className={cn(
        sticky ? "sticky top-0 z-30" : "",
        "px-4 pt-safe pb-3 rounded-b-2xl",
        surface,
        className
      )}
    >
      <div className="flex items-center gap-3 min-h-[44px]">
        {back && (
          <IOSIconButton
            variant={variant}
            size="sm"
            onClick={handleBack}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </IOSIconButton>
        )}
        <h1 className="flex-1 text-2xl font-bold leading-tight truncate">{title}</h1>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
      {subRow && <div className="mt-3">{subRow}</div>}
    </header>
  );
}