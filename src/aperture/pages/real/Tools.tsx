import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureLoading, ApertureButton, ApertureSectionTitle,
} from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { TOOL_CATEGORY_GROUPS, INTEGRATIONS, bucketForCategory } from "@/aperture/data/tools";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { SourceCard } from "@/aperture/components/SourceCard";
import { SourceDetailSheet } from "@/aperture/components/SourceDetailSheet";
import { useApertureSources, type SourceSummary } from "@/aperture/hooks/db/useApertureSources";
import { BriefCard } from "@/aperture/components/BriefCard";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { useNavigate } from "react-router-dom";

interface UserToolRow {
  id: string;
  tool_slug: string;
  tool_name: string;
  category: string | null;
  custom: boolean;
  is_active: boolean;
}

interface CatalogToolRow {
  slug: string;
  label: string;
  categories: string[] | null;
  industries: string[] | null;
  sort_order: number | null;
}

type PickerEntry =
  | { kind: "tool"; slug: string; name: string; industries: string[]; category: string }
  | { kind: "nothing_yet" | "spreadsheet_or_notes"; slug: string; name: string; category: string };

/**
 * Tools page — what the user uses today + a preview of future live
 * integrations. Selecting a tool writes both an aperture_user_tools row
 * and a memory fact into the matching bucket so the AI sees it in chat.
 */
export default function RealTools() {
  const { user } = useAuth();
  const { profile, upsert: upsertProfile, refresh: refreshProfile } = useApertureUserProfile();
  const navigate = useNavigate();
  const { createChat } = useApertureChatsDB();
  const [startingStackChat, setStartingStackChat] = useState(false);
  const [rows, setRows] = useState<UserToolRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState("");
  const [catCustomNames, setCatCustomNames] = useState<Record<string, string>>({});
  const { sources, busy: sourceBusy } = useApertureSources();
  const [openSource, setOpenSource] = useState<SourceSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: userRows }, { data: catRows }] = await Promise.all([
      supabase
        .from("aperture_user_tools")
        .select("id,tool_slug,tool_name,category,custom,is_active")
        .eq("user_id", user.id),
      (supabase as any)
        .from("aperture_tools")
        .select("slug,label,categories,industries,category,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);
    setRows((userRows ?? []) as UserToolRow[]);
    setCatalog(
      ((catRows ?? []) as any[]).map((r) => ({
        slug: r.slug,
        label: r.label,
        categories: Array.isArray(r.categories) && r.categories.length > 0
          ? r.categories
          : (r.category ? [r.category] : []),
        industries: Array.isArray(r.industries) ? r.industries : [],
        sort_order: r.sort_order ?? 0,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const activeSet = useMemo(
    () => new Set(rows.filter((r) => r.is_active).map((r) => r.tool_slug)),
    [rows],
  );

  // First-visit onboarding pass (plan §3): if user has never touched Tools,
  // show a simplified picker-only view with a sticky Continue button that
  // stamps `tool_onboarding_done_at` and reveals the living Tools page.
  const hasAnyPick = rows.some((r) => r.is_active);
  const firstVisit = !loading && !hasAnyPick && !(profile as any)?.tool_onboarding_done_at;
  const [savingContinue, setSavingContinue] = useState(false);
  const finishOnboarding = useCallback(async () => {
    if (!user || savingContinue) return;
    setSavingContinue(true);
    try {
      await upsertProfile({ tool_onboarding_done_at: new Date().toISOString() } as any);
      await refreshProfile();
    } finally {
      setSavingContinue(false);
    }
  }, [user, savingContinue, upsertProfile, refreshProfile]);

  const writeMemoryFact = useCallback(async (tool: { name: string; bucket_slug: string; question_key?: string }) => {
    if (!user) return;
    await supabase.from("aperture_memory_items").insert({
      user_id: user.id,
      content: `Uses ${tool.name}`,
      source: "user_confirmed",
      bucket_slug: tool.bucket_slug,
      question_key: tool.question_key ?? `uses_${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    } as any);
    // Mirror EVERY tool pick into the canonical `tools-systems` bucket so the
    // Tools page brief ("What I know about your stack") sees the full stack,
    // regardless of which category-specific bucket the tool primarily maps to.
    if (tool.bucket_slug !== "tools-systems") {
      const nameKey = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      await supabase.from("aperture_memory_items").upsert({
        user_id: user.id,
        content: `Uses ${tool.name}`,
        source: "user_confirmed",
        bucket_slug: "tools-systems",
        question_key: `tool_mirror__${nameKey}`,
        is_active: true,
      } as any, { onConflict: "user_id,bucket_slug,question_key" });
    }
  }, [user]);

  // Backfill: any active aperture_user_tools row without a matching
  // tools-systems memory fact gets one inserted. Runs once per rows change so
  // existing users (who picked tools before mirroring existed) light up the
  // Tools brief the moment they open this page.
  useEffect(() => {
    if (!user || rows.length === 0) return;
    const activeTools = rows.filter(r => r.is_active && r.tool_name && !r.tool_slug.startsWith("nothing_yet__") && !r.tool_slug.startsWith("spreadsheet_or_notes__"));
    if (activeTools.length === 0) return;
    (async () => {
      const { data: existing } = await supabase
        .from("aperture_memory_items")
        .select("question_key")
        .eq("user_id", user.id)
        .eq("bucket_slug", "tools-systems")
        .eq("is_active", true);
      const have = new Set(((existing ?? []) as any[]).map(r => r.question_key).filter(Boolean));
      const toInsert = activeTools
        .map(r => {
          const nameKey = r.tool_name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
          const qk = `tool_mirror__${nameKey}`;
          return { qk, r };
        })
        .filter(x => !have.has(x.qk))
        // Dedup by question_key (same tool in multiple categories).
        .filter((x, i, arr) => arr.findIndex(y => y.qk === x.qk) === i);
      if (toInsert.length === 0) return;
      await supabase.from("aperture_memory_items").insert(
        toInsert.map(({ qk, r }) => ({
          user_id: user.id,
          content: `Uses ${r.tool_name}`,
          source: "user_confirmed",
          bucket_slug: "tools-systems",
          question_key: qk,
          is_active: true,
        })) as any,
      );
    })();
  }, [user, rows]);

  const togglePick = useCallback(async (entry: PickerEntry, on: boolean) => {
    if (!user) return;
    const bucket = bucketForCategory(entry.category);
    if (on) {
      // MUTUAL EXCLUSIVITY (redesign plan §8):
      //  - picking a marker ("Nothing yet" / "Spreadsheet") clears the OTHER marker
      //    AND every real-tool row in this category.
      //  - picking a real tool clears BOTH markers in this category.
      if (entry.kind === "nothing_yet" || entry.kind === "spreadsheet_or_notes") {
        const opposite = entry.kind === "nothing_yet"
          ? `spreadsheet_or_notes__${entry.category}`
          : `nothing_yet__${entry.category}`;
        await supabase.from("aperture_user_tools")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("tool_slug", opposite);
        await supabase.from("aperture_user_tools")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("category", entry.category)
          .eq("custom", false)
          .not("tool_slug", "like", "nothing_yet__%")
          .not("tool_slug", "like", "spreadsheet_or_notes__%");
      } else if (entry.kind === "tool") {
        await supabase.from("aperture_user_tools")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .in("tool_slug", [`nothing_yet__${entry.category}`, `spreadsheet_or_notes__${entry.category}`]);
      }
      await supabase.from("aperture_user_tools").upsert({
        user_id: user.id,
        tool_slug: entry.slug,
        tool_name: entry.name,
        category: entry.category,
        custom: false,
        is_active: true,
      }, { onConflict: "user_id,tool_slug" });
      const content =
        entry.kind === "tool"
          ? `Uses ${entry.name}`
          : entry.kind === "nothing_yet"
            ? `For ${entry.category}: nothing yet`
            : `For ${entry.category}: spreadsheet / notes / in my head`;
      await writeMemoryFact({
        name: entry.name,
        bucket_slug: bucket,
        question_key: `tool__${entry.category.toLowerCase().replace(/[^a-z0-9]+/g, "_")}__${entry.slug}`,
      });
      // Override default content (writeMemoryFact uses `Uses X`); for marker rows
      // we want the structured message above.
      if (entry.kind !== "tool") {
        await supabase.from("aperture_memory_items").insert({
          user_id: user.id,
          content,
          source: "user_confirmed",
          bucket_slug: bucket,
          question_key: `tool_marker__${entry.category.toLowerCase().replace(/[^a-z0-9]+/g, "_")}__${entry.kind}`,
        } as any);
      }
    } else {
      await supabase.from("aperture_user_tools")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("tool_slug", entry.slug);
    }
    await refresh();
  }, [user, refresh, writeMemoryFact]);

  const addCustom = useCallback(async () => {
    const name = customName.trim();
    if (!name || !user) return;
    const slug = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    await supabase.from("aperture_user_tools").upsert({
      user_id: user.id,
      tool_slug: slug,
      tool_name: name,
      category: "custom",
      custom: true,
      is_active: true,
    }, { onConflict: "user_id,tool_slug" });
    await writeMemoryFact({ name, bucket_slug: "tools-systems" });
    setCustomName("");
    await refresh();
  }, [customName, user, refresh, writeMemoryFact]);

  const addCategoryCustom = useCallback(async (categoryLabel: string) => {
    const name = (catCustomNames[categoryLabel] ?? "").trim();
    if (!name || !user) return;
    const catKey = categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const slug = `custom_${catKey}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    await supabase.from("aperture_user_tools").upsert({
      user_id: user.id,
      tool_slug: slug,
      tool_name: name,
      category: categoryLabel,
      custom: true,
      is_active: true,
    }, { onConflict: "user_id,tool_slug" });
    await writeMemoryFact({ name, bucket_slug: bucketForCategory(categoryLabel) });
    setCatCustomNames((prev) => ({ ...prev, [categoryLabel]: "" }));
    await refresh();
  }, [catCustomNames, user, refresh, writeMemoryFact]);

  // Filter catalog by user's industry: keep tools tagged to no industry
  // (defaults) OR explicitly tagged with the user's industry.
  const industrySlug = profile?.industry_slug ?? null;
  const filteredCatalog = useMemo(() => {
    return catalog.filter((t) => {
      const inds = t.industries ?? [];
      if (inds.length === 0) return true;
      if (industrySlug && inds.includes(industrySlug)) return true;
      return false;
    });
  }, [catalog, industrySlug]);

  // Bucket tools by every category they're tagged with (a tool with 3
  // categories appears under all 3 groups but the same slug = same state).
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogToolRow[]>();
    for (const t of filteredCatalog) {
      for (const c of t.categories ?? []) {
        const arr = map.get(c) ?? [];
        arr.push(t);
        map.set(c, arr);
      }
    }
    return map;
  }, [filteredCatalog]);

  const activeToolNames = useMemo(
    () => rows.filter(r => r.is_active).map(r => r.tool_name).filter(Boolean),
    [rows],
  );

  async function continueStackChat() {
    if (startingStackChat) return;
    setStartingStackChat(true);
    const toolLine = activeToolNames.length > 0
      ? `You're using ${activeToolNames.slice(0, 6).join(", ")}${activeToolNames.length > 6 ? ", and more" : ""}.`
      : `You haven't picked any tools yet — want to walk through what you actually use?`;
    const sourceLine = sources.length > 0
      ? ` I've also read your ${sources.map(s => s.display).join(" and ")}.`
      : "";
    const opener = `${toolLine}${sourceLine}\n\nWhat do you want to dig into — what's missing, what's overlapping, or how these connect?`;
    const chat = await createChat({
      title: "My stack",
      entry_point: "bucket_specific",
      bucket_slug: "tools-systems",
      opener,
    });
    setStartingStackChat(false);
    if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}`);
  }

  return (
    <>
      <Helmet><title>Tools · RiloBiz</title></Helmet>
      <RealAppShell>
        <div style={{ marginBottom: 12 }}>
          <Link to="/app/rilobiz/app/memory" style={{ textDecoration: "none" }}>
            <ApertureButton variant="ghost" size="sm">
              <ArrowLeft size={13} /> Memory
            </ApertureButton>
          </Link>
        </div>

        <PageHeader
          index="TOOLS"
          title="Your stack"
          sub="Tell me what you use to run the business. I'll remember it and skip asking about it later."
          action={<ApertureChip tone={activeSet.size ? "signal" : "neutral"}>{activeSet.size} active</ApertureChip>}
        />

        {/* Continue chat + Brief pair — same pattern as bucket pages */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12, marginBottom: 18,
        }}>
          <ApertureCard padding={16}>
            <ApertureMonoLabel>Conversation</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
              Continue chat about my stack
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
              Talk through what's missing, what overlaps, and how your tools and sources connect.
            </p>
            <ApertureButton variant="accent" onClick={continueStackChat} disabled={startingStackChat}>
              {startingStackChat ? "Opening…" : "Start →"}
            </ApertureButton>
          </ApertureCard>

          <BriefCard
            label="Brief"
            title="What I know about your stack"
            teaser="A short read-back of the tools you use and what I've pulled from your sources."
            load={async () => {
              if (!user) return null;
              const { data } = await supabase
                .from("aperture_bucket_briefs")
                .select("summary,generated_at")
                .eq("user_id", user.id).eq("bucket_slug", "tools-systems")
                .maybeSingle();
              return data ? { summary: (data as any).summary, generated_at: (data as any).generated_at } : null;
            }}
            regenerate={async () => {
              const { data, error } = await supabase.functions.invoke("aperture-bucket-brief", {
                body: { bucket_slug: "tools-systems", force: true },
              });
              if (error) throw new Error(error.message);
              const b = (data as any)?.brief;
              if (!b) throw new Error("No brief returned");
              return { summary: b.summary, generated_at: b.generated_at };
            }}
          />
        </div>

        {industrySlug && (
          <div style={{ marginBottom: 16 }}>
            <ApertureMonoLabel>
              Showing defaults + tools for: {industrySlug.replace(/-/g, " ")}
            </ApertureMonoLabel>
          </div>
        )}

        {/* Connected sources (website + instagram) */}
        {sources.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 10 }}>
              <ApertureSectionTitle
                index="YOUR SOURCES"
                title="What I'm reading from"
                sub="Tap a card to see what I pulled, refetch, or chat about it."
              />
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 10,
            }}>
              {sources.map(s => (
                <SourceCard
                  key={s.kind}
                  summary={s}
                  busy={sourceBusy === s.kind}
                  onOpen={() => setOpenSource(s)}
                />
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <ApertureLoading label="Loading…" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {TOOL_CATEGORY_GROUPS.map((cat) => {
              const tools = grouped.get(cat.label) ?? [];
              if (tools.length === 0) return null;
              const noneSlug = `nothing_yet__${cat.label}`;
              const sheetSlug = `spreadsheet_or_notes__${cat.label}`;
              const catKey = cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
              const entries: PickerEntry[] = [
                ...tools.map((t) => ({
                  kind: "tool" as const,
                  // Scope the tool slug by category so the same tool tagged
                  // under multiple categories gets an independent row in
                  // aperture_user_tools — toggling it off in one category
                  // no longer wipes the others (unique key is user_id,tool_slug).
                  slug: `${t.slug}__${catKey}`,
                  name: t.label,
                  industries: t.industries ?? [],
                  category: cat.label,
                })),
                { kind: "nothing_yet",          slug: noneSlug,  name: "Nothing yet",                       category: cat.label },
                { kind: "spreadsheet_or_notes", slug: sheetSlug, name: "Spreadsheet / notes / in my head", category: cat.label },
              ];
              return (
                <section key={cat.label}>
                  <div style={{ marginBottom: 10 }}>
                    <ApertureSectionTitle index={cat.label.toUpperCase()} title={cat.label} sub={cat.sub} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {entries.map((e) => {
                      const on = activeSet.has(e.slug);
                      const muted = e.kind !== "tool";
                      return (
                        <button
                          key={e.slug}
                          onClick={() => togglePick(e, !on)}
                          style={{
                            appearance: "none",
                            cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: on
                              ? "1px solid transparent"
                              : `1px ${muted ? "dashed" : "solid"} var(--ap-hairline-strong)`,
                            background: on ? "var(--ap-signal-soft)" : "var(--ap-surface-2)",
                            color: on ? "var(--ap-signal)" : "var(--ap-ink-1)",
                            fontSize: 13, fontWeight: 500, fontFamily: "var(--ap-font-sans)",
                            fontStyle: muted ? "italic" : "normal",
                          }}
                        >
                          {on && <Check size={13} />}
                          {e.name}
                          {e.kind === "tool" && e.industries.length > 0 && (
                            <span style={{ opacity: 0.55, fontSize: 11, marginLeft: 4 }}>
                              · {e.industries.join(", ")}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Per-category Other input */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                    <input
                      value={catCustomNames[cat.label] ?? ""}
                      onChange={(e) => setCatCustomNames((p) => ({ ...p, [cat.label]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") addCategoryCustom(cat.label); }}
                      placeholder={`Other ${cat.label.toLowerCase()} tool…`}
                      style={{
                        flex: 1, height: 34, padding: "0 12px",
                        borderRadius: 999,
                        border: "1px dashed var(--ap-hairline-strong)",
                        background: "var(--ap-surface-1)", color: "var(--ap-ink-1)",
                        fontSize: 13, fontFamily: "var(--ap-font-sans)",
                      }}
                    />
                    <ApertureButton variant="ghost" size="sm" onClick={() => addCategoryCustom(cat.label)}>
                      <Plus size={13} /> Add
                    </ApertureButton>
                  </div>
                  {/* Custom tools previously added under this category */}
                  {rows.filter((r) => r.custom && r.is_active && r.category === cat.label).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {rows.filter((r) => r.custom && r.is_active && r.category === cat.label).map((r) => (
                        <span
                          key={r.id}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "6px 10px", borderRadius: 999,
                            background: "var(--ap-signal-soft)", color: "var(--ap-signal)",
                            fontSize: 12.5, fontWeight: 500,
                          }}
                        >
                          <Check size={12} /> {r.tool_name}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Custom additions */}
            <section>
              <div style={{ marginBottom: 10 }}>
                <ApertureSectionTitle index="OTHER" title="Add anything else" sub="Tools we haven't listed — type the name." />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                  placeholder="e.g. Booksy, Jobber, FreshBooks"
                  style={{
                    flex: 1, height: 38, padding: "0 12px",
                    borderRadius: "var(--ap-radius-sm)",
                    border: "1px solid var(--ap-hairline-strong)",
                    background: "var(--ap-surface-1)", color: "var(--ap-ink-1)",
                    fontSize: 13.5, fontFamily: "var(--ap-font-sans)",
                  }}
                />
                <ApertureButton variant="accent" onClick={addCustom}>
                  <Plus size={13} /> Add
                </ApertureButton>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {rows.filter((r) => r.custom && r.is_active).map((r) => (
                  <span
                    key={r.id}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 999,
                      background: "var(--ap-signal-soft)", color: "var(--ap-signal)",
                      fontSize: 13, fontWeight: 500,
                    }}
                  >
                    <Check size={13} /> {r.tool_name}
                  </span>
                ))}
              </div>
            </section>

            {/* Future integrations */}
            <section>
              <div style={{ marginBottom: 10 }}>
                <ApertureSectionTitle
                  index="INTEGRATIONS"
                  title="Connect RiloBiz to your tools"
                  sub="Coming soon — instead of asking, I'll read live data straight from these."
                />
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}>
                {INTEGRATIONS.map((i) => (
                  <ApertureCard key={i.slug} padding={14}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ap-ink-1)" }}>{i.name}</h4>
                      <ApertureChip tone="neutral">Soon</ApertureChip>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ap-ink-3)", lineHeight: 1.45 }}>
                      {i.blurb}
                    </p>
                    <div style={{ marginTop: 10 }}>
                      <ApertureButton variant="ghost" size="sm" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                        Connect →
                      </ApertureButton>
                    </div>
                  </ApertureCard>
                ))}
              </div>
            </section>
          </div>
        )}
      </RealAppShell>
      <SourceDetailSheet
        summary={openSource}
        open={!!openSource}
        onClose={() => setOpenSource(null)}
      />
    </>
  );
}