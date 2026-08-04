import { useEffect, useRef } from "react";
import { useLocation, useParams, matchPath } from "react-router-dom";

declare global {
  interface Window {
    fbq?: (
      command: string,
      event: string,
      parameters?: Record<string, any>,
      options?: Record<string, any>,
    ) => void;
  }
}

// Routes that should also fire ViewContent (program-style pages)
const PROGRAM_ROUTES: { pattern: string; name: string; category?: string }[] = [
  { pattern: "/programs/:slug", name: "Program", category: "program" },
  { pattern: "/programs", name: "Programs List", category: "program" },
  { pattern: "/elc", name: "Empowered Ladyboss Challenge", category: "program" },
  { pattern: "/elclanding", name: "Empowered Ladyboss Challenge Landing", category: "program" },
  { pattern: "/flow", name: "Flow", category: "program" },
  { pattern: "/floew", name: "Flow", category: "program" },
  { pattern: "/sixtraps", name: "6 Instagram Traps", category: "webinar" },
  { pattern: "/presixtraps", name: "6 Instagram Traps (Pre)", category: "webinar" },
  { pattern: "/thankyousixtraps", name: "6 Instagram Traps (Thanks)", category: "webinar" },
];

export default function MetaPixelTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.fbq) return;
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;

    try {
      window.fbq("track", "PageView");

      const match = PROGRAM_ROUTES.find((r) => matchPath({ path: r.pattern, end: true }, location.pathname));
      if (match) {
        const slugMatch = matchPath({ path: match.pattern, end: true }, location.pathname);
        const slug = (slugMatch?.params as any)?.slug;
        window.fbq("track", "ViewContent", {
          content_name: slug ? `${match.name}: ${slug}` : match.name,
          content_category: match.category ?? "page",
          content_ids: slug ? [slug] : undefined,
        });
      }
    } catch {
      // no-op
    }
  }, [location.pathname, location.search]);

  return null;
}
