import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton, ApertureSectionTitle,
} from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TOOL_CATEGORY_GROUPS, INTEGRATIONS, bucketForCategory } from "@/aperture/data/tools";
import { ArrowLeft, Plus, Check } from "lucide-react";

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
  const [rows, setRows] = useState<UserToolRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState("");

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

  const writeMemoryFact = useCallback(async (tool: { name: string; bucket_slug: string; question_key?: string }) => {
    if (!user) return;
    await supabase.from("aperture_memory_items").insert({
      user_id: user.id,
      content: `Uses ${tool.name}`,
      source: "user_confirmed",
      bucket_slug: tool.bucket_slug,
      question_key: tool.question_key ?? `uses_${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    } as any);
  }, [user]);

  const togglePick = useCallback(async (entry: PickerEntry, on: boolean) => {
    if (!user) return;
    const bucket = bucketForCategory(entry.category);
    if (on) {
      // For "nothing yet" / "spreadsheet" in a category, clear the opposite one first.
      if (entry.kind === "nothing_yet" || entry.kind === "spreadsheet_or_notes") {
        const opposite = entry.kind === "nothing_yet"
          ? `spreadsheet_or_notes__${entry.category}`
          : `nothing_yet__${entry.category}`;
        await supabase.from("aperture_user_tools")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("tool_slug", opposite);
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

  // Bucket tools by every category they're tagged with (a tool with 3
  // categories appears under all 3 groups but the same slug = same state).
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogToolRow[]>();
    for (const t of catalog) {
      for (const c of t.categories ?? []) {
        const arr = map.get(c) ?? [];
        arr.push(t);
        map.set(c, arr);
      }
    }
    return map;
  }, [catalog]);

  return (
    <>
      <Helmet><title>Tools · Aperture</title></Helmet>
      <RealAppShell>
        <div style={{ marginBottom: 12 }}>
          <Link to="/aperture/app/memory" style={{ textDecoration: "none" }}>
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

        {loading ? (
          <ApertureCard padding={20}><ApertureMonoLabel>Loading…</ApertureMonoLabel></ApertureCard>
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
                  title="Connect Aperture to your tools"
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
    </>
  );
}