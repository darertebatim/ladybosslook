import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ApertureMonoLabel, ApertureButton } from "@/aperture/components/primitives";
import { ApertureLogo } from "@/aperture/brand/ApertureLogo";

type Mode = "signup" | "login" | "forgot";

export default function ApertureAuth() {
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const search = new URLSearchParams(location.search);
  const redirectPath = search.get("redirect") || "/aperture/app";

  const [mode, setMode] = useState<Mode>(search.get("mode") === "login" ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    if (user) navigate(redirectPath, { replace: true });
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/aperture/auth`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We've sent you a reset link." });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast({ title: "Welcome", description: "Account created." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message ?? "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const handleOauth = async (provider: "google" | "apple") => {
    setOauth(provider);
    try {
      const fn = provider === "google" ? signInWithGoogle : signInWithApple;
      const { error } = await fn();
      if (error) throw error;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sign-in failed", description: err?.message ?? "Try again" });
    } finally {
      setOauth(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--ap-surface-2)",
    border: "1px solid var(--ap-hairline)",
    borderRadius: "var(--ap-radius-sm)",
    padding: "12px 14px",
    color: "var(--ap-ink-1)",
    fontFamily: "var(--ap-font-sans)",
    fontSize: 15,
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        background: "var(--ap-canvas)",
      }}
    >
      <Helmet>
        <title>Aperture — Sign in</title>
        <meta name="description" content="Sign in to Aperture." />
      </Helmet>

      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <ApertureLogo size={40} />
          <ApertureMonoLabel size={10}>
            {mode === "signup" ? "Create account" : mode === "login" ? "Sign in" : "Reset password"}
          </ApertureMonoLabel>
        </div>

        {mode !== "forgot" && (
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            <ApertureButton
              type="button"
              onClick={() => handleOauth("apple")}
              disabled={!!oauth || authLoading}
              style={{ width: "100%" }}
            >
              {oauth === "apple" ? "Opening…" : "Continue with Apple"}
            </ApertureButton>
            <ApertureButton
              type="button"
              onClick={() => handleOauth("google")}
              disabled={!!oauth || authLoading}
              style={{ width: "100%" }}
            >
              {oauth === "google" ? "Opening…" : "Continue with Google"}
            </ApertureButton>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 4px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--ap-hairline)" }} />
              <ApertureMonoLabel size={9}>or</ApertureMonoLabel>
              <div style={{ flex: 1, height: 1, background: "var(--ap-hairline)" }} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <ApertureMonoLabel size={9}>Email</ApertureMonoLabel>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@domain.com"
            />
          </div>

          {mode !== "forgot" && (
            <div style={{ display: "grid", gap: 6 }}>
              <ApertureMonoLabel size={9}>Password</ApertureMonoLabel>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
          )}

          <ApertureButton type="submit" variant="accent" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading
              ? "Working…"
              : mode === "signup"
              ? "Create account"
              : mode === "login"
              ? "Sign in"
              : "Send reset link"}
          </ApertureButton>
        </form>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              style={{ background: "none", border: 0, color: "var(--ap-ink-3)", fontSize: 12, cursor: "pointer" }}
            >
              Forgot password?
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setMode((m) => (m === "login" ? "signup" : "login"))
            }
            style={{ background: "none", border: 0, color: "var(--ap-ink-2)", fontSize: 13, cursor: "pointer" }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : mode === "login"
              ? "Need an account? Create one"
              : "Back to sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}