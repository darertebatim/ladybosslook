import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { regenerateMemoryCard } from "@/aperture/lib/apertureChat";
import { toast } from "@/hooks/use-toast";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureIndustriesDB } from "@/aperture/hooks/db/useApertureOnboardingDB";

export default function RealSettings() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [lastLen, setLastLen] = useState<number | null>(null);
  const { profile, upsert } = useApertureUserProfile();
  const { industries } = useApertureIndustriesDB();
  const [form, setForm] = useState({ owner_name: "", business_name: "", industry_slug: "", website: "", instagram: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        owner_name: profile.owner_name ?? "",
        business_name: profile.business_name ?? "",
        industry_slug: profile.industry_slug ?? "",
        website: profile.website ?? "",
        instagram: profile.instagram ?? "",
      });
    }
  }, [profile]);

  async function saveProfile() {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await upsert({
        owner_name: form.owner_name.trim() || null,
        business_name: form.business_name.trim() || null,
        industry_slug: form.industry_slug || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
      });
      toast({ title: "Profile saved" });
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  }

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

  const inputStyle: React.CSSProperties = {
    width: "100%", appearance: "none", outline: "none",
    background: "var(--ap-surface-2)",
    border: "1px solid var(--ap-hairline)",
    borderRadius: "var(--ap-radius-sm)",
    padding: "10px 12px",
    fontSize: 14, color: "var(--ap-ink-1)",
    fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--ap-ink-3)", marginBottom: 4, display: "block" };

  return (
    <>
      <Helmet><title>Settings · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader index="SETTINGS" title="Settings" sub="Account and memory tools." />
        <ApertureCard padding={18} style={{ marginBottom: 14 }}>
          <ApertureMonoLabel>Your profile</ApertureMonoLabel>
          <p style={{ margin: "8px 0 14px", fontSize: 13, color: "var(--ap-ink-2)" }}>
            The basics Aperture uses to ground every answer.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Your name</label>
              <input style={inputStyle} value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Business name</label>
              <input style={inputStyle} value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <select style={inputStyle} value={form.industry_slug} onChange={e => setForm(f => ({ ...f, industry_slug: e.target.value }))}>
                <option value="">— Pick one —</option>
                {industries.map(ind => (
                  <option key={ind.slug} value={ind.slug}>
                    {ind.group_label ? `${ind.group_label} · ${ind.label}` : ind.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" />
            </div>
            <div>
              <label style={labelStyle}>Instagram handle</label>
              <input style={inputStyle} value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@yourhandle" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <ApertureButton variant="accent" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save profile"}
            </ApertureButton>
          </div>
        </ApertureCard>
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