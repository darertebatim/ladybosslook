import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApertureUserProfile } from "./useApertureUserProfile";

export type SourceKind = "website" | "instagram";

export interface SourceSnapshot {
  id: string;
  source_kind: SourceKind;
  url: string;
  raw_text: string | null;
  meta: Record<string, unknown> | null;
  fetched_at: string;
}

export interface SourceFact {
  id: string;
  content: string;
  bucket_slug: string | null;
  question_key: string | null;
  created_at: string;
}

export interface SourceSummary {
  kind: SourceKind;
  display: string;      // domain or @handle
  url: string;          // outbound URL
  snapshot: SourceSnapshot | null;
  factsCount: number;
  fetchStatus: "ok" | "failed" | "unfetched";
}

function domainOf(raw: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
}

function instagramUrlOf(handle: string): string {
  const h = handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "");
  return `https://www.instagram.com/${h}/`;
}

/** Lists the user's connected sources (website + instagram) with snapshot + extracted fact counts. */
export function useApertureSources() {
  const { user } = useAuth();
  const { profile } = useApertureUserProfile();
  const [snapshots, setSnapshots] = useState<SourceSnapshot[]>([]);
  const [facts, setFacts] = useState<SourceFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<SourceKind | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setSnapshots([]); setFacts([]); setLoading(false); return; }
    setLoading(true);
    const [snapRes, factRes] = await Promise.all([
      (supabase as any)
        .from("aperture_source_snapshots")
        .select("id,source_kind,url,raw_text,meta,fetched_at")
        .eq("user_id", user.id),
      (supabase as any)
        .from("aperture_memory_items")
        .select("id,content,bucket_slug,question_key,source_kind,created_at")
        .eq("user_id", user.id)
        .eq("source", "ai_extracted")
        .eq("is_active", true)
        .not("source_kind", "is", null),
    ]);
    setSnapshots(((snapRes.data ?? []) as any[]) as SourceSnapshot[]);
    setFacts(((factRes.data ?? []) as any[]) as (SourceFact & { source_kind: SourceKind })[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const factsFor = useCallback((kind: SourceKind): SourceFact[] => {
    return facts.filter((f: any) => f.source_kind === kind);
  }, [facts]);

  const sources = useMemo<SourceSummary[]>(() => {
    const out: SourceSummary[] = [];
    const websiteRaw = profile?.website?.trim();
    if (websiteRaw) {
      const snap = snapshots.find(s => s.source_kind === "website") ?? null;
      const st = (snap?.meta as any)?.fetch_status;
      out.push({
        kind: "website",
        display: domainOf(websiteRaw),
        url: /^https?:\/\//i.test(websiteRaw) ? websiteRaw : `https://${websiteRaw}`,
        snapshot: snap,
        factsCount: factsFor("website").length,
        fetchStatus: !snap ? "unfetched" : st === "failed" ? "failed" : "ok",
      });
    }
    const igRaw = profile?.instagram?.trim();
    if (igRaw) {
      const handle = igRaw.replace(/^@/, "");
      const snap = snapshots.find(s => s.source_kind === "instagram") ?? null;
      const st = (snap?.meta as any)?.fetch_status;
      out.push({
        kind: "instagram",
        display: `@${handle}`,
        url: instagramUrlOf(igRaw),
        snapshot: snap,
        factsCount: factsFor("instagram").length,
        fetchStatus: !snap ? "unfetched" : st === "failed" ? "failed" : "ok",
      });
    }
    return out;
  }, [profile, snapshots, factsFor]);

  const refetch = useCallback(async (kind: SourceKind, url: string, userPrompt?: string) => {
    setBusy(kind);
    try {
      await supabase.functions.invoke("aperture-onboarding-research", {
        body: { source: kind, url, businessName: profile?.business_name ?? undefined, userPrompt },
      });
    } finally {
      setBusy(null);
      await refresh();
    }
  }, [profile?.business_name, refresh]);

  /** Creates a new chat thread pre-seeded with an assistant message about this source. */
  const startChatAboutSource = useCallback(async (summary: SourceSummary): Promise<string | null> => {
    if (!user) return null;
    const title = summary.kind === "website" ? `About ${summary.display}` : `About ${summary.display}`;
    const { data: chat, error } = await supabase
      .from("aperture_chats")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !chat) return null;
    const factsList = factsFor(summary.kind);
    const factLines = factsList.slice(0, 12).map(f => `• ${f.content}`).join("\n");
    const snapExcerpt = (summary.snapshot?.raw_text ?? "").slice(0, 1500);
    const opener =
`Let's dig into your ${summary.kind === "website" ? "website" : "Instagram"} (${summary.url}).

Here's what I've pulled from it so far${factsList.length ? ":" : " — nothing extracted yet."}
${factLines || ""}

What would you like to do?

[OPTIONS]
- Summarize what this ${summary.kind} says about my business
- Suggest improvements I should make
- Pull more specific info from it
- Compare this to what I actually do
[/OPTIONS]`;
    await supabase.from("aperture_messages").insert({
      chat_id: chat.id,
      user_id: user.id,
      role: "assistant",
      content: opener,
    });
    // Hidden system note so the model has the raw context in thread.
    if (snapExcerpt) {
      await supabase.from("aperture_messages").insert({
        chat_id: chat.id,
        user_id: user.id,
        role: "system",
        content: `Source context — ${summary.kind} (${summary.url}):\n${snapExcerpt}`,
      });
    }
    return chat.id as string;
  }, [user, factsFor]);

  return { sources, loading, busy, refresh, refetch, startChatAboutSource, factsFor };
}