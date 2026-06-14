import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";

/**
 * Memory page — single source of truth view of the user's pool.
 * Shows every item regardless of source, grouped by bucket (with a
 * "Notes" group for freeform items not tied to any bucket).
 * A freeform input at the top lets the user add anything to memory.
 */
export default function RealMemory() {
  const { buckets, loading: bLoading } = useApertureBucketsDB();
  const { items, loading, addFreeformNote, deleteItem } = useApertureMemoryDB();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    const t = note.trim();
    if (!t || busy) return;
    setBusy(true);
    await addFreeformNote(t);
    setBusy(false);
    setNote("");
  }

  // Group items by bucket_slug (null → "notes")
  const grouped = new Map<string, typeof items>();
  for (const it of items) {
    const key = it.bucket_slug ?? "__notes__";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(it);
  }

  // Ensure every known bucket appears, even if empty
  for (const b of buckets) if (!grouped.has(b.slug)) grouped.set(b.slug, []);

  const bucketTitle = (slug: string) =>
    slug === "__notes__" ? "Notes" : (buckets.find(b => b.slug === slug)?.title ?? slug);

  return (
    <>
      <Helmet><title>Memory · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="MEMORY"
          title="What I know about your business"
          sub="Everything below is one pool. Bucket answers, things I noticed in chats, and your own notes all live here together."
          action={<ApertureChip tone={items.length > 0 ? "signal" : "neutral"}>{items.length} item{items.length === 1 ? "" : "s"}</ApertureChip>}
        />

        {/* Freeform add */}
        <ApertureCard padding={14} style={{ marginBottom: 24 }}>
          <ApertureMonoLabel>Add to memory</ApertureMonoLabel>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8 }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Anything I should know — context, a number, a constraint, a goal…"
              rows={2}
              style={{
                flex: 1, resize: "vertical",
                appearance: "none", outline: "none",
                background: "var(--ap-surface-2)",
                border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-sm)",
                padding: "10px 12px",
                fontSize: 14, color: "var(--ap-ink-1)",
                fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
              }}
            />
            <ApertureButton variant="accent" onClick={handleAdd} disabled={!note.trim() || busy}>
              {busy ? "…" : "Save"}
            </ApertureButton>
          </div>
        </ApertureCard>

        {loading || bLoading ? (
          <ApertureCard padding={20}><ApertureMonoLabel>Loading…</ApertureMonoLabel></ApertureCard>
        ) : grouped.size === 0 ? (
          <ApertureCard padding={32} style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--ap-ink-1)", fontWeight: 600 }}>Nothing in memory yet</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
              Add a note above, or just start a chat. I'll remember the parts that matter.
            </p>
          </ApertureCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[...grouped.entries()].map(([slug, list]) => {
              const bucket = buckets.find(b => b.slug === slug);
              return (
                <section key={slug}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <ApertureMonoLabel>{slug === "__notes__" ? "FREEFORM" : "BUCKET"}</ApertureMonoLabel>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>{bucketTitle(slug)}</h3>
                    </div>
                    {bucket && (
                      <Link to={`/aperture/app/memory/${bucket.slug}`} style={{ fontSize: 11, color: "var(--ap-signal)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                        Open →
                      </Link>
                    )}
                  </div>
                  {list.length === 0 ? (
                    <ApertureCard padding={14}>
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--ap-ink-3)" }}>
                        Nothing in this bucket yet.
                      </p>
                    </ApertureCard>
                  ) : (
                    <ApertureCard padding={0}>
                      {list.map((it, idx) => (
                        <div key={it.id} style={{
                          display: "grid", gridTemplateColumns: "auto 1fr auto",
                          gap: 12, alignItems: "flex-start",
                          padding: "12px 14px",
                          borderTop: idx === 0 ? "none" : "1px solid var(--ap-hairline)",
                        }}>
                          <ApertureMonoLabel color={it.source === "ai_extracted" ? "var(--ap-signal)" : undefined}>
                            {it.source === "ai_extracted" ? "Noticed" : it.source === "bucket_answer" ? "Answer" : "Note"}
                          </ApertureMonoLabel>
                          <span style={{ fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.5 }}>{it.content}</span>
                          <button
                            onClick={() => { if (confirm("Remove from memory?")) deleteItem(it.id); }}
                            aria-label="Remove"
                            style={{ appearance: "none", border: "none", background: "transparent", cursor: "pointer", color: "var(--ap-ink-3)", padding: 4 }}
                          >×</button>
                        </div>
                      ))}
                    </ApertureCard>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </RealAppShell>
    </>
  );
}