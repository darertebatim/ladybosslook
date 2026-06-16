import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import { ApertureCard, ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";

interface ActionRow {
  slug: string; kind: string; category: string | null;
  title: string; blurb: string | null; why: string | null;
  duration: string | null;
}

/** Library of playbooks/prompts pulled from aperture_actions. */
export default function RealLibrary() {
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("aperture_actions")
        .select("slug,kind,category,title,blurb,why,duration")
        .eq("is_published", true)
        .order("category", { ascending: true });
      setActions((data ?? []) as ActionRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Helmet><title>Library · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="LIBRARY"
          title="Playbooks & prompts"
          sub="Ready-to-run flows for the most common things small businesses get stuck on."
        />
        {loading ? (
          <ApertureMonoLabel>Loading…</ApertureMonoLabel>
        ) : actions.length === 0 ? (
          <ApertureCard padding={24}><p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)" }}>Library is empty for now.</p></ApertureCard>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {actions.map(a => (
              <Link
                key={a.slug}
                to={`/aperture/app/library/${a.slug}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <ApertureCard padding={18} style={{ cursor: "pointer", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <ApertureChip tone={a.kind === "playbook" ? "signal" : "neutral"}>
                    {a.kind === "playbook" ? "Playbook" : "Prompt"}
                  </ApertureChip>
                  {a.duration && <ApertureMonoLabel>{a.duration}</ApertureMonoLabel>}
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