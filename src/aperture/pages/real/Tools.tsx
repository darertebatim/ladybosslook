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
import { TOOL_CATALOG, TOOL_CATEGORIES, INTEGRATIONS, type ApertureToolDef } from "@/aperture/data/tools";
import { ArrowLeft, Plus, Check } from "lucide-react";

interface UserToolRow {
  id: string;
  tool_slug: string;
  tool_name: string;
  category: string | null;
  custom: boolean;
  is_active: boolean;
}

/**
 * Tools page — what the user uses today + a preview of future live
 * integrations. Selecting a tool writes both an aperture_user_tools row
 * and a memory fact into the matching bucket so the AI sees it in chat.
 */
export default function RealTools() {
  const { user } = useAuth();
  const [rows, setRows] = useState<UserToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("aperture_user_tools")
      .select("id,tool_slug,tool_name,category,custom,is_active")
      .eq("user_id", user.id);
    setRows((data ?? []) as UserToolRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const activeSet = useMemo(
    () => new Set(rows.filter((r) => r.is_active).map((r) => r.tool_slug)),
    [rows],
  );

  const writeMemoryFact = useCallback(async (tool: { name: string; bucket_slug: string }) => {
    if (!user) return;
    await supabase.from("aperture_memory_items").insert({
      user_id: user.id,
      content: `Uses ${tool.name}`,
      source: "user_confirmed",
      bucket_slug: tool.bucket_slug,
      question_key: `uses_${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    } as any);
  }, [user]);

  const toggle = useCallback(async (tool: ApertureToolDef, on: boolean) => {
    if (!user) return;
    if (on) {
      await supabase.from("aperture_user_tools").upsert({
        user_id: user.id,
        tool_slug: tool.slug,
        tool_name: tool.name,
        category: tool.category,
        custom: false,
        is_active: true,
      }, { onConflict: "user_id,tool_slug" });
      await writeMemoryFact({ name: tool.name, bucket_slug: tool.bucket_slug });
    } else {
      await supabase.from("aperture_user_tools")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("tool_slug", tool.slug);
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
            {TOOL_CATEGORIES.map((cat) => {
              const tools = TOOL_CATALOG.filter((t) => t.category === cat.id);
              if (tools.length === 0) return null;
              return (
                <section key={cat.id}>
                  <div style={{ marginBottom: 10 }}>
                    <ApertureSectionTitle index={cat.label.toUpperCase()} title={cat.label} sub={cat.sub} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {tools.map((t) => {
                      const on = activeSet.has(t.slug);
                      return (
                        <button
                          key={t.slug}
                          onClick={() => toggle(t, !on)}
                          style={{
                            appearance: "none",
                            cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: on ? "1px solid transparent" : "1px solid var(--ap-hairline-strong)",
                            background: on ? "var(--ap-signal-soft)" : "var(--ap-surface-2)",
                            color: on ? "var(--ap-signal)" : "var(--ap-ink-1)",
                            fontSize: 13, fontWeight: 500, fontFamily: "var(--ap-font-sans)",
                          }}
                        >
                          {on && <Check size={13} />}
                          {t.name}
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