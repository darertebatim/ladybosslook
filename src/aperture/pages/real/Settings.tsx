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
import { IndustryPicker } from "@/aperture/components/IndustryPicker";

export default function RealSettings() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [lastLen, setLastLen] = useState<number | null>(null);
  const { profile, upsert } = useApertureUserProfile();
  const { industries } = useApertureIndustriesDB();
  const [form, setForm] = useState({ owner_name: "", business_name: "", industry_slug: "", website: "", instagram: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportThin, setExportThin] = useState(false);

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

  async function exportMemory() {
    if (exporting || !user) return;
    setExporting(true);
    setExportThin(false);
    try {
      const ALLOWED = ["user_confirmed", "chat_extracted", "ai_extracted", "ai_inferred_pre_onboarding"];
      const [{ data: items, error: iErr }, { data: buckets, error: bErr }] = await Promise.all([
        supabase
          .from("aperture_memory_items")
          .select("content, source, bucket_slug")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .in("source", ALLOWED),
        supabase
          .from("aperture_buckets")
          .select("slug, title, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (iErr) throw iErr;
      if (bErr) throw bErr;
      const rows = items ?? [];
      if (rows.length < 5) {
        setExportThin(true);
        return;
      }
      const byBucket = new Map<string, typeof rows>();
      for (const r of rows) {
        const slug = r.bucket_slug ?? "other";
        if (!byBucket.has(slug)) byBucket.set(slug, [] as any);
        byBucket.get(slug)!.push(r);
      }
      const orderedBuckets = (buckets ?? []).filter(b => byBucket.has(b.slug));
      // Append any bucket slugs present in items but missing from buckets table (alphabetical).
      const knownSlugs = new Set(orderedBuckets.map(b => b.slug));
      const extras = [...byBucket.keys()]
        .filter(s => !knownSlugs.has(s))
        .sort()
        .map(slug => ({ slug, title: slug.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()), sort_order: 9999 }));
      const finalBuckets = [...orderedBuckets, ...extras];

      const businessName = (profile?.business_name ?? "").trim() || "my-business";
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      let md = `# Business Memory — ${businessName}\n`;
      md += `*Exported from Aperture on ${today}*\n\n`;
      md += `This document contains everything Aperture has learned about this business. Paste it at the start of any AI conversation to give the AI full context.\n\n---\n\n`;

      let hasInferred = false;
      for (const b of finalBuckets) {
        const facts = byBucket.get(b.slug) ?? [];
        if (facts.length === 0) continue;
        md += `## ${b.title}\n`;
        for (const f of facts) {
          const content = (f.content ?? "").trim();
          if (!content) continue;
          const isInferred = f.source === "ai_inferred_pre_onboarding";
          if (isInferred) hasInferred = true;
          md += `- ${content}${isInferred ? " *" : ""}\n`;
        }
        md += `\n`;
      }

      md += `---\n\n`;
      if (hasInferred) {
        md += `*Note: Some facts marked with * are AI estimates that have not been confirmed by the owner. Treat these as starting assumptions, not verified information.*\n`;
      }

      const slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "my-business";
      const filename = `${slug}-aperture-memory.md`;

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setExporting(false);
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
              <IndustryPicker
                industries={industries}
                value={form.industry_slug}
                onChange={(slug) => setForm(f => ({ ...f, industry_slug: slug }))}
              />
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
        <ApertureCard padding={18} style={{ marginTop: 14 }}>
          <ApertureMonoLabel>Export</ApertureMonoLabel>
          <p style={{ margin: "8px 0 14px", fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
            Download everything Aperture knows about your business as a Markdown file. Paste it into Claude, ChatGPT, or any AI tool to give it full context instantly.
          </p>
          <ApertureButton variant="accent" onClick={exportMemory} disabled={exporting}>
            {exporting ? "Preparing…" : "Export my memory"}
          </ApertureButton>
          {exportThin && (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--ap-ink-3)", lineHeight: 1.5 }}>
              Your memory is still pretty thin — keep talking to Aperture and come back to export when there's more to work with.
            </p>
          )}
        </ApertureCard>
      </RealAppShell>
    </>
  );
}