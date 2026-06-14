import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { regenerateMemoryCard } from "@/aperture/lib/apertureChat";
import { toast } from "@/hooks/use-toast";

export default function RealSettings() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [lastLen, setLastLen] = useState<number | null>(null);

  async function rebuild() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await regenerateMemoryCard();
      setLastLen(r.length);
      toast({ title: "Memory card rebuilt", description: `${r.length} characters injected per chat.` });
    } catch (e: any) {
      toast({ title: "Failed to rebuild", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Helmet><title>Settings · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader index="SETTINGS" title="Settings" sub="Account and memory tools." />
        <ApertureCard padding={18} style={{ marginBottom: 14 }}>
          <ApertureMonoLabel>Account</ApertureMonoLabel>
          <p style={{ margin: "8px 0 14px", fontSize: 14, color: "var(--ap-ink-1)" }}>{user?.email}</p>
          <ApertureButton variant="ghost" onClick={() => supabase.auth.signOut()}>Sign out</ApertureButton>
        </ApertureCard>
        <ApertureCard padding={18}>
          <ApertureMonoLabel>Memory card</ApertureMonoLabel>
          <p style={{ margin: "8px 0 14px", fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
            The compressed brief I inject into every chat. Normally I rebuild it automatically when your memory changes. You can force a rebuild here.
          </p>
          {lastLen !== null && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ap-ink-3)" }}>Last rebuild: {lastLen} characters.</p>
          )}
          <ApertureButton variant="accent" onClick={rebuild} disabled={busy}>
            {busy ? "Rebuilding…" : "Rebuild memory card"}
          </ApertureButton>
        </ApertureCard>
      </RealAppShell>
    </>
  );
}