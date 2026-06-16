import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";

/**
 * Memory page — map of what Aperture knows about the user's business.
 * Shows the 13 territories as tiles with "explored" badges, a single
 * "Talk to Aperture" CTA, and a "Continue onboarding" card if the
 * Full questionnaire hasn't been completed yet.
 */
export default function RealMemory() {
  const navigate = useNavigate();
  const { buckets, loading: bLoading } = useApertureBucketsDB();
  const { items, loading: mLoading } = useApertureMemoryDB();
  const { profile } = useApertureUserProfile();
  const { createChat } = useApertureChatsDB();

  const countsBySlug = useMemo(() => {
    // Weight: confirmed/extracted/freeform = 1.0, ai_inferred_pre_onboarding = 0.5.
    // Guesses fill the visual space without making a bucket look truly "well understood".
    const m: Record<string, number> = {};
    for (const it of items) {
      if (!it.bucket_slug) continue;
      const weight = it.source === "ai_inferred_pre_onboarding" ? 0.5 : 1;
      m[it.bucket_slug] = (m[it.bucket_slug] ?? 0) + weight;
    }
    return m;
  }, [items]);

  const progressFor = (slug: string, target: number) => {
    const t = Math.max(1, target ?? 8);
    const c = countsBySlug[slug] ?? 0;
    return Math.min(100, Math.round((c / t) * 100));
  };
  const avgProgress = buckets.length
    ? Math.round(
        buckets.reduce((sum, b) => sum + progressFor(b.slug, b.target_count ?? 8), 0)
        / buckets.length,
      )
    : 0;
  const fullDone = !!profile?.full_onboarded_at;

  async function talkToAperture() {
    const chat = await createChat("What should we look at first?");
    if (chat) navigate(`/aperture/app/chats/${chat.id}`);
  }

  return (
    <>
      <Helmet><title>Memory · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="MEMORY"
          title="What I know about your business"
          sub="Thirteen territories. The more I know, the sharper my answers get. Tap any to read or fill in."
          action={
            <ApertureChip tone={avgProgress > 0 ? "signal" : "neutral"}>
              {avgProgress}% mapped
            </ApertureChip>
          }
        />

        {/* CTA row */}
        <div style={{ display: "grid", gridTemplateColumns: fullDone ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <ApertureCard padding={16}>
            <ApertureMonoLabel>Conversation</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
              Talk to Aperture
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
              I'll ask about whatever gap looks most useful right now.
            </p>
            <ApertureButton variant="accent" onClick={talkToAperture}>Start →</ApertureButton>
          </ApertureCard>
          {!fullDone && (
            <ApertureCard padding={16}>
              <ApertureMonoLabel>Deep dive</ApertureMonoLabel>
              <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                Continue onboarding
              </h3>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                Run the full business questionnaire. Skip anything that doesn't apply.
              </p>
              <Link to="/aperture/app/onboard/full" style={{ textDecoration: "none" }}>
                <ApertureButton variant="ghost">Open →</ApertureButton>
              </Link>
            </ApertureCard>
          )}
        </div>

        {bLoading || mLoading ? (
          <ApertureCard padding={20}><ApertureMonoLabel>Loading…</ApertureMonoLabel></ApertureCard>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 10,
          }}>
            {buckets.map(b => {
              const count = countsBySlug[b.slug] ?? 0;
              const target = b.target_count ?? 8;
              const pct = progressFor(b.slug, target);
              const tone: "signal" | "neutral" =
                pct >= 60 ? "signal" : pct > 0 ? "signal" : "neutral";
              return (
                <Link
                  key={b.slug}
                  to={`/aperture/app/memory/${b.slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <ApertureCard padding={14} style={{ height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{b.glyph ?? "·"}</span>
                      <ApertureChip tone={tone}>{pct}%</ApertureChip>
                    </div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 600 }}>
                      {b.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ap-ink-3)", lineHeight: 1.45 }}>
                      {b.blurb ?? ""}
                    </p>
                    <div style={{
                      marginTop: 10, height: 4, borderRadius: 2,
                      background: "var(--ap-hairline)", overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: pct > 0 ? "var(--ap-signal)" : "transparent",
                        transition: "width 240ms ease",
                      }} />
                    </div>
                    <div style={{
                      marginTop: 6, fontSize: 10.5, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "var(--ap-ink-3)",
                    }}>
                      {count} / {target} facts
                    </div>
                  </ApertureCard>
                </Link>
              );
            })}
          </div>
        )}
      </RealAppShell>
    </>
  );
}