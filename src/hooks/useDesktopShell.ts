import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/platform";

const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * True when the app is running in a desktop browser (not the native app).
 * Used to swap the phone tab bar for the desktop sidebar shell.
 */
export function useDesktopShell() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || isNativeApp()) return false;
    return window.matchMedia(DESKTOP_QUERY).matches;
  });

  useEffect(() => {
    if (isNativeApp()) return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
