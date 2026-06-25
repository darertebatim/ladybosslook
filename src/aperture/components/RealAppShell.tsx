import { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import { ApertureMonoLabel, ApertureThemeSwitch } from "./primitives";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import riloAppIcon from "@/assets/rilo-app-icon.png";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatsRail } from "./ChatsRail";
import { useApertureAdminLockSync } from "@/aperture/hooks/useApertureAdminLockSync";
import { haptic } from "@/lib/haptics";

const NAV = [
  { to: "/app/rilobiz/app",          label: "Home",     end: true },
  { to: "/app/rilobiz/app/chats",    label: "Chats" },
  { to: "/app/rilobiz/app/memory",   label: "Memory" },
  { to: "/app/rilobiz/app/library",  label: "Library" },
  { to: "/app/rilobiz/app/settings", label: "Settings" },
];

function Icon({ name }: { name: string }) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "Home":     return <svg {...props}><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>;
    case "Chats":    return <svg {...props}><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>;
    case "Memory":   return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>;
    case "Library":  return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>;
    case "Settings": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    default: return null;
  }
}

/** Auth-gated shell for the real /app/rilobiz/app/* product. */
export function RealAppShell({ children }: { children: ReactNode; rightRail?: ReactNode }) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const loc = useLocation();
  const initial = (user?.email ?? "U").slice(0, 1).toUpperCase();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useApertureAdminLockSync();
  const [adminLocked, setAdminLocked] = useState<boolean>(() =>
    typeof window !== "undefined" && localStorage.getItem("rilo:admin-lock-on-rilobiz") === "1"
  );
  const [userLock, setUserLock] = useState<boolean>(() =>
    typeof window !== "undefined" && localStorage.getItem("rilo:lock-on-rilobiz") === "1"
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("rilo:lock-on-rilobiz", userLock ? "1" : "0");
    // Persist to DB so the lock survives app restarts / reinstalls / new devices.
    (async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) return;
        await (supabase as any)
          .from("aperture_user_profile")
          .upsert({ user_id: u.id, user_locked: userLock }, { onConflict: "user_id" });
      } catch {}
    })();
  }, [userLock]);
  // Poll the admin-lock localStorage value so the sync hook's write
  // (it runs asynchronously) gets reflected in the toggle UI.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tick = () => {
      const v = localStorage.getItem("rilo:admin-lock-on-rilobiz") === "1";
      setAdminLocked(prev => prev === v ? prev : v);
    };
    const id = window.setInterval(tick, 1500);
    window.addEventListener("storage", tick);
    return () => { window.clearInterval(id); window.removeEventListener("storage", tick); };
  }, []);
  const lockOnRilobiz = adminLocked || userLock;
  const toggleLock = () => {
    if (adminLocked) { haptic.warning(); return; }
    haptic.medium();
    setUserLock(v => !v);
  };
  const lockLabel = adminLocked ? "Locked by admin" : (lockOnRilobiz ? "Locked" : "Unlocked");
  const isChatThread = /^\/app\/rilobiz\/app\/chats\/[^/]+/.test(loc.pathname);

  if (isMobile) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--ap-canvas)" }}>
          <header style={{
            flexShrink: 0, zIndex: 30,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
            paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
            background: "var(--ap-canvas)",
            borderBottom: isChatThread ? "none" : "1px solid var(--ap-hairline)",
          }}>
            <button
              onClick={() => { haptic.light(); setDrawerOpen(true); }}
              aria-label="Open menu"
              style={{
                width: 38, height: 38, borderRadius: 999,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "var(--ap-surface-1)", border: "1px solid var(--ap-hairline)",
                color: "var(--ap-ink-1)", cursor: "pointer",
                boxShadow: "var(--ap-shadow-raised)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
            </button>
            <ApertureWordmark size={14} />
            <Link
              to="/app/rilobiz/app/chats"
              aria-label="New chat"
              style={{
                width: 38, height: 38, borderRadius: 999,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "var(--ap-surface-1)", border: "1px solid var(--ap-hairline)",
                color: "var(--ap-ink-1)",
                boxShadow: "var(--ap-shadow-raised)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </Link>
          </header>
          <main
            data-scroll-container="true"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "4px 18px calc(16px + env(safe-area-inset-bottom, 0px))",
            }}
          >{children}</main>

          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent
              side="left"
              className="aperture-root"
              data-aperture-theme={document.documentElement.getAttribute("data-aperture-theme") || "light"}
              style={{
                background: "var(--ap-canvas)",
                padding: 0,
                width: "82vw",
                maxWidth: 320,
                borderRight: "1px solid var(--ap-hairline)",
                opacity: 1,
              }}
            >
              <div style={{
                display: "flex", flexDirection: "column", height: "100%",
                padding: "20px 16px",
                paddingTop: "calc(20px + env(safe-area-inset-top, 0px))",
                paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
                background: "var(--ap-canvas)", overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <ApertureWordmark size={16} />
                  <ApertureThemeSwitch />
                </div>
                <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {NAV.map(item => {
                    const active = item.end ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
                    return (
                      <NavLink key={item.to} to={item.to} end={item.end}
                        onClick={() => { haptic.light(); setDrawerOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 12px", borderRadius: "var(--ap-radius-xs)",
                          fontSize: 14.5,
                          color: active ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                          background: active ? "var(--ap-surface-2)" : "transparent",
                          textDecoration: "none",
                        }}>
                        <span style={{ color: active ? "var(--ap-signal)" : "var(--ap-ink-3)", display: "inline-flex" }}><Icon name={item.label} /></span>
                        {item.label}
                      </NavLink>
                    );
                  })}
                </nav>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--ap-hairline)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link
                    to="/app/my-rilo"
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 10px", borderRadius: "var(--ap-radius-xs)",
                      fontSize: 14.5, color: "var(--ap-ink-1)", textDecoration: "none",
                      background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
                    }}
                  >
                    <img src={riloAppIcon} alt="Rilo" width={22} height={22} style={{ borderRadius: 6, display: "block" }} />
                    Go to RiloME
                  </Link>
                  <label
                    onClick={toggleLock}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      padding: "10px 10px", borderRadius: "var(--ap-radius-xs)",
                      fontSize: 13.5, color: "var(--ap-ink-2)",
                      background: "transparent", cursor: adminLocked ? "not-allowed" : "pointer",
                      opacity: adminLocked ? 0.85 : 1,
                    }}
                  >
                    <span>Lock on RiloBiz</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--ap-ink-3)", fontWeight: 500 }}>
                        {lockLabel}
                      </span>
                      <span style={{
                        width: 36, height: 20, borderRadius: 999,
                        background: lockOnRilobiz ? "var(--ap-signal)" : "var(--ap-surface-3, #d4d4d8)",
                        position: "relative", transition: "background 180ms ease",
                        outline: "none", border: "1px solid var(--ap-hairline)",
                        display: "inline-block", flexShrink: 0,
                      }}>
                        <span style={{
                          position: "absolute", top: 2, left: lockOnRilobiz ? 18 : 2,
                          width: 14, height: 14, borderRadius: 999,
                          background: "#fff",
                          transition: "left 180ms ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                        }} />
                      </span>
                    </span>
                  </label>
                </div>
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--ap-hairline)" }}>
                  <ChatsRail onNavigate={() => setDrawerOpen(false)} />
                </div>
                <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--ap-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--ap-ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{user?.email ?? "Signed in"}</span>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    style={{ appearance: "none", border: "none", background: "transparent", color: "var(--ap-ink-3)", fontSize: 11, padding: 0, cursor: "pointer", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Sign out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh" }}>
      <aside style={{
        position: "sticky", top: 0, alignSelf: "flex-start",
        height: "100vh", width: 260, flexShrink: 0,
        background: "var(--ap-surface-1)", borderRight: "1px solid var(--ap-hairline)",
        display: "flex", flexDirection: "column", padding: "20px 16px",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <ApertureWordmark size={16} />
        </div>
        <ApertureMonoLabel style={{ padding: "0 8px 8px" }}>You</ApertureMonoLabel>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px", background: "var(--ap-surface-2)",
          border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)",
          marginBottom: 24,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "var(--ap-signal)", color: "var(--ap-on-signal)",
            fontWeight: 700, fontSize: 11,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{initial}</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, color: "var(--ap-ink-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>
              {user?.email ?? "Signed in"}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ appearance: "none", border: "none", background: "transparent", color: "var(--ap-ink-3)", fontSize: 11, padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Sign out
            </button>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const active = item.end ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.end}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: "var(--ap-radius-xs)",
                  fontSize: 13.5,
                  color: active ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                  background: active ? "var(--ap-surface-2)" : "transparent",
                  textDecoration: "none",
                }}>
                <span style={{ color: active ? "var(--ap-signal)" : "var(--ap-ink-3)", display: "inline-flex" }}><Icon name={item.label} /></span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--ap-hairline)", display: "flex", flexDirection: "column", gap: 8 }}>
          <Link
            to="/app/my-rilo"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: "var(--ap-radius-xs)",
              fontSize: 13.5, color: "var(--ap-ink-1)", textDecoration: "none",
              background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
            }}
          >
            <img src={riloAppIcon} alt="Rilo" width={22} height={22} style={{ borderRadius: 6, display: "block" }} />
            Go to RiloME
          </Link>
          <label
            onClick={toggleLock}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              padding: "8px 10px", borderRadius: "var(--ap-radius-xs)",
              fontSize: 12.5, color: "var(--ap-ink-2)",
              cursor: adminLocked ? "not-allowed" : "pointer",
              opacity: adminLocked ? 0.85 : 1,
            }}
          >
            <span>Lock on RiloBiz</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--ap-ink-3)", fontWeight: 500 }}>
                {lockLabel}
              </span>
              <span style={{
                width: 34, height: 18, borderRadius: 999,
                background: lockOnRilobiz ? "var(--ap-signal)" : "var(--ap-surface-3, #d4d4d8)",
                position: "relative", transition: "background 180ms ease",
                outline: "none", border: "1px solid var(--ap-hairline)",
                display: "inline-block", flexShrink: 0,
              }}>
                <span style={{
                  position: "absolute", top: 2, left: lockOnRilobiz ? 17 : 2,
                  width: 12, height: 12, borderRadius: 999,
                  background: "#fff",
                  transition: "left 180ms ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }} />
              </span>
            </span>
          </label>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--ap-hairline)" }}>
          <ChatsRail />
        </div>
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--ap-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <ApertureMonoLabel>Theme</ApertureMonoLabel>
          <ApertureThemeSwitch />
        </div>
      </aside>
      <div style={{ flex: 1, display: "flex", minWidth: 0 }}>
        <main data-scroll-container="true" style={{
          flex: 1, minWidth: 0,
          height: "100vh", overflowY: "auto", WebkitOverflowScrolling: "touch",
          padding: "32px 40px 64px",
          maxWidth: 1080,
          margin: "0 auto",
          width: "100%",
        }}>{children}</main>
      </div>
    </div>
  );
}