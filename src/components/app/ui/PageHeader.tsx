import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoBack } from "@/hooks/useGoBack";
import { IOSIconButton } from "./IOSIconButton";
import { HomeMenu } from "@/components/app/HomeMenu";
import { PresenceStatsPill } from "./PresenceStatsPill";
import { SupportNavButton } from "./SupportNavButton";

/**
 * Standard page header for app pages (iOS 18 / Liquid Glass).
 *
 * Light variant — warm translucent bar over `bg-bg-warm`.
 * Dark  variant — translucent black-on-photo bar (Listen / cinematic pages).
 *
 * Layout: [back?]  Title  [right slot?]
 * With `menu`: [burger + support]  centered Title  [stats / right slot?]
 * — the layout used by the main pages (Home, Listen, My Rilo Path).
 *
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
  /** Back button look: iOS circle (default) or plain chevron like other app pages. */
  backStyle?: "circle" | "plain";
  /** Sticky vs static. Default: sticky to top. */
  sticky?: boolean;
  /** Burger menu + support headset on the left, centered title (main-page look). */
  menu?: boolean;
  /** Trophy + streak pill on the right, opening Presence. */
  stats?: boolean;
  className?: string;

}

export function PageHeader({
  title,
  back,
  onBack,
  right,
  subRow,
  variant = "light",
  backStyle = "circle",
  sticky = true,
  menu = false,
  stats = false,
  className,
}: PageHeaderProps) {
  const goBack = useGoBack();
  const handleBack = onBack ?? goBack;

  const surface =
    variant === "dark"
      ? "bg-foreground/20 backdrop-blur-xl text-background shadow-ios"
      : "bg-bg-warm/95 backdrop-blur-xl text-fg-warm shadow-ios";

  return (
    <header
      className={cn(
        sticky ? "sticky top-0 z-30" : "",
        "shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3",
        surface,
        className
      )}
    >
      {menu ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 min-h-[44px]">
          {/* Left: Menu + Support */}
          <div className="justify-self-start flex items-center gap-0 -ml-1 tour-menu-button">
            <HomeMenu />
            <SupportNavButton variant={variant} />
          </div>

          {/* Center: Title */}
          <h1 className="justify-self-center min-w-0 max-w-full text-center text-2xl font-bold leading-tight tracking-normal break-words">
            {title}
          </h1>

          {/* Right: stats pill / extra slots */}
          <div className="justify-self-end flex items-center gap-2">
            {stats && <PresenceStatsPill />}
            {right}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 min-h-[44px]">
          {back && (
            backStyle === "plain" ? (
              <button
                onClick={handleBack}
                aria-label="Back"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-brand active:opacity-70 transition-opacity"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            ) : (
              <IOSIconButton
                variant={variant}
                size="sm"
                onClick={handleBack}
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </IOSIconButton>
            )
          )}
          <h1 className="flex-1 text-2xl font-bold leading-tight truncate">{title}</h1>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      )}

      {subRow && <div className="mt-3">{subRow}</div>}
    </header>
  );
}
