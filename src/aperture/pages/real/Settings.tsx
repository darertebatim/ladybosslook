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
      // Pull EVERYTHING — every active memory item across every source
      // (bucket_answer, user_confirmed, chat_extracted, ai_extracted,
      // ai_inferred_pre_onboarding, freeform, etc.), plus the bucket
      // catalog and every known question prompt so we can render
      // raw onboarding answers (codes like "solo", "<5k") as readable
      // "Question: Answer" lines.
      const [
        { data: items, error: iErr },
        { data: buckets, error: bErr },
        { data: onboardingQs },
        { data: bucketQs },
        { data: card },
        { data: briefs },
      ] = await Promise.all([
        supabase
          .from("aperture_memory_items")
          .select("content, source, bucket_slug, question_key, created_at")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        supabase
          .from("aperture_buckets")
          .select("slug, title, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("aperture_onboarding_questions")
          .select("question_key, prompt, options"),
        supabase
          .from("aperture_bucket_questions")
          .select("question_key, prompt, choices, bucket_slug"),
        supabase
          .from("aperture_memory_card")
          .select("summary")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("aperture_bucket_briefs")
          .select("bucket_slug, summary")
          .eq("user_id", user.id),
      ]);
      if (iErr) throw iErr;
      if (bErr) throw bErr;
      const rows = items ?? [];
      if (rows.length < 5) {
        setExportThin(true);
        return;
      }

      // Build a question lookup: question_key -> { prompt, optionMap }
      type QInfo = { prompt: string; options: Map<string, string> };
      const qLookup = new Map<string, QInfo>();
      function ingest(key: string | null, prompt: string | null, optsRaw: any) {
        if (!key) return;
        if (qLookup.has(key)) return;
        const optionMap = new Map<string, string>();
        if (Array.isArray(optsRaw)) {
          for (const o of optsRaw) {
            if (o && typeof o === "object" && "value" in o) {
              optionMap.set(String(o.value), String(o.label ?? o.value));
            } else if (typeof o === "string") {
              optionMap.set(o, o);
            }
          }
        }
        qLookup.set(key, { prompt: (prompt ?? key).trim(), options: optionMap });
      }
      for (const q of (onboardingQs ?? []) as any[]) ingest(q.question_key, q.prompt, q.options);
      for (const q of (bucketQs ?? []) as any[]) ingest(q.question_key, q.prompt, q.choices);

      const briefBySlug = new Map<string, string>();
      for (const b of (briefs ?? []) as any[]) {
        if (b.bucket_slug && b.summary) briefBySlug.set(b.bucket_slug, String(b.summary).trim());
      }

      function formatRow(r: any): string | null {
        const raw = (r.content ?? "").trim();
        if (!raw) return null;
        const inferred = r.source === "ai_inferred_pre_onboarding";
        const star = inferred ? " *" : "";
        if (r.source === "bucket_answer" && r.question_key) {
          const q = qLookup.get(r.question_key);
          if (q) {
            const labeled = q.options.get(raw) ?? raw;
            return `- **${q.prompt}** ${labeled}${star}`;
          }
          return `- **${r.question_key}** ${raw}${star}`;
        }
        return `- ${raw}${star}`;
      }

      // Group by bucket
      const byBucket = new Map<string, any[]>();
      const freeform: any[] = [];
      for (const r of rows) {
        if (r.source === "freeform" || !r.bucket_slug) {
          freeform.push(r);
          continue;
        }
        const slug = r.bucket_slug;
        if (!byBucket.has(slug)) byBucket.set(slug, []);
        byBucket.get(slug)!.push(r);
      }

      const orderedBuckets = (buckets ?? []).filter(b => byBucket.has(b.slug));
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
      md += `This document contains everything Aperture has learned about this business. Paste it at the start of any AI conversation to give the AI full context — every onboarding answer, every confirmed fact, every detail extracted from chats, the website, and Instagram.\n\n`;

      // Profile snapshot
      const profLines: string[] = [];
      if (profile?.owner_name) profLines.push(`- **Owner:** ${profile.owner_name}`);
      if (profile?.business_name) profLines.push(`- **Business name:** ${profile.business_name}`);
      if (profile?.industry_slug) profLines.push(`- **Industry:** ${profile.industry_slug.replace(/-/g, " ")}`);
      if (profile?.website) profLines.push(`- **Website:** ${profile.website}`);
      if (profile?.instagram) profLines.push(`- **Instagram:** ${profile.instagram}`);
      if (profLines.length) {
        md += `## Profile\n${profLines.join("\n")}\n\n`;
      }

      // High-level memory card summary, if available
      const cardSummary = (card as any)?.summary?.toString().trim();
      if (cardSummary) {
        md += `## Executive summary\n${cardSummary}\n\n`;
      }

      md += `---\n\n`;

      let hasInferred = false;
      for (const b of finalBuckets) {
        const facts = byBucket.get(b.slug) ?? [];
        if (facts.length === 0) continue;
        md += `## ${b.title}\n`;
        const brief = briefBySlug.get(b.slug);
        if (brief) md += `_${brief}_\n\n`;
        for (const f of facts) {
          const line = formatRow(f);
          if (!line) continue;
          if (f.source === "ai_inferred_pre_onboarding") hasInferred = true;
          md += `${line}\n`;
        }
        md += `\n`;
      }

      if (freeform.length) {
        md += `## Notes\n`;
        for (const f of freeform) {
          const line = formatRow(f);
          if (line) md += `${line}\n`;
        }
        md += `\n`;
      }

      md += `---\n\n`;
      if (hasInferred) {
        md += `*Note: Facts marked with * are AI estimates that have not been confirmed by the owner. Treat these as starting assumptions, not verified information.*\n`;
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