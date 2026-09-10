import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import QRCode from "qrcode";
import {
  ClipboardList,
  Route as RouteIcon,
  Headphones,
  Compass,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RILO_DOWNLOAD_URL } from "@/components/chat/DownloadRiloDialog";
import riloLogo from "@/assets/rilo-app-icon.png";

type NavItem = { path: string; label: string; icon: typeof ClipboardList; match?: string };

const NAV_ITEMS: NavItem[] = [
  { path: "/app/path", label: "My Rilo Path", icon: RouteIcon },
  { path: "/app/home", label: "Today", icon: ClipboardList },
  { path: "/app/player", label: "Listen", icon: Headphones, match: "/app/player" },
  { path: "/app/tools", label: "Tools", icon: Compass },
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
                : "text-fg-warm-muted active:bg-muted/60",
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
 * Desktop presentation of the same four destinations used by the phone tab bar.
 * Fixed positioning keeps it entirely outside the app page's scroll layout.
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col border-r border-border/60 bg-bg-warm lg:flex">
      <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
        <img src={riloLogo} alt="Rilo" className="h-8 w-8 rounded-xl" />
        <span className="text-lg font-bold tracking-tight">Rilo</span>
      </Link>

      <nav className="flex-1 px-3">
        <NavGroup items={NAV_ITEMS} pathname={pathname} />
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
