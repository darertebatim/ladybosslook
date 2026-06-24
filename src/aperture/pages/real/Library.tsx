import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import { ApertureCard, ApertureChip, ApertureMonoLabel, ApertureLoading } from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";

interface ActionRow {
  slug: string; kind: string; category: string | null;
  title: string; blurb: string | null; why: string | null;
  duration: string | null;
  industry_group_slug: string | null;
}

const CATEGORIES = ["All", "Strategy", "Sales", "Marketing", "Customers", "Pricing", "Products", "Operations", "Money", "Team"] as const;
type CatFilter = typeof CATEGORIES[number];
type KindFilter = "all" | "playbook" | "prompt";
type ScopeFilter = "mine" | "all";

/** Library of playbooks/prompts pulled from aperture_actions. */
export default function RealLibrary() {
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CatFilter>("All");
  const [kind, setKind] = useState<KindFilter>("all");
  const [scope, setScope] = useState<ScopeFilter>("mine");
  const { profile } = useApertureUserProfile();
  const [industryGroup, setIndustryGroup] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("aperture_actions")
        .select("slug,kind,category,title,blurb,why,duration,industry_group_slug")
        .eq("is_published", true)
        .order("category", { ascending: true });
      setActions((data ?? []) as ActionRow[]);
      setLoading(false);
    })();
  }, []);

  // Resolve user's industry → industry group slug
  useEffect(() => {
    (async () => {
      if (!profile?.industry_slug) { setIndustryGroup(null); return; }
      const { data } = await supabase
        .from("aperture_industries")
        .select("group_slug")
        .eq("slug", profile.industry_slug)
        .maybeSingle();
      setIndustryGroup((data?.group_slug as string | null) ?? null);
    })();
  }, [profile?.industry_slug]);

  const visible = useMemo(() => actions.filter(a => {
    if (filter !== "All" && a.category !== filter) return false;
    if (kind !== "all" && a.kind !== kind) return false;
    if (scope === "mine") {
      // Show general (untagged) items + items matching user's industry group.
      if (a.industry_group_slug && a.industry_group_slug !== industryGroup) return false;
    }
    return true;
  }), [actions, filter, kind, scope, industryGroup]);

  return (
    <>
      <Helmet><title>Library · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="03 · LIBRARY"
          title="Playbooks & prompts"
          sub="The full library. Your home page surfaces the ones that fit your business right now — this is where you browse everything."
        />

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(["mine", "all"] as const).map(s => (
              <button
                key={s}
                onClick={() => setScope(s)}
                style={{
                  appearance: "none", cursor: "pointer",
                  padding: "5px 10px",
                  fontSize: 11, fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em",
                  background: scope === s ? "var(--ap-ink-1)" : "transparent",
                  color: scope === s ? "var(--ap-canvas)" : "var(--ap-ink-3)",
                  border: "1px solid " + (scope === s ? "var(--ap-ink-1)" : "var(--ap-hairline)"),
                  borderRadius: 999,
                }}
              >{s === "mine" ? "For my industry" : "All industries"}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  appearance: "none", cursor: "pointer",
                  padding: "6px 10px",
                  fontSize: 11, fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em",
                  background: filter === c ? "var(--ap-ink-1)" : "var(--ap-surface-1)",
                  color: filter === c ? "var(--ap-canvas)" : "var(--ap-ink-2)",
                  border: "1px solid var(--ap-hairline)",
                  borderRadius: 999,
                }}
              >{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "playbook", "prompt"] as const).map(k => (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  appearance: "none", cursor: "pointer",
                  padding: "5px 10px",
                  fontSize: 11, fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em",
                  background: kind === k ? "var(--ap-signal-soft)" : "transparent",
                  color: kind === k ? "var(--ap-signal)" : "var(--ap-ink-3)",
                  border: "1px solid " + (kind === k ? "var(--ap-signal-soft)" : "var(--ap-hairline)"),
                  borderRadius: 999,
                }}
              >{k === "all" ? "All kinds" : k + "s"}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <ApertureLoading label="Loading library…" />
        ) : visible.length === 0 ? (
          <ApertureCard padding={24}><p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)" }}>Nothing matches those filters.</p></ApertureCard>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {visible.map(a => (
              <Link
                key={a.slug}
                to={`/app/rilobiz/app/library/${a.slug}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <ApertureCard padding={18} style={{ cursor: "pointer", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <ApertureChip tone={a.kind === "playbook" ? "signal" : "neutral"}>
                    {a.kind === "playbook" ? "Playbook" : "Quick prompt"}
                  </ApertureChip>
                  <ApertureMonoLabel>
                    {[a.category, a.duration].filter(Boolean).join(" · ")}
                  </ApertureMonoLabel>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                  {a.title}
                </h3>
                {a.blurb && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>{a.blurb}</p>
                )}
                {a.why && (
                  <div style={{
                    marginTop: 10, paddingTop: 10,
                    borderTop: "1px dashed var(--ap-hairline)",
                    fontSize: 12, color: "var(--ap-ink-3)", fontStyle: "italic", lineHeight: 1.5,
                  }}>Why this: {a.why}</div>
                )}
                </ApertureCard>
              </Link>
            ))}
          </div>
        )}
      </RealAppShell>
    </>
  );
}