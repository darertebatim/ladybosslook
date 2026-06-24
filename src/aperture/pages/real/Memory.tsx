import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureLoading, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { Paperclip, Plug } from "lucide-react";
import { pickFallbackBucket, topNBuckets } from "@/aperture/lib/pickFallbackBucket";
import { composeMemoryGeneralOpener } from "@/aperture/lib/composeOpener";
import { BriefCard } from "@/aperture/components/BriefCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Memory page — map of what RiloBiz knows about the user's business.
 * Shows the 13 territories as tiles with "explored" badges, a single
 * "Talk to RiloBiz" CTA, and a "Continue onboarding" card if the
 * Full questionnaire hasn't been completed yet.
 */
export default function RealMemory() {
  const navigate = useNavigate();
  const { buckets, loading: bLoading } = useApertureBucketsDB();
  const { items, loading: mLoading } = useApertureMemoryDB();
  const { profile } = useApertureUserProfile();
  const { createChat } = useApertureChatsDB();
  const { user } = useAuth();

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
    const chat = await createChat({
      title: "What should we look at first?",
      entry_point: "general_chat",
    });
    if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}`);
  }

  /**
   * "Continue filling out your memory" — picks a bucket via the §4
   * fallback scorer, composes Opener A with chips from the same scorer
   * (top-N, not raw lowest-progress), starts a memory_general chat.
   */
  async function continueFillingMemory() {
    const scoreable = buckets.map(b => ({
      slug: b.slug, title: b.title, target_count: b.target_count,
    }));
    const memItems = items.map(i => ({ bucket_slug: i.bucket_slug, source: i.source }));
    const picked = pickFallbackBucket(scoreable, memItems);
    if (!picked) {
      await talkToAperture();
      return;
    }
    const topRanked = topNBuckets(scoreable, memItems, 4);
    const opener = composeMemoryGeneralOpener({ title: picked.title }, topRanked);
    const chat = await createChat({
      title: `Memory · ${picked.title}`,
      entry_point: "memory_general",
      bucket_slug: picked.slug,
      opener,
    });
    if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}`);
  }

  return (
    <>
      <Helmet><title>Memory · RiloBiz</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="MEMORY"
          title="What I know about your business"
          sub={`${buckets.length} territories. The more I know, the sharper my answers get. Tap any to read or fill in.`}
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Link to="/app/rilobiz/app/memory/files" style={{ textDecoration: "none" }}>
                <ApertureButton variant="default" size="sm">
                  <Paperclip size={13} /> Files
                </ApertureButton>
              </Link>
              <Link to="/app/rilobiz/app/memory/tools" style={{ textDecoration: "none" }}>
                <ApertureButton variant="default" size="sm">
                  <Plug size={13} /> Tools
                </ApertureButton>
              </Link>
              <ApertureChip tone={avgProgress > 0 ? "signal" : "neutral"}>
                {avgProgress}% mapped
              </ApertureChip>
            </div>
          }
        />

        {/* CTA row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <ApertureCard padding={16}>
            <ApertureMonoLabel>Conversation</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
              Talk to RiloBiz
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
              Open chat. Bring me anything — a stuck decision, an idea, a quick question.
            </p>
            <ApertureButton variant="accent" onClick={talkToAperture}>Start →</ApertureButton>
          </ApertureCard>
          {!fullDone ? (
            <ApertureCard padding={16}>
              <ApertureMonoLabel>Deep dive</ApertureMonoLabel>
              <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                Continue onboarding
              </h3>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                Run the full business questionnaire. Skip anything that doesn't apply.
              </p>
              <Link to="/app/rilobiz/app/onboard/full" style={{ textDecoration: "none" }}>
                <ApertureButton variant="ghost">Open →</ApertureButton>
              </Link>
            </ApertureCard>
          ) : (
            <ApertureCard padding={16}>
              <ApertureMonoLabel>Keep building</ApertureMonoLabel>
              <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                Continue filling out your memory
              </h3>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                I'll pick the territory that looks most useful right now and we'll go from there.
              </p>
              <ApertureButton variant="accent" onClick={continueFillingMemory} disabled={bLoading || mLoading}>
                Start →
              </ApertureButton>
            </ApertureCard>
          )}
        </div>

        {bLoading || mLoading ? (
          <ApertureLoading label="Loading…" />
        ) : (
          <>
          {/* Full business brief — pinned above the bucket grid. */}
          <div style={{ marginBottom: 20 }}>
            <BriefCard
              label="Full brief"
              title="What I know about your business"
              teaser="The whole picture, pulled across every bucket. Reset for a fresh read-back anytime."
              load={async () => {
                if (!user) return null;
                const { data } = await supabase
                  .from("aperture_memory_card")
                  .select("summary,regenerated_at,stale")
                  .eq("user_id", user.id).maybeSingle();
                if (!data || !(data as any).summary) return null;
                return {
                  summary: (data as any).summary,
                  generated_at: (data as any).regenerated_at ?? new Date().toISOString(),
                };
              }}
              regenerate={async () => {
                const { data, error } = await supabase.functions.invoke("aperture-regenerate-memory-card", {});
                if (error) throw new Error(error.message);
                const summary = (data as any)?.summary ?? "";
                const generated_at = (data as any)?.regenerated_at ?? new Date().toISOString();
                return { summary, generated_at };
              }}
            />
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 10,
          }}>
            {[...buckets].sort((a, b) => {
              // Industry-specific buckets first, then keep existing order.
              const ai = (a as any).kind === "industry" ? 0 : 1;
              const bi = (b as any).kind === "industry" ? 0 : 1;
              if (ai !== bi) return ai - bi;
              return 0;
            }).map(b => {
              const count = countsBySlug[b.slug] ?? 0;
              const target = b.target_count ?? 8;
              const pct = progressFor(b.slug, target);
              const tone: "signal" | "neutral" =
                pct >= 60 ? "signal" : pct > 0 ? "signal" : "neutral";
              return (
                <Link
                  key={b.slug}
                  to={`/app/rilobiz/app/memory/${b.slug}`}
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
          </>
        )}
      </RealAppShell>
    </>
  );
}