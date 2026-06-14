import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import "@/aperture/tokens/aperture.css";

export type ApertureTheme = "dark" | "light";

interface Ctx {
  theme: ApertureTheme;
  setTheme: (t: ApertureTheme) => void;
  toggle: () => void;
}

const ApertureThemeCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "aperture-theme";

export function useApertureTheme(): Ctx {
  const ctx = useContext(ApertureThemeCtx);
  if (!ctx) throw new Error("useApertureTheme must be used inside <ApertureLayout>");
  return ctx;
}

interface ApertureLayoutProps {
  children: ReactNode;
  /** Default theme on first load. Persists across visits once user toggles. */
  defaultTheme?: ApertureTheme;
  /** Optional className appended to the root wrapper. */
  className?: string;
}

/**
 * Root wrapper for all Aperture pages. Installs the scoped token layer,
 * applies the data-aperture-theme attribute, and exposes a theme context.
 *
 * Tokens live in `aperture.css` under `.aperture-root` and never leak
 * into Rilo's design system.
 */
export function ApertureLayout({
  children,
  defaultTheme = "dark",
  className,
}: ApertureLayoutProps) {
  const [theme, setTheme] = useState<ApertureTheme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") return stored;
    } catch {}
    return defaultTheme;
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return (
    <ApertureThemeCtx.Provider value={value}>
      <Helmet>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <div
        className={["aperture-root", className].filter(Boolean).join(" ")}
        data-aperture-theme={theme}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </div>
    </ApertureThemeCtx.Provider>
  );
}