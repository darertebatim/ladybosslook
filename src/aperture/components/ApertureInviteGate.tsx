import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ApertureInviteShield } from "./ApertureInviteShield";

/**
 * Gate for RiloBiz: only approved users (or admins) reach the app.
 * Everyone else sees the invite shield.
 */
export function ApertureInviteGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState<"loading" | "approved" | "blocked">("loading");

  const check = async () => {
    if (!user) return;
    if (isAdmin) { setStatus("approved"); return; }
    const { data } = await (supabase as any)
      .from("aperture_approved_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setStatus(data ? "approved" : "blocked");
  };

  useEffect(() => { check(); /* eslint-disable-next-line */ }, [user?.id, isAdmin]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="ap-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ap-ink-3)" }}>
          Loading
        </span>
      </div>
    );
  }

  if (status === "blocked") {
    return <ApertureInviteShield onApproved={check} />;
  }

  return <>{children}</>;
}