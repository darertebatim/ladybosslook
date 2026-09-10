import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import QRCode from "qrcode";
import {
  ClipboardList,
  Route as RouteIcon,
  GraduationCap,
  Headphones,
  Compass,
  LifeBuoy,
  Settings,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RILO_DOWNLOAD_URL } from "@/components/chat/DownloadRiloDialog";

type NavItem = { path: string; label: string; icon: typeof ClipboardList; match?: string };

const PRIMARY: NavItem[] = [
  { path: "/app/path", label: "My Rilo Path", icon: RouteIcon },
  { path: "/app/home", label: "Today", icon: ClipboardList },
  { path: "/app/myprograms", label: "My Programs", icon: GraduationCap, match: "/app/myprograms" },
  { path: "/app/chat", label: "Support", icon: LifeBuoy },
];

const SECONDARY: NavItem[] = [
  { path: "/app/player", label: "Listen", icon: Headphones, match: "/app/player" },
  { path: "/app/tools", label: "Tools", icon: Compass },
  { path: "/app/academy", label: "Academy", icon: Sparkles },
  { path: "/app/settings", label: "Profile", icon: Settings },
];

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.match ? pathname.startsWith(item.match) : pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-[hsl(var(--brand-primary)/0.12)] text-brand font-semibold"
                : "text-fg-warm-muted hover:bg-muted/60",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.7} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Desktop-only left sidebar that replaces the phone tab bar on wide screens.
 */
export function DesktopSidebar() {
  const { pathname } = useLocation();
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(RILO_DOWNLOAD_URL, { margin: 1, width: 320, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setQrUrl(url))
      .catch(() =>
        !cancelled &&
        setQrUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(RILO_DOWNLOAD_URL)}`,
        ),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-border/60 bg-bg-warm/40 h-full overflow-y-auto">
      <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
        <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] flex items-center justify-center text-white font-bold">
          R
        </span>
        <span className="text-lg font-bold tracking-tight">Rilo</span>
      </Link>

      <nav className="flex-1 px-3 space-y-5">
        <NavGroup items={PRIMARY} pathname={pathname} />
        <div className="h-px bg-border/60 mx-3" />
        <NavGroup items={SECONDARY} pathname={pathname} />
      </nav>

      <div className="p-3">
        <div className="rounded-2xl bg-card shadow-ios p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <Smartphone className="h-4 w-4 text-brand" />
            Get the Rilo app
          </div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt="QR code to download the Rilo app"
              className="mx-auto mt-3 h-28 w-28 rounded-lg"
              loading="lazy"
            />
          )}
          <p className="mt-2 text-xs text-muted-foreground">Scan with your phone camera</p>
          <a
            href={RILO_DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            Download
          </a>
        </div>
      </div>
    </aside>
  );
}
