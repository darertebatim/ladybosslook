import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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
 * Memory Level — single climbing number driven by total fact count.
 * Thresholds: L1 = onboarding complete, L2=40, L3=80, L4=140, L5=220,
 * L6=320, then every +120 (440, 560, 680…). No max. Cosmetic only.
 */
function computeMemoryLevel(facts: number, onboarded: boolean): number {
  let level = onboarded ? 1 : 0;
  const table: Array<[number, number]> = [
    [2, 40], [3, 80], [4, 140], [5, 220], [6, 320],
  ];
  for (const [lvl, t] of table) if (facts >= t) level = Math.max(level, lvl);
  if (facts > 320) {
    level = Math.max(level, 6 + Math.ceil((facts - 320) / 120));
  }
  return level;
}
function prevThreshold(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 1;
  const t: Record<number, number> = { 2: 40, 3: 80, 4: 140, 5: 220, 6: 320 };
  if (level in t) return t[level];
  return 320 + (level - 6) * 120;
}
function nextThreshold(level: number): number {
  if (level === 0) return 1;
  const t: Record<number, number> = { 1: 40, 2: 80, 3: 140, 4: 220, 5: 320 };
  if (level in t) return t[level];
  return 320 + (level - 5) * 120;
}

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

  // ─── Wave progression ─────────────────────────────────────────────────
  // Next wave number = (max completed wave) + 1. Defaults to 2 for a user
  // who's just finished Essential onboarding and hasn't run any wave yet.
  const [nextWave, setNextWave] = useState<number>(2);
  const [waveInProgress, setWaveInProgress] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("aperture_waves")
        .select("wave_number,status")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      const inProg = data.find((r: any) => r.status !== "complete");
      if (inProg) setWaveInProgress(inProg.wave_number as number);
      const maxComplete = data
        .filter((r: any) => r.status === "complete")
        .reduce((m: number, r: any) => Math.max(m, r.wave_number as number), 1);
      setNextWave(Math.max(2, maxComplete + 1));
    })();
    return () => { cancelled = true; };
  }, [user]);

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

  // ─── Memory Level ─────────────────────────────────────────────────────────
  // Total fact count across the memory pool. Excludes rows with source
  // "skipped" or "unknown" (none of our current sources match, but kept
  // for future-proofing). Onboarding-complete unlocks Level 1.
  const factCount = useMemo(
    () => items.filter(i => !["skipped", "unknown"].includes(String(i.source))).length,
    [items],
  );
  const onboarded = !!profile?.full_onboarded_at || factCount > 0;
  const computedLevel = useMemo(() => computeMemoryLevel(factCount, onboarded), [factCount, onboarded]);

  // Levels never decrease — even if facts are soft-deleted/superseded.
  const LEVEL_FLOOR_KEY = "rilobiz.memoryLevel.floor";
  const LEVEL_SEEN_KEY = "rilobiz.memoryLevel.lastSeen";
  const [level, setLevel] = useState<number>(() => {
    if (typeof window === "undefined") return computedLevel;
    const floor = Number(window.localStorage.getItem(LEVEL_FLOOR_KEY) ?? 0);
    return Math.max(floor, computedLevel);
  });
  useEffect(() => {
    const next = Math.max(level, computedLevel);
    if (next !== level) setLevel(next);
    try { window.localStorage.setItem(LEVEL_FLOOR_KEY, String(next)); } catch {}
  }, [computedLevel, level]);

  // Level-up moment — one-line message for a few seconds. No modal.
  const [leveledUp, setLeveledUp] = useState(false);
  const initRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastSeen = Number(window.localStorage.getItem(LEVEL_SEEN_KEY) ?? 0);
    if (!initRef.current) {
      initRef.current = true;
      // Don't celebrate on first mount unless we've actually crossed.
      if (level > lastSeen && lastSeen > 0) {
        setLeveledUp(true);
        const t = setTimeout(() => setLeveledUp(false), 4000);
        try { window.localStorage.setItem(LEVEL_SEEN_KEY, String(level)); } catch {}
        return () => clearTimeout(t);
      }
      try { window.localStorage.setItem(LEVEL_SEEN_KEY, String(level)); } catch {}
      return;
    }
    if (level > lastSeen) {
      setLeveledUp(true);
      try { window.localStorage.setItem(LEVEL_SEEN_KEY, String(level)); } catch {}
      const t = setTimeout(() => setLeveledUp(false), 4000);
      return () => clearTimeout(t);
    }
  }, [level]);

  const prevT = prevThreshold(level);
  const nextT = nextThreshold(level);
  const span = Math.max(1, nextT - prevT);
  const intoLevel = Math.max(0, factCount - prevT);
  const levelPct = Math.min(100, Math.round((intoLevel / span) * 100));

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
          {(profile?.essential_onboarded_at || profile?.quick_onboarded_at) ? (
            <ApertureCard padding={16} style={{ borderColor: "var(--ap-signal)" }}>
              <ApertureMonoLabel style={{ color: "var(--ap-signal)" }}>
                {waveInProgress ? `Wave ${waveInProgress} in progress` : `Wave ${nextWave} ready`}
              </ApertureMonoLabel>
              <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                A short round of focused questions
              </h3>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                10–15 questions I've picked for your business. Skip anything.
              </p>
              <Link to={`/app/rilobiz/app/waves/${waveInProgress ?? nextWave}`} style={{ textDecoration: "none" }}>
                <ApertureButton variant="accent">
                  {waveInProgress ? `Resume Wave ${waveInProgress} →` : `Start Wave ${nextWave} →`}
                </ApertureButton>
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
          {/* Memory Level — single number, progress to next. Cosmetic only. */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12,
              marginBottom: 8,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <ApertureMonoLabel>Level</ApertureMonoLabel>
                <span
                  key={level}
                  style={{
                    fontSize: 28, fontWeight: 700, color: "var(--ap-ink-1)",
                    fontVariantNumeric: "tabular-nums",
                    animation: leveledUp ? "rilobizLevelPulse 700ms ease-out" : undefined,
                  }}
                >
                  {level}
                </span>
              </div>
              <ApertureMonoLabel>
                {level >= 1 ? `${factCount} / ${nextT} facts` : `${factCount} facts`}
              </ApertureMonoLabel>
            </div>
            <div style={{
              height: 4, borderRadius: 2, background: "var(--ap-hairline)", overflow: "hidden",
            }}>
              <div style={{
                width: `${levelPct}%`, height: "100%",
                background: "var(--ap-signal)",
                transition: "width 400ms ease",
              }} />
            </div>
            <div style={{
              minHeight: 18, marginTop: 6, fontSize: 12, color: "var(--ap-signal)",
              opacity: leveledUp ? 1 : 0, transition: "opacity 240ms ease",
            }}>
              {leveledUp ? `You reached Level ${level}.` : ""}
            </div>
            <style>{`
              @keyframes rilobizLevelPulse {
                0% { transform: scale(1); }
                40% { transform: scale(1.18); }
                100% { transform: scale(1); }
              }
            `}</style>
          </div>
          {/* Full business brief — pinned above the bucket grid. */}
          <div style={{ marginBottom: 20 }}>
            <BriefCard
              label="Full brief"
              title="What I know about your business"
              teaser="The whole picture, pulled across every bucket. Reset for a fresh read-back anytime."
              onTalk={async ({ move }) => {
                const opener = move
                  ? `From your full brief, here's the move I'd zero in on:\n\n"${move}"\n\nWant to work on this together? Where do you want to start — the first concrete step, what's blocking it, or how you'd know it's working?`
                  : `Let's talk through your brief. Where do you want to start?`;
                const chat = await createChat({
                  title: "Talk about my brief",
                  entry_point: "general_chat",
                  opener,
                });
                if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}`);
              }}
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